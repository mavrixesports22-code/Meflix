import React from 'react';
import { DeviceIcon, TvIcon, MobileIcon, PlayIcon, CheckIcon, ClockIcon, TrashIcon, AndroidIcon, AppleIcon } from './Icons.jsx';

export function formatAgo(timestamp, now = Date.now()) {
  if (!timestamp) return 'Never';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diffSec / 3600);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function getDevicePresence(device, now = Date.now()) {
  const isStreaming = Boolean(device.isWatching && device.lastActiveAt && (now - device.lastActiveAt < 300000));
  if (isStreaming) {
    return {
      type: 'streaming',
      label: 'STREAMING NOW',
      dotClass: 'green-dot-pulse',
      pillClass: 'pill-streaming',
      color: '#10B981'
    };
  }

  const lastActive = device.lastActiveAt || device.requestedAt;
  const diff = lastActive ? now - lastActive : Infinity;

  if (diff < 600000) {
    return {
      type: 'online',
      label: 'ONLINE',
      dotClass: 'green-dot',
      pillClass: 'pill-online',
      color: '#10B981'
    };
  }

  if (diff < 86400000) {
    return {
      type: 'idle',
      label: 'IDLE',
      dotClass: 'amber-dot',
      pillClass: 'pill-idle',
      color: '#F59E0B'
    };
  }

  return {
    type: 'offline',
    label: 'OFFLINE',
    dotClass: 'gray-dot',
    pillClass: 'pill-offline',
    color: '#64748B'
  };
}

