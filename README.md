# 🕵️‍♂️ Pega-Safado Pro

> **Fiscal Audit & Real Estate Fraud Detection System**

[![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](./README.pt-br.md)

**Pega-Safado Pro** is a *Full-Stack* solution (Python + Next.js) designed to automate the analysis of large volumes of real estate data (JSON). The system identifies anomalies, tax evasion, and registration irregularities using statistical business rules and text mining.

---

## 🧠 The Detection Algorithm

The core of the system resides in the `backend/logic.py` module. The detection intelligence is based on 4 rigorous audit pillars:

### 1. Trivial Value Detection (Critical Risk)
* **Goal:** Detect properties declared with symbolic values to evade transfer taxes (ITBI/ITCMD).
* **Rule:** If `Declared Value <= R$ 10.00`, the system immediately flags it as **CRITICAL**.
* **Impact:** Identifies flagrant tax evasion.

### 2. Textual Irregularity Mining (High Risk)
* **Goal:** Find keywords in the "Location" or description fields that indicate legal or physical issues.
* **Rule:** Scans for substrings (case-insensitive) such as: `INVASÃO` (Invasion), `POSSE` (Possession/Squatting), `IRREGULAR`, `PROVAVEL` (Probable), `S/D` (No Data).
* **Impact:** Segregates properties that lack a definitive deed or are in conflict areas.

### 3. Market Anomaly / Underpricing (High Risk)
* **Goal:** Detect properties sold well below the market price for their region/type, indicating "under-the-table" payments.
* **Rule:**
    1. Calculates the **Price per m²** for each property.
    2. Calculates the **Market Median** for that `Type` of property (e.g., Land, House, Apartment).
    3. If the property value is **less than 15%** of the category median, it is flagged as aggressive underpricing suspicion.
* **Impact:** Recovery of tax revenue on the value difference.

### 4. Registry Inconsistency (Medium Risk)
* **Goal:** Find flaws in the city hall or registry database.
* **Rule:** Checks if the `Real Estate ID` (Inscrição) is empty, zeroed out, "S/N" (No Number), or "NÃO INFORMADO" (Not Informed).
* **Impact:** Municipal database sanitation.

---

## 🛠️ Tech Stack

* **Backend:** Python 3.9, FastAPI, Pandas, NumPy.
* **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts (Data Visualization).
* **Infrastructure:** Docker & Docker Compose.

---

## 🚀 How to Run

The project is fully Dockerized. You do not need to install Python or Node.js on your machine.

1.  **Place the data:**
    Ensure the `bens-imoveis.json` file is located in the `data/` folder at the project root.

2.  **Start the containers:**
    ```bash
    docker compose up --build
    ```

3.  **Access:**
    * 🖥️ **Dashboard:** [http://localhost:3000](http://localhost:3000)
    * ⚙️ **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔮 Next Steps (Roadmap)

To transform this MVP into a full Enterprise product, the following steps are suggested:

* [ ] **UI Upload:** Allow auditors to upload JSON (or CSV/Excel) files directly via the browser.
* [ ] **Persistent Database:** Migrate from file reading to PostgreSQL or MongoDB to enable audit history and year-over-year comparison.
* [ ] **Machine Learning (Isolation Forest):** Replace static rules (thresholds) with an *Unsupervised Learning* model (Scikit-Learn) to detect anomalies that escape human patterns.
* [ ] **Report Export:** Add a button to generate PDF or Excel reports for direct submission to fiscal enforcement.
* [ ] **Authentication:** Create a Login system for different auditor levels.

---

**Developed with 🩸, 💦 and Python.**# pega-safado
