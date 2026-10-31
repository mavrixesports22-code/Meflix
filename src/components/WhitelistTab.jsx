import React, { useState } from 'react';
import { TrashIcon, CheckIcon } from './Icons.jsx';

export const WhitelistTab = ({ hidden = false, whitelistedIps, onAddIp, onRemoveIp }) => {
  const [ipInput, setIpInput] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const clean = ipInput.trim() || document.getElementById('manual-ip-input')?.value?.trim();
    if (!clean) return;
    setBusy(true);
    try {
      await onAddIp(clean);
      setIpInput('');
      const inputEl = document.getElementById('manual-ip-input');
      if (inputEl) inputEl.value = '';
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="view-whitelist" className="tab-section" hidden={hidden}>
      <div className="section-header">
        <h2 className="section-title">Network IP Whitelist</h2>
        <p className="section-desc">
          Devices connecting from whitelisted IP addresses bypass device authorization gates automatically.
        </p>
      </div>

      <form className="whitelist-input-row" onSubmit={handleAdd}>
        <input
          id="manual-ip-input"
          type="text"
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
          placeholder="Enter IP address (e.g. 152.58.63.170)"
          className="ip-input"
          disabled={busy}
        />
        <button
          id="add-ip-btn"
          type="button"
          className="btn-primary-red"
          onClick={handleAdd}
          disabled={busy}
        >
          <CheckIcon size={14} color="#FFFFFF" />
          <span>Add IP</span>
        </button>
      </form>

      <div id="whitelist-list" className="whitelist-list">
        {whitelistedIps.length === 0 ? (
          <div className="empty-state">
            <p>No whitelisted IP addresses. Add an IP above to grant automatic network access.</p>
          </div>
        ) : (
          whitelistedIps.map(ip => (
            <div key={ip} className="ip-item">
              <span className="ip-text">{ip}</span>
              <button
                type="button"
                className="action-btn btn-revoke"
                onClick={() => onRemoveIp(ip)}
                title="Remove IP"
              >
                <TrashIcon size={13} color="#FF6B6B" />
                <span>Remove</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
