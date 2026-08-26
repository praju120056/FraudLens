"""XGBoost inference. The classifier output is the system's ground-truth decision."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from model.train import ALL_FEATURES, CATEGORICAL_FEATURES, NUMERIC_FEATURES, transform

_BUNDLE: dict[str, Any] | None = None


def model_path() -> Path:
    import os

    env = os.environ.get("MODEL_PATH", "./model/model.pkl")
    p = Path(env)
    if not p.is_absolute():
        p = Path(__file__).resolve().parent.parent / p
        if not p.exists():
            p = Path(__file__).resolve().parent / "model.pkl"
    return p


def load_bundle(force: bool = False) -> dict[str, Any]:
    global _BUNDLE
    if _BUNDLE is None or force:
        path = model_path()
        if not path.exists():
            raise FileNotFoundError(
                f"Trained model not found at {path}. Run `python -m model.train` first."
            )
        _BUNDLE = joblib.load(path)
    return _BUNDLE


def vectorize(ieee_row: dict) -> np.ndarray:
    bundle = load_bundle()
    df = pd.DataFrame([ieee_row], columns=ALL_FEATURES)
    for col in NUMERIC_FEATURES:
        if col not in df.columns:
            df[col] = np.nan
    for col in CATEGORICAL_FEATURES:
        if col not in df.columns:
            df[col] = np.nan
    return transform(df, bundle["medians"], bundle["category_maps"])


def predict_fraud(ieee_row: dict) -> dict[str, Any]:
    """
    Run XGBoost. Returns probability, binary prediction, and threshold used.

    LLM layers must consume this output as-is and must not override it.
    """
    bundle = load_bundle()
    clf = bundle["model"]
    threshold = float(bundle["threshold"])
    X = vectorize(ieee_row)
    proba = float(clf.predict_proba(X)[0, 1])
    pred = int(proba >= threshold)
    return {
        "fraud_probability": proba,
        "xgboost_prediction": pred,
        "xgboost_label": "fraud" if pred == 1 else "not_fraud",
        "threshold": threshold,
        "decision_source": "xgboost",
        "feature_vector_dim": int(X.shape[1]),
    }