export const DeviceCard = ({
  device,
  isStreaming,
  expirationDetails,
  relativeTime,
  onOpenDetails,
  onOpenHistory,
  onQuickApprove,
  onRevoke,
  onDelete
}) => {
  const watching = isStreaming(device);
  const exp = expirationDetails;
  const historyList = Array.isArray(device.watchHistory) ? device.watchHistory : [];
  const historyCount = device.watchCount || historyList.length;
  const latestWatched = historyList.length > 0 ? historyList[historyList.length - 1] : null;
  const presence = getDevicePresence(device);

  const getPlatformDetails = () => {
    const p = (device.platform || '').toLowerCase();
    if (p.includes('tv') || p.includes('fire') || p.includes('androidtv')) {
      return { icon: <TvIcon size={18} color="#FF4D58" />, glyphCls: 'glyph-tv', name: device.platform || 'Smart TV' };
    }
    if (p.includes('apple') || p.includes('ios') || p.includes('iphone') || p.includes('ipad')) {
      return { icon: <AppleIcon size={18} color="#E2E8F0" />, glyphCls: 'glyph-apple', name: device.platform || 'Apple iOS' };
    }
    if (p.includes('android')) {
      return { icon: <AndroidIcon size={18} color="#10B981" />, glyphCls: 'glyph-android', name: device.platform || 'Android' };
    }
    return { icon: <DeviceIcon size={18} color="#94A3B8" />, glyphCls: 'glyph-device', name: device.platform || 'Device' };
  };

  const platformMeta = getPlatformDetails();

  const formattedRegDate = device.requestedAt
    ? new Date(device.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  const regAgo = device.requestedAt ? formatAgo(device.requestedAt) : '';
  const activeAgo = formatAgo(device.lastActiveAt || device.requestedAt);

  return (
    <div
      className="device-card device-row"
      aria-label={`Manage ${device.name || device.deviceId}`}
      ref={(el) => {
        if (el && !el._hasClick) {
          el._hasClick = true;
          el.addEventListener('click', (e) => {
            if (e && e.target && e.target.closest && e.target.closest('button')) return;
            onOpenDetails(device.deviceId);
          });
        }
      }}
      onClick={(e) => {
        if (e && e.target && e.target.closest && e.target.closest('button')) return;
        onOpenDetails(device.deviceId);
      }}
    >
      {/* Top Header */}
      <div className="card-header">
        <div className="card-header-main">
          <div className={`device-glyph ${platformMeta.glyphCls}`}>
            {platformMeta.icon}
          </div>
          <div className="device-meta-col">
            <div className="name-row">
              <strong className="device-name">{device.name || 'Unnamed device'}</strong>
              <div className={`presence-pill ${presence.pillClass}`}>
                <span className={`presence-dot ${presence.dotClass}`} />
                <span className="presence-label">{presence.label}</span>
              </div>
            </div>
            <div className="platform-meta">
              <span>Platform: <strong className="white-text">{platformMeta.name}</strong></span>
              <span className="meta-separator">•</span>
              <span>Registered: <strong className="white-text">{formattedRegDate}</strong></span>
              {regAgo ? <span className="meta-ago">({regAgo})</span> : null}
            </div>
          </div>
        </div>

        <div className="status-col">
          {watching ? (
            <div className="watching-now-badge">
              <span className="green-dot-pulse" />
              <span>WATCHING NOW</span>
            </div>
          ) : (
            <div className={`status-tag ${exp.cls}`} style={{ borderColor: exp.badgeColor, color: exp.badgeColor }}>
              {exp.badge}
            </div>
          )}
        </div>
      </div>

      {/* 4-Column Metadata Grid */}
      <div className="details-grid">
        <div className="detail-block">
          <span className="detail-label">IP ADDRESS</span>
          <span className="detail-mono">{device.ip || 'Not recorded'}</span>
        </div>
        <div className="detail-block">
          <span className="detail-label">DEVICE ID</span>
          <span className="detail-mono">{device.deviceId}</span>
        </div>
        <div className="detail-block">
          <span className="detail-label">LAST ACTIVE</span>
          <span className="detail-value detail-value-active">
            <span className={`status-micro-dot ${presence.dotClass}`} />
            <strong className="ago-highlight">{activeAgo}</strong>
          </span>
        </div>
        <div className="detail-block">
          <span className="detail-label">SUBSCRIPTION VALIDITY</span>
          <span className="detail-value" style={{ color: exp.badgeColor }}>
            {exp.detail}
          </span>
        </div>
      </div>

      {/* Currently Watching Live Stream Banner */}
      {watching && device.currentTitle ? (
        <div className="now-watching-banner">
          <div className="now-watching-header">
            <div className="now-watching-title-wrap">
              <PlayIcon size={13} color="#E50914" />
              <span className="now-watching-title">
                {device.currentTitle}
                {device.currentEpisode ? ` - ${device.currentEpisode}` : ''}
              </span>
            </div>
            <span className="now-watching-pct">{device.currentProgress || 0}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(5, device.currentProgress || 0))}%` }}
            />
          </div>
        </div>
      ) : (!watching && latestWatched && latestWatched.title) ? (
        <div className="recent-stream-bar">
          <div className="recent-stream-info">
            <span className="recent-stream-label">RECENT TITLE</span>
            <span className="recent-stream-title">{latestWatched.title}</span>
            {latestWatched.episode ? <span className="recent-stream-ep">{latestWatched.episode}</span> : null}
            {latestWatched.progress ? <span className="recent-stream-pct">({latestWatched.progress}%)</span> : null}
          </div>
          {latestWatched.updatedAt ? (
            <span className="recent-stream-ago">{formatAgo(latestWatched.updatedAt)}</span>
          ) : null}
        </div>
      ) : null}

      {/* Action Buttons Row */}
      <div className="card-actions">
        <div className="action-buttons">
          <button
            type="button"
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); onOpenHistory(device); }}
          >
            <ClockIcon size={13} color="#CCCCCC" />
            <span>History ({historyCount})</span>
          </button>

          <button
            type="button"
            className="action-btn btn-primary-red"
            onClick={(e) => { e.stopPropagation(); onOpenDetails(device.deviceId); }}
          >
            <CheckIcon size={13} color="#FFFFFF" />
            <span>{device.status === 'approved' ? 'Extend Access' : 'Activate User'}</span>
          </button>

          {device.status === 'pending' && (
            <button
              type="button"
              className="action-btn btn-quick"
              onClick={(e) => { e.stopPropagation(); onQuickApprove(device.deviceId); }}
            >
              <span>Quick 1-Mo (₹200)</span>
            </button>
          )}

          {device.status === 'approved' && (
            <button
              type="button"
              className="action-btn btn-revoke"
              onClick={(e) => { e.stopPropagation(); onRevoke(device.deviceId); }}
            >
              <span>Pause access</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className="trash-btn"
          title="Delete device record"
          aria-label="Delete device record"
          onClick={(e) => { e.stopPropagation(); onDelete(device.deviceId); }}
        >
          <TrashIcon size={14} color="#888888" />
        </button>
      </div>
    </div>
  );
};
