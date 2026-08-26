"""
SHAP TreeExplainer over the trained XGBoost model.

Top-5 feature contributions (value + direction) are the only evidence the
LLM is allowed to narrate. They never change the XGBoost decision.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from model.predict import load_bundle, vectorize

_EXPLAINER = None


def get_explainer():
    global _EXPLAINER
    if _EXPLAINER is None:
        import shap

        bundle = load_bundle()
        _EXPLAINER = shap.TreeExplainer(bundle["model"])
    return _EXPLAINER


def explain_prediction(ieee_row: dict, top_k: int = 5) -> list[dict[str, Any]]:
    bundle = load_bundle()
    names = bundle["feature_names"]
    X = vectorize(ieee_row)
    explainer = get_explainer()
    shap_values = explainer.shap_values(X)

    # Binary XGBoost: shap_values is (n_samples, n_features)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    row = np.asarray(shap_values[0], dtype=float)

    order = np.argsort(np.abs(row))[::-1][:top_k]
    contributions = []
    for idx in order:
        value = float(row[int(idx)])
        contributions.append(
            {
                "feature": names[int(idx)],
                "shap_value": value,
                "abs_shap_value": abs(value),
                "direction": "positive" if value >= 0 else "negative",
                "towards": "fraud" if value >= 0 else "not_fraud",
                "feature_value": _raw_feature_value(ieee_row, names[int(idx)]),
            }
        )
    return contributions


def _raw_feature_value(ieee_row: dict, name: str):
    val = ieee_row.get(name)
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    if isinstance(val, (np.floating, np.integer)):
        return float(val)
    return val
