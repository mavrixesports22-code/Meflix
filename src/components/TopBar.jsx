import React from 'react';
import { ShieldIcon, RefreshIcon, LockIcon, ExportIcon } from './Icons.jsx';

export const TopBar = ({ streamingCount, onRefresh, onLock, onExport, onShowReleases }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-mark-box">
          <ShieldIcon size={18} color="#FFFFFF" />
        </div>
        <div className="brand-text-col">
          <div className="brand-top-row">
            <span className="brand-title">MEFLIX CONSOLE</span>
            <span className="admin-pill">ADMIN</span>
            {streamingCount > 0 && (
              <div id="active-indicator" className="live-indicator">
                <span className="green-dot" />
                <span id="active-count" className="live-indicator-text">{streamingCount} Active</span>
              </div>
            )}
          </div>
          <span className="brand-sub">Device Authorization & Security</span>
        </div>
      </div>

      <div className="topbar-right">
        <button id="updates-nav" type="button" className="top-btn" onClick={onShowReleases}>App releases</button>
        <button
          id="export"
          type="button"
          className="top-btn"
          title="Export devices to CSV"
          onClick={onExport}
        >
          <ExportIcon size={13} color="#D0D0D8" />
          <span className="btn-label-desktop">Export</span>
        </button>

        <button
          id="refresh"
          type="button"
          className="top-btn"
          title="Refresh device updates"
          onClick={onRefresh}
        >
          <RefreshIcon size={14} color="#D0D0D8" />
          <span className="btn-label-desktop">Refresh</span>
        </button>

        <button
          id="logout"
          type="button"
          className="top-btn top-btn-danger"
          title="Lock console"
          onClick={onLock}
        >
          <LockIcon size={13} color="#FF6B6B" />
          <span className="btn-label-desktop">Lock</span>
        </button>
      </div>

    </header>
  );
};
