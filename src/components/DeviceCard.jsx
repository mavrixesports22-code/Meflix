import React from 'react';
import { DeviceIcon, TvIcon, MobileIcon, PlayIcon, CheckIcon, ClockIcon, TrashIcon } from './Icons.jsx';

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
  const historyCount = device.watchCount || (Array.isArray(device.watchHistory) ? device.watchHistory.length : 0);

  const renderPlatformIcon = () => {
    const p = (device.platform || '').toLowerCase();
    if (p.includes('tv') || p.includes('fire')) return <TvIcon size={16} color="#CCCCCC" />;
    if (p.includes('android') || p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return <MobileIcon size={16} color="#CCCCCC" />;
    return <DeviceIcon size={16} color="#CCCCCC" />;
  };

  const formattedRegDate = device.requestedAt
    ? new Date(device.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  return (
    <div
      className="device-card device-row"
      aria-label={`Manage ${device.name || device.deviceId}`}
      ref={(el) => {
        if (el && !el._hasNativeCardClick) {
          el._hasNativeCardClick = true;
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
          <div className="device-glyph">
            {renderPlatformIcon()}
          </div>
          <div className="device-meta-col">
            <div className="name-row">
              <strong className="device-name">{device.name || 'Unnamed device'}</strong>
            </div>
            <div className="platform-meta">
              Platform: <strong className="white-text">{device.platform || 'Device'}</strong>
              <span className="meta-separator"> </span>
              Registered: <strong className="white-text">{formattedRegDate}</strong>
            </div>
          </div>
        </div>

        <div className="status-col">
          {watching ? (
            <div className="watching-now-badge">
              <span className="green-dot" />
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
          <span className="detail-value">{relativeTime(device.lastActiveAt || device.requestedAt)}</span>
        </div>
        <div className="detail-block">
          <span className="detail-label">SUBSCRIPTION VALIDITY</span>
          <span className="detail-value" style={{ color: exp.badgeColor }}>
            {exp.detail}
          </span>
        </div>
      </div>

      {/* Currently Watching Banner */}
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
