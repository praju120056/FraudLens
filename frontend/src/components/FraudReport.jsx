import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from "recharts";
import {
  ShieldAlert, ShieldCheck, Eye, Copy, Check,
  Layers, Database, FileText, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Cpu, Terminal, Zap, Sparkles
} from "lucide-react";
import SpotlightCard from "./SpotlightCard.jsx";
import DecryptedText from "./DecryptedText.jsx";

export default function FraudReport({ result }) {
  const [activeTab, setActiveTab] = useState("gemini");
  const [copiedDispute, setCopiedDispute] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!result) {
    return (
      <SpotlightCard className="empty-hero-state" style={{ minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-sm)", background: "var(--bg-code)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-cyan)", marginBottom: 14 }}>
          <Cpu size={26} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pure)", marginBottom: 6 }}>
          <DecryptedText text="READY FOR TRANSACTION INGESTION" speed={30} />
        </h3>
        <p style={{ maxWidth: 360, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Select a preset or paste a Razorpay payment payload, then execute <strong style={{ color: "var(--text-primary)" }}>Analyze & Synthesize Evidence</strong> to evaluate XGBoost decision gates, TreeSHAP drivers, and the Gemini ground truth package.
        </p>
      </SpotlightCard>
    );
  }

  const isFraud = result.final_decision === "fraud";
  const action = result.recommended_action || "clear";
  const prob = Number(result.fraud_probability || 0);
  const probPct = (prob * 100).toFixed(2);
  const thresholdPct = (Number(result.threshold || 0.8351) * 100).toFixed(2);
  const gemini = result.gemini_output || {};

  const tone = isFraud ? "fraud" : action === "monitor" ? "monitor" : "clear";

  const shapData = (result.shap_values || []).map((s) => ({
    name: s.feature,
    value: Number(s.shap_value),
    direction: s.direction,
    towards: s.towards,
    fill: s.direction === "positive" ? "var(--risk-fraud)" : "var(--risk-clear)"
  }));

  const maxAbsShap = Math.max(...shapData.map(s => Math.abs(s.value)), 0.001);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Top Decision Banner (Skipper Tactical HUD) ── */}
      <div className={`decision-hero-container ${tone}`}>
        <div className="decision-hero-top">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className={`verdict-icon-bubble ${tone}`}>
              {isFraud ? <ShieldAlert size={24} /> : action === "monitor" ? <Eye size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <div className={`verdict-badge-tag ${tone}`}>
                XGBoost ML Ground Truth • {result.decision_source}
              </div>
              <div className="verdict-main-heading">
                <DecryptedText
                  text={isFraud ? "RISK VERDICT: FRAUD CONFIRMED" : action === "monitor" ? "RISK VERDICT: ELEVATED MONITORING" : "RISK VERDICT: TRANSACTION CLEARED"}
                  speed={25}
                />
              </div>
              <div className="verdict-subtext">
                Prediction: <strong style={{ color: "var(--text-pure)", fontFamily: "JetBrains Mono" }}>{result.xgboost_label}</strong>
                <span>•</span>
                Decision Threshold: <span className="font-mono">{Number(result.threshold).toFixed(4)}</span>
                <span>•</span>
                Latency: <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>~18ms</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div className={`action-capsule ${action}`}>
              {action === "escalate" ? "ESCALATE DISPUTE" : action === "monitor" ? "ACTIVE MONITOR" : "CLEAR PAYMENT"}
            </div>
            {gemini.llm_backend && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--brand-cyan)" }}>
                <Zap size={11} />
                <span>Backend: {gemini.llm_backend}</span>
              </div>
            )}
          </div>
        </div>

        {/* Probability Gauge Bar */}
        <div className="gauge-section">
          <div className="gauge-header-row">
            <span className="gauge-label">XGBoost Posterior Fraud Probability</span>
            <span className={`gauge-score-value ${tone}`}>{probPct}%</span>
          </div>
          <div className="gauge-track">
            <div className={`gauge-fill ${tone}`} style={{ width: `${Math.min(prob * 100, 100)}%` }} />
          </div>
          <div className="gauge-footer-row">
            <span>0.00% (Baseline Safe)</span>
            <span style={{ color: "var(--text-secondary)" }}>Optimal Operating Cutoff: {thresholdPct}%</span>
            <span>100.00% (High Confidence Attack)</span>
          </div>
        </div>

        {gemini.llm_error && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: "var(--radius-xs)", background: "rgba(244, 63, 94, 0.1)", border: "1px solid var(--risk-fraud-border)", fontSize: 11.5, color: "#fca5a5", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} />
            <span>LLM Note: {gemini.llm_error}</span>
          </div>
        )}
      </div>

      {/* ── Multi-Tab Deep Dive Suite ── */}
      <SpotlightCard className="tabs-container" style={{ padding: 20 }}>
        {/* Navigation Tabs */}
        <div className="tabs-subnav">
          <button
            className={`tab-subnav-btn ${activeTab === "gemini" ? "active" : ""}`}
            onClick={() => setActiveTab("gemini")}
          >
            <Sparkles size={14} />
            <span>Gemini Narrative ({gemini.llm_backend || "Heuristic"})</span>
          </button>
          <button
            className={`tab-subnav-btn ${activeTab === "shap" ? "active" : ""}`}
            onClick={() => setActiveTab("shap")}
          >
            <Layers size={14} />
            <span>SHAP Explainer Vectors ({shapData.length})</span>
          </button>
          <button
            className={`tab-subnav-btn ${activeTab === "features" ? "active" : ""}`}
            onClick={() => setActiveTab("features")}
          >
            <Database size={14} />
            <span>IEEE-CIS 42-Feature Vector</span>
          </button>
          <button
            className={`tab-subnav-btn ${activeTab === "raw" ? "active" : ""}`}
            onClick={() => setActiveTab("raw")}
          >
            <Terminal size={14} />
            <span>Audit Response JSON</span>
          </button>
        </div>

        {/* Tab 1: Gemini Reasoning & Chargeback Responder */}
        {activeTab === "gemini" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {gemini.evidence_summary && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>
                  <FileText size={13} />
                  <span>Synthesized Evidence Summary</span>
                </div>
                <div className="ai-narrative-box">
                  {gemini.evidence_summary}
                </div>
              </div>
            )}

            {gemini.confidence_narrative && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>
                  <Zap size={13} />
                  <span>Model Confidence & Operational Logic</span>
                </div>
                <div className="ai-confidence-box">
                  {gemini.confidence_narrative}
                </div>
              </div>
            )}

            {/* Chargeback Dispute Responder */}
            {isFraud && gemini.dispute_draft ? (
              <div className="dispute-evidence-box">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldAlert size={16} color="var(--risk-fraud)" />
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "JetBrains Mono", color: "#ffe4e6", textTransform: "uppercase" }}>
                      Auto-Drafted Chargeback Dispute Defense
                    </span>
                  </div>
                  <button className="btn-secondary" onClick={copyDispute}>
                    {copiedDispute ? <Check size={13} color="var(--risk-clear)" /> : <Copy size={13} />}
                    <span>{copiedDispute ? "Copied" : "Copy Dispute Text"}</span>
                  </button>
                </div>
                <div className="dispute-text-content">
                  {gemini.dispute_draft}
                </div>
              </div>
            ) : (
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--bg-code)", border: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={15} color="var(--risk-clear)" />
                <span>Dispute response not generated — payment scored below fraud threshold.</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SHAP Feature Attribution */}
        {activeTab === "shap" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-pure)" }}>TreeExplainer Attribution Drivers</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Positive values push probability toward fraud; negative values pull toward legitimate.</div>
            </div>

            {/* Bar Chart Visualization */}
            <div style={{ height: 210, width: "100%", marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10.5, fill: '#64748b' }} tickFormatter={(v) => v.toFixed(3)} />
                  <YAxis type="category" dataKey="name" width={110} stroke="#64748b" tick={{ fontSize: 10.5, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{ background: "#07090d", border: "1px solid var(--border-medium)", borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    formatter={(v, _, item) => [
                      `${v.toFixed(5)} (${item.payload.direction === 'positive' ? 'Increased Risk' : 'Reduced Risk'})`,
                      item.payload.name
                    ]}
                  />
                  <Bar dataKey="value" radius={2}>
                    {shapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* List breakdown */}
            <div style={{ display: "grid", gap: 8 }}>
              {shapData.map((item, i) => {
                const pct = (Math.abs(item.value) / maxAbsShap) * 100;
                const isPos = item.direction === "positive";
                return (
                  <div className="shap-card-item" key={i}>
                    <div className="shap-meta-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isPos ? <ArrowUpRight size={14} color="var(--risk-fraud)" /> : <ArrowDownRight size={14} color="var(--risk-clear)" />}
                        <span className="shap-feature-name">{item.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`shap-value-tag ${isPos ? "pos" : "neg"}`}>
                          {isPos ? "+" : ""}{item.value.toFixed(5)}
                        </span>
                        <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                          → {item.towards}
                        </span>
                      </div>
                    </div>
                    <div className="shap-progress-track">
                      <div className={`shap-progress-fill ${isPos ? "pos" : "neg"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: IEEE-CIS Vector Table */}
        {activeTab === "features" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-pure)" }}>42-Dimension Feature Vector Ingestion</div>
              <div style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-muted)" }}>{Object.keys(result.input_features || {}).length} Columns</div>
            </div>
            <div className="data-table-wrap" style={{ maxHeight: 380 }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Feature Column</th>
                    <th>Model Input Value</th>
                    <th>Encoding Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.input_features || {}).map(([key, val]) => (
                    <tr key={key}>
                      <td className="font-mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{key}</td>
                      <td className="font-mono" style={{ color: "var(--brand-cyan)" }}>
                        {val === null || val === undefined ? "—" : typeof val === "number" ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(val)}
                      </td>
                      <td style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--text-muted)" }}>
                        {typeof val === "number" ? "Float32" : "CategoricalID"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Standardized Raw JSON */}
        {activeTab === "raw" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-pure)" }}>Audit Trace & Response Payload</div>
              <button className="btn-secondary" onClick={copyPayload}>
                {copiedPayload ? <Check size={13} color="var(--risk-clear)" /> : <Copy size={13} />}
                <span>{copiedPayload ? "Copied" : "Copy Payload"}</span>
              </button>
            </div>
            <pre style={{
              background: "var(--bg-code)",
              padding: 14,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              fontSize: 11.5,
              fontFamily: "JetBrains Mono, monospace",
              color: "#94a3b8",
              maxHeight: 380,
              overflowY: "auto"
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
