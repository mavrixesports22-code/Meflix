import React from "react";
import {
  HomeIcon,
  ActivityIcon,
  AlertCircleIcon,
  TvIcon,
  SettingsIcon,
  CheckIcon,
  ClockIcon,
  PauseIcon,
} from "./Icons.jsx";

export const BottomNavBar = ({
  currentTab,
  onSelectTab,
  streamingCount = 0,
  pendingCount = 0,
  tvCount = 0,
}) => {
  const navItems = [
    {
      key: "all",
      id: "tab-all",
      label: "Home",
      icon: <HomeIcon size={20} />,
      badge: null,
    },
    {
      key: "watching",
      id: "tab-watching",
      label: "Watching",
      icon: <ActivityIcon size={20} />,
      badge: streamingCount > 0 ? streamingCount : null,
      isGreen: false,
      isRed: streamingCount > 0,
    },
    {
      key: "pending",
      id: "tab-pending",
      label: "Pending",
      icon: <AlertCircleIcon size={20} />,
      badge: pendingCount > 0 ? pendingCount : null,
      isAmber: true,
    },
    {
      key: "tvs",
      id: "tab-tvs",
      label: "TVs",
      icon: <TvIcon size={20} />,
      badge: tvCount > 0 ? tvCount : null,
    },
    {
      key: "pin",
      id: "tab-pin",
      label: "Settings",
      icon: <SettingsIcon size={20} />,
      badge: null,
    },
  ];

  return (
    <nav className="minimal-bottom-nav" aria-label="Mobile Navigation">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          return (
            <button
              id={item.id}
              key={item.key}
              type="button"
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelectTab(item.key)}
            >
              <div className="nav-icon-wrap">
                {item.icon}
                {item.badge && (
                  <span
                    className={`nav-badge ${item.isRed ? "badge-red" : ""} ${item.isAmber ? "badge-amber" : ""}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const StatusFilterChips = ({
  currentTab,
  onSelectTab,
  totalCount = 0,
  approvedCount = 0,
  expiredCount = 0,
  rejectedCount = 0,
}) => {
  return (
    <div className="status-filter-chips" role="tablist" aria-label="Status filters">
      <button
        type="button"
        className={`filter-chip ${currentTab === "all" ? "active" : ""}`}
        onClick={() => onSelectTab("all")}
        role="tab"
        aria-selected={currentTab === "all"}
      >
        <span>All</span>
        {totalCount > 0 && <span className="chip-count">{totalCount}</span>}
      </button>

      <button
        id="tab-approved"
        type="button"
        className={`filter-chip ${currentTab === "approved" ? "active" : ""}`}
        onClick={() => onSelectTab("approved")}
        role="tab"
        aria-selected={currentTab === "approved"}
      >
        <CheckIcon size={12} color={currentTab === "approved" ? "#FFFFFF" : "#059669"} />
        <span>Approved</span>
        {approvedCount > 0 && <span className="chip-count">{approvedCount}</span>}
      </button>

      <button
        id="tab-expired"
        type="button"
        className={`filter-chip ${currentTab === "expired" ? "active" : ""}`}
        onClick={() => onSelectTab("expired")}
        role="tab"
        aria-selected={currentTab === "expired"}
      >
        <ClockIcon size={12} color={currentTab === "expired" ? "#FFFFFF" : "#C6001B"} />
        <span>Expired</span>
        {expiredCount > 0 && <span className="chip-count">{expiredCount}</span>}
      </button>

      <button
        id="tab-rejected"
        type="button"
        className={`filter-chip ${currentTab === "rejected" ? "active" : ""}`}
        onClick={() => onSelectTab("rejected")}
        role="tab"
        aria-selected={currentTab === "rejected"}
      >
        <PauseIcon size={12} color={currentTab === "rejected" ? "#FFFFFF" : "#849BB2"} />
        <span>Paused</span>
        {rejectedCount > 0 && <span className="chip-count">{rejectedCount}</span>}
      </button>
    </div>
  );
};

export const NavTabs = BottomNavBar;
