# AI Chargeback Risk Manager

A full-stack fraud detection system that scores Razorpay payment transactions in real time using an XGBoost model trained on the [IEEE-CIS Fraud Detection dataset](https://www.kaggle.com/c/ieee-fraud-detection). Every decision is backed by SHAP feature attribution and a Gemini-generated narrative report.

---

## Architecture Overview

```
Razorpay Transaction
        │
        ▼
┌──────────────────┐
│  Feature         │  Maps Razorpay fields → IEEE-CIS feature space
│  Engineering     │  (pipeline/feature_engineering.py)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  XGBoost Model   │  Fraud probability + binary label
│  (model.pkl)     │  Threshold: 0.8351 (val-tuned, max F1)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────┐
│  SHAP Explainer  │     │  Gemini 2.0      │
│  (top-5 features)│────▶│  Flash Report    │  Narrative only — never overrides XGBoost
└────────┬─────────┘     └────────┬────────┘
         │                        │
         └──────────┬─────────────┘
                    ▼
           ┌────────────────┐
           │  Audit Logger  │  Persisted to audit_log.json
           └────────┬───────┘
                    ▼
           ┌────────────────┐
           │  React Dashboard│  Dark-theme UI, live feed, metrics panel
           └────────────────┘
```

---

## Model Performance

Trained on `ieee_cis/train_transaction.csv` (590,540 rows). Split: **70 / 15 / 15** (`random_state=42`, stratified on `isFraud`). The held-out test set was **never** used during fitting, feature encoding, or threshold selection.

| Metric              | Validation | Test (Held-out)      |
|---------------------|------------|----------------------|
| Precision           | 0.6866     | **0.6925**           |
| Recall              | 0.5887     | **0.6031**           |
| F1                  | 0.6339     | **0.6447**           |
| False Positive Rate | 0.00974    | **0.00971**          |
| AUC-ROC             | 0.9465     | **0.9477**           |
| Decision Threshold  | 0.8351     | 0.8351               |
| Test samples        | 88,581     | 88,581 (3,099 fraud) |

Class imbalance handled via `scale_pos_weight = 27.5798` (train split only).

---

## Project Structure

```
razorpay/
├── backend/
│   ├── main.py                      # FastAPI app & endpoint definitions
│   ├── requirements.txt
│   ├── .env                         # API keys (see Configuration)
│   ├── audit_log.json               # Persisted analysis records
│   ├── model/
│   │   ├── train.py                 # XGBoost training script
│   │   ├── predict.py               # Inference & bundle loading
│   │   ├── explainer.py             # SHAP TreeExplainer (top-5 features)
│   │   ├── model.pkl                # Trained artifact (joblib)
│   │   ├── metrics.json             # Locked test/val metrics
│   │   ├── split_manifest.json      # Reproducible split record
│   │   └── locked_test_ids.csv      # Held-out TransactionIDs
│   ├── pipeline/
│   │   ├── feature_engineering.py   # Razorpay → IEEE-CIS feature mapping
│   │   ├── llm_report.py            # Gemini 2.0 Flash report generator
│   │   └── audit_logger.py          # Read/write audit_log.json
│   └── razorpay/
│       └── test_transactions.py     # 12 synthetic Razorpay-shaped payloads
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx        # Main view: live feed + metrics
│   │   │   ├── TransactionCard.jsx  # Per-transaction summary card
│   │   │   ├── FraudReport.jsx      # SHAP + Gemini report display
│   │   │   └── AuditTrail.jsx       # Audit log viewer
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── vite.config.js               # Proxy: /api → localhost:8000
│   └── package.json
└── ieee_cis/                        # Raw IEEE-CIS dataset (not tracked in git)
    ├── train_transaction.csv
    ├── train_identity.csv
    ├── test_transaction.csv
    └── test_identity.csv
```

---

## API Endpoints

| Method | Endpoint                  | Description                                              |
|--------|---------------------------|----------------------------------------------------------|
| `GET`  | `/health`                 | Liveness check; confirms `model.pkl` is present         |
| `POST` | `/analyze`                | Run full pipeline on a raw Razorpay transaction payload  |
| `GET`  | `/transactions`           | List all analysed transactions from the audit log        |
| `GET`  | `/metrics`                | Return held-out test metrics from `metrics.json`         |
| `GET`  | `/audit/{transaction_id}` | Fetch full audit record for a specific transaction       |
| `POST` | `/demo/seed`              | Analyze 12 synthetic payloads and populate the live feed |
| `GET`  | `/demo/transactions`      | Return pre-generated demo transactions                   |

Interactive API docs available at `http://localhost:8000/docs` when the server is running.

---

## Prerequisites

| Dependency | Version |
|------------|---------|
| Python     | ≥ 3.10  |
| Node.js    | ≥ 18    |
| npm        | ≥ 9     |

---

## Configuration

Edit `backend/.env` with your credentials:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_PATH=./model/model.pkl
AUDIT_LOG_PATH=./audit_log.json
IEEE_DATA_PATH=../ieee_cis/train_transaction.csv
```

> **Note:** `GEMINI_API_KEY` is optional. If absent, the system falls back to a heuristic rule-based report.

---

## Running the Project

### 1. Clone the repository

```bash
git clone <repo-url>
cd razorpay
```

### 2. Backend — install dependencies

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

### 3. Backend — start the FastAPI server

```bash
# From the backend/ directory, with venv active
python main.py
```

The API will be available at **`http://localhost:8000`**.  
Swagger UI: **`http://localhost:8000/docs`**

### 4. Frontend — install dependencies and start dev server

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at **`http://localhost:5173`**.

### 5. Seed demo data (optional)

With both servers running, populate the live feed with 12 synthetic transactions:

```bash
curl -X POST http://localhost:8000/demo/seed
```

Or click the **Seed Demo** button in the dashboard UI.

---

## Retraining the Model

The pre-trained `model.pkl` is included and ready to use. To retrain from scratch:

1. Ensure the IEEE-CIS dataset files are present under `ieee_cis/`.
2. Run the training script from inside the `backend/` directory:

```bash
cd backend
python -m model.train
```

This overwrites `model/model.pkl`, `model/metrics.json`, `model/split_manifest.json`, and `model/locked_test_ids.csv`.

---

## Feature Mapping

The pipeline maps Razorpay-specific fields to the IEEE-CIS feature space before inference:

| Razorpay Field   | IEEE-CIS Feature | Notes                                          |
|------------------|------------------|------------------------------------------------|
| `amount` (paise) | `TransactionAmt` | Divided by 100 to convert paise → rupees       |
| `method`         | `ProductCD`      | `card→C`, `upi→W`, `netbanking→H`, `wallet→R`, `emi→S` |
| `card_network`   | `card4`          | RuPay approximated as `discover` (no RuPay in IEEE-CIS) |
| `card_type`      | `card6`          | `credit` / `debit`                             |
| C/D/V features   | Various          | Filled with train-split medians from the bundle |

> Identity table features are not used. The model operates on transaction-level features only.

---

## Key Design Decisions

- **XGBoost is the sole decision engine.** Gemini 2.0 Flash is used exclusively for human-readable narrative reporting and never overrides the ML classification.
- **Strict train/test separation.** Test `TransactionID`s are written to `locked_test_ids.csv` before any fitting begins and are excluded from all preprocessing steps.
- **Threshold selected on validation only.** The decision threshold (0.8351) maximises F1 on the validation split. The test set was evaluated exactly once.
- **Audit trail.** Every analysed transaction is persisted to `audit_log.json`, queryable via `GET /audit/{transaction_id}`.
