# FraudLens

### Financial Risk Intelligence & Security Operations Console

> **Detect fraud. Understand why. Defend the transaction.**

FraudLens is a defense-only payment risk intelligence platform built for merchants dealing with fraud, returns, and chargebacks.

It takes a Razorpay payment payload, evaluates it through a locked XGBoost fraud model, explains the prediction using TreeSHAP, synthesizes supporting evidence with Gemini, and records the complete decision in an immutable audit trail.

The goal isn't just to say **"this transaction is fraudulent."**

It's to answer:

> **What happened, why is it risky, and what should the merchant do about it?**

**Live Demo:** https://fraudlens-lyart.vercel.app/

---

## What FraudLens Does

FraudLens turns a raw payment into an explainable, auditable risk decision.

```text
Razorpay Payment
       │
       ▼
Feature Normalization
       │
       ▼
XGBoost Fraud Scoring
       │
       ▼
SHAP Risk Attribution
       │
       ▼
Evidence Synthesis
       │
       ▼
Recommended Action
       │
       ▼
Immutable Audit Trail
```

Every transaction is classified into one of three operational states:

| Decision     | Meaning                                      |
| ------------ | -------------------------------------------- |
| **Escalate** | High-confidence fraud requiring intervention |
| **Monitor**  | Suspicious activity requiring observation    |
| **Clear**    | No significant fraud signal detected         |

The ML model remains the sole decision-maker. The LLM layer does not override the prediction.

---

# Interface

## Command Center

The Command Center provides a real-time operational view of payment activity.

It shows:

* Live transaction volume
* High-risk escalations
* Active monitoring cases
* Cleared transactions
* Fraud probability per transaction
* Payment method and route
* Live transaction feed
* Immutable audit records

![Command Center](docs\screenshots\Screenshot (31).png)

---

## Investigation & Scoring Workbench

The Investigation Workbench is where individual payments are analyzed.

A Razorpay payment payload can be submitted directly for evaluation.

The pipeline then performs:

1. Razorpay payload ingestion
2. Feature normalization
3. XGBoost fraud scoring
4. SHAP attribution
5. Evidence synthesis
6. Recommended action generation
7. Audit persistence

![Payment Risk Assessment Workbench](docs\screenshots\Screenshot (32).png)

### Explainable Risk Decisions

FraudLens doesn't stop at a probability score.

TreeSHAP identifies the strongest directional contributors to the prediction, allowing an investigator to see **why the model reached its conclusion**.

Example:

```text
Fraud Probability
        94.2%

Risk Drivers

Transaction amount       ██████████  +42%
Device mismatch          ████████    +21%
Transaction velocity     ███████     +17%
Location anomaly         █████       +11%
Merchant behaviour       ███          +9%
```

The result is a decision that can be investigated rather than a black-box prediction.

---

## Intelligence & Economic Impact

The Intelligence console connects model performance with actual merchant economics.

It provides:

* Precision
* Recall
* False-positive rate
* AUC-ROC
* Locked test-set statistics
* False-positive cost modelling
* Fraud loss prevention estimates
* Net merchant financial impact

![Intelligence & Economic Impact](docs/screenshots/honest_metrics_roi.png)

The simulator allows merchants to vary:

* Monthly transaction volume
* Average order value

and immediately see how model performance translates into potential financial impact.

---

# Model Performance

FraudLens is evaluated on a **locked held-out test set of 88,581 transactions**.

| Metric              |                            Result |
| ------------------- | --------------------------------: |
| Precision           |                        **69.25%** |
| Recall              |                        **60.31%** |
| AUC-ROC             |                        **0.9477** |
| False Positive Rate |                        **0.971%** |
| Locked Test Samples |                        **88,581** |
| Training Dataset    | **590,540 IEEE-CIS transactions** |

### What these numbers mean

**69.25% precision**

Approximately 7 out of every 10 transactions flagged as fraud are actually fraudulent.

**60.31% recall**

The model detects more than 60% of fraudulent transactions in the held-out evaluation set.

**0.9477 AUC-ROC**

The model demonstrates strong discrimination between fraudulent and legitimate transactions across the decision space.

**0.971% false-positive rate**

Fewer than 1% of legitimate transactions are incorrectly classified as fraud at the deployed threshold.

---

# Zero-Leakage Evaluation

FraudLens uses a strict train / validation / test protocol.

```text
IEEE-CIS Dataset
       │
       ├── 70% Training
       │
       ├── 15% Validation
       │       └── Threshold selection
       │
       └── 15% Locked Test
               └── Final evaluation
```

The test-set IDs are frozen in:

```text
locked_test_ids.csv
```

The test set is never used for:

* Feature engineering decisions
* Threshold tuning
* Model selection
* Hyperparameter tuning

The final metrics therefore represent performance on previously unseen transactions.

---

# Fraud Detection Pipeline

FraudLens uses a six-stage processing pipeline.

### 01 — Razorpay Ingestion

Raw Razorpay webhook / SDK payloads are accepted by the backend.

Payment information such as:

* amount
* payment method
* card/IIN information
* contact information
* timestamps
* transaction metadata

is extracted and normalized.

### 02 — Feature Engineering

Razorpay fields are mapped into the feature representation expected by the IEEE-CIS model.

Missing values are handled using statistics derived from the training data.

### 03 — XGBoost Risk Engine

The normalized transaction is passed to the XGBoost classifier.

The model produces:

```text
P(fraud)
```

The production decision threshold is:

```text
0.8351
```

### 04 — SHAP Explainability

