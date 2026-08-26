"""
Map Razorpay test-mode payment objects into the IEEE-CIS feature space
used by the trained XGBoost model.

Razorpay → IEEE-CIS (explicit contract)
---------------------------------------
TransactionAmt  ← amount / 100          # Razorpay amount is paise; IEEE is rupees-like units
ProductCD       ← method                # card→C, upi→W, netbanking→H, wallet→R, emi→S, else W
card4           ← card.network          # visa/mastercard/amex/rupay → visa/mastercard/american express/discover
card6           ← card.type             # credit/debit (prepaid → debit)
card1           ← numeric hash of card last4 + network (IEEE card1 is a tokenized card id)
card2, card3, card5 ← card.issuer / iin fragments when present; else train medians
addr1           ← derived from contact (last 6 digits as a coarse geo/account token, IEEE-style)
addr2           ← country code numeric proxy (IN→356)
dist1           ← unavailable at payment time → train median
C1–C14          ← unavailable counts → train medians
D1              ← days since account/customer first seen (created_at vs customer created_at)
D2–D15          ← unavailable deltas → train medians
TransactionDT   ← unix seconds of created_at (IEEE is seconds from a reference epoch)
P_emaildomain   ← domain of email

Any feature not present on the Razorpay object is filled with the TRAIN-SET
column median (or categorical __MISSING__) stored in model.pkl — never with
test-set statistics.

ieee_feature_overrides (optional, demo / testing only)
------------------------------------------------------
A transaction dict may include an `ieee_feature_overrides` key containing a
plain dict of feature_name → value. These values are applied *after* the
normal mapping and overwrite only the specified features. This mechanism is
used exclusively by fraud-shaped synthetic demo payloads so that count-based
behavioural features (C1–C14, D1, D2–D15) can be set to values that match
real IEEE-CIS fraud patterns, giving realistic model scores in the dashboard.

Real Razorpay API payloads never include this key, so it has no effect in
production.
"""

from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from typing import Any

from model.predict import load_bundle
from model.train import ALL_FEATURES, CATEGORICAL_FEATURES, NUMERIC_FEATURES

# IEEE ProductCD observed values: W, C, R, H, S
METHOD_TO_PRODUCTCD = {
    "card": "C",
    "upi": "W",
    "netbanking": "H",
    "wallet": "R",
    "emi": "S",
    "bank_transfer": "H",
    "emandate": "H",
    "cardless_emi": "S",
}

NETWORK_TO_CARD4 = {
    "visa": "visa",
    "mastercard": "mastercard",
    "master": "mastercard",
    "amex": "american express",
    "american_express": "american express",
    "american express": "american express",
    "rupay": "discover",  # closest IEEE bucket; documented approximation
    "maestro": "mastercard",
    "diners": "discover",
}


def _median_row(bundle: dict) -> dict[str, Any]:
    row = {col: bundle["medians"][col] for col in NUMERIC_FEATURES}
    for col in CATEGORICAL_FEATURES:
        row[col] = "__MISSING__"
    return row


def _parse_created_at(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        # Razorpay timestamps are unix seconds
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    if isinstance(value, str):
        try:
            if value.isdigit():
                return datetime.fromtimestamp(int(value), tz=timezone.utc)
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _email_domain(email: str | None) -> str:
    if not email or "@" not in email:
        return "__MISSING__"
    return email.split("@", 1)[1].strip().lower() or "__MISSING__"


def _stable_int(text: str, modulo: int, offset: int = 0) -> int:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return offset + (int(digest[:8], 16) % modulo)


def razorpay_to_ieee(txn: dict[str, Any]) -> dict[str, Any]:
    """Convert a Razorpay payment dict (or demo synthetic) into IEEE-CIS features."""
    bundle = load_bundle()
    row = _median_row(bundle)

    amount_paise = txn.get("amount")
    if amount_paise is not None:
        # paise → rupees (IEEE TransactionAmt is a currency amount, not paise)
        row["TransactionAmt"] = float(amount_paise) / 100.0

    method = str(txn.get("method") or "").lower()
    row["ProductCD"] = METHOD_TO_PRODUCTCD.get(method, "W")

    card = txn.get("card") or {}
    network = str(card.get("network") or card.get("issuer") or "").lower()
    row["card4"] = NETWORK_TO_CARD4.get(network, "__MISSING__") if network else "__MISSING__"

    card_type = str(card.get("type") or "").lower()
    if card_type in {"credit", "debit"}:
        row["card6"] = card_type
    elif card_type == "prepaid":
        row["card6"] = "debit"

    last4 = str(card.get("last4") or card.get("last_4") or "")
    iin = str(card.get("iin") or "")
    token_src = f"{last4}|{network}|{txn.get('payment_id') or txn.get('id') or ''}"
    row["card1"] = float(_stable_int(token_src, 15000, offset=1000))
    if iin.isdigit() and len(iin) >= 4:
        row["card2"] = float(iin[:3])
        row["card5"] = float(iin[:3])
        row["card3"] = 150.0  # INR issuing-country analogue (IEEE card3≈150 is India-like)

    contact = str(txn.get("contact") or "")
    digits = re.sub(r"\D", "", contact)
    if len(digits) >= 6:
        row["addr1"] = float(int(digits[-6:]) % 500)  # coarse billing/account token
    row["addr2"] = 87.0 if str(txn.get("currency") or "INR").upper() == "INR" else 60.0

    created = _parse_created_at(txn.get("created_at"))
    customer_created = _parse_created_at(
        (txn.get("customer") or {}).get("created_at") or txn.get("account_created_at")
    )
    if created is not None:
        row["TransactionDT"] = float(int(created.timestamp()))
        if customer_created is not None:
            delta_days = max((created - customer_created).total_seconds() / 86400.0, 0.0)
            row["D1"] = float(delta_days)

    row["P_emaildomain"] = _email_domain(txn.get("email"))

    # Optional overrides: demo/test payloads may supply ieee_feature_overrides to
    # inject specific C/D/card values that match real fraud patterns from IEEE-CIS.
    # Real Razorpay API objects never carry this key, so this is a no-op in production.
    overrides = txn.get("ieee_feature_overrides")
    if isinstance(overrides, dict):
        for feat, val in overrides.items():
            if feat in ALL_FEATURES:
                row[feat] = val

    # Keep only the model contract; extra keys are ignored at vectorize time.
    return {k: row.get(k) for k in ALL_FEATURES}


def standardize_transaction(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize Razorpay SDK payloads and pasted JSON into one internal shape."""
    entity = raw.get("entity") if isinstance(raw.get("entity"), dict) else raw
    payment_id = entity.get("id") or entity.get("payment_id")
    out = {
        "payment_id": payment_id,
        "order_id": entity.get("order_id"),
        "amount": entity.get("amount"),
        "currency": entity.get("currency") or "INR",
        "method": entity.get("method"),
        "status": entity.get("status"),
        "email": entity.get("email"),
        "contact": entity.get("contact"),
        "created_at": entity.get("created_at"),
        "card": entity.get("card") or {},
        "customer": entity.get("customer") or {},
        "account_created_at": entity.get("account_created_at"),
        "notes": entity.get("notes") or {},
        "international": entity.get("international"),
        "vpa": entity.get("vpa"),
        "bank": entity.get("bank"),
        "wallet": entity.get("wallet"),
        "raw": entity,
    }
    # Preserve ieee_feature_overrides from demo payloads; ignored for real API objects.
    if "ieee_feature_overrides" in raw:
        out["ieee_feature_overrides"] = raw["ieee_feature_overrides"]
    return out
