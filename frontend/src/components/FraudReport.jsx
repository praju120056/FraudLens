import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function FraudReport({ result }) {
  if (!result) {
    return <div className="card muted">Submit a Razorpay payment JSON to run the XGBoost pipeline.</div>;
  }
  const prob = Number(result.fraud_probability || 0);
  const shap = (result.shap_values || []).map((s) => ({
    name: s.feature,
    value: Number(s.shap_value),
    fill: s.direction === "positive" ? "#f07178" : "#3dd68c",
  }));
  const gemini = result.gemini_output || {};
  const isFraud = result.final_decision === "fraud";

  return (
    <div className="grid">
      <div className="card">
        <h3 className="h">Model decision</h3>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span className={`pill ${isFraud ? "fraud" : "clear"}`}>
            XGBoost: {result.xgboost_label}
          </span>
          <span className="muted">source: {result.decision_source} · threshold {Number(result.threshold).toFixed(4)}</span>
        </div>
        <div className="muted" style={{ marginBottom: 6 }}>Fraud probability {(prob * 100).toFixed(2)}%</div>
        <div className="bar"><span style={{ width: `${Math.min(prob * 100, 100)}%`, background: isFraud ? "#f07178" : "#3dd68c" }} /></div>
      </div>

      <div className="card">
        <h3 className="h">SHAP top features</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shap} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid stroke="#243041" horizontal={false} />
              <XAxis type="number" stroke="#8b9bb0" />
              <YAxis type="category" dataKey="name" width={110} stroke="#8b9bb0" />
              <Tooltip contentStyle={{ background: "#121820", border: "1px solid #243041" }} />
              <Bar dataKey="value">{shap.map((s, i) => <Cell key={s.name + i} fill={s.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="h">Evidence summary</h3>
        <p className="pre">{gemini.evidence_summary || "—"}</p>
        <p className="muted">{gemini.confidence_narrative}</p>
        <p>Recommended action: <span className={`pill ${gemini.recommended_action}`}>{gemini.recommended_action}</span></p>
      </div>

      {isFraud && gemini.dispute_draft ? (
        <div className="card">
          <h3 className="h">Chargeback dispute draft</h3>
          <p className="pre">{gemini.dispute_draft}</p>
        </div>
      ) : null}
    </div>
  );
}
