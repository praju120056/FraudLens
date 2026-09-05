import React from "react";

export default function MetricCard({ label, value, delta, deltaType = "neutral", style }) {
  // deltaType: "positive" (charge/blue or clear/green depending on metric), "negative" (threat/red), "neutral" (dim)
  const deltaColor =
    deltaType === "positive"
      ? "var(--fl-charge)"
      : deltaType === "clear"
      ? "var(--fl-clear)"
      : deltaType === "threat" || deltaType === "negative"
      ? "var(--fl-threat)"
      : deltaType === "caution"
      ? "var(--fl-caution)"
      : "var(--fl-dim)";

  return (
    <div
      style={{
        backgroundColor: "var(--fl-surface)",
        borderRadius: "var(--fl-radius-md)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "var(--fl-ghost)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 400,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "30px",
          fontWeight: 500,
          color: "var(--fl-bone)",
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontSize: "11px",
            color: deltaColor,
            fontWeight: 400,
            marginTop: "2px",
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
