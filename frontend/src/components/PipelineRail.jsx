import React from "react";
import { ArrowRight, Database, Shield, Zap, Sparkles, Cpu, Layers } from "lucide-react";

export default function PipelineRail({ activeStep = 5, isAnalyzing = false }) {
  const steps = [
    {
      id: 1,
      name: "Razorpay Ingest",
      sub: "Payload Normalizer",
      icon: Database,
      detail: "Paise → INR"
    },
    {
      id: 2,
      name: "IEEE-CIS Vector",
      sub: "42-Dim Feature Space",
      icon: Layers,
      detail: "Frozen Encodings"
    },
    {
      id: 3,
      name: "XGBoost Engine",
      sub: "Ground Truth Decision",
      icon: Shield,
      detail: "Threshold 0.8351"
    },
    {
      id: 4,
      name: "SHAP Drivers",
      sub: "TreeAttribution",
      icon: Cpu,
      detail: "Top 5 Attributions"
    },
    {
      id: 5,
      name: "Gemini Synthesis",
      sub: "Evidence Synthesis",
      icon: Sparkles,
      detail: "Dispute Dossier"
    }
  ];

  return (
    <div style={{
      background: "var(--fl-surface)",
      border: "0.5px solid var(--fl-hairline)",
      borderRadius: "var(--fl-radius-md)",
      padding: "12px 16px",
      marginBottom: "20px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--fl-ghost)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--fl-charge)" }} />
          <span>INSPECTION PIPELINE ARCHITECTURE</span>
        </div>
        <span style={{ fontFamily: "var(--fl-font-data)", color: "var(--fl-dim)" }}>
          DEFENSE-ONLY PIPELINE
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "10px"
      }}>
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isDone = activeStep >= s.id;
          return (
            <div
              key={s.id}
              style={{
                background: isDone ? "var(--fl-raised)" : "var(--fl-bg)",
                border: isDone ? "0.5px solid var(--fl-border)" : "0.5px solid var(--fl-hairline)",
                borderRadius: "var(--fl-radius-sm)",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "3px"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: isDone ? "var(--fl-charge-dim)" : "var(--fl-ghost)",
                fontSize: "10px",
                fontFamily: "var(--fl-font-data)"
              }}>
                <span>0{s.id}</span>
                <Icon size={12} strokeWidth={1.75} />
              </div>
              <div style={{
                fontSize: "11.5px",
                fontWeight: 500,
                color: isDone ? "var(--fl-bone)" : "var(--fl-dim)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {s.name}
              </div>
              <div style={{
                fontSize: "10px",
                color: "var(--fl-dim)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {s.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
