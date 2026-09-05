import React, { useEffect, useMemo, useState } from "react";
import SidebarNav from "./SidebarNav.jsx";
import MetricCard from "./MetricCard.jsx";
import PipelineRail from "./PipelineRail.jsx";
import FraudReport from "./FraudReport.jsx";
import TransactionCard from "./TransactionCard.jsx";
import AuditTrail from "./AuditTrail.jsx";
import {
  Search, RefreshCw, Play, Sliders, Database, AlertCircle, ShieldCheck
} from "lucide-react";

// Real-World Production Presets for 1-Click Risk Evaluation
const PRESETS = [
  {
    id: "preset_fraud_high",
    title: "High-Risk Velocity Attack",
    badge: "Escalate",
    data: {
      id: "pay_demo_card_high_04",
      amount: 9250000, // ₹92,500
      currency: "INR",
      method: "card",
      status: "captured",
      email: "disposable.buyer99@tempmail.com",
      contact: "+919800000001",
      created_at: Math.floor(Date.now() / 1000),
      account_created_at: Math.floor(Date.now() / 1000) - 3600,
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
    data: {
      id: "pay_demo_upi_low_01",
      amount: 45000, // ₹450
      currency: "INR",
      method: "upi",
      status: "captured",
      email: "rahul.sharma@gmail.com",
      contact: "+919876543210",
      created_at: Math.floor(Date.now() / 1000),
      account_created_at: Math.floor(Date.now() / 1000) - (86400 * 450),
      order_id: "order_grocery_234",
      vpa: "rahul@okaxis"
    }
  },
  {
    id: "preset_monitor_takeover",
    title: "Borderline Account Velocity",
    badge: "Monitor",
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
    badge: "Clear",
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

export default function Dashboard({ view, onViewChange, onNavigateLanding }) {
  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [jsonText, setJsonText] = useState(JSON.stringify(PRESETS[0].data, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [feed, setFeed] = useState([]);
  const [audit, setAudit] = useState(null);

  // Feed Filter & Search
  const [feedFilter, setFeedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ROI Simulator State
  const [monthlyVolume, setMonthlyVolume] = useState(50000);
  const [avgOrderValue, setAvgOrderValue] = useState(2500);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && view === "workbench") {
        e.preventDefault();
        analyze();
      }
      if (e.key === "Escape" && audit) {
        setAudit(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, jsonText, audit]);

  // Load locked metrics on mount
  useEffect(() => {
    fetch(`${API_BASE}/metrics`)
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, []);

  // Poll telemetry feed
  useEffect(() => {
    const loadFeed = () => {
      fetch(`${API_BASE}/transactions`)
        .then((r) => r.json())
        .then((d) => setFeed(d.transactions || []))
        .catch(() => {});
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
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
      // Auto-update feed
      fetch(`${API_BASE}/transactions`)
        .then((r) => r.json())
        .then((d) => setFeed(d.transactions || []))
        .catch(() => {});
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

  // Filtered Feed List
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const action = item.recommended_action || "clear";
      const matchesFilter =
        feedFilter === "all"
          ? true
          : feedFilter === "escalate"
          ? action === "escalate"
          : feedFilter === "monitor"
          ? action === "monitor"
          : action === "clear";

      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const id = (item.transaction_id || "").toLowerCase();
      const email = ((item.standardized_transaction || {}).email || "").toLowerCase();
      const method = ((item.standardized_transaction || {}).method || "").toLowerCase();
      return id.includes(q) || email.includes(q) || method.includes(q);
    });
  }, [feed, feedFilter, searchQuery]);

  // Economic Impact Calculation
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
      per10kLegitBlocked: Math.round(fpr * 10000),
    };
  }, [metrics, monthlyVolume, avgOrderValue]);

  const escalateCount = feed.filter((f) => (f.recommended_action || "clear") === "escalate").length;
  const monitorCount = feed.filter((f) => (f.recommended_action || "clear") === "monitor").length;
  const clearCount = feed.filter((f) => (f.recommended_action || "clear") === "clear").length;

  return (
    <div className="console-layout">
      {/* ── Left Sidebar Navigation Console ── */}
      <SidebarNav
        currentView={view}
        onViewChange={onViewChange}
        onNavigateLanding={onNavigateLanding}
        stats={{ totalFeedCount: feed.length }}
      />

      {/* ── Main Viewport ── */}
      <div className="console-main">
        {/* Top Console HUD Bar */}
        <header className="console-topbar">
          <div className="topbar-breadcrumbs">
            <span style={{ color: "var(--fl-ghost)", fontFamily: "var(--fl-font-data)", fontSize: "11px" }}>FRAUDLENS /</span>
            <span className="topbar-surface-title">
              {view === "feed" ? "Command Center (Live Telemetry)" : view === "workbench" ? "Investigations & Scoring Workbench" : "Intelligence & Economic Simulator"}
            </span>
          </div>

          <div className="topbar-stats-cluster">
            <div className="topbar-stat-item">
              <span className="status-dot-active" />
              <span>XGB_LOCKED: <strong>0.8351</strong></span>
            </div>
            <div className="topbar-stat-item">
              <span>LATENCY: <strong>~18ms</strong></span>
            </div>
            <div className="topbar-stat-item">
              <span>TEST_AUC: <strong>94.77%</strong></span>
            </div>
          </div>
        </header>

        {/* Scrollable View Body */}
        <main className="console-body">

          {/* ─────────────────────────────────────────────────────────────
             SURFACE 1: COMMAND CENTER (Live Telemetry Feed)
             ───────────────────────────────────────────────────────────── */}
          {view === "feed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Telemetry KPI Overview */}
              <div className="metrics-grid-4" style={{ marginBottom: 0 }}>
                <MetricCard
                  label="Total Ingested Stream"
                  value={`${feed.length} txns`}
                  delta="Live Razorpay Webhook Ingestion"
                  deltaType="neutral"
                />
                <MetricCard
                  label="High-Risk Escalations"
                  value={escalateCount}
                  delta={`${((escalateCount / (feed.length || 1)) * 100).toFixed(1)}% of stream`}
                  deltaType={escalateCount > 0 ? "positive" : "neutral"}
                />
                <MetricCard
                  label="Active Monitoring"
                  value={monitorCount}
                  delta={`${((monitorCount / (feed.length || 1)) * 100).toFixed(1)}% borderline`}
                  deltaType={monitorCount > 0 ? "caution" : "neutral"}
                />
                <MetricCard
                  label="Cleared Transactions"
                  value={clearCount}
                  delta={`${((clearCount / (feed.length || 1)) * 100).toFixed(1)}% safe`}
                  deltaType="clear"
                />
              </div>

              {/* High-Density Telemetry Table */}
              <div className="telemetry-table-container">
                {/* Table Control & Filter Bar */}
                <div className="telemetry-filter-bar">
                  <div className="filter-tab-group">
                    <button
                      className={`tab-btn ${feedFilter === "all" ? "active" : ""}`}
                      onClick={() => setFeedFilter("all")}
                    >
                      All ({feed.length})
                    </button>
                    <button
                      className={`tab-btn ${feedFilter === "escalate" ? "active" : ""}`}
                      onClick={() => setFeedFilter("escalate")}
                    >
                      Escalate ({escalateCount})
                    </button>
                    <button
                      className={`tab-btn ${feedFilter === "monitor" ? "active" : ""}`}
                      onClick={() => setFeedFilter("monitor")}
                    >
                      Monitor ({monitorCount})
                    </button>
                    <button
                      className={`tab-btn ${feedFilter === "clear" ? "active" : ""}`}
                      onClick={() => setFeedFilter("clear")}
                    >
                      Cleared ({clearCount})
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative", width: "220px" }}>
                      <Search size={12} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--fl-ghost)" }} />
                      <input
                        type="text"
                        placeholder="Search ID, email, method..."
                        className="fl-input"
                        style={{ paddingLeft: "28px", height: "32px", fontSize: "11px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn-ghost"
                      style={{ padding: "6px 12px", height: "32px" }}
                      onClick={seedDemoFeed}
                      disabled={busy}
                    >
                      <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
                      <span>{busy ? "Seeding..." : "Seed 16 Payments"}</span>
                    </button>
                  </div>
                </div>

                {/* Table Column Headers */}
                <div className="telemetry-header-row">
                  <div>Payment ID / Timestamp</div>
                  <div>Method / Route</div>
                  <div>Amount</div>
                  <div>Risk State</div>
                  <div style={{ textAlign: "right" }}>Fraud Score</div>
                </div>

                {/* Table Rows */}
                {filteredFeed.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--fl-ghost)" }}>
                    No payment telemetry found matching current filter. Click "Seed 16 Payments" above.
                  </div>
                ) : (
                  <div>
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
              </div>

              {/* Slide-over Audit Drawer */}
              <AuditTrail record={audit} onClose={() => setAudit(null)} />
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
             SURFACE 2: INVESTIGATIONS & WORKBENCH
             ───────────────────────────────────────────────────────────── */}
          {view === "workbench" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Architecture Pipeline Rail */}
              <PipelineRail activeStep={result ? 5 : 2} isAnalyzing={busy} />

              <div className="workbench-layout">
                {/* Left Column: Test Presets & Payload Editor */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="fl-card">
                    <div className="data-label" style={{ marginBottom: "8px" }}>SELECT TEST PAYLOAD PRESET</div>
                    <div className="preset-chip-grid">
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          className={`preset-chip ${selectedPresetId === p.id ? "active" : ""}`}
                          onClick={() => handleSelectPreset(p)}
                        >
                          <span>{p.title}</span>
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 6px" }}>
                      <span className="data-label">razorpay_payment.json</span>
                      <span style={{ fontSize: "10px", color: "var(--fl-ghost)", fontFamily: "var(--fl-font-data)" }}>Ctrl+Enter to Execute</span>
                    </div>

                    <textarea
                      className="fl-textarea"
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      spellCheck={false}
                    />

                    {error && (
                      <div style={{
                        marginTop: "10px",
                        padding: "8px 10px",
                        background: "var(--fl-threat-tint)",
                        border: "0.5px solid var(--fl-threat)",
                        borderRadius: "var(--fl-radius-sm)",
                        color: "#FFAAA6",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <AlertCircle size={13} />
                        <span>{error}</span>
                      </div>
                    )}

                    <div style={{ marginTop: "12px" }}>
                      <button
                        className="btn-primary"
                        onClick={analyze}
                        disabled={busy}
                        style={{ width: "100%" }}
                      >
                        {busy ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                        <span>{busy ? "Evaluating ML Pipeline..." : "Execute Risk Scoring & Synthesis"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Decision Hub & Explainability */}
                <div>
                  <FraudReport result={result} />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
             SURFACE 3: INTELLIGENCE & ECONOMIC SIMULATOR
             ───────────────────────────────────────────────────────────── */}
          {view === "metrics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header Title */}
              <div>
                <h2 className="section-heading">Model Performance & Economic Impact</h2>
                <p className="section-subtext">
                  Metrics strictly evaluated on 88,581 held-out test rows (IEEE-CIS locked test set). Zero data leakage protocol.
                </p>
              </div>

              {/* 4-Up Locked Test Metrics Grid */}
              <div className="metrics-grid-4">
                <MetricCard
                  label="Test Set Precision"
                  value={metrics?.precision ? `${(metrics.precision * 100).toFixed(2)}%` : "69.25%"}
                  delta="7 of 10 flagged are true attacks"
                  deltaType="neutral"
                />
                <MetricCard
                  label="Test Set Recall"
                  value={metrics?.recall ? `${(metrics.recall * 100).toFixed(2)}%` : "60.31%"}
                  delta="Catches 60.3% of fraud volume"
                  deltaType="neutral"
                />
                <MetricCard
                  label="False Positive Rate (FPR)"
                  value={metrics?.false_positive_rate ? `${(metrics.false_positive_rate * 100).toFixed(2)}%` : "0.97%"}
                  delta="Only ~97 legitimate blocked per 10k"
                  deltaType="clear"
                />
                <MetricCard
                  label="Locked AUC-ROC"
                  value={metrics?.auc_roc ? metrics.auc_roc.toFixed(4) : "0.9477"}
                  delta="Class discrimination boundary"
                  deltaType="positive"
                />
              </div>

              {/* Interactive ROI & False-Positive Cost Simulator */}
              <div className="fl-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <Sliders size={16} color="var(--fl-charge-dim)" />
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--fl-bone)" }}>
                      Interactive False-Positive Economics & Protection Simulator
                    </h3>
                    <p style={{ fontSize: "11.5px", color: "var(--fl-dim)" }}>
                      Translate mathematical FPR directly into real-world Rupee merchant margin.
                    </p>
                  </div>
                </div>

                {/* Sliders Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ background: "var(--fl-bg)", padding: "12px 14px", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="data-label">Monthly Transaction Volume</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--fl-bone)", fontWeight: 500 }}>
                        {monthlyVolume.toLocaleString()} txns
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={500000}
                      step={5000}
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                      className="fl-slider"
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--fl-ghost)", marginTop: "4px" }}>
                      <span>5k txns</span>
                      <span>500k txns</span>
                    </div>
                  </div>

                  <div style={{ background: "var(--fl-bg)", padding: "12px 14px", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="data-label">Average Order Value (AOV)</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--fl-bone)", fontWeight: 500 }}>
                        ₹{avgOrderValue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={25000}
                      step={250}
                      value={avgOrderValue}
                      onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                      className="fl-slider"
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--fl-ghost)", marginTop: "4px" }}>
                      <span>₹500</span>
                      <span>₹25,000</span>
                    </div>
                  </div>
                </div>

                {/* Economic Output 3-Up Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "var(--fl-radius-sm)",
                    background: "var(--fl-clear-tint)",
                    border: "0.5px solid var(--fl-clear)"
                  }}>
                    <div className="data-label" style={{ color: "#74DF9F" }}>Fraud Loss Prevented</div>
                    <div className="font-mono" style={{ fontSize: "20px", fontWeight: 500, color: "#74DF9F", marginTop: "4px" }}>
                      ₹{businessImpact.fraudRupeesProtected.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--fl-dim)", marginTop: "2px" }}>
                      ~{businessImpact.caughtFraudTxns.toLocaleString()} attacks stopped / month
                    </div>
                  </div>

                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "var(--fl-radius-sm)",
                    background: "var(--fl-caution-tint)",
                    border: "0.5px solid var(--fl-caution)"
                  }}>
                    <div className="data-label" style={{ color: "var(--fl-caution)" }}>False Positive Friction</div>
                    <div className="font-mono" style={{ fontSize: "20px", fontWeight: 500, color: "var(--fl-caution)", marginTop: "4px" }}>
                      ₹{businessImpact.falsePositiveFrictionRupees.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--fl-dim)", marginTop: "2px" }}>
                      ~{businessImpact.falsePositiveCount.toLocaleString()} legit txns ({businessImpact.per10kLegitBlocked} per 10k)
                    </div>
                  </div>

                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "var(--fl-radius-sm)",
                    background: "var(--fl-charge-tint)",
                    border: "0.5px solid var(--fl-charge)"
                  }}>
                    <div className="data-label" style={{ color: "var(--fl-charge-dim)" }}>Net Merchant Benefit</div>
                    <div className="font-mono" style={{ fontSize: "20px", fontWeight: 500, color: "var(--fl-bone)", marginTop: "4px" }}>
                      +₹{businessImpact.netProtectedValue.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--fl-dim)", marginTop: "2px" }}>
                      Net financial margin preserved
                    </div>
                  </div>
                </div>
              </div>

              {/* Locked Split Manifest Protocol */}
              <div className="fl-card">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Database size={15} color="var(--fl-dim)" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--fl-bone)" }}>Locked Split Protocol & Manifest</div>
                    <div style={{ fontSize: "11px", color: "var(--fl-dim)" }}>70% Train / 15% Validation / 15% Test (Zero Data Leakage)</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ padding: "8px 12px", background: "var(--fl-bg)", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                    <div className="data-label">Training Rows</div>
                    <div className="font-mono" style={{ fontSize: "15px", color: "var(--fl-bone)", marginTop: "2px" }}>413,378</div>
                  </div>
                  <div style={{ padding: "8px 12px", background: "var(--fl-bg)", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                    <div className="data-label">Validation Rows</div>
                    <div className="font-mono" style={{ fontSize: "15px", color: "var(--fl-bone)", marginTop: "2px" }}>88,581</div>
                  </div>
                  <div style={{ padding: "8px 12px", background: "var(--fl-bg)", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                    <div className="data-label">Locked Test Rows</div>
                    <div className="font-mono" style={{ fontSize: "15px", color: "var(--fl-bone)", marginTop: "2px" }}>88,581</div>
                  </div>
                  <div style={{ padding: "8px 12px", background: "var(--fl-bg)", borderRadius: "var(--fl-radius-sm)", border: "0.5px solid var(--fl-hairline)" }}>
                    <div className="data-label">Stratified Fraud Rate</div>
                    <div className="font-mono" style={{ fontSize: "15px", color: "var(--fl-bone)", marginTop: "2px" }}>~3.50%</div>
                  </div>
                </div>

                <div style={{
                  padding: "10px 12px",
                  borderRadius: "var(--fl-radius-sm)",
                  background: "var(--fl-bg)",
                  border: "0.5px solid var(--fl-hairline)",
                  fontSize: "11.5px",
                  color: "var(--fl-dim)",
                  lineHeight: 1.5
                }}>
                  Test TransactionIDs were frozen into <span className="font-mono" style={{ color: "var(--fl-charge-dim)" }}>locked_test_ids.csv</span> before any model training or imputation. Early stopping and max-F1 threshold selection were conducted on validation set only.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
