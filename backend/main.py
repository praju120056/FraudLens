"""
FastAPI orchestrator: Razorpay txn → IEEE features → XGBoost → SHAP → Gemini → audit.

XGBoost is the sole decision engine. Gemini only explains and drafts reports.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env")

from model.predict import load_bundle, predict_fraud
from model.explainer import explain_prediction
from pipeline.audit_logger import get_analysis, list_analyses, log_analysis
from pipeline.feature_engineering import razorpay_to_ieee, standardize_transaction
from pipeline.llm_report import generate_report
from razorpay.test_transactions import generate_demo_if_needed, synthetic_test_transactions

app = FastAPI(
    title="AI Chargeback Risk Manager",
    description="XGBoost fraud scores with SHAP evidence and Gemini reporting. ML decision is final.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_pipeline(raw_txn: dict[str, Any]) -> dict[str, Any]:
    standardized = standardize_transaction(raw_txn)
    txn_id = standardized.get("payment_id") or raw_txn.get("transaction_id") or "unknown"
    ieee_features = razorpay_to_ieee(standardized)
    ml = predict_fraud(ieee_features)
    shap_values = explain_prediction(ieee_features, top_k=5)
    gemini_output = generate_report(standardized, ml, shap_values)
    final_decision = ml["xgboost_label"]  # LLM never overrides
    result = {
        "transaction_id": txn_id,
        "standardized_transaction": standardized,
        "input_features": ieee_features,
        "fraud_probability": ml["fraud_probability"],
        "xgboost_prediction": ml["xgboost_prediction"],
        "xgboost_label": ml["xgboost_label"],
        "threshold": ml["threshold"],
        "decision_source": "xgboost",
        "shap_values": shap_values,
        "gemini_output": gemini_output,
        "recommended_action": gemini_output.get("recommended_action"),
        "final_decision": final_decision,
    }
    log_analysis(result)
    return result


@app.get("/health")
def health():
    model_ok = Path(
        os.environ.get("MODEL_PATH", str(Path(__file__).parent / "model" / "model.pkl"))
    )
    if not model_ok.is_absolute():
        model_ok = Path(__file__).parent / "model" / "model.pkl"
    return {"status": "ok", "model_present": model_ok.exists()}


@app.post("/analyze")
def analyze(payload: dict[str, Any]):
    if not payload:
        raise HTTPException(status_code=400, detail="JSON body required")
    try:
        return run_pipeline(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/transactions")
def transactions():
    return {"transactions": list_analyses()}


@app.get("/metrics")
def metrics():
    try:
        bundle = load_bundle()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    test = bundle["metrics"]["test"]
    return {
        "precision": test["precision"],
        "recall": test["recall"],
        "f1": test["f1"],
        "false_positive_rate": test["false_positive_rate"],
        "auc_roc": test["auc_roc"],
        "threshold": test["threshold"],
        "n_test": test["n_samples"],
        "n_fraud_test": test["n_fraud"],
        "split_manifest": bundle.get("split_manifest"),
        "validation": bundle["metrics"].get("validation"),
        "note": "Metrics are computed on the locked held-out test set only.",
    }


@app.get("/audit/{transaction_id}")
def audit(transaction_id: str):
    record = get_analysis(transaction_id)
    if record is None:
        raise HTTPException(status_code=404, detail="No audit trail for this transaction_id")
    return record


@app.get("/demo/transactions")
def demo_transactions():
    return {"transactions": generate_demo_if_needed()}


@app.post("/demo/seed")
def seed_demo():
    """Analyze 16 synthetic Razorpay-shaped payments to populate the live feed.

    Indices 0–11 are normal/borderline transactions; indices 12–15 are
    fraud-shaped payloads that trigger XGBoost fraud labels for demo purposes.
    """
    results = [run_pipeline(txn) for txn in synthetic_test_transactions(16)]
    return {"seeded": len(results), "transactions": results}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