TreeSHAP calculates directional feature contributions for the prediction.

The strongest drivers are surfaced to the investigator.

### 05 — Evidence Synthesis

Gemini converts the model output and available transaction evidence into a human-readable risk summary and, when appropriate, a chargeback dispute draft.

**Gemini does not make the fraud decision.**

### 06 — Audit Trail

The complete transaction decision is persisted and exposed through the operational console.

This creates a traceable chain from:

```text
Payment → Features → Model → Explanation → Action
```

---

# AI Architecture

FraudLens deliberately separates **decision-making** from **language generation**.

```text
                    ┌──────────────────┐
                    │   Razorpay JSON   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Feature Pipeline │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     XGBoost      │
                    │  DECISION MAKER  │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐     ┌─────────────┐
              │  TreeSHAP │     │ Gemini      │
              │ Explain.  │     │ Synthesis   │
              └──────────┘     └──────┬──────┘
                                      │
                                      ▼
                              Evidence / Draft
```

This prevents the LLM from hallucinating or overriding the underlying fraud classification.

---

# Defense-Only Guarantee

FraudLens is explicitly designed for defensive fraud prevention.

The decision logic is enforced server-side:

```text
XGBoost = fraud
        ↓
recommended_action = escalate
        ↓
Generate dispute evidence
```

```text
XGBoost = not_fraud
AND P(fraud) ≥ 0.35
        ↓
recommended_action = monitor
```

```text
Otherwise
        ↓
recommended_action = clear
```

Gemini can:

* summarize evidence
* explain the available signals
* draft chargeback responses

Gemini cannot:

* change the XGBoost classification
* lower the risk score
* convert fraud into a legitimate transaction
* trigger offensive actions

---

# Economic Impact

Model metrics only tell part of the story.

FraudLens explicitly models the cost of false positives.

For an illustrative merchant with:

```text
Monthly transactions = 50,000
Average order value  = ₹2,500
Fraud rate           ≈ 3.5%
```

the model estimates:

| Impact                  | Estimated Monthly Value |
| ----------------------- | ----------------------: |
| Fraud loss prevented    |         **+₹26,37,500** |
| False-positive friction |         **−₹11,72,500** |
| Net financial impact    |         **+₹14,65,000** |

These are **scenario estimates**, not observed production savings.

The simulator allows the assumptions to be changed interactively so merchants can evaluate the model against their own transaction volume and AOV.

---

# Reliability

The evidence-generation layer uses a Gemini fallback cascade.

If a model is unavailable or rate-limited, FraudLens attempts the next configured model.

If all Gemini models are unavailable, a deterministic heuristic report is used.

This means:

> **Payment risk scoring does not depend on Gemini availability.**

The core XGBoost decision engine remains independent of the LLM layer.

---

# Tech Stack

### Machine Learning

* XGBoost
* TreeSHAP
* IEEE-CIS Fraud Detection Dataset
* Scikit-learn

### AI

* Google Gemini
* `google-genai`

### Backend

* Python
* FastAPI
* Uvicorn

### Frontend

* React
* Vite
* JavaScript

### Deployment

* Vercel
* Railway / Render

---

# API

| Method | Endpoint        | Purpose                             |
| ------ | --------------- | ----------------------------------- |
| `POST` | `/analyze`      | Evaluate a Razorpay payment         |
| `GET`  | `/metrics`      | Retrieve locked evaluation metrics  |
| `GET`  | `/transactions` | Retrieve analyzed transactions      |
| `GET`  | `/audit/{id}`   | Retrieve an individual audit record |
| `POST` | `/demo/seed`    | Seed synthetic test payments        |
| `GET`  | `/health`       | Check backend/model health          |

Interactive API documentation is available through FastAPI at:

```text
/docs
```

---

# Project Structure

```text
FraudLens/
│
├── backend/
│   ├── model/
│   │   ├── train.py
│   │   └── model.pkl
│   │
│   ├── pipeline/
│   │   └── llm_report.py
│   │
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
│   └── screenshots/
│
├── ieee_cis/
│
└── README.md
```

---

# Running Locally

## Backend

```bash
git clone https://github.com/praju120056/FraudLens.git
cd FraudLens/backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=your_gemini_api_key_here

MODEL_PATH=./model/model.pkl
AUDIT_LOG_PATH=./audit_log.json
IEEE_DATA_PATH=../ieee_cis/train_transaction.csv
```

Start the backend:

```bash
python main.py
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Retraining

To reproduce the training and evaluation pipeline:

```bash
cd backend
python -m model.train
```

The training process:

1. Creates the stratified train / validation / test split
2. Freezes the held-out test IDs
3. Trains the XGBoost model
4. Selects the decision threshold on validation data
5. Evaluates once on the locked test set
6. Saves the model and evaluation metrics

---

# Why FraudLens?

Most fraud systems answer:

> **"Is this transaction fraudulent?"**

FraudLens tries to answer the questions that come after that:

> **Why?**

> **What evidence supports the decision?**

> **What should the merchant do?**

> **What does that decision cost?**

> **Can the entire decision be audited later?**

That's the difference between a fraud classifier and a **fraud operations system**.

---

## Status

FraudLens is a working defense-only prototype demonstrating:

* Real-time payment risk scoring
* Explainable ML
* LLM-assisted evidence synthesis
* Chargeback response generation
* Operational transaction monitoring
* Immutable audit logging
* Locked-set model evaluation
* Merchant economic simulation

**Built for Razorpay Buildathon — Track 02: AI Risk Manager.**
