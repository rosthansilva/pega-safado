from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import sys

try:
    from logic import processar_fraudes
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from logic import processar_fraudes

app = FastAPI(title="API Pega-Safado Enterprise")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_json_path():
    """
    Tenta localizar o arquivo de dados em diferentes ambientes:
    1. Bazel/Kubernetes (via ENV)
    2. Docker (caminho fixo da imagem)
    3. Local (desenvolvimento)
    """
    
    env_path = os.getenv("DATA_PATH")
    if env_path:
        if os.path.exists(env_path):
            return env_path
        abs_path = os.path.join(os.getcwd(), env_path)
        if os.path.exists(abs_path):
            return abs_path

    docker_path = "/pega_safado/data/bens-imoveis.json"
    if os.path.exists(docker_path):
        return docker_path
    
    local_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "bens-imoveis.json")
    if os.path.exists(local_path):
        return local_path

    return None

@app.get("/")
def health_check():
    return {"status": "online", "system": "Pega-Safado Audit System"}

@app.get("/analisar-pasta")
def analisar_dados():
    file_path = get_json_path()
    
    if not file_path:
        print(f"ERRO: Arquivo não encontrado. CWD: {os.getcwd()}")
        return {
            "status": "vazio",
            "mensagem": "Arquivo 'bens-imoveis.json' não encontrado. Verifique a pasta 'data' ou a montagem do Docker.",
            "resultados": [] 
        }

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            dados_brutos = json.load(f)
            
        if not isinstance(dados_brutos, list):
            return {
                "status": "erro",
                "mensagem": "O arquivo JSON não é uma lista válida de imóveis.",
                "resultados": []
            }

        resultados = processar_fraudes(dados_brutos)
        
        for item in resultados:
            item['arquivo_origem'] = os.path.basename(file_path)

        return {
            "status": "sucesso",
            "arquivos_processados": [file_path],
            "total_imoveis_suspeitos": len(resultados),
            "resultados": resultados
        }

    except json.JSONDecodeError:
        return {
            "status": "erro", 
            "mensagem": "O arquivo existe mas está corrompido (não é um JSON válido).",
            "resultados": [] 
        }
    
    except Exception as e:
        print(f"Erro Interno: {e}")
        return {
            "status": "erro",
            "mensagem": f"Erro interno no servidor: {str(e)}",
            "resultados": [] 
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)