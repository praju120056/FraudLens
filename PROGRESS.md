# Progress — AI Chargeback Risk Manager

## Done

### ML model (step 1–2)
- Trained XGBoost on IEEE-CIS `train_transaction.csv` only (590,540 rows).
- Split locked at **70 / 15 / 15** (`random_state=42`), stratified on `isFraud`.
- Test TransactionIDs written to `backend/model/locked_test_ids.csv` and unused for fitting, medians, encodings, early stopping, or threshold selection.
- Imbalance handled with **train-only** `scale_pos_weight = 27.5798`.
- Validation-tuned decision threshold (max F1), then evaluated **once** on the held-out test set.
- SHAP TreeExplainer implemented in `backend/model/explainer.py` (top 5 features + direction).
- Artifact: `backend/model/model.pkl`

**Held-out test metrics**
| Metric | Value |
|---|---|
| Precision | 0.6925 |
| Recall | 0.6031 |
| F1 | 0.6447 |
| **False positive rate** | **0.00971** |
| AUC-ROC | 0.9477 |
| Threshold | 0.8351 |
| Test n | 88,581 (3,099 fraud) |

### FastAPI + pipeline
- Feature mapping Razorpay → IEEE-CIS in `pipeline/feature_engineering.py` (documented in-module).
- Razorpay fetcher with `.env` keys + ≥12 synthetic test-mode payloads.
- Gemini 2.0 Flash explainability; XGBoost decision is never overridden (server-side action remap).
- Endpoints: `POST /analyze`, `GET /transactions`, `GET /metrics`, `GET /audit/{id}`, `POST /demo/seed`.
- Audit log: `backend/audit_log.json`.

### React dashboard
- Dark-theme Analyzer, Live feed (10s poll), Metrics panel with FPR highlighted.
- Vite proxy to FastAPI on port 8000.

## Pending
- Fill `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY` in `backend/.env` for live API + Gemini (heuristic report fallback if Gemini key empty).
- Dataset CSVs were already present under `ieee_cis/`; nothing was downloaded.

## Assumptions
- IEEE-CIS Kaggle *test* files have no labels and are unused.
- Identity table not merged; Razorpay mapping targets transaction-level features.
- ProductCD mapping: card→C, upi→W, netbanking→H, wallet→R, emi→S.
- RuPay approximated as IEEE `card4=discover` (no RuPay in IEEE-CIS).
- Amount: Razorpay paise / 100 → `TransactionAmt`.
- Unavailable C/D/V features filled with **train** medians from `model.pkl`.
