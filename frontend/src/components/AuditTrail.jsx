import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Eye, Copy, Check, Sparkles, Layers, FileText, ArrowUpRight, ArrowDownRight, Database, X } from "lucide-react";

export default function AuditTrail({ record, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!record) {
    return (
      <div className="glass-card empty-hero-state" style={{ marginTop: 20 }}>
        <div className="empty-icon-circle">
          <Database size={24} />
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          No Transaction Selected
        </h4>
        <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 320 }}>
          Click any transaction from the stream above to inspect its complete immutable audit trail and Gemini explanation.
        </p>
      </div>
    );
  }

  const isFraud = (record.final_decision || record.xgboost_label) === "fraud";
  const action = record.recommended_action || "clear";
  const prob = Number(record.fraud_probability || 0);
  const probPct = (prob * 100).toFixed(2);
  const gemini = record.gemini_output || {};
  const txn = record.standardized_transaction || {};
  const shap = record.shap_values || [];

  const copyAuditJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ marginTop: 24, border: "1px solid var(--border-medium)" }}>
      {/* Header */}
      <div className="card-header-row" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className={`verdict-icon-bubble ${isFraud ? "fraud" : action === "monitor" ? "monitor" : "clear"}`} style={{ width: 38, height: 38, borderRadius: "var(--radius-md)" }}>
            {isFraud ? <ShieldAlert size={20} /> : action === "monitor" ? <Eye size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="font-mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {record.transaction_id}
              </span>
              <span className={`action-capsule ${action}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                {action}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Logged at {record.timestamp ? new Date(record.timestamp).toLocaleString() : "Unknown"} • Decision: <strong>{record.final_decision || record.xgboost_label}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn-secondary" onClick={copyAuditJSON}>
            {copied ? <Check size={14} color="var(--clear-emerald)" /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy Audit JSON"}</span>
          </button>
          {onClose && (
            <button className="btn-secondary" onClick={onClose} style={{ padding: "8px" }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Key Properties */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "18px 0" }}>
        <div style={{ padding: "10px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Probability</div>
          <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: isFraud ? "var(--fraud-rose)" : "var(--clear-emerald)", marginTop: 2 }}>
            {probPct}%
          </div>
        </div>
        <div style={{ padding: "10px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Threshold</div>
          <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
            {Number(record.threshold || 0.8351).toFixed(4)}
          </div>
        </div>
        <div style={{ padding: "10px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Amount</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
            ₹{txn.amount != null ? (txn.amount / 100).toLocaleString("en-IN") : "—"}
          </div>
        </div>
        <div style={{ padding: "10px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Method & Network</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 4, textTransform: "uppercase" }}>
            {txn.method || "—"} ({txn.card?.network || txn.currency || "INR"})
          </div>
        </div>
      </div>

      {/* AI Synthesized Narrative */}
      {gemini.evidence_summary && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>
            <Sparkles size={13} color="var(--ai-purple)" />
            <span>Gemini Narrative & Ground Truth Alignment</span>
          </div>
          <div className="ai-narrative-box" style={{ fontSize: 13 }}>
            {gemini.evidence_summary}
          </div>
        </div>
      )}

      {/* Dispute Draft if Fraud */}
      {isFraud && gemini.dispute_draft && (
        <div className="dispute-evidence-box" style={{ marginTop: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#ffe4e6", marginBottom: 8 }}>
            <ShieldAlert size={15} color="var(--fraud-rose)" />
            <span>Generated Chargeback Defense Package</span>
          </div>
          <div className="dispute-text-content" style={{ fontSize: 12 }}>
            {gemini.dispute_draft}
          </div>
        </div>
      )}

      {/* SHAP Drivers */}
      {shap.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>
            <Layers size={13} />
            <span>SHAP Attribution Breakdown</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            {shap.map((s, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {s.direction === "positive" ? <ArrowUpRight size={13} color="var(--fraud-rose)" /> : <ArrowDownRight size={13} color="var(--clear-emerald)" />}
                  <span className="font-mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>{s.feature}</span>
                </div>
                <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: s.direction === "positive" ? "var(--fraud-rose)" : "var(--clear-emerald)" }}>
                  {s.direction === "positive" ? "+" : ""}{Number(s.shap_value).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
