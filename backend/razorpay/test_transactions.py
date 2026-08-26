"""
Fetch Razorpay test-mode payments and produce standardized transaction dicts.

Uses RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET from .env only — never hardcoded.

If keys are missing or the API is unreachable, falls back to 10+ synthetic
payloads that match Razorpay payment JSON so the rest of the pipeline can demo.
"""

from __future__ import annotations

import importlib.util
import os
import site
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _load_official_sdk():
    """Load the pip `razorpay` package, not this local folder of the same name."""
    search_roots = []
    try:
        search_roots.extend(site.getsitepackages())
    except Exception:
        pass
    try:
        search_roots.append(site.getusersitepackages())
    except Exception:
        pass
    for root in search_roots:
        init = Path(root) / "razorpay" / "__init__.py"
        if not init.exists():
            continue
        spec = importlib.util.spec_from_file_location("official_razorpay_sdk", init)
        if spec is None or spec.loader is None:
            continue
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    raise ImportError("Official razorpay SDK is not installed. pip install razorpay")


def _client():
    key_id = os.environ.get("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret:
        return None
    sdk = _load_official_sdk()
    return sdk.Client(auth=(key_id, key_secret))


def synthetic_test_transactions(n: int = 12) -> list[dict[str, Any]]:
    """At least 10 demo payments shaped like Razorpay payment entities.

    Four entries (indices 12–15) are intentionally fraud-shaped: their
    `ieee_feature_overrides` dicts inject C/D/card values drawn directly
    from high-scoring IEEE-CIS fraud rows, so the XGBoost model returns
    realistic fraud probabilities (≥0.85) for demo purposes.
    """
    now = int(time.time())
    templates = [
        {
            "id": "pay_demo_card_ok_01",
            "amount": 49900,
            "method": "card",
            "status": "captured",
            "email": "priya.sharma@gmail.com",
            "contact": "+919811112222",
            "card": {"network": "visa", "type": "debit", "last4": "1111", "iin": "411111"},
        },
        {
            "id": "pay_demo_upi_ok_02",
            "amount": 129900,
            "method": "upi",
            "status": "captured",
            "email": "rahul.k@yahoo.com",
            "contact": "+919822223333",
            "vpa": "rahul@okaxis",
            "card": {},
        },
        {
            "id": "pay_demo_nb_ok_03",
            "amount": 250000,
            "method": "netbanking",
            "status": "captured",
            "email": "accounts@shopkart.in",
            "contact": "+919833334444",
            "bank": "HDFC",
            "card": {},
        },
        {
            "id": "pay_demo_card_high_04",
            "amount": 1850000,
            "method": "card",
            "status": "captured",
            "email": "unknown.buyer@mailinator.com",
            "contact": "+919800000001",
            "card": {"network": "mastercard", "type": "credit", "last4": "4444", "iin": "555555"},
        },
        {
            "id": "pay_demo_card_intl_05",
            "amount": 720000,
            "method": "card",
            "status": "authorized",
            "email": "buyer@protonmail.com",
            "contact": "+14155550100",
            "international": True,
            "currency": "INR",
            "card": {"network": "amex", "type": "credit", "last4": "0005", "iin": "378282"},
        },
        {
            "id": "pay_demo_upi_new_06",
            "amount": 99900,
            "method": "upi",
            "status": "captured",
            "email": "newuser123@gmail.com",
            "contact": "+919844445555",
            "vpa": "newuser@paytm",
            "card": {},
        },
        {
            "id": "pay_demo_wallet_07",
            "amount": 35000,
            "method": "wallet",
            "status": "captured",
            "email": "meena@outlook.com",
            "contact": "+919855556666",
            "wallet": "payzapp",
            "card": {},
        },
        {
            "id": "pay_demo_emi_08",
            "amount": 4599900,
            "method": "emi",
            "status": "captured",
            "email": "vip.client@icloud.com",
            "contact": "+919866667777",
            "card": {"network": "visa", "type": "credit", "last4": "4242", "iin": "424242"},
        },
        {
            "id": "pay_demo_card_fail_09",
            "amount": 150000,
            "method": "card",
            "status": "failed",
            "email": "retry.fraud@yopmail.com",
            "contact": "+919877778888",
            "card": {"network": "rupay", "type": "debit", "last4": "0008", "iin": "652134"},
        },
        {
            "id": "pay_demo_nb_large_10",
            "amount": 8900000,
            "method": "netbanking",
            "status": "captured",
            "email": "cfo@enterprise.co.in",
            "contact": "+919888889999",
            "bank": "ICICI",
            "card": {},
        },
        {
            "id": "pay_demo_card_prepaid_11",
            "amount": 210000,
            "method": "card",
            "status": "captured",
            "email": "giftcard.user@gmail.com",
            "contact": "+919800001234",
            "card": {"network": "visa", "type": "prepaid", "last4": "0123", "iin": "407810"},
        },
        {
            "id": "pay_demo_upi_midnight_12",
            "amount": 67000,
            "method": "upi",
            "status": "captured",
            "email": "late.night@hotmail.com",
            "contact": "+919812345678",
            "vpa": "late@upi",
            "card": {},
        },
        # ── Fraud-shaped synthetic payloads (indices 12–15) ─────────────────────
        # C/D/card values are drawn from real IEEE-CIS fraud rows so the XGBoost
        # model returns fraud scores well above its 0.8351 decision threshold.
        # The `ieee_feature_overrides` key is consumed by feature_engineering.py
        # and has no effect on real Razorpay API payloads.
        {
            # High-velocity card fraud: 123 repeat transactions on same card (C1=123),
            # brand-new account (D1=0), small repeat charge — classic card testing attack.
            # Source: IEEE-CIS fraud row → model score 0.9950.
            "id": "pay_fraud_card_carding_13",
            "amount": 7800,           # ₹78 — micro-probe amount typical of carding
            "method": "card",
            "status": "captured",
            "email": "testcard.burner@hotmail.com",
            "contact": "+919900000013",
            "card": {"network": "visa", "type": "credit", "last4": "9026", "iin": "545100"},
            "ieee_feature_overrides": {
                # Behavioural counts: same card used 123 times (extreme velocity)
                "C1": 123.0, "C2": 150.0, "C3": 0.0, "C4": 30.0, "C5": 0.0,
                "C6": 30.0,  "C7": 30.0,  "C8": 22.0, "C9": 0.0, "C10": 56.0,
                "C11": 42.0, "C12": 42.0, "C13": 8.0,  "C14": 5.0,
                # Account created same day as transaction
                "D1": 0.0, "D4": 65.0, "D5": 12.0, "D6": 65.0, "D7": 12.0,
                "D10": 0.0, "D12": 65.0, "D13": 4.0, "D14": 4.0, "D15": 355.0,
                # Card fingerprint matching fraud pattern
                "card1": 9026.0, "card2": 545.0, "card3": 185.0, "card5": 137.0,
            },
        },
        {
            # Netbanking fraud: account opened same day (D1=0), multiple payment
            # attempts via netbanking with a card-associated BIN (C1=5).
            # Source: IEEE-CIS fraud row → model score 0.9909.
            "id": "pay_fraud_nb_newaccount_14",
            "amount": 45000,          # ₹450 — mid-range amount
            "method": "netbanking",
            "status": "captured",
            "email": "quick.transfer@gmail.com",
            "contact": "+919900000014",
            "bank": "SBI",
            "card": {},
            "ieee_feature_overrides": {
                "C1": 5.0,  "C2": 5.0,  "C3": 0.0, "C4": 0.0, "C5": 0.0,
                "C6": 1.0,  "C7": 0.0,  "C8": 0.0, "C9": 1.0, "C10": 0.0,
                "C11": 1.0, "C12": 0.0, "C13": 1.0, "C14": 1.0,
                "D1": 0.0, "D10": 0.0, "D15": 52.0,
                "card1": 4151.0, "card2": 404.0, "card3": 150.0, "card5": 102.0,
            },
        },
        {
            # UPI fraud: high-velocity repeat charges (C1=15, C6=14), brand-new
            # account (D1=0), hotmail domain, card cluster 9803/583/226.
            # Source: IEEE-CIS ProductCD=W fraud row → model score 0.9918.
            "id": "pay_fraud_upi_cnp_15",
            "amount": 10795,          # ₹107.95 — matching fraud pattern amount
            "method": "upi",
            "status": "captured",
            "email": "disposable.id@hotmail.com",
            "contact": "+919900000015",
            "vpa": "anon9803@upi",
            "card": {},
            "ieee_feature_overrides": {
                "C1": 15.0, "C2": 15.0, "C3": 0.0, "C4": 0.0, "C5": 0.0,
                "C6": 14.0, "C7": 0.0,  "C8": 0.0, "C9": 4.0, "C10": 0.0,
                "C11": 14.0, "C12": 0.0, "C13": 3.0, "C14": 2.0,
                "D1": 0.0, "D10": 0.0, "D15": 0.0,
                "card1": 9803.0, "card2": 583.0, "card3": 150.0, "card5": 226.0,
                "addr1": 226.0, "card4": "visa",
                "TransactionAmt": 107.95,
            },
        },
        {
            # Wallet fraud: new account (D1=0), multiple linked payment methods
            # (C1=7, C11=5), mastercard cluster 4425/562/197.
            # Source: IEEE-CIS ProductCD=R fraud row → model score 0.9985.
            "id": "pay_fraud_wallet_newish_16",
            "amount": 22500,          # ₹225
            "method": "wallet",
            "status": "captured",
            "email": "burner.wallet@gmail.com",
            "contact": "+919900000016",
            "wallet": "mobikwik",
            "card": {},
            "ieee_feature_overrides": {
                "C1": 7.0,  "C2": 6.0,  "C3": 0.0, "C4": 0.0, "C5": 0.0,
                "C6": 1.0,  "C7": 0.0,  "C8": 0.0, "C9": 0.0, "C10": 0.0,
                "C11": 5.0, "C12": 0.0, "C13": 0.0, "C14": 0.0,
                "D1": 0.0, "D10": 0.0, "D15": 52.0,
                "card1": 4425.0, "card2": 562.0, "card3": 150.0, "card5": 197.0,
                "addr1": 472.0, "card4": "mastercard",
                "TransactionAmt": 225.0,
            },
        },
    ]
    out = []
    for i, t in enumerate(templates[: max(n, 10)]):
        created = now - (i * 3600)
        customer_created = created - (86400 * (1 if i in {3, 4, 8} else 120))
        entry = {
            "id": t["id"],
            "entity": "payment",
            "amount": t["amount"],
            "currency": t.get("currency", "INR"),
            "status": t["status"],
            "method": t["method"],
            "order_id": f"order_demo_{i+1:02d}",
            "email": t.get("email"),
            "contact": t.get("contact"),
            "created_at": created,
            "account_created_at": customer_created,
            "international": t.get("international", False),
            "card": t.get("card") or {},
            "vpa": t.get("vpa"),
            "bank": t.get("bank"),
            "wallet": t.get("wallet"),
            "notes": {"source": "synthetic_test_mode"},
        }
        # Forward ieee_feature_overrides so feature_engineering.py can inject
        # pre-validated C/D/card values for fraud-shaped demo payloads.
        if "ieee_feature_overrides" in t:
            entry["ieee_feature_overrides"] = t["ieee_feature_overrides"]
        out.append(entry)
    return out


def fetch_recent_payments(count: int = 20) -> list[dict[str, Any]]:
    """
    Pull recent test-mode payments via Razorpay Payments API.
    Returns standardized dicts; on missing keys or API errors, returns synthetics.
    """
    client = _client()
    if client is None:
        return synthetic_test_transactions(max(count, 12))
    try:
        payload = client.payment.all({"count": min(count, 100)})
        items = payload.get("items") or []
        if not items:
            return synthetic_test_transactions(12)
        return items
    except Exception:
        return synthetic_test_transactions(12)


def generate_demo_if_needed() -> list[dict[str, Any]]:
    """Always returns ≥10 transactions for the dashboard live feed seed."""
    live = fetch_recent_payments(20)
    if len(live) >= 10:
        return live
    return live + synthetic_test_transactions(12 - len(live))
