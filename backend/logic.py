import pandas as pd
import numpy as np

def clean_ptbr_number(x):
    if isinstance(x, str):
        clean_str = x.strip().replace('.', '').replace(',', '.')
        try:
            return float(clean_str)
        except ValueError:
            return 0.0
    return float(x) if isinstance(x, (int, float)) else 0.0

def processar_fraudes(dados: list):
    if not dados:
        return []

    df = pd.DataFrame(dados)
    df.columns = [c.strip() for c in df.columns]

    required_cols = ['Valor do ImOvel', 'Metragem', 'Localidade', 'Inscrição do ImOvel', 'Tipo ImOvel']
    for col in required_cols:
        if col not in df.columns:
            df[col] = ""

    df['Valor_Float'] = df['Valor do ImOvel'].apply(clean_ptbr_number)
    df['Metragem_Float'] = df['Metragem'].apply(clean_ptbr_number)
    df['Localidade'] = df['Localidade'].fillna("").astype(str).str.strip()
    df['Inscrição'] = df['Inscrição do ImOvel'].fillna("").astype(str).str.strip()
    df['Tipo'] = df['Tipo ImOvel'].fillna("NÃO INFORMADO").astype(str).str.strip()

    df['Preco_m2'] = df.apply(lambda x: x['Valor_Float'] / x['Metragem_Float'] if x['Metragem_Float'] > 0 else 0, axis=1)

    df_mercado = df[df['Valor_Float'] > 100]
    
    try:
        medianas_por_tipo = df_mercado.groupby('Tipo')['Preco_m2'].median()
    except:
        medianas_por_tipo = pd.Series()
    
    media_geral_backup = df_mercado['Preco_m2'].median() if not df_mercado.empty else 0

    suspects = []

    for idx, row in df.iterrows():
        motivos = []
        nivel_risco = "Baixo"
        
        if row['Valor_Float'] <= 10.0 and row['Metragem_Float'] > 0:
            motivos.append("Valor Declarado Irrisório (R$ 0,10)")
            nivel_risco = "Crítico"

        termos_suspeitos = ['IRREGULAR', 'INVASÃO', 'POSSE', 'PROVAVEL', 'S/D']
        local_upper = row['Localidade'].upper()
        for termo in termos_suspeitos:
            if termo in local_upper:
                motivos.append(f"Indício de Irregularidade Física ({termo})")
                if nivel_risco != "Crítico": nivel_risco = "Alto"

        if row['Inscrição'] in ["", "S/N", "0", "NÃO INFORMADO"]:
            motivos.append("Inscrição Imobiliária Ausente")
            if nivel_risco == "Baixo": nivel_risco = "Médio"

        tipo_atual = row['Tipo']
        referencia_m2 = medianas_por_tipo.get(tipo_atual, media_geral_backup)

        if referencia_m2 > 0 and 0 < row['Preco_m2'] < (referencia_m2 * 0.15):
            motivos.append(f"Subfaturamento Agressivo: R$ {row['Preco_m2']:.2f}/m² (Ref: R$ {referencia_m2:.2f})")
            if nivel_risco in ["Baixo", "Médio"]: 
                nivel_risco = "Alto"

        if motivos:
            suspects.append({
                "id_original": idx,
                "tipo": row['Tipo'],
                "inscricao": row['Inscrição'],
                "localidade": row['Localidade'],
                "metragem": row['Metragem_Float'],
                "valor_declarado": row['Valor_Float'],
                "valor_m2_calculado": round(row['Preco_m2'], 2),
                "referencia_mercado_m2": round(referencia_m2, 2),
                "nivel_risco": nivel_risco,
                "motivos": ", ".join(motivos)
            })

    return suspects