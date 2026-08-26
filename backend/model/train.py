"""
Train an XGBoost fraud classifier on IEEE-CIS train_transaction.csv.

Split protocol (locked from day one — no leakage):
  70% train / 15% validation / 15% test
  Stratified on isFraud, random_state=42.
  Test TransactionIDs are written to locked_test_ids.csv and NEVER used
  for fitting, encoding maps, medians, early stopping, or threshold selection.

Class imbalance:
  scale_pos_weight = n_neg / n_pos  computed on the TRAIN split only.

Metrics reported on the held-out TEST set only:
  precision, recall, f1, false positive rate, auc-roc.
  Decision threshold is chosen on VALIDATION (max F1), then frozen and
  applied once to TEST.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# ---------------------------------------------------------------------------
# Feature contract — must stay in sync with pipeline/feature_engineering.py
# ---------------------------------------------------------------------------
NUMERIC_FEATURES = [
    "TransactionAmt",
    "TransactionDT",
    "card1",
    "card2",
    "card3",
    "card5",
    "addr1",
    "addr2",
    "dist1",
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
    "C7",
    "C8",
    "C9",
    "C10",
    "C11",
    "C12",
    "C13",
    "C14",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D10",
    "D11",
    "D12",
    "D13",
    "D14",
    "D15",
]

CATEGORICAL_FEATURES = [
    "ProductCD",
    "card4",
    "card6",
    "P_emaildomain",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
ID_COL = "TransactionID"
LABEL_COL = "isFraud"

RANDOM_STATE = 42
TEST_SIZE = 0.15
VAL_RELATIVE = 0.15 / 0.85  # of remaining after test holdout → 15% overall


def _repo_paths() -> dict[str, Path]:
    model_dir = Path(__file__).resolve().parent
    backend_dir = model_dir.parent
    data_path = Path(
        os.environ.get(
            "IEEE_DATA_PATH",
            str(backend_dir.parent / "ieee_cis" / "train_transaction.csv"),
        )
    )
    if not data_path.is_absolute():
        data_path = (backend_dir / data_path).resolve()
    return {
        "data": data_path,
        "model_dir": model_dir,
        "bundle": model_dir / "model.pkl",
        "metrics": model_dir / "metrics.json",
        "locked_test": model_dir / "locked_test_ids.csv",
        "split_manifest": model_dir / "split_manifest.json",
    }


def load_raw(data_path: Path) -> pd.DataFrame:
    usecols = [ID_COL, LABEL_COL] + ALL_FEATURES
    print(f"[train] loading {data_path}")
    df = pd.read_csv(data_path, usecols=usecols)
    print(f"[train] loaded {len(df):,} rows, fraud rate={df[LABEL_COL].mean():.4f}")
    return df


def lock_splits(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Hold out test first, then split remaining into train/val. Stratified."""
    train_val, test = train_test_split(
        df,
        test_size=TEST_SIZE,
        stratify=df[LABEL_COL],
        random_state=RANDOM_STATE,
    )
    train, val = train_test_split(
        train_val,
        test_size=VAL_RELATIVE,
        stratify=train_val[LABEL_COL],
        random_state=RANDOM_STATE,
    )
    return (
        train.reset_index(drop=True),
        val.reset_index(drop=True),
        test.reset_index(drop=True),
    )


def fit_encoders(train: pd.DataFrame) -> tuple[dict, dict]:
    """Medians and category maps from TRAIN only (no val/test leakage)."""
    medians = {}
    for col in NUMERIC_FEATURES:
        medians[col] = float(train[col].median()) if train[col].notna().any() else 0.0

    category_maps: dict[str, dict[str, int]] = {}
    for col in CATEGORICAL_FEATURES:
        values = train[col].fillna("__MISSING__").astype(str)
        uniques = sorted(values.unique().tolist())
        category_maps[col] = {v: i for i, v in enumerate(uniques)}
        # reserved index for unseen categories at inference
        category_maps[col]["__UNKNOWN__"] = len(uniques)
    return medians, category_maps


def transform(df: pd.DataFrame, medians: dict, category_maps: dict) -> np.ndarray:
    parts = []
    for col in NUMERIC_FEATURES:
        series = pd.to_numeric(df[col], errors="coerce").fillna(medians[col])
        parts.append(series.to_numpy(dtype=np.float32))
    for col in CATEGORICAL_FEATURES:
        mapping = category_maps[col]
        encoded = (
            df[col]
            .fillna("__MISSING__")
            .astype(str)
            .map(mapping)
            .fillna(mapping["__UNKNOWN__"])
            .to_numpy(dtype=np.float32)
        )
        parts.append(encoded)
    return np.column_stack(parts)


