# 🕵️‍♂️ Pega-Safado Pro

> **Sistema de Auditoria Fiscal & Detecção de Fraudes Imobiliárias**

[![en](https://img.shields.io/badge/lang-en-red.svg)](./README.md)

O **Pega-Safado Pro** é uma solução *Full-Stack* (Python + Next.js) projetada para automatizar a análise de grandes volumes de dados imobiliários (JSON). O sistema identifica anomalias, sonegação de impostos e irregularidades cadastrais utilizando regras de negócio estatísticas e textuais.

---

## 🧠 O Algoritmo de Detecção

O coração do sistema reside no módulo `backend/logic.py`. A inteligência de detecção não é baseada em "achismos", mas em 4 pilares rigorosos de auditoria:

### 1. Detecção de Valor Irrisório (Risco Crítico)
* **O que busca:** Imóveis declarados com valores simbólicos para evadir impostos de transmissão (ITBI/ITCMD).
* **Regra:** Se `Valor Declarado <= R$ 10,00`, o sistema marca imediatamente como **CRÍTICO**.
* **Impacto:** Identifica sonegação fiscal flagrante.

### 2. Mineração Textual de Irregularidades (Risco Alto)
* **O que busca:** Palavras-chave no campo de "Localidade" ou descrição que indiquem problemas jurídicos ou físicos.
* **Regra:** Busca por substrings (case-insensitive): `INVASÃO`, `POSSE`, `IRREGULAR`, `PROVAVEL`, `S/D` (Sem Dados).
* **Impacto:** Separa imóveis que não possuem escritura definitiva ou estão em áreas de conflito.

### 3. Anomalia de Mercado / Subfaturamento (Risco Alto)
* **O que busca:** Imóveis vendidos muito abaixo do preço de mercado da região/tipo, indicando "pagamento por fora".
* **Regra:**
    1. Calcula o **Preço por m²** de cada imóvel.
    2. Calcula a **Mediana de Mercado** para aquele `Tipo` de imóvel (ex: Terreno, Casa, Apartamento).
    3. Se o valor do imóvel for **menor que 15%** da mediana da categoria, é marcado como suspeita de subfaturamento agressivo.
* **Impacto:** Recuperação de receita fiscal sobre a diferença de valor.

### 4. Inconsistência Cadastral (Risco Médio)
* **O que busca:** Falhas na base de dados da prefeitura ou cartório.
* **Regra:** Verifica se a `Inscrição Imobiliária` está vazia, zerada, "S/N" ou "NÃO INFORMADO".
* **Impacto:** Saneamento da base de dados municipal.

---

## 🛠️ Tech Stack

* **Backend:** Python 3.9, FastAPI, Pandas, NumPy.
* **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts (Data Visualization).
* **Infraestrutura:** Docker & Docker Compose.

---

## 🚀 Como Rodar

O projeto é "Dockerizado". Você não precisa instalar Python ou Node.js na sua máquina, apenas o Docker.

1.  **Coloque os dados:**
    Garanta que o arquivo `bens-imoveis.json` esteja na pasta `data/` na raiz do projeto.

2.  **Suba os containers:**
    ```bash
    docker compose up --build
    ```

3.  **Acesse:**
    * 🖥️ **Dashboard:** [http://localhost:3000](http://localhost:3000)
    * ⚙️ **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔮 Próximos Passos (Roadmap)

Para transformar este MVP em um produto Enterprise completo, os próximos passos sugeridos são:

* [ ] **Upload via Interface:** Permitir que o auditor faça upload do JSON (ou CSV/Excel) diretamente pelo navegador.
* [ ] **Banco de Dados Persistente:** Migrar da leitura de arquivos para um banco PostgreSQL ou MongoDB, permitindo histórico de auditorias e comparação entre anos fiscais.
* [ ] **Machine Learning (Isolation Forest):** Substituir as regras estáticas (thresholds) por um modelo de *Unsupervised Learning* (Scikit-Learn) para detectar anomalias que fogem do padrão humano.
* [ ] **Exportação de Relatórios:** Adicionar botão para gerar PDF ou planilha Excel com os imóveis filtrados para envio direto à fiscalização.
* [ ] **Autenticação:** Criar sistema de Login para diferentes níveis de auditores.

---

**Desenvolvido com 🩸, 💦 e Python.**