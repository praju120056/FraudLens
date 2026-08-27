"""
FastAPI orchestrator: Razorpay txn → IEEE features → XGBoost → SHAP → Gemini → audit.

XGBoost is the sole decision engine. Gemini only explains and drafts reports.
"""

from __future__ import annotations

import json
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
    title="FraudLens — AI Chargeback Risk Manager",
    description="FraudLens: XGBoost fraud scores with SHAP evidence and Gemini reporting. ML decision is final.",
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


@app.get("/")
def root():
    return {
        "status": "ok",
        "app": "FraudLens",
        "description": "FraudLens: Defense-only payment fraud detector and evidence verifier",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    try:
        bundle = load_bundle()
        model_loaded = bundle is not None
    except Exception:
        model_loaded = False
    return {"status": "ok", "app": "FraudLens", "model_loaded": model_loaded}


@app.post("/analyze")
def analyze_transaction(txn: dict[str, Any]):
    try:
        return run_pipeline(txn)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/metrics")
def get_metrics():
    metrics_path = Path(__file__).resolve().parent / "model" / "metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="metrics.json not found")
    with open(metrics_path, encoding="utf-8") as f:
        return json.load(f)


@app.get("/transactions")
def list_transactions(limit: int = 50):
    return {"transactions": list_analyses(limit=limit)}


@app.get("/audit/{transaction_id}")
def get_audit(transaction_id: str):
    record = get_analysis(transaction_id)
    if not record:
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

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
