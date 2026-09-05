import React from "react";

const badgeConfig = {
  escalate: {
    bg: "var(--fl-charge-tint)",
    text: "var(--fl-charge-dim)",
    dot: "var(--fl-charge)",
    label: "Escalate",
  },
  monitor: {
    bg: "var(--fl-caution-tint)",
    text: "var(--fl-caution)",
    dot: "var(--fl-caution)",
    label: "Monitor",
  },
  cleared: {
    bg: "var(--fl-raised)",
    text: "var(--fl-ghost)",
    dot: "#3a3a3a",
    label: "Cleared",
  },
};

export default function Badge({ state = "cleared", labelOverride }) {
  const normState = state?.toLowerCase?.() || "cleared";
  const normalized =
    normState === "escalate" || normState === "fraud"
      ? "escalate"
      : normState === "monitor"
      ? "monitor"
      : "cleared";

  const config = badgeConfig[normalized] || badgeConfig.cleared;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.text,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {labelOverride || config.label}
    </span>
  );
}
