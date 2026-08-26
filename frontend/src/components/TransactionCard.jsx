import React from "react";
import { ShieldAlert, ShieldCheck, Eye, CreditCard, Smartphone, Building, Wallet, Calendar } from "lucide-react";

export default function TransactionCard({ item, onSelect, isSelected }) {
  const action = item.recommended_action || "clear";
  const label = item.final_decision || item.xgboost_label;
  const isFraud = label === "fraud";
  const prob = Number(item.fraud_probability || 0);
  const probPct = (prob * 100).toFixed(1);
  const txn = item.standardized_transaction || {};
  
  const amountRs = txn.amount != null ? (txn.amount / 100).toLocaleString("en-IN") : "—";
  const method = (txn.method || "card").toLowerCase();
  
  const tone = isFraud ? "fraud" : action === "monitor" ? "monitor" : "clear";

  const getMethodIcon = (m) => {
    switch (m) {
      case "upi": return <Smartphone size={14} color="var(--brand-primary)" />;
      case "netbanking":
      case "bank_transfer": return <Building size={14} color="var(--text-secondary)" />;
      case "wallet": return <Wallet size={14} color="var(--monitor-amber)" />;
      default: return <CreditCard size={14} color="var(--text-secondary)" />;
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div 
      className={`txn-stream-card ${tone} ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect?.(item)}
      id={`txn-${item.transaction_id}`}
    >
      {/* Col 1: ID & Timestamp */}
      <div>
        <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {item.transaction_id}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          <Calendar size={11} />
          <span>{formatDate(item.timestamp)}</span>
        </div>
      </div>

      {/* Col 2: Method & Account */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ padding: 6, borderRadius: "var(--radius-sm)", background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)" }}>
          {getMethodIcon(method)}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-primary)" }}>
            {method}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {txn.card?.network || txn.currency || "INR"}
          </div>
        </div>
      </div>

      {/* Col 3: Amount */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
          ₹{amountRs}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
          {txn.email || "No email"}
        </div>
      </div>

      {/* Col 4: Action Status Pill */}
      <div>
        <span className={`action-capsule ${action}`} style={{ fontSize: 11, padding: "4px 10px", width: "fit-content" }}>
          {action === "escalate" ? "⚡ Escalate" : action === "monitor" ? "👁 Monitor" : "✓ Cleared"}
        </span>
      </div>

      {/* Col 5: Fraud Probability */}
      <div style={{ textAlign: "right" }}>
        <div className="font-mono" style={{ fontSize: 15, fontWeight: 800, color: isFraud ? "var(--fraud-rose)" : action === "monitor" ? "var(--monitor-amber)" : "var(--clear-emerald)" }}>
          {probPct}%
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
