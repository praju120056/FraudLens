import React, { useState } from "react";
import { X, Copy, Check, ShieldAlert, FileText, Terminal, Layers } from "lucide-react";
import Badge from "./Badge.jsx";
import ShapBar from "./ShapBar.jsx";

export default function AuditTrail({ record, onClose }) {
  const [copiedDispute, setCopiedDispute] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!record) return null;

  const isFraud = (record.final_decision || record.xgboost_label) === "fraud";
  const action = record.recommended_action || "clear";
  const prob = Number(record.fraud_probability || 0);
  const probPct = (prob * 100).toFixed(2);
  const gemini = record.gemini_output || {};
  const txn = record.standardized_transaction || {};
  const shap = record.shap_values || [];

  const copyDispute = () => {
    if (!gemini.dispute_draft) return;
    navigator.clipboard.writeText(gemini.dispute_draft);
    setCopiedDispute(true);
    setTimeout(() => setCopiedDispute(false), 2000);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <aside className="audit-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="payment-id" style={{ fontSize: "13px" }}>{record.transaction_id}</span>
            <Badge state={action} />
          </div>
          <div style={{ fontSize: "11px", color: "var(--fl-dim)", marginTop: "2px" }}>
            Audit Ledger Record • {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : "Live"}
          </div>
        </div>
        <button
          className="btn-ghost"
          style={{ padding: "6px" }}
          onClick={onClose}
          title="Close Drawer (Esc)"
        >
          <X size={15} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="drawer-body">
        {/* Core Decision Strip */}
        <div style={{
          background: "var(--fl-surface)",
          border: "0.5px solid var(--fl-hairline)",
          borderRadius: "var(--fl-radius-md)",
          padding: "12px 14px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px"
        }}>
          <div>
            <div className="data-label">Fraud Probability</div>
            <div style={{
              fontFamily: "var(--fl-font-data)",
              fontSize: "20px",
              fontWeight: 500,
              color: prob > 0.8351 ? "var(--fl-charge)" : prob >= 0.35 ? "var(--fl-caution)" : "var(--fl-bone)",
              marginTop: "2px"
            }}>
              {probPct}%
            </div>
          </div>
          <div>
            <div className="data-label">Amount & Method</div>
            <div style={{
              fontFamily: "var(--fl-font-data)",
              fontSize: "14px",
              color: "var(--fl-bone)",
              marginTop: "4px"
            }}>
              ₹{txn.amount != null ? (txn.amount / 100).toLocaleString("en-IN") : "—"}
            </div>
            <div style={{ fontSize: "10px", color: "var(--fl-dim)", textTransform: "uppercase" }}>
              {txn.method || "card"}
            </div>
          </div>
        </div>

        {/* SHAP Attributions */}
        {shap.length > 0 && (
          <div>
            <ShapBar shapValues={shap} />
          </div>
        )}

        {/* Gemini Evidence Synthesis */}
        {gemini.evidence_summary && (
          <div style={{
            background: "var(--fl-surface)",
            border: "0.5px solid var(--fl-hairline)",
            borderRadius: "var(--fl-radius-md)",
            padding: "14px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px"
            }}>
              <FileText size={13} color="var(--fl-dim)" />
              <span className="data-label">Synthesized Evidence Summary</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--fl-dim)", lineHeight: "1.5" }}>
              {gemini.evidence_summary}
            </p>
          </div>
        )}

        {/* Dispute Dossier */}
        {isFraud && gemini.dispute_draft && (
          <div style={{
            background: "var(--fl-surface)",
            border: "0.5px solid var(--fl-border)",
            borderRadius: "var(--fl-radius-md)",
            padding: "14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldAlert size={14} color="var(--fl-charge)" />
                <span className="data-label" style={{ color: "var(--fl-charge-dim)" }}>Auto-Drafted Dispute Dossier</span>
              </div>
              <button className="btn-accent-ghost" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={copyDispute}>
                {copiedDispute ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedDispute ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div style={{
              background: "#080808",
              padding: "10px",
              borderRadius: "var(--fl-radius-sm)",
              border: "0.5px solid var(--fl-hairline)",
              fontFamily: "var(--fl-font-data)",
              fontSize: "11px",
              color: "var(--fl-dim)",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap",
              maxHeight: "140px",
              overflowY: "auto"
            }}>
              {gemini.dispute_draft}
            </div>
          </div>
        )}

        {/* Raw JSON Trace */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span className="data-label">Raw Audit Ledger Payload</span>
            <button className="btn-ghost" style={{ padding: "3px 8px", fontSize: "11px" }} onClick={copyJson}>
              {copiedJson ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>
          <pre style={{
            background: "#080808",
            border: "0.5px solid var(--fl-hairline)",
            borderRadius: "var(--fl-radius-sm)",
            padding: "10px",
            fontFamily: "var(--fl-font-data)",
            fontSize: "10.5px",
            color: "var(--fl-dim)",
            maxHeight: "160px",
            overflowY: "auto"
          }}>
            {JSON.stringify(record, null, 2)}
          </pre>
        </div>
      </div>
    </aside>
  );
}
