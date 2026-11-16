import React, { memo, useState } from "react";
import { TvIcon, MobileIcon, ClockIcon, TrashIcon } from "./Icons.jsx";

export function formatAgo(timestamp, now = Date.now()) {
  if (!timestamp) return "Not recorded";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes}m ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h ago`
        : `${Math.floor(minutes / 1440)}d ago`;
}
export function getDevicePresence(device, now = Date.now()) {
  const active = device.lastActiveAt && now - device.lastActiveAt < 300000;
  return {
    type:
      active && device.isWatching ? "streaming" : active ? "online" : "offline",
    label:
      active && device.isWatching
        ? "Watching"
        : active
          ? "Recently active"
          : "Offline",
  };
}

export const DeviceCard = memo(function DeviceCard({
  device,
  isStreaming,
  expirationDetails: exp,
  relativeTime,
  onOpenDetails,
  onOpenHistory,
  onQuickApprove,
  onRevoke,
  onDelete,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const watching = isStreaming(device);
  const account = ["google", "password"].includes(device.signInMethod);
  const method =
    device.signInMethod === "google"
      ? "Google"
      : device.signInMethod === "password"
        ? "Email login"
        : "Guest request";
  const tv = /tv|aft|fire/i.test(device.platform || "");
  const historyCount = device.watchCount || device.watchHistory?.length || 0;
  async function quick(event) {
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onQuickApprove(device.deviceId);
    } catch (cause) {
      setError(cause.message || "Could not approve. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className="device-card"
      role="group"
      aria-label={`Manage ${device.name || device.deviceId}`}
      onClick={() => onOpenDetails(device.deviceId)}
    >
      <div className="device-identity">
        <span className={`device-icon ${tv ? "device-icon-tv" : "device-icon-mobile"}`}>
          {tv ? <TvIcon size={20} color="#012C54" /> : <MobileIcon size={20} color="#C6001B" />}
        </span>
        <div className="identity-copy">
          <div className="device-title-row">
            <h3>{device.name || "Unnamed request"}</h3>
            {watching && <span className="live-watching-tag">● LIVE</span>}
          </div>
          <p className="device-subtext">{device.email || device.platform || "No email provided"}</p>
          <div className="device-meta-tags">
            <span className="device-method">{method}</span>
            {!account && device.platform ? (
              <span className="device-platform-badge">{device.platform}</span>
            ) : null}
            {device.note ? <span className="device-note-badge">📝 {device.note}</span> : null}
          </div>
        </div>
      </div>
      <div className="device-access">
        <span className={`access-status ${exp.cls}`}>{exp.badge}</span>
        <span className="row-secondary">{exp.detail}</span>
      </div>
      <div className="device-activity">
        <span>{watching ? "Watching now" : "Last active"}</span>
        <span className="row-secondary">
          {watching
            ? `${device.currentTitle || "Streaming"}${device.currentEpisode ? ` · ${device.currentEpisode}` : ""}`
            : relativeTime(device.lastActiveAt || device.requestedAt)}
        </span>
      </div>
      <div
        className="card-actions"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="action-btn"
          onClick={() => onOpenHistory(device)}
        >
          <ClockIcon size={14} color="#012C54" />
          <span>History ({historyCount})</span>
        </button>
        <button
          type="button"
          className="action-btn btn-primary-red"
          onClick={() => onOpenDetails(device.deviceId)}
        >
          Manage access
        </button>
        <details className="row-menu">
          <summary
            aria-label={`More actions for ${device.name || device.deviceId}`}
          >
            •••
          </summary>
          <div className="row-menu-items">
            {device.status === "pending" && (
              <button type="button" disabled={busy} onClick={quick}>
                {busy ? "Approving…" : "Approve 30 days"}
              </button>
            )}
            {device.status === "approved" && (
              <button type="button" onClick={() => onRevoke(device.deviceId)}>
                Pause access
              </button>
            )}
            <button
              type="button"
              className="danger-text"
              onClick={() => onDelete(device.deviceId)}
            >
              <TrashIcon size={14} color="#C6001B" /> Delete record
            </button>
          </div>
        </details>
      </div>
      {!!error && (
        <p className="row-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
});
