import React from "react";
import { ArrowRight, CheckCircle, Database, Shield, Zap, Sparkles, Cpu, Layers } from "lucide-react";

export default function PipelineRail({ activeStep = 5, isAnalyzing = false }) {
  const steps = [
    {
      id: 1,
      name: "Razorpay Ingest",
      sub: "Payload Normalizer",
      icon: <Database size={13} />,
      detail: "Paise → INR / Entity Map"
    },
    {
      id: 2,
      name: "IEEE-CIS Vector",
      sub: "42-Dim Feature Space",
      icon: <Layers size={13} />,
      detail: "Train Medians & Hashes"
    },
    {
      id: 3,
      name: "XGBoost Engine",
      sub: "Ground Truth Model",
      icon: <Shield size={13} />,
      detail: "Locked Threshold 0.8351"
    },
    {
      id: 4,
      name: "SHAP Explainer",
      sub: "TreeAttribution",
      icon: <Cpu size={13} />,
      detail: "Top 5 Feature Vectors"
    },
    {
      id: 5,
      name: "Gemini Synthesis",
      sub: "Defense Reporter",
      icon: <Sparkles size={13} />,
      detail: "Immutable Evidence Pack"
    }
  ];

  return (
    <div className="pipeline-rail-container">
      <div className="pipeline-rail-header">
        <div className="pipeline-rail-title">
          <span className="telemetry-dot" />
          <span>INSPECTION PIPELINE ARCHITECTURE (ZERO LEAKAGE RAIL)</span>
        </div>
        <div className="pipeline-latency-badge">
          <Zap size={11} />
          <span>Deterministic ML Ground Truth</span>
        </div>
      </div>

      <div className="pipeline-steps-track">
        {steps.map((s, idx) => {
          const isDone = activeStep >= s.id;
          const isCurrent = isAnalyzing && activeStep === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className={`pipeline-node ${isDone ? "active" : ""} ${isCurrent ? "pulse" : ""}`}>
                <div className="pipeline-node-badge">
                  {s.icon}
                  <span>STAGE 0{s.id}</span>
                </div>
                <div className="pipeline-node-name">{s.name}</div>
                <div className="pipeline-node-sub">{s.sub}</div>
                <div className="pipeline-node-detail">{s.detail}</div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`pipeline-connector ${isDone ? "active" : ""}`}>
                  <div className="connector-line" />
                  <ArrowRight size={12} className="connector-arrow" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
