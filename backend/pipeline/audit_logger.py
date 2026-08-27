"""Append-only JSON audit trail for every pipeline run."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def audit_path() -> Path:
    env = os.environ.get("AUDIT_LOG_PATH", "./audit_log.json")
    p = Path(env)
    if not p.is_absolute():
        p = Path(__file__).resolve().parent.parent / p
    return p


def _load_all() -> list[dict[str, Any]]:
    path = audit_path()
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "records" in data:
            return list(data["records"])
    except json.JSONDecodeError:
        return []
    return []


def log_analysis(record: dict[str, Any]) -> dict[str, Any]:
    records = _load_all()
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "transaction_id": record.get("transaction_id"),
        "input_features": record.get("input_features"),
        "fraud_probability": record.get("fraud_probability"),
        "xgboost_prediction": record.get("xgboost_prediction"),
        "shap_values": record.get("shap_values"),
        "gemini_output": record.get("gemini_output"),
        "final_decision": record.get("final_decision"),
        "standardized_transaction": record.get("standardized_transaction"),
        "recommended_action": record.get("recommended_action"),
    }
    records.append(entry)
    path = audit_path()
    path.write_text(json.dumps(records, indent=2, default=str), encoding="utf-8")
    return entry


def list_analyses(limit: int | None = None) -> list[dict[str, Any]]:
    records = list(reversed(_load_all()))
    if limit is not None:
        return records[:limit]
    return records


def get_analysis(transaction_id: str) -> dict[str, Any] | None:
    matches = [r for r in _load_all() if str(r.get("transaction_id")) == str(transaction_id)]
    return matches[-1] if matches else None
