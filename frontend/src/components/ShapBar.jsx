import React from "react";

export default function ShapBar({ shapValues = [] }) {
  if (!shapValues || shapValues.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--fl-surface)",
          padding: "14px",
          borderRadius: "var(--fl-radius-md)",
          fontSize: "12px",
          color: "var(--fl-ghost)",
        }}
      >
        No SHAP attribution vectors available.
      </div>
    );
  }

  const maxAbsValue = Math.max(
    ...shapValues.map((s) => Math.abs(Number(s.shap_value || 0))),
    0.0001
  );

  return (
    <div
      style={{
        backgroundColor: "var(--fl-surface)",
        padding: "14px",
        borderRadius: "var(--fl-radius-md)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "var(--fl-ghost)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "2px",
        }}
      >
        SHAP Feature Attributions (Top Drivers)
      </div>

      {shapValues.map((item, index) => {
        const val = Number(item.shap_value || 0);
        const isPositive = val >= 0;
        const widthPct = Math.min((Math.abs(val) / maxAbsValue) * 100, 100);
        const color = isPositive ? "var(--fl-charge)" : "var(--fl-threat)";

        return (
          <div key={item.feature || index} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              <span style={{ color: "var(--fl-dim)" }}>{item.feature}</span>
              <span
                style={{
                  color: color,
                  fontFamily: "var(--fl-font-data)",
                  fontWeight: 500,
                }}
              >
                {isPositive ? `+${val.toFixed(4)}` : val.toFixed(4)}
              </span>
            </div>
            <div
              style={{
                height: "4px",
                backgroundColor: "var(--fl-raised)",
                borderRadius: "2px",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <div
                className="shap-bar-fill"
                style={{
                  height: "100%",
                  width: `${widthPct}%`,
                  backgroundColor: color,
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
