import { useEffect, useMemo, useState } from "react";
import AuditTrail from "./AuditTrail.jsx";
import FraudReport from "./FraudReport.jsx";
import TransactionCard from "./TransactionCard.jsx";

const SAMPLE = {
  id: "pay_demo_card_high_04",
  amount: 1850000,
  currency: "INR",
  method: "card",
  status: "captured",
  email: "unknown.buyer@mailinator.com",
  contact: "+919800000001",
  created_at: Math.floor(Date.now() / 1000),
  account_created_at: Math.floor(Date.now() / 1000) - 86400,
  order_id: "order_demo_04",
  card: { network: "mastercard", type: "credit", last4: "4444", iin: "555555" },
};

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function Dashboard({ view, onViewChange }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [feed, setFeed] = useState([]);
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    fetch("/metrics")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, []);

  useEffect(() => {
    const load = () => {
      fetch("/transactions")
        .then((r) => r.json())
        .then((d) => setFeed(d.transactions || []))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      const body = JSON.parse(jsonText);
      const res = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analyze failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    try {
      await fetch("/demo/seed", { method: "POST" });
      const d = await fetch("/transactions").then((r) => r.json());
      setFeed(d.transactions || []);
    } finally {
      setBusy(false);
    }
  };

  const openAudit = async (item) => {
    const res = await fetch(`/audit/${encodeURIComponent(item.transaction_id)}`);
    if (res.ok) setAudit(await res.json());
    else setAudit(item);
  };

  const stats = useMemo(() => ([
    { key: "precision", label: "Precision", critical: false },
    { key: "recall", label: "Recall", critical: false },
    { key: "f1", label: "F1 Score", critical: false },
    { key: "false_positive_rate", label: "False Positive Rate", critical: true },
    { key: "auc_roc", label: "AUC-ROC", critical: false },
  ]), []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Chargeback Risk Manager <span>XGBoost ground truth · Gemini explainability</span></div>
        <nav className="nav">
          <button className={view === "analyzer" ? "active" : ""} onClick={() => onViewChange("analyzer")}>Analyzer</button>
          <button className={view === "feed" ? "active" : ""} onClick={() => onViewChange("feed")}>Live feed</button>
          <button className={view === "metrics" ? "active" : ""} onClick={() => onViewChange("metrics")}>Metrics</button>
        </nav>
      </header>

      {view === "analyzer" && (
        <main className="page grid two">
          <section className="card">
            <h3 className="h">Razorpay transaction JSON</h3>
            <textarea rows={22} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" onClick={analyze} disabled={busy}>{busy ? "Scoring…" : "Analyze"}</button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </section>
          <FraudReport result={result} />
        </main>
      )}

      {view === "feed" && (
        <main className="page grid">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p className="muted">Polling GET /transactions every 10s. Color: green clear · amber monitor · red fraud.</p>
            <button className="ghost" onClick={seed} disabled={busy}>Seed 12 test payments</button>
          </div>
          <div className="feed">
            {feed.map((item) => (
              <TransactionCard key={`${item.transaction_id}-${item.timestamp}`} item={item} onSelect={openAudit} />
            ))}
          </div>
          <AuditTrail record={audit} />
        </main>
      )}

      {view === "metrics" && (
        <main className="page">
          <p className="muted" style={{ marginTop: 0 }}>
            Held-out IEEE-CIS test set only. Test IDs locked before fitting. FPR is reported explicitly.
          </p>
          <div className="stats">
            {stats.map((s) => (
              <div key={s.key} className={`card stat ${s.critical ? "critical" : ""}`}>
                <div className="label">{s.label}</div>
                <div className="value">{fmt(metrics?.[s.key])}</div>
              </div>
            ))}
          </div>
          {metrics?.split_manifest ? (
            <pre className="pre" style={{ marginTop: 16 }}>{JSON.stringify(metrics.split_manifest, null, 2)}</pre>
          ) : (
            <p className="muted">Metrics unavailable until the model is trained and the API is running.</p>
          )}
        </main>
      )}
    </div>
  );
}
