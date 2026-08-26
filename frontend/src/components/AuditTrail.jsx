export default function AuditTrail({ record }) {
  if (!record) {
    return <div className="card muted">Select a transaction from the live feed to inspect its audit trail.</div>;
  }
  return (
    <div className="card">
      <h3 className="h">Audit trail · {record.transaction_id}</h3>
      <div className="muted">{record.timestamp}</div>
      <pre className="pre">{JSON.stringify(record, null, 2)}</pre>
    </div>
  );
}
