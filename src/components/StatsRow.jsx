import React from 'react';

export const StatsRow = ({ devices, whitelistedIps, currentTab, onSelectTab, isStreaming }) => {
  const streamingCount = devices.filter(isStreaming).length;
  const pendingCount = devices.filter(d => d.status === 'pending').length;
  const ipsCount = whitelistedIps.length;

  const kpis = [
    {
      id: 'all',
      countId: 'count-all',
      label: 'TOTAL DEVICES',
      num: devices.length,
      sub: 'Tracked in system',
      color: '#FFFFFF',
      hasDot: false
    },
    {
      id: 'watching',
      countId: 'count-watching',
      label: 'STREAMING NOW',
      num: streamingCount,
      sub: streamingCount > 0 ? 'Active viewers' : 'Idle',
      color: streamingCount > 0 ? '#46D369' : '#FFFFFF',
      hasDot: streamingCount > 0
    },
    {
      id: 'pending',
      countId: 'count-pending',
      label: 'PENDING APPROVAL',
      num: pendingCount,
      sub: pendingCount > 0 ? 'Needs action' : 'Queue clear',
      color: pendingCount > 0 ? '#FFA726' : '#FFFFFF',
      hasDot: false
    },
    {
      id: 'whitelist',
      countId: 'count-whitelist',
      label: 'IP WHITELIST',
      num: ipsCount,
      sub: 'Network passes',
      color: '#FFFFFF',
      hasDot: false
    }
  ];

  return (
    <div id="stats" className="stats-grid">
      {kpis.map(k => (
        <div
          key={k.id}
          className={`stat-card stat-card-${k.id} ${currentTab === k.id ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => onSelectTab(k.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectTab(k.id); }}
        >
          <div className="stat-label-row">
            <span className="stat-label">{k.label}</span>
            {k.hasDot && <span className="green-dot" />}
          </div>
          <div id={k.countId} className="stat-number" style={{ color: k.color }}>
            {k.num}
          </div>
          <div className="stat-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
};

