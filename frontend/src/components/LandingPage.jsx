import React, { useState } from "react";
import {
  Shield, Activity, Radio, BarChart2, Cpu, ArrowRight,
  CheckCircle2, Terminal, Layers, Database, Sparkles, ExternalLink,
  Lock, Zap, FileText, ChevronRight
} from "lucide-react";

export default function LandingPage({ onLaunchConsole }) {
  const [selectedTxn, setSelectedTxn] = useState("high_risk");

  const sampleTxns = {
    high_risk: {
      id: "TX-84721",
      amount: "₹84,200",
      method: "CARD / VISA",
      prob: "94.2%",
      action: "ESCALATE",
      color: "var(--fl-charge)",
      shap: [
        { feature: "Amount anomaly (TransactionAmt)", val: "+42%", width: 85, pos: true },
        { feature: "Velocity spike (C1/C2 burst)", val: "+21%", width: 60, pos: true },
        { feature: "Device mismatch (DeviceInfo)", val: "+17%", width: 45, pos: true },
        { feature: "Cardholder tenure (D1 history)", val: "-09%", width: 25, pos: false },
      ],
      evidence: "Transaction exceeds historical account baseline by 4.2×. Rapid carding velocity anomaly detected across 3 distinct merchant endpoints within 3600 seconds.",
      decision: "XGBoost → FRAUD (Score: 0.9420 > Cutoff: 0.8351)"
    },
    takeover: {
      id: "TX-31904",
      amount: "₹18,500",
      method: "CARD / MASTERCARD",
      prob: "64.1%",
      action: "MONITOR",
      color: "var(--fl-caution)",
      shap: [
        { feature: "Account age anomaly", val: "+28%", width: 65, pos: true },
        { feature: "Email domain volatility", val: "+19%", width: 45, pos: true },
        { feature: "Consistent billing zip", val: "-14%", width: 35, pos: false },
        { feature: "Normal transaction hour", val: "-08%", width: 20, pos: false },
      ],
      evidence: "Borderline account takeover profile. 2-day old credentials exhibiting moderate velocity with established domestic card bin.",
      decision: "XGBoost → MONITOR (Score: 0.6410 in Mid-Band 0.35–0.8351)"
    },
    legit: {
      id: "TX-10492",
      amount: "₹450",
      method: "UPI / OKAXIS",
      prob: "1.2%",
      action: "CLEARED",
      color: "var(--fl-clear)",
      shap: [
        { feature: "Established customer (450d)", val: "-38%", width: 75, pos: false },
        { feature: "Domestic verified VPA", val: "-24%", width: 55, pos: false },
        { feature: "Low transaction value", val: "-18%", width: 40, pos: false },
        { feature: "Regular merchant category", val: "-12%", width: 30, pos: false },
      ],
      evidence: "High-confidence legitimate domestic payment. Established 450-day customer history with zero anomalous velocity signals.",
      decision: "XGBoost → LEGITIMATE (Score: 0.0120 < 0.3500)"
    }
  };

  const current = sampleTxns[selectedTxn];

  return (
    <div className="landing-container">
      {/* ── Top Terminal Ticker Strip ── */}
      <div className="terminal-ticker-bar">
        <div className="ticker-inner">
          <span className="ticker-item">
            <span className="status-dot-active" /> FRAUDLENS RISK INTELLIGENCE
          </span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">SYS_STATUS: <strong style={{ color: "var(--fl-bone)" }}>ONLINE</strong></span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">XGB_LOCKED: <strong style={{ color: "var(--fl-charge-dim)" }}>0.8351</strong></span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">AUC_ROC: <strong style={{ color: "var(--fl-bone)" }}>94.77%</strong></span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">FPR: <strong style={{ color: "#74DF9F" }}>0.97%</strong></span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">RECALL: <strong style={{ color: "var(--fl-bone)" }}>60.31%</strong></span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">TEST_SET: <strong style={{ color: "var(--fl-bone)" }}>88,581 ROWS</strong></span>
          <span className="ticker-divider">//</span>
          <span className="ticker-item">INFERENCE: <strong style={{ color: "var(--fl-bone)" }}>~18MS</strong></span>
        </div>
      </div>

      {/* ── Main Navigation Bar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-left">
          <div className="brand-row" style={{ padding: 0 }}>
            <div className="brand-icon-box">
              <Shield size={14} strokeWidth={2} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="brand-title-text" style={{ fontSize: "13px" }}>FRAUDLENS</span>
              <span className="brand-tag">OPS_TERMINAL</span>
            </div>
          </div>

          <div className="landing-nav-links">
            <a href="#thesis" className="nav-link">Thesis</a>
            <a href="#surfaces" className="nav-link">Console Surfaces</a>
            <a href="#investigation" className="nav-link">Inspection Engine</a>
            <a href="#economics" className="nav-link">Economics</a>
            <a href="#integrity" className="nav-link">Integrity</a>
          </div>
        </div>

        <div className="landing-nav-right">
          <button
            className="btn-primary"
            style={{ fontSize: "12px", padding: "6px 14px" }}
            onClick={() => onLaunchConsole("feed")}
          >
            <span>Launch Ops Console</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION (Palantir x Bloomberg Style Split) ── */}
      <section className="landing-hero">
        <div className="hero-content-split">
          {/* Left Hero Column */}
          <div className="hero-text-block">
            <div className="hero-eyebrow">
              <span className="status-dot-active" />
              <span>DEFENSE-ONLY PAYMENT RISK PLATFORM</span>
            </div>

            <h1 className="hero-title">
              Detect Fraud.<br />
              Understand Why.<br />
              <span style={{ color: "var(--fl-charge-dim)" }}>Defend The Transaction.</span>
            </h1>

            <p className="hero-subtext">
              A financial security operations console uniting deterministic XGBoost scoring, TreeSHAP directional attribution, and automated Gemini dispute dossiers.
            </p>

            <div className="hero-cta-row">
              <button
                className="btn-primary"
                style={{ padding: "10px 20px", fontSize: "13.5px" }}
                onClick={() => onLaunchConsole("workbench")}
              >
                <span>Launch Operations Console</span>
                <ArrowRight size={14} />
              </button>

              <button
                className="btn-ghost"
                style={{ padding: "10px 18px", fontSize: "13px" }}
                onClick={() => onLaunchConsole("metrics")}
              >
                <span>Model Metrics & ROI</span>
              </button>
            </div>

            {/* Locked Empirical Metrics Strip */}
            <div className="hero-metrics-strip">
              <div className="hero-stat-card">
                <div className="data-label">False Positive Rate</div>
                <div className="stat-num" style={{ color: "#74DF9F" }}>0.97%</div>
                <div className="stat-sub">~97 blocked per 10k legit</div>
              </div>

              <div className="hero-stat-card">
                <div className="data-label">Locked AUC-ROC</div>
                <div className="stat-num">94.77%</div>
                <div className="stat-sub">Class discrimination</div>
              </div>

              <div className="hero-stat-card">
                <div className="data-label">Test Set Recall</div>
                <div className="stat-num">60.31%</div>
                <div className="stat-sub">Catches 60.3% attacks</div>
              </div>

              <div className="hero-stat-card">
                <div className="data-label">Held-out Test Rows</div>
                <div className="stat-num">88,581</div>
                <div className="stat-sub">Zero leakage protocol</div>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Live Risk Engine Terminal */}
          <div className="hero-terminal-container">
            <div className="terminal-topbar">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Terminal size={13} color="var(--fl-dim)" />
                <span className="terminal-title-text">LIVE RISK ENGINE INTERCEPTOR</span>
              </div>
              <div className="terminal-selector-pills">
                <button
                  className={`term-pill ${selectedTxn === "high_risk" ? "active" : ""}`}
                  onClick={() => setSelectedTxn("high_risk")}
                >
                  Attack
                </button>
                <button
                  className={`term-pill ${selectedTxn === "takeover" ? "active" : ""}`}
                  onClick={() => setSelectedTxn("takeover")}
                >
                  Monitor
                </button>
                <button
                  className={`term-pill ${selectedTxn === "legit" ? "active" : ""}`}
                  onClick={() => setSelectedTxn("legit")}
                >
                  Clean
                </button>
              </div>
            </div>

            <div className="terminal-body">
              {/* Header meta */}
              <div className="terminal-row-split" style={{ borderBottom: "0.5px solid var(--fl-hairline)", paddingBottom: "10px", marginBottom: "12px" }}>
                <div>
                  <span className="payment-id" style={{ fontSize: "13px" }}>{current.id}</span>
                  <span style={{ fontSize: "11px", color: "var(--fl-dim)", marginLeft: "8px" }}>{current.method}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="font-mono" style={{ fontSize: "15px", color: "var(--fl-bone)", fontWeight: 500 }}>{current.amount}</span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "2px 7px",
                    borderRadius: "3px",
                    background: current.action === "ESCALATE" ? "var(--fl-charge-tint)" : current.action === "MONITOR" ? "var(--fl-caution-tint)" : "var(--fl-raised)",
                    color: current.color
                  }}>
                    {current.action}
                  </span>
                </div>
              </div>

              {/* Score Display */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <span className="data-label">Posterior Fraud Probability</span>
                  <span className="font-mono" style={{ fontSize: "22px", fontWeight: 500, color: current.color }}>
                    {current.prob}
                  </span>
                </div>
                <div className="shap-track" style={{ height: "4px" }}>
                  <div style={{ height: "100%", width: current.prob, background: current.color, borderRadius: "2px", transition: "width 300ms ease-out" }} />
                </div>
              </div>

              {/* Directional SHAP Attribution Waterfall */}
              <div style={{ marginBottom: "14px" }}>
                <div className="data-label" style={{ marginBottom: "6px" }}>Directional SHAP Drivers</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {current.shap.map((s, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                        <span style={{ color: "var(--fl-dim)", fontFamily: "var(--fl-font-data)" }}>{s.feature}</span>
                        <span className="font-mono" style={{ color: s.pos ? "var(--fl-charge)" : "var(--fl-threat)", fontWeight: 500 }}>
                          {s.val}
                        </span>
                      </div>
                      <div className="shap-track" style={{ height: "3px" }}>
                        <div style={{ height: "100%", width: `${s.width}%`, background: s.pos ? "var(--fl-charge)" : "var(--fl-threat)", borderRadius: "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Synthesized */}
              <div style={{
                background: "var(--fl-bg)",
                border: "0.5px solid var(--fl-hairline)",
                borderRadius: "var(--fl-radius-sm)",
                padding: "10px 12px",
                marginBottom: "12px"
              }}>
                <div className="data-label" style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Sparkles size={11} color="var(--fl-charge-dim)" />
                  <span>Gemini Evidence Synthesis</span>
                </div>
                <p style={{ fontSize: "11.5px", color: "var(--fl-dim)", lineHeight: 1.45 }}>
                  {current.evidence}
                </p>
              </div>

              {/* Terminal Action Button */}
              <button
                className="btn-accent-ghost"
                style={{ width: "100%", fontSize: "12px", justifyContent: "center" }}
                onClick={() => onLaunchConsole("workbench")}
              >
                <span>Open in Investigations Console</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: THE CORE THESIS ── */}
      <section id="thesis" className="landing-section">
        <div className="section-header-block">
          <div className="data-label">01 // CORE PHILOSOPHY</div>
          <h2 className="section-title-large">Why Explainability Dictates Financial Security</h2>
          <p className="section-lead">
            Generic AI black-boxes hallucinate decisions and destroy merchant margins through excessive false positives. FraudLens enforces a strict separation between <strong>deterministic ML decision-making</strong> and <strong>generative evidence synthesis</strong>.
          </p>
        </div>

        <div className="comparison-grid">
          {/* Box 1: Conventional Black Box */}
          <div className="fl-card comparison-card bad">
            <div className="card-tag">CONVENTIONAL APPROACH</div>
            <h3 style={{ fontSize: "15px", color: "var(--fl-bone)", margin: "8px 0 12px" }}>Opaque Black-Box Classifiers</h3>
            <ul className="comparison-list">
              <li>High False-Positive Rate (~3–5%) blocking legitimate paying users</li>
              <li>Uninterpretable neural predictions with zero directional justification</li>
              <li>Chargeback dispute teams manually write defense packets from scratch</li>
              <li>Risk of training data leakage and unverified test metrics</li>
            </ul>
          </div>

          {/* Box 2: FraudLens Defense-Only Console */}
          <div className="fl-card comparison-card good">
            <div className="card-tag" style={{ color: "var(--fl-charge-dim)" }}>FRAUDLENS DEFENSE ARCHITECTURE</div>
            <h3 style={{ fontSize: "15px", color: "var(--fl-bone)", margin: "8px 0 12px" }}>Deterministic XGBoost + SHAP Ground Truth</h3>
            <ul className="comparison-list">
              <li><strong>0.97% FPR:</strong> Tuned strictly on validation max-F1 to minimize user friction</li>
              <li><strong>TreeSHAP Attribution:</strong> Exact mathematical contribution per feature vector</li>
              <li><strong>Gemini Dispute Dossiers:</strong> Structured evidence auto-drafted for bank submission</li>
              <li><strong>Locked 88,581 Test Set:</strong> Zero data leakage, frozen transaction IDs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE THREE PRIMARY SURFACES ── */}
      <section id="surfaces" className="landing-section">
        <div className="section-header-block">
          <div className="data-label">02 // INFORMATION ARCHITECTURE</div>
          <h2 className="section-title-large">Engineered Around Three Primary Surfaces</h2>
          <p className="section-lead">
            Every screen is structured for information density, zero decoration, and immediate operational action.
          </p>
        </div>

        <div className="surfaces-grid">
          {/* Surface 1 */}
          <div className="fl-card surface-card" onClick={() => onLaunchConsole("feed")}>
            <div className="surface-icon-wrap">
              <Radio size={16} color="var(--fl-charge-dim)" />
            </div>
            <div className="surface-num">SURFACE 01</div>
            <h3 className="surface-title">Command Center</h3>
            <p className="surface-desc">
              High-density 36px telemetry stream ingesting Razorpay payment webhooks with instant multi-state filtering and slide-over audit ledger inspection.
            </p>
            <div className="surface-action-link">
              <span>View Telemetry Stream</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Surface 2 */}
          <div className="fl-card surface-card" onClick={() => onLaunchConsole("workbench")}>
            <div className="surface-icon-wrap">
              <Activity size={16} color="var(--fl-charge-dim)" />
            </div>
            <div className="surface-num">SURFACE 02</div>
            <h3 className="surface-title">Investigation Console</h3>
            <p className="surface-desc">
              The star inspection screen. 36px probability anchor, operating threshold cutoff, directional SHAP drivers, and automated dispute defense package.
            </p>
            <div className="surface-action-link">
              <span>Open Investigation Terminal</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Surface 3 */}
          <div className="fl-card surface-card" onClick={() => onLaunchConsole("metrics")}>
            <div className="surface-icon-wrap">
              <BarChart2 size={16} color="var(--fl-charge-dim)" />
            </div>
            <div className="surface-num">SURFACE 03</div>
            <h3 className="surface-title">Intelligence & ROI</h3>
            <p className="surface-desc">
              Locked 88,581 test set performance matrix paired with an interactive Rupee economic simulator mapping False Positive Rate directly to merchant margin.
            </p>
            <div className="surface-action-link">
              <span>Simulate Economics</span>
              <ChevronRight size={13} />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: INSPECTION PIPELINE ── */}
      <section id="investigation" className="landing-section">
        <div className="section-header-block">
          <div className="data-label">03 // PIPELINE MECHANICS</div>
          <h2 className="section-title-large">Defense-Only Pipeline Rail</h2>
          <p className="section-lead">
            From raw webhook payload to bank-ready dispute dossier in under 20ms.
          </p>
        </div>

        <div className="fl-card" style={{ padding: "24px" }}>
          <div className="pipeline-linear-grid">
            <div className="pipeline-step-card">
              <div className="step-num">STAGE 01</div>
              <div className="step-name">Razorpay Ingest</div>
              <div className="step-desc">Standardizes paise currency, entity identifiers, and payment networks into unified schemas.</div>
            </div>

            <div className="pipeline-step-card">
              <div className="step-num">STAGE 02</div>
              <div className="step-name">IEEE-CIS Vector</div>
              <div className="step-desc">Projects payload into 42-dimensional feature space using frozen training medians and hash maps.</div>
            </div>

            <div className="pipeline-step-card highlight">
              <div className="step-num" style={{ color: "var(--fl-charge-dim)" }}>STAGE 03</div>
              <div className="step-name">XGBoost Engine</div>
              <div className="step-desc">Sole ground truth decision maker. Evaluated against frozen 0.8351 max-F1 threshold.</div>
            </div>

            <div className="pipeline-step-card">
              <div className="step-num">STAGE 04</div>
              <div className="step-name">TreeSHAP Drivers</div>
              <div className="step-desc">Computes exact directional feature attribution values (+ increased risk / - safe pull).</div>
            </div>

            <div className="pipeline-step-card">
              <div className="step-num">STAGE 05</div>
              <div className="step-name">Gemini Synthesis</div>
              <div className="step-desc">Synthesizes evidence narrative and auto-drafts complete chargeback dispute dossier.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: ECONOMICS & INTEGRITY ── */}
      <section id="economics" className="landing-section">
        <div className="section-header-block">
          <div className="data-label">04 // EMPIRICAL VALIDATION</div>
          <h2 className="section-title-large">Locked Test Set & Integrity Guarantees</h2>
          <p className="section-lead">
            No synthetic inflation. No test leakage. Metrics verified strictly on held-out transaction distributions.
          </p>
        </div>

        <div className="integrity-grid">
          <div className="fl-card">
            <div className="data-label" style={{ marginBottom: "6px" }}>70 / 15 / 15 STRATIFIED SPLIT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "12px 0" }}>
              <div style={{ background: "var(--fl-bg)", padding: "10px", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                <div className="data-label">Training Distribution</div>
                <div className="font-mono" style={{ fontSize: "16px", color: "var(--fl-bone)", marginTop: "2px" }}>413,378 rows</div>
              </div>
              <div style={{ background: "var(--fl-bg)", padding: "10px", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                <div className="data-label">Locked Test Rows</div>
                <div className="font-mono" style={{ fontSize: "16px", color: "var(--fl-bone)", marginTop: "2px" }}>88,581 rows</div>
              </div>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--fl-dim)", lineHeight: 1.5 }}>
              Test TransactionIDs were pre-isolated into <code style={{ color: "var(--fl-charge-dim)" }}>locked_test_ids.csv</code> before model training. Never used for median imputation, categorical encodings, or threshold tuning.
            </p>
          </div>

          <div className="fl-card">
            <div className="data-label" style={{ marginBottom: "6px" }}>ECONOMIC PROTECTION BENCHMARK</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "12px 0" }}>
              <div style={{ background: "var(--fl-clear-tint)", padding: "10px", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-clear)" }}>
                <div className="data-label" style={{ color: "#74DF9F" }}>False Positive Rate</div>
                <div className="font-mono" style={{ fontSize: "18px", color: "#74DF9F", marginTop: "2px" }}>0.97%</div>
              </div>
              <div style={{ background: "var(--fl-charge-tint)", padding: "10px", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-charge)" }}>
                <div className="data-label" style={{ color: "var(--fl-charge-dim)" }}>Area Under ROC</div>
                <div className="font-mono" style={{ fontSize: "18px", color: "var(--fl-bone)", marginTop: "2px" }}>0.9477</div>
              </div>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--fl-dim)", lineHeight: 1.5 }}>
              Operating at a 0.97% FPR preserves high 60.31% fraud recall while ensuring only ~97 legitimate users experience payment friction per 10,000 transactions.
            </p>
          </div>
        </div>
      </section>

      {/* ── TERMINAL FOOTER & CONSOLE LAUNCHER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="brand-row" style={{ padding: 0 }}>
              <div className="brand-icon-box">
                <Shield size={14} strokeWidth={2} />
              </div>
              <span className="brand-title-text">FRAUDLENS</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--fl-dim)", maxWidth: "360px" }}>
              Financial Risk Intelligence & Security Operations Console. Defense-only payment scoring.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn-ghost"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ fontSize: "12px" }}
            >
              Back to Top
            </button>
            <button
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: "12.5px" }}
              onClick={() => onLaunchConsole("feed")}
            >
              <span>Launch Operations Console</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>FRAUDLENS TRACK_02 • IEEE-CIS 42-DIM • XGB_LOCKED_0.8351</span>
          <span>STRICT SEPARATION: XGBOOST GROUND TRUTH × GEMINI EXPLAINABILITY</span>
        </div>
      </footer>
    </div>
  );
}
