import React, { useEffect, useMemo, useState } from "react";
import AuditTrail from "./AuditTrail.jsx";
import FraudReport from "./FraudReport.jsx";
import TransactionCard from "./TransactionCard.jsx";
import PipelineRail from "./PipelineRail.jsx";
import SpotlightCard from "./SpotlightCard.jsx";
import DecryptedText from "./DecryptedText.jsx";
import {
  ShieldCheck, Cpu, Activity, BarChart3, Search,
  RefreshCw, Sliders, AlertCircle, Play, Database, Zap, Sparkles
} from "lucide-react";

// Curated Real-World Presets for 1-Click Evaluation
const PRESETS = [
  {
    id: "preset_fraud_high",
    title: "High-Risk Velocity Attack",
    badge: "Escalate",
    badgeType: "fraud",
    data: {
      id: "pay_demo_card_high_04",
      amount: 9250000, // ₹92,500
      currency: "INR",
      method: "card",
      status: "captured",
      email: "disposable.buyer99@tempmail.com",
      contact: "+919800000001",
      created_at: Math.floor(Date.now() / 1000),
      account_created_at: Math.floor(Date.now() / 1000) - 3600, // 1 hr old account
      order_id: "order_demo_burst_99",
      card: { network: "mastercard", type: "credit", last4: "9912", iin: "555555" },
      ieee_feature_overrides: {
        C1: 42,
        C2: 38,
        D1: 0,
        TransactionAmt: 92500.0,
      }
    }
  },
  {
    id: "preset_clear_upi",
    title: "Verified Domestic UPI",
    badge: "Clear",
    badgeType: "clear",
    data: {
      id: "pay_demo_upi_low_01",
      amount: 45000, // ₹450
      currency: "INR",
      method: "upi",
      status: "captured",
      email: "rahul.sharma@gmail.com",
      contact: "+919876543210",
      created_at: Math.floor(Date.now() / 1000),
      account_created_at: Math.floor(Date.now() / 1000) - (86400 * 450), // established customer
      order_id: "order_grocery_234",
      vpa: "rahul@okaxis"
    }
  },
  {
    id: "preset_monitor_takeover",
    title: "Borderline Account Velocity",
    badge: "Monitor",
    badgeType: "monitor",
    data: {
      id: "pay_demo_ato_borderline",
      amount: 1850000, // ₹18,500
      currency: "INR",
      method: "card",
      status: "captured",
      email: "stealth.user@protonmail.com",
      contact: "+919123456789",
      created_at: Math.floor(Date.now() / 1000),
      account_created_at: Math.floor(Date.now() / 1000) - (86400 * 2),
      order_id: "order_ato_771",
      card: { network: "visa", type: "credit", last4: "4444", iin: "411111" }
    }
  },
  {
    id: "preset_intl_amex",
    title: "International Corporate Card",
    badge: "Evaluate",
    badgeType: "clear",
    data: {
      id: "pay_demo_intl_luxury",
      amount: 18500000, // ₹1,85,000
      currency: "USD",
      method: "card",
      status: "captured",
      email: "executive.traveler@corporate.co.uk",
      contact: "+447911123456",
      created_at: Math.floor(Date.now() / 1000),
      account_created_at: Math.floor(Date.now() / 1000) - (86400 * 120),
      order_id: "order_luxury_hotel_09",
      card: { network: "amex", type: "credit", last4: "1004", iin: "378282" }
    }
  }
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function Dashboard({ view, onViewChange }) {
  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [jsonText, setJsonText] = useState(JSON.stringify(PRESETS[0].data, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [feed, setFeed] = useState([]);
  const [audit, setAudit] = useState(null);

  // Feed Filters
  const [feedFilter, setFeedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive ROI Calculator State
  const [monthlyVolume, setMonthlyVolume] = useState(50000);
  const [avgOrderValue, setAvgOrderValue] = useState(2500);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && view === "analyzer") {
        e.preventDefault();
        analyze();
      }
      if (e.altKey && e.key === "1") onViewChange("analyzer");
      if (e.altKey && e.key === "2") onViewChange("feed");
      if (e.altKey && e.key === "3") onViewChange("metrics");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, jsonText]);

  // Load metrics once
  useEffect(() => {
    fetch(`${API_BASE}/metrics`)
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, []);

  // Poll transaction feed every 10s
  useEffect(() => {
    const loadFeed = () => {
      fetch(`${API_BASE}/transactions`)
        .then((r) => r.json())
        .then((d) => setFeed(d.transactions || []))
        .catch(() => { });
    };
    loadFeed();
    const interval = setInterval(loadFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setJsonText(JSON.stringify(preset.data, null, 2));
    setError("");
  };

  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      const body = JSON.parse(jsonText);
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis request failed");
      setResult(data);
      // Auto-update feed list
      fetch(`${API_BASE}/transactions`).then(r => r.json()).then(d => setFeed(d.transactions || [])).catch(() => { });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const seedDemoFeed = async () => {
    setBusy(true);
    try {
      await fetch(`${API_BASE}/demo/seed`, { method: "POST" });
      const d = await fetch(`${API_BASE}/transactions`).then((r) => r.json());
      setFeed(d.transactions || []);
    } finally {
      setBusy(false);
    }
  };

  const openAuditRecord = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/audit/${encodeURIComponent(item.transaction_id)}`);
      if (res.ok) setAudit(await res.json());
      else setAudit(item);
    } catch {
      setAudit(item);
    }
  };

  // Filtered feed list
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const action = item.recommended_action || "clear";
      const matchesFilter =
        feedFilter === "all" ? true :
          feedFilter === "escalate" ? action === "escalate" :
            feedFilter === "monitor" ? action === "monitor" :
              action === "clear";

      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const id = (item.transaction_id || "").toLowerCase();
      const email = ((item.standardized_transaction || {}).email || "").toLowerCase();
      const method = ((item.standardized_transaction || {}).method || "").toLowerCase();
      return id.includes(q) || email.includes(q) || method.includes(q);
    });
  }, [feed, feedFilter, searchQuery]);

  // Business Impact / ROI calculation
  const businessImpact = useMemo(() => {
    const fpr = Number(metrics?.false_positive_rate || 0.00971);
    const recall = Number(metrics?.recall || 0.6031);
    const estimatedFraudRate = 0.035;

    const totalFraudTxns = monthlyVolume * estimatedFraudRate;
    const totalLegitTxns = monthlyVolume * (1 - estimatedFraudRate);

    const caughtFraudTxns = Math.round(totalFraudTxns * recall);
    const fraudRupeesProtected = caughtFraudTxns * avgOrderValue;

    const falsePositiveCount = Math.round(totalLegitTxns * fpr);
    const falsePositiveFrictionRupees = falsePositiveCount * avgOrderValue;

    const netProtectedValue = fraudRupeesProtected - falsePositiveFrictionRupees;

    return {
      fpr,
      caughtFraudTxns,
      fraudRupeesProtected,
      falsePositiveCount,
      falsePositiveFrictionRupees,
      netProtectedValue,
      per10kLegitBlocked: Math.round(fpr * 10000)
    };
  }, [metrics, monthlyVolume, avgOrderValue]);

  return (
    <div className={`app-container ${view === "analyzer" ? "viewport-locked" : ""}`}>
      {/* ── Top Navigation Bar (Skipper HUD) ── */}
      <header className="header-nav compact-bar">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <ShieldCheck size={18} />
          </div>
          <div className="brand-text-block">
            <div className="brand-title">
              <DecryptedText text="FRAUDLENS" speed={25} />
              <span className="brand-version-pill">TRACK_02</span>
            </div>
            <div className="brand-subtitle">
              FraudLens Defense-Only • XGBoost Ground Truth • Gemini Cascade Engine
            </div>
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <nav className="nav-pills">
          <button
            className={`nav-pill-btn ${view === "analyzer" ? "active" : ""}`}
            onClick={() => onViewChange("analyzer")}
          >
            <Cpu size={14} />
            <span>Workbench</span>
            <span className="nav-shortcut-key">Alt+1</span>
          </button>
          <button
            className={`nav-pill-btn ${view === "feed" ? "active" : ""}`}
            onClick={() => onViewChange("feed")}
          >
            <Activity size={14} />
            <span>Telemetry Feed</span>
            <span className="nav-shortcut-key">Alt+2</span>
          </button>
          <button
            className={`nav-pill-btn ${view === "metrics" ? "active" : ""}`}
            onClick={() => onViewChange("metrics")}
          >
            <BarChart3 size={14} />
            <span>Honest Metrics & ROI</span>
            <span className="nav-shortcut-key">Alt+3</span>
          </button>
        </nav>

        {/* Live Engine Status Badge */}
        <div className="header-actions">
          <div className="status-badge-live">
            <span className="live-dot" />
            <span>XGB_LOCKED_0.8351</span>
          </div>
        </div>
      </header>

      {/* ── Main View Content ── */}
      <main className="main-content">

        {/* ───────────────────────────────────────────────
           VIEW 1: TRANSACTION ANALYZER WORKBENCH
           ─────────────────────────────────────────────── */}
        {view === "analyzer" && (
          <div>
            <div className="view-header">
              <div className="view-title-block">
                <h1>Payment Risk Assessment Workbench</h1>
                <p>Ingest Razorpay payment payloads → Transform to IEEE-CIS features → XGBoost scoring → SHAP attribution → Gemini narrative</p>
              </div>
            </div>

            {/* Architecture Flow Rail */}
            <PipelineRail activeStep={result ? 5 : 2} isAnalyzing={busy} />

            <div className="workbench-grid">
              {/* Left Column: Presets + Terminal Editor */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 1-Click Presets */}
                <SpotlightCard style={{ padding: 14 }}>
                  <div className="presets-label">⚡ SELECT TEST PAYLOAD PRESET</div>
                  <div className="presets-scroll-grid">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        className={`preset-chip-btn ${selectedPresetId === p.id ? "active" : ""}`}
                        onClick={() => handleSelectPreset(p)}
                      >
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </div>
                </SpotlightCard>

                {/* Terminal Code Editor */}
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="terminal-controls">
                      <span className="terminal-dot-ctrl dot-red" />
                      <span className="terminal-dot-ctrl dot-yellow" />
                      <span className="terminal-dot-ctrl dot-green" />
                    </div>
                    <div className="terminal-title">razorpay_payload.json</div>
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>Ctrl+Enter to Run</span>
                  </div>

                  <textarea
                    className="code-textarea"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    spellCheck={false}
                  />

                  {error && (
                    <div style={{ padding: "8px 12px", background: "rgba(244, 63, 94, 0.1)", borderTop: "1px solid var(--risk-fraud-border)", color: "#fca5a5", fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                    <button
                      className="btn-tactile-primary"
                      onClick={analyze}
                      disabled={busy}
                      style={{ width: "100%" }}
                    >
                      {busy ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
                      <span>{busy ? "Evaluating ML Pipeline..." : "Execute Risk Scoring & Synthesis"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Decision Hub */}
              <div>
                <FraudReport result={result} />
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────
           VIEW 2: REAL-TIME TRANSACTION STREAM
           ─────────────────────────────────────────────── */}
        {view === "feed" && (
          <div>
            <div className="view-header">
              <div className="view-title-block">
                <h1>Live Payment Risk Telemetry Stream</h1>
                <p>Continuous payment stream evaluated against locked IEEE-CIS decision threshold (0.8351). Select any card to inspect its immutable audit trail.</p>
              </div>

              <button
                className="btn-secondary"
                onClick={seedDemoFeed}
                disabled={busy}
              >
                <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
                <span>{busy ? "Seeding..." : "Seed 16 Test Payments"}</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="feed-filter-bar">
              <div className="feed-filter-tabs">
                <button
                  className={`filter-btn ${feedFilter === "all" ? "active" : ""}`}
                  onClick={() => setFeedFilter("all")}
                >
                  All ({feed.length})
                </button>
                <button
                  className={`filter-btn ${feedFilter === "escalate" ? "active" : ""}`}
                  onClick={() => setFeedFilter("escalate")}
                >
                  🔴 Escalate ({feed.filter(f => (f.recommended_action || "clear") === "escalate").length})
                </button>
                <button
                  className={`filter-btn ${feedFilter === "monitor" ? "active" : ""}`}
                  onClick={() => setFeedFilter("monitor")}
                >
                  🟡 Monitor ({feed.filter(f => (f.recommended_action || "clear") === "monitor").length})
                </button>
                <button
                  className={`filter-btn ${feedFilter === "clear" ? "active" : ""}`}
                  onClick={() => setFeedFilter("clear")}
                >
                  🟢 Cleared ({feed.filter(f => (f.recommended_action || "clear") === "clear").length})
                </button>
              </div>

              <div className="search-input-wrap">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter by ID, email, method..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Transaction Stream Cards */}
            {filteredFeed.length === 0 ? (
              <SpotlightCard className="empty-hero-state" style={{ minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: "var(--bg-code)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-cyan)", marginBottom: 12 }}>
                  <Activity size={22} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-pure)", marginBottom: 4 }}>
                  No Logged Payments Found
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 340 }}>
                  Click <strong>Seed 16 Test Payments</strong> or analyze a transaction in the workbench to populate the live audit stream.
                </p>
              </SpotlightCard>
            ) : (
              <div className="txn-stream-list">
                {filteredFeed.map((item) => (
                  <TransactionCard
                    key={`${item.transaction_id}-${item.timestamp}`}
                    item={item}
                    isSelected={audit?.transaction_id === item.transaction_id}
                    onSelect={openAuditRecord}
                  />
                ))}
              </div>
            )}

            {/* Selected Audit Trail Inspector */}
            <AuditTrail record={audit} onClose={() => setAudit(null)} />
          </div>
        )}

        {/* ───────────────────────────────────────────────
           VIEW 3: HONEST METRICS & ECONOMIC ROI SIMULATOR
           ─────────────────────────────────────────────── */}
        {view === "metrics" && (
          <div>
            <div className="view-header">
              <div className="view-title-block">
                <h1>Model Performance & Economic Impact</h1>
                <p>Metrics measured strictly on 88,581 held-out test rows (IEEE-CIS locked test set). Evaluated exactly once at validation-tuned threshold.</p>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="stats-kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Precision</div>
                <div className="kpi-number">
                  {metrics?.precision ? `${(metrics.precision * 100).toFixed(2)}%` : "69.25%"}
                </div>
                <div className="kpi-hint">7 out of 10 flagged transactions are true fraud</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">Recall</div>
                <div className="kpi-number">
                  {metrics?.recall ? `${(metrics.recall * 100).toFixed(2)}%` : "60.31%"}
                </div>
                <div className="kpi-hint">Catches 60.3% of all fraud attacks</div>
              </div>

              <div className="kpi-card highlight">
                <div className="kpi-label">False Positive Rate (FPR)</div>
                <div className="kpi-number">
                  {metrics?.false_positive_rate ? `${(metrics.false_positive_rate * 100).toFixed(2)}%` : "0.97%"}
                </div>
                <div className="kpi-hint">Only ~97 legitimate txns blocked per 10,000</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">AUC-ROC</div>
                <div className="kpi-number">
                  {metrics?.auc_roc ? metrics.auc_roc.toFixed(4) : "0.9477"}
                </div>
                <div className="kpi-hint">Excellent class separation discrimination</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">Decision Threshold</div>
                <div className="kpi-number font-mono">
                  {metrics?.threshold ? metrics.threshold.toFixed(4) : "0.8351"}
                </div>
                <div className="kpi-hint">Tuned on validation (max-F1), frozen for test</div>
              </div>
            </div>

            {/* Interactive ROI & Business Cost Simulator */}
            <SpotlightCard style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ padding: 6, borderRadius: "var(--radius-xs)", background: "var(--brand-cyan-bg)", color: "var(--brand-cyan)", border: "1px solid var(--brand-cyan-border)" }}>
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pure)" }}>
                    Interactive False-Positive Cost & Protection Simulator
                  </h3>
                  <p style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                    Translate mathematical FPR directly into real-world Rupee business economics.
                  </p>
                </div>
              </div>

              {/* Slider Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--bg-code)", padding: 14, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Monthly Transaction Volume</span>
                    <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-pure)" }}>{monthlyVolume.toLocaleString()} txns</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={500000}
                    step={5000}
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--text-dim)", marginTop: 4 }}>
                    <span>5k txns</span>
                    <span>500k txns</span>
                  </div>
                </div>

                <div style={{ background: "var(--bg-code)", padding: 14, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Average Order Value (AOV)</span>
                    <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-pure)" }}>₹{avgOrderValue.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={25000}
                    step={250}
                    value={avgOrderValue}
                    onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--text-dim)", marginTop: 4 }}>
                    <span>₹500</span>
                    <span>₹25,000</span>
                  </div>
                </div>
              </div>

              {/* Economic Calculation Results */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "var(--risk-clear-bg)", border: "1px solid var(--risk-clear-border)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--risk-clear)", letterSpacing: "0.05em" }}>Fraud Loss Prevented</div>
                  <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--risk-clear)", marginTop: 4 }}>
                    ₹{businessImpact.fraudRupeesProtected.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                    ~{businessImpact.caughtFraudTxns.toLocaleString()} fraud attacks stopped / month
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "var(--risk-monitor-bg)", border: "1px solid var(--risk-monitor-border)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--risk-monitor)", letterSpacing: "0.05em" }}>False Positive Friction</div>
                  <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--risk-monitor)", marginTop: 4 }}>
                    ₹{businessImpact.falsePositiveFrictionRupees.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                    ~{businessImpact.falsePositiveCount.toLocaleString()} legit txns ({businessImpact.per10kLegitBlocked} per 10k)
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "var(--brand-cyan-bg)", border: "1px solid var(--brand-cyan-border)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--brand-cyan)", letterSpacing: "0.05em" }}>Net Merchant Benefit</div>
                  <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--text-pure)", marginTop: 4 }}>
                    +₹{businessImpact.netProtectedValue.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                    Net financial margin preserved
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Split Manifest Verification */}
            {metrics?.split_manifest && (
              <SpotlightCard style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: 6, borderRadius: "var(--radius-xs)", background: "var(--bg-code)", color: "var(--brand-cyan)", border: "1px solid var(--border-subtle)" }}>
                    <Database size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-pure)" }}>Locked Split Protocol & Manifest</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>70% Train / 15% Validation / 15% Test (No Data Leakage)</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: "10px 14px", background: "var(--bg-code)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Training Rows</div>
                    <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                      {Number(metrics.split_manifest.train_n || 413378).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--bg-code)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Validation Rows</div>
                    <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                      {Number(metrics.split_manifest.val_n || 88581).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--bg-code)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Locked Test Rows</div>
                    <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                      {Number(metrics.split_manifest.test_n || 88581).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--bg-code)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Stratified Fraud Rate</div>
                    <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                      ~3.50%
                    </div>
                  </div>
                </div>

                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-xs)", background: "var(--bg-code)", border: "1px solid var(--border-subtle)", fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  🛡️ <strong>Integrity Guarantee:</strong> Test TransactionIDs were frozen into <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>locked_test_ids.csv</span> before training. Never used for median imputation, categorical encodings, early stopping, or threshold tuning.
                </div>
              </SpotlightCard>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
