import React from "react";
import { MeflixRibbonLogo } from "./Icons.jsx";

export const TopBar = ({ syncState = "ready" }) => {
  return (
    <header className="minimal-topbar">
      <div className="minimal-header-row">
        <div className="minimal-header-left">
          <h1 className="minimal-page-title">Home</h1>
          <div className="minimal-brand-tag">
            <MeflixRibbonLogo size={13} />
            <span>MEFLIX</span>
          </div>
        </div>

        <div className="minimal-header-right">
          <div className="minimal-user-avatar" title="Administrator">
            <span className="minimal-avatar-text">A</span>
            <span
              className={`minimal-avatar-dot ${syncState === "loading" ? "syncing" : ""}`}
              title={syncState === "loading" ? "Syncing…" : "Online"}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
