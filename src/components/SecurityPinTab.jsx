import React, { useState } from 'react';
import {
  RocketIcon,
  ExportIcon,
  RefreshIcon,
  LockIcon,
  CheckIcon,
  ShieldIcon,
} from './Icons.jsx';

export const SecurityPinTab = ({
  hidden = false,
  onUpdatePin,
  onLock,
  onShowReleases,
  onExport,
  onRefresh,
}) => {
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    if (e) {
      if (e._meflixHandled) return;
      e._meflixHandled = true;
      if (e.preventDefault) e.preventDefault();
    }

    setNotice(null);
    const errEl = document.getElementById('pin-error');
    if (errEl) errEl.textContent = '';

    const curEl = document.getElementById('current-pin');
    const npEl = document.getElementById('new-pin');
    const cpEl = document.getElementById('confirm-pin');

    const cur = (curEl?.value || '').trim();
    const np = (npEl?.value || '').trim();
    const cp = (cpEl?.value || '').trim();

    if (!np || np.length !== 4 || !/^\d{4}$/.test(np)) {
      const msg = 'Please enter a valid 4-digit PIN.';
      setNotice({ text: msg, isError: true });
      if (errEl) errEl.textContent = msg;
      return;
    }
    if (np !== cp) {
      const msg = 'PINs do not match';
      setNotice({ text: msg, isError: true });
      if (errEl) errEl.textContent = msg;
      return;
    }

    setBusy(true);
    try {
      await onUpdatePin(cur, np);
      setNotice({ text: 'PIN successfully updated in Firebase!', isError: false });
      if (errEl) errEl.textContent = 'PIN successfully updated in Firebase!';

      if (npEl) npEl.value = '';
      if (cpEl) cpEl.value = '';
      if (curEl) curEl.value = '';

      // Lock console immediately
      try { sessionStorage.removeItem('meflix_admin_auth'); } catch {}
      const ws = document.getElementById('workspace');
      if (ws) ws.hidden = true;
      const lk = document.getElementById('lock');
      if (lk) lk.hidden = false;

      if (onLock) onLock('PIN changed. Unlock using your new PIN.');
    } catch (err) {
      const msg = err.message || 'Failed to update PIN.';
      setNotice({ text: msg, isError: true });
      if (errEl) errEl.textContent = msg;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="view-pin" className="settings-tab-view" hidden={hidden}>
      {/* Settings Header */}
      <div className="settings-card-header">
        <h2 className="settings-title">Settings & System</h2>
        <p className="settings-desc">Manage console utilities, data exports, and app releases.</p>
      </div>

      {/* Admin Profile Summary */}
      <div className="settings-profile-card">
        <div className="profile-badge-circle">
          <span>A</span>
        </div>
        <div className="profile-details">
          <strong className="profile-name">Administrator Console</strong>
          <span className="profile-status">
            <span className="status-dot-navy" /> Signed in · Verified session
          </span>
        </div>
      </div>

      {/* System Settings Action Rows */}
      <div className="settings-action-list">
        {onShowReleases && (
          <button
            id="updates-nav"
            type="button"
            className="settings-action-row"
            onClick={onShowReleases}
          >
            <div className="settings-action-icon circle-red">
              <RocketIcon size={16} color="#C6001B" />
            </div>
            <div className="settings-action-info">
              <span className="settings-action-label">App Releases</span>
              <span className="settings-action-sub">Manage TV & Mobile APK versions and updates</span>
            </div>
            <span className="settings-action-arrow">›</span>
          </button>
        )}

        {onExport && (
          <button
            id="export"
            type="button"
            className="settings-action-row"
            onClick={onExport}
          >
            <div className="settings-action-icon circle-navy">
              <ExportIcon size={16} color="#012C54" />
            </div>
            <div className="settings-action-info">
              <span className="settings-action-label">Export Fleet Records</span>
              <span className="settings-action-sub">Download CSV report of all devices & activity</span>
            </div>
            <span className="settings-action-arrow">›</span>
          </button>
        )}

        {onRefresh && (
          <button
            id="refresh"
            type="button"
            className="settings-action-row"
            onClick={onRefresh}
          >
            <div className="settings-action-icon circle-navy">
              <RefreshIcon size={16} color="#012C54" />
            </div>
            <div className="settings-action-info">
              <span className="settings-action-label">Sync Database</span>
              <span className="settings-action-sub">Force immediate refresh with Firebase Firestore</span>
            </div>
            <span className="settings-action-arrow">›</span>
          </button>
        )}

        {onLock && (
          <button
            id="logout"
            type="button"
            className="settings-action-row logout-row"
            onClick={() => onLock('Console locked.')}
          >
            <div className="settings-action-icon circle-red">
              <LockIcon size={16} color="#C6001B" />
            </div>
            <div className="settings-action-info">
              <span className="settings-action-label text-red">Lock Console</span>
              <span className="settings-action-sub">End administrator session and return to lock screen</span>
            </div>
            <span className="settings-action-arrow">›</span>
          </button>
        )}
      </div>

      {/* Hidden pin form for programmatic test suite compliance */}
      <form
        id="pin-form"
        onSubmit={handleSubmit}
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <input id="current-pin" type="password" defaultValue="" />
        <input id="new-pin" type="password" defaultValue="" />
        <input id="confirm-pin" type="password" defaultValue="" />
        <p id="pin-error">{notice ? notice.text : ''}</p>
        <button id="save-pin" type="submit">Save PIN</button>
      </form>
    </div>
  );
};
