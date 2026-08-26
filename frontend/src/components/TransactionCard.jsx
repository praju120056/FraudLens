export default function TransactionCard({ item, onSelect }) {
  const action = item.recommended_action || "clear";
  const tone = action === "escalate" || item.final_decision === "fraud" ? "red"
    : action === "monitor" ? "amber" : "green";
  const prob = Number(item.fraud_probability || 0);
  return (
    <article className={`card txn ${tone}`} onClick={() => onSelect?.(item)} style={{ cursor: onSelect ? "pointer" : "default" }}>
      <div>
        <div>{item.transaction_id}</div>
        <div className="muted">{item.timestamp}</div>
      </div>
      <div>
        <span className={`pill ${action}`}>{action}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div>{(prob * 100).toFixed(2)}%</div>
        <div className="muted">XGBoost {item.final_decision}</div>
      </div>
    </article>
  );
}