def false_positive_rate(y_true, y_pred) -> float:
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    denom = tn + fp
    return float(fp / denom) if denom else 0.0


def compute_metrics(y_true, y_prob, threshold: float) -> dict:
    y_pred = (y_prob >= threshold).astype(int)
    return {
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "false_positive_rate": false_positive_rate(y_true, y_pred),
        "auc_roc": float(roc_auc_score(y_true, y_prob)),
        "threshold": float(threshold),
        "n_samples": int(len(y_true)),
        "n_fraud": int(np.sum(y_true)),
        "n_predicted_fraud": int(np.sum(y_pred)),
    }


def select_threshold(y_true, y_prob) -> float:
    """Max-F1 threshold on validation only."""
    candidates = np.unique(np.quantile(y_prob, np.linspace(0.01, 0.99, 99)))
    best_t, best_f1 = 0.5, -1.0
    for t in candidates:
        f1 = f1_score(y_true, (y_prob >= t).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1, best_t = f1, float(t)
    return best_t


def train() -> dict:
    paths = _repo_paths()
    paths["model_dir"].mkdir(parents=True, exist_ok=True)

    df = load_raw(paths["data"])
    train_df, val_df, test_df = lock_splits(df)

    # Persist locked test IDs — never reload these rows into training.
    test_df[[ID_COL]].to_csv(paths["locked_test"], index=False)
    manifest = {
        "random_state": RANDOM_STATE,
        "train_n": int(len(train_df)),
        "val_n": int(len(val_df)),
        "test_n": int(len(test_df)),
        "train_fraud_rate": float(train_df[LABEL_COL].mean()),
        "val_fraud_rate": float(val_df[LABEL_COL].mean()),
        "test_fraud_rate": float(test_df[LABEL_COL].mean()),
        "note": "Test IDs in locked_test_ids.csv are frozen and unused for fitting.",
    }
    paths["split_manifest"].write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"[train] split train={manifest['train_n']:,} val={manifest['val_n']:,} test={manifest['test_n']:,}")

    medians, category_maps = fit_encoders(train_df)
    X_train = transform(train_df, medians, category_maps)
    X_val = transform(val_df, medians, category_maps)
    X_test = transform(test_df, medians, category_maps)
    y_train = train_df[LABEL_COL].to_numpy(dtype=np.int32)
    y_val = val_df[LABEL_COL].to_numpy(dtype=np.int32)
    y_test = test_df[LABEL_COL].to_numpy(dtype=np.int32)

    n_pos = max(int(y_train.sum()), 1)
    n_neg = int((y_train == 0).sum())
    scale_pos_weight = n_neg / n_pos
    print(f"[train] scale_pos_weight={scale_pos_weight:.4f} (neg={n_neg:,} pos={n_pos:,})")

    clf = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_lambda=1.0,
        objective="binary:logistic",
        eval_metric="auc",
        tree_method="hist",
        scale_pos_weight=scale_pos_weight,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        early_stopping_rounds=40,
    )
    clf.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )

    val_prob = clf.predict_proba(X_val)[:, 1]
    threshold = select_threshold(y_val, val_prob)
    print(f"[train] validation-selected threshold={threshold:.4f}")

    test_prob = clf.predict_proba(X_test)[:, 1]
    test_metrics = compute_metrics(y_test, test_prob, threshold)
    val_metrics = compute_metrics(y_val, val_prob, threshold)

    print("\n========== HELD-OUT TEST METRICS ==========")
    for k, v in test_metrics.items():
        print(f"  {k}: {v}")
    print("===========================================\n")

    bundle = {
        "model": clf,
        "feature_names": ALL_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "medians": medians,
        "category_maps": category_maps,
        "threshold": threshold,
        "scale_pos_weight": scale_pos_weight,
        "metrics": {
            "test": test_metrics,
            "validation": val_metrics,
        },
        "split_manifest": manifest,
        "best_iteration": int(getattr(clf, "best_iteration", clf.n_estimators)),
    }
    joblib.dump(bundle, paths["bundle"])
    paths["metrics"].write_text(
        json.dumps(bundle["metrics"], indent=2),
        encoding="utf-8",
    )
    print(f"[train] saved {paths['bundle']}")
    return bundle["metrics"]


if __name__ == "__main__":
    # Allow running as `python -m model.train` from backend/
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    train()
