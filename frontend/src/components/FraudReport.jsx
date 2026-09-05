import React, { useState } from "react";
import {
  ShieldAlert, ShieldCheck, Eye, Copy, Check,
  Layers, Database, FileText, Terminal, Zap, Sparkles
} from "lucide-react";
import Badge from "./Badge.jsx";
import ShapBar from "./ShapBar.jsx";

export default function FraudReport({ result }) {
  const [activeTab, setActiveTab] = useState("gemini");
  const [copiedDispute, setCopiedDispute] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!result) {
    return (
      <div className="fl-card" style={{
        minHeight: "340px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "10px"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--fl-radius-sm)",
          background: "var(--fl-raised)",
          border: "0.5px solid var(--fl-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fl-ghost)"
        }}>
          <Zap size={18} />
        </div>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--fl-bone)" }}>
          Awaiting Transaction Payload
        </div>
        <p style={{ maxWidth: "320px", fontSize: "11.5px", color: "var(--fl-dim)", lineHeight: 1.5 }}>
          Select a test preset on the left or paste a Razorpay payment object, then execute the pipeline.
        </p>
      </div>
    );
  }

  const isFraud = result.final_decision === "fraud";
  const action = result.recommended_action || "clear";
  const prob = Number(result.fraud_probability || 0);
  const probPct = (prob * 100).toFixed(2);
  const thresholdPct = (Number(result.threshold || 0.8351) * 100).toFixed(2);
  const gemini = result.gemini_output || {};
  const shap = result.shap_values || [];

  const copyDispute = () => {
    if (!gemini.dispute_draft) return;
    navigator.clipboard.writeText(gemini.dispute_draft);
    setCopiedDispute(true);
    setTimeout(() => setCopiedDispute(false), 2000);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Top Decision Anchor ── */}
      <div className="fl-card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Badge state={action} />
              <span className="payment-id">{result.transaction_id}</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--fl-dim)" }}>
              XGBoost Ground Truth ({result.decision_source}) • Latency ~18ms
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="data-label">Posterior Probability</div>
            <div
              className="display-numeric"
              style={{
                color: prob > 0.8351 ? "var(--fl-charge)" : prob >= 0.35 ? "var(--fl-caution)" : "var(--fl-bone)",
                marginTop: "2px"
              }}
            >
              {probPct}%
            </div>
            <div className="threshold-annotation">
              Threshold Cutoff: {thresholdPct}%
            </div>
          </div>
        </div>

        {/* Linear Decision Track */}
        <div style={{
          height: "4px",
          background: "var(--fl-raised)",
          borderRadius: "2px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "6px"
        }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(prob * 100, 100)}%`,
              backgroundColor: prob > 0.8351 ? "var(--fl-charge)" : prob >= 0.35 ? "var(--fl-caution)" : "var(--fl-clear)",
              borderRadius: "2px",
              transition: "width 300ms ease-out"
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--fl-ghost)", fontFamily: "var(--fl-font-data)" }}>
          <span>0.0% (Safe)</span>
          <span style={{ color: "var(--fl-dim)" }}>Operating Threshold: {thresholdPct}%</span>
          <span>100.0% (Definite Fraud)</span>
        </div>
      </div>

      {/* ── Inspection Tabs ── */}
      <div className="fl-card" style={{ padding: "14px 16px" }}>
        {/* Tab Controls */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: "0.5px solid var(--fl-hairline)",
          paddingBottom: "10px",
          marginBottom: "14px"
        }}>
          <button
            className={`btn-ghost ${activeTab === "gemini" ? "active" : ""}`}
            style={{
              fontSize: "11.5px",
              padding: "5px 10px",
              color: activeTab === "gemini" ? "var(--fl-bone)" : "var(--fl-dim)",
              background: activeTab === "gemini" ? "var(--fl-raised)" : "transparent"
            }}
            onClick={() => setActiveTab("gemini")}
          >
            <Sparkles size={12} />
            <span>Gemini Synthesis</span>
          </button>
          <button
            className={`btn-ghost ${activeTab === "shap" ? "active" : ""}`}
            style={{
              fontSize: "11.5px",
              padding: "5px 10px",
              color: activeTab === "shap" ? "var(--fl-bone)" : "var(--fl-dim)",
              background: activeTab === "shap" ? "var(--fl-raised)" : "transparent"
            }}
            onClick={() => setActiveTab("shap")}
          >
            <Layers size={12} />
            <span>SHAP Vectors ({shap.length})</span>
          </button>
          <button
            className={`btn-ghost ${activeTab === "features" ? "active" : ""}`}
            style={{
              fontSize: "11.5px",
              padding: "5px 10px",
              color: activeTab === "features" ? "var(--fl-bone)" : "var(--fl-dim)",
              background: activeTab === "features" ? "var(--fl-raised)" : "transparent"
            }}
            onClick={() => setActiveTab("features")}
          >
            <Database size={12} />
            <span>IEEE-CIS (42 Dim)</span>
          </button>
          <button
            className={`btn-ghost ${activeTab === "raw" ? "active" : ""}`}
            style={{
              fontSize: "11.5px",
              padding: "5px 10px",
              color: activeTab === "raw" ? "var(--fl-bone)" : "var(--fl-dim)",
              background: activeTab === "raw" ? "var(--fl-raised)" : "transparent"
            }}
            onClick={() => setActiveTab("raw")}
          >
            <Terminal size={12} />
            <span>Audit JSON</span>
          </button>
        </div>

        {/* Tab 1: Gemini Synthesis */}
        {activeTab === "gemini" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {gemini.evidence_summary && (
              <div>
                <div className="data-label" style={{ marginBottom: "4px" }}>Synthesized Evidence Analysis</div>
                <div style={{
                  background: "var(--fl-bg)",
                  border: "0.5px solid var(--fl-hairline)",
                  borderRadius: "var(--fl-radius-sm)",
                  padding: "12px",
                  fontSize: "12px",
                  color: "var(--fl-bone)",
                  lineHeight: "1.5"
                }}>
                  {gemini.evidence_summary}
                </div>
              </div>
            )}

            {gemini.confidence_narrative && (
              <div>
                <div className="data-label" style={{ marginBottom: "4px" }}>Ground Truth Calibration Logic</div>
                <div style={{
                  background: "var(--fl-bg)",
                  border: "0.5px solid var(--fl-hairline)",
                  borderRadius: "var(--fl-radius-sm)",
                  padding: "12px",
                  fontSize: "11.5px",
                  color: "var(--fl-dim)",
                  lineHeight: "1.5"
                }}>
                  {gemini.confidence_narrative}
                </div>
              </div>
            )}

            {/* Auto Dispute Dossier */}
            {isFraud && gemini.dispute_draft ? (
              <div style={{
                background: "var(--fl-bg)",
                border: "0.5px solid var(--fl-border)",
                borderRadius: "var(--fl-radius-sm)",
                padding: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={14} color="var(--fl-charge)" />
                    <span className="data-label" style={{ color: "var(--fl-charge-dim)" }}>Auto-Drafted Chargeback Dispute Dossier</span>
                  </div>
                  <button className="btn-accent-ghost" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={copyDispute}>
                    {copiedDispute ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedDispute ? "Copied" : "Copy Dispute Text"}</span>
                  </button>
                </div>
                <div style={{
                  fontFamily: "var(--fl-font-data)",
                  fontSize: "11px",
                  color: "var(--fl-dim)",
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap"
                }}>
                  {gemini.dispute_draft}
                </div>
              </div>
            ) : (
              <div style={{
                padding: "10px 12px",
                background: "var(--fl-bg)",
                border: "0.5px solid var(--fl-hairline)",
                borderRadius: "var(--fl-radius-sm)",
                fontSize: "11.5px",
                color: "var(--fl-ghost)"
              }}>
                Dispute defense dossier is only auto-generated for transactions crossing the 0.8351 fraud threshold.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SHAP Attribution Bars */}
        {activeTab === "shap" && (
          <div>
            <ShapBar shapValues={shap} />
          </div>
        )}

        {/* Tab 3: IEEE-CIS Feature Space */}
        {activeTab === "features" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="data-label">42-Dimension Feature Vector</span>
              <span style={{ fontSize: "10px", color: "var(--fl-ghost)", fontFamily: "var(--fl-font-data)" }}>
                {Object.keys(result.input_features || {}).length} Columns
              </span>
            </div>
            <div style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "0.5px solid var(--fl-hairline)",
              borderRadius: "var(--fl-radius-sm)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "var(--fl-font-data)" }}>
                <thead>
                  <tr style={{ background: "var(--fl-bg)", borderBottom: "0.5px solid var(--fl-hairline)", textAlign: "left", color: "var(--fl-ghost)" }}>
                    <th style={{ padding: "6px 10px", fontWeight: 500 }}>Feature</th>
                    <th style={{ padding: "6px 10px", fontWeight: 500 }}>Value</th>
                    <th style={{ padding: "6px 10px", fontWeight: 500 }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.input_features || {}).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: "0.5px solid var(--fl-hairline)" }}>
                      <td style={{ padding: "5px 10px", color: "var(--fl-dim)" }}>{k}</td>
                      <td style={{ padding: "5px 10px", color: "var(--fl-bone)" }}>
                        {v === null || v === undefined ? "—" : typeof v === "number" ? v.toFixed(4) : String(v)}
                      </td>
                      <td style={{ padding: "5px 10px", color: "var(--fl-ghost)", fontSize: "10px" }}>
                        {typeof v === "number" ? "Float32" : "Categorical"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === "raw" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="data-label">Standardized Response Payload</span>
              <button className="btn-ghost" style={{ padding: "3px 8px", fontSize: "11px" }} onClick={copyPayload}>
                {copiedPayload ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedPayload ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
            <pre style={{
              background: "var(--fl-bg)",
              border: "0.5px solid var(--fl-hairline)",
              borderRadius: "var(--fl-radius-sm)",
              padding: "10px",
              fontFamily: "var(--fl-font-data)",
              fontSize: "11px",
              color: "var(--fl-dim)",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
