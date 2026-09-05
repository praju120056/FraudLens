import React from "react";
import Badge from "./Badge.jsx";

export default function TransactionCard({ item, onSelect, isSelected }) {
  const action = item.recommended_action || "clear";
  const prob = Number(item.fraud_probability || 0);
  const probPct = (prob * 100).toFixed(1);
  const txn = item.standardized_transaction || {};
  
  const amountRs = txn.amount != null ? (txn.amount / 100).toLocaleString("en-IN") : "—";
  const method = (txn.method || "card").toUpperCase();

  // Score color rule
  const scoreColor =
    prob > 0.8351
      ? "var(--fl-charge)"
      : prob >= 0.35
      ? "var(--fl-caution)"
      : "var(--fl-ghost)";

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`telemetry-row ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect?.(item)}
      id={`txn-${item.transaction_id}`}
    >
      {/* Col 1: ID & Ingestion Timestamp */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
        <span className="payment-id" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.transaction_id}
        </span>
        <span style={{ fontSize: "10px", color: "var(--fl-ghost)", fontFamily: "var(--fl-font-data)" }}>
          {formatDate(item.timestamp)} • {txn.email || "direct-payload"}
        </span>
      </div>

      {/* Col 2: Method / Network */}
      <div style={{ fontSize: "11px", color: "var(--fl-dim)", fontFamily: "var(--fl-font-data)" }}>
        {method} / {txn.card?.network ? txn.card.network.toUpperCase() : txn.currency || "INR"}
      </div>

      {/* Col 3: Amount */}
      <div style={{ fontSize: "12.5px", color: "var(--fl-bone)", fontFamily: "var(--fl-font-data)" }}>
        ₹{amountRs}
      </div>

      {/* Col 4: State Badge */}
      <div>
        <Badge state={action} />
      </div>

      {/* Col 5: Monospace Probability */}
      <div style={{ textAlign: "right", fontFamily: "var(--fl-font-data)", fontSize: "12px", color: scoreColor, fontWeight: 500 }}>
        {probPct}%
      </div>
    </div>
  );
}
