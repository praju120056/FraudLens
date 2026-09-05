import React from "react";
import { Activity, Radio, BarChart2, Shield, ArrowLeft } from "lucide-react";

export default function SidebarNav({ currentView, onViewChange, onNavigateLanding, stats = {} }) {
  const navItems = [
    { id: "feed", label: "Command Center", icon: Radio, count: stats.totalFeedCount || 0 },
    { id: "workbench", label: "Investigations", icon: Activity },
    { id: "metrics", label: "Intelligence & ROI", icon: BarChart2 },
  ];

  return (
    <aside className="console-sidebar">
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div className="brand-row" style={{ padding: 0 }}>
            <div className="brand-icon-box">
              <Shield size={14} strokeWidth={2} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="brand-title-text">FRAUDLENS</span>
              <span style={{ fontSize: "9.5px", color: "var(--fl-dim)", letterSpacing: "0.02em" }}>Risk Ops Console</span>
            </div>
          </div>

          {onNavigateLanding && (
            <button
              className="btn-ghost"
              style={{ padding: "4px 6px", fontSize: "10px", gap: "3px" }}
              onClick={onNavigateLanding}
              title="Return to Landing Page"
            >
              <ArrowLeft size={10} />
              <span>Landing</span>
            </button>
          )}
        </div>

        <div className="sidebar-nav-group">
          <div className="nav-category-label">PRIMARY SURFACES</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                className={`console-nav-item ${isActive ? "active" : ""}`}
                onClick={() => onViewChange(item.id)}
              >
                {isActive && <span className="nav-indicator" />}
                <Icon size={15} strokeWidth={1.75} />
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span className="nav-badge-count">{item.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="telemetry-pill">
          <span>XGB_THRESHOLD</span>
          <span style={{ color: "var(--fl-charge-dim)", fontWeight: 500 }}>0.8351</span>
        </div>
        <div className="telemetry-pill">
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span className="status-dot-active" />
            ENGINE_STATE
          </span>
          <span style={{ color: "var(--fl-bone)" }}>LOCKED</span>
        </div>
      </div>
    </aside>
  );
}
