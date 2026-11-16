import React from "react";
import { statusOf } from "../../public/model.js";
import { GridIcon, PlayIcon, AlertCircleIcon, CheckIcon } from "./Icons.jsx";

export const StatsRow = ({ devices, currentTab, onSelectTab, isStreaming }) => {
  const streamingCount = devices.filter(isStreaming).length;
  const pendingCount = devices.filter((d) => d.status === "pending").length;
  const approvedCount = devices.filter(
    (d) => statusOf(d) === "approved",
  ).length;

  const kpis = [
    {
      id: "all",
      countId: "count-all",
      label: "Total Fleet",
      num: devices.length,
      icon: <GridIcon size={16} color="#012C54" />,
      circleCls: "circle-navy",
    },
    {
      id: "watching",
      countId: "count-watching",
      label: "Watching Now",
      num: streamingCount,
      icon: <PlayIcon size={14} color="#C6001B" />,
      circleCls: "circle-red",
      hasDot: streamingCount > 0,
    },
    {
      id: "pending",
      countId: "count-pending",
      label: "Pending Review",
      num: pendingCount,
      icon: <AlertCircleIcon size={16} color="#C6001B" />,
      circleCls: "circle-red",
    },
    {
      id: "approved",
      countId: "count-approved",
      label: "Active Passes",
      num: approvedCount,
      icon: <CheckIcon size={14} color="#012C54" />,
      circleCls: "circle-navy",
    },
  ];

  return (
    <div id="stats" className="concept-stats-grid">
      {kpis.map((k) => (
        <div
          key={k.id}
          className={`concept-kpi-card ${currentTab === k.id ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => onSelectTab(k.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectTab(k.id);
            }
          }}
        >
          <div className="concept-kpi-top">
            <div className={`concept-icon-circle ${k.circleCls}`}>
              {k.icon}
            </div>
            <span className="concept-kpi-label">{k.label}</span>
            {k.hasDot && <span className="concept-live-dot" />}
          </div>
          <div id={k.countId} className="concept-kpi-number">
            {k.num}
          </div>
        </div>
      ))}
    </div>
  );
};
