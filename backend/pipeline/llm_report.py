"""
Gemini explainability layer with multi-model fallback cascade.

The LLM receives XGBoost probability, binary prediction, and SHAP evidence.
It may ONLY summarize evidence, draft a chargeback response, and suggest an
operational action that is consistent with the model. It must never contradict
or replace the XGBoost decision.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
logger = logging.getLogger("ai_risk_manager.llm")

# Primary and fallback Gemini models cascade in priority order
DEFAULT_MODELS_CASCADE = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
]

SYSTEM_PROMPT = """You are an evidence and report writer for a payments risk system.
You do NOT decide whether a transaction is fraud. XGBoost has already decided.
You MUST treat xgboost_prediction, xgboost_label, and fraud_probability as ground truth.
You MUST NOT contradict, soften, or override the ML decision.
You MUST NOT invent features that are not in shap_top_features.
You MAY only:
  1) explain the SHAP evidence in plain language
  2) draft a chargeback dispute response when the model label is fraud
  3) suggest recommended_action as exactly one of: escalate | monitor | clear
Action mapping you must follow:
  - xgboost_label == "fraud" → recommended_action = "escalate"
  - xgboost_label == "not_fraud" and fraud_probability >= 0.35 → recommended_action = "monitor"
  - otherwise → recommended_action = "clear"
If xgboost_label is "not_fraud", dispute_draft must be null.
Return JSON only with keys:
  evidence_summary, dispute_draft, recommended_action, confidence_narrative
"""


def _heuristic_report(payload: dict[str, Any]) -> dict[str, Any]:
    """Deterministic fallback when GEMINI_API_KEY is unset or all models fail — still never overrides ML."""
    label = payload["xgboost_label"]
    proba = payload["fraud_probability"]
    shap_bits = []
    for f in payload.get("shap_top_features") or []:
        shap_bits.append(
            f"{f['feature']} ({f['direction']} toward {f['towards']}, SHAP={f['shap_value']:.4f})"
        )
    evidence = (
        f"XGBoost classified this payment as {label} "
        f"(p_fraud={proba:.4f}, threshold={payload.get('threshold')}). "
        f"Top SHAP drivers: {'; '.join(shap_bits) if shap_bits else 'none available'}."
    )
    if label == "fraud":
        action = "escalate"
        dispute = (
            "We dispute this chargeback. Our XGBoost fraud classifier scored this "
            f"transaction at {proba:.2%} fraud probability, above the validation-tuned "
            "threshold. SHAP attributions identify the drivers listed in the evidence "
            "summary. The payment was processed in Razorpay test/live rails with the "
            "attached identifiers. We request the chargeback be reversed and the "
            "merchant protected pending issuer review of this evidence pack."
        )
        narrative = "High model probability plus SHAP-aligned risk factors supports escalation."
    elif proba >= 0.35:
        action = "monitor"
        dispute = None
        narrative = "Model cleared the payment but residual probability warrants monitoring."
    else:
        action = "clear"
        dispute = None
        narrative = "Model cleared the payment with low fraud probability."
    return {
        "evidence_summary": evidence,
        "dispute_draft": dispute,
        "recommended_action": action,
        "confidence_narrative": narrative,
        "llm_backend": "heuristic_fallback",
    }


def get_candidate_models() -> list[str]:
    """Return ordered list of Gemini models to try, with user overrides first."""
    custom_model = os.environ.get("GEMINI_MODEL", "").strip()
    candidates = [custom_model] + DEFAULT_MODELS_CASCADE if custom_model else DEFAULT_MODELS_CASCADE
    # Deduplicate while preserving order
    seen = set()
    result = []
    for m in candidates:
        if m and m not in seen:
            seen.add(m)
            result.append(m)
    return result


def generate_report(
    transaction: dict[str, Any],
    ml_result: dict[str, Any],
    shap_top_features: list[dict[str, Any]],
) -> dict[str, Any]:
    payload = {
        "transaction": {
            "payment_id": transaction.get("payment_id"),
            "order_id": transaction.get("order_id"),
            "amount": transaction.get("amount"),
            "currency": transaction.get("currency"),
            "method": transaction.get("method"),
            "status": transaction.get("status"),
            "email": transaction.get("email"),
            "contact": transaction.get("contact"),
            "created_at": transaction.get("created_at"),
        },
        "fraud_probability": ml_result["fraud_probability"],
        "xgboost_prediction": ml_result["xgboost_prediction"],
        "xgboost_label": ml_result["xgboost_label"],
        "threshold": ml_result.get("threshold"),
        "shap_top_features": shap_top_features,
        "instruction": "Explain SHAP evidence only. Do not change xgboost_label.",
    }

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return _heuristic_report(payload)

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
    except Exception as exc:
        fallback = _heuristic_report(payload)
        fallback["llm_error"] = f"SDK Client initialization error: {exc}"
        return fallback

    candidate_models = get_candidate_models()
    errors: list[str] = []

    for model_name in candidate_models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=json.dumps(payload, default=str),
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )
            parsed = json.loads(response.text)

            # Hard constraint: never let Gemini change the decision or illegal actions.
            label = ml_result["xgboost_label"]
            proba = ml_result["fraud_probability"]
            if label == "fraud":
                parsed["recommended_action"] = "escalate"
            elif proba >= 0.35:
                parsed["recommended_action"] = "monitor"
            else:
                parsed["recommended_action"] = "clear"
            if label != "fraud":
                parsed["dispute_draft"] = None

            parsed["llm_backend"] = model_name
            parsed.setdefault("evidence_summary", "")
            parsed.setdefault("confidence_narrative", "")
            return parsed

        except Exception as exc:
            err_msg = f"{model_name}: {exc}"
            errors.append(err_msg)
            logger.warning(f"Gemini model {model_name} failed, falling back to next candidate: {exc}")

    # If all candidate models failed, return heuristic fallback with full error details
    fallback = _heuristic_report(payload)
    fallback["llm_error"] = "All Gemini models failed: " + " | ".join(errors)
    return fallback
