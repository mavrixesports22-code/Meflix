import React, { useState } from 'react';
import { ShieldIcon, LockIcon, CheckIcon } from './Icons.jsx';

export const SecurityPinTab = ({ hidden = false, onUpdatePin, onLock }) => {
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
      let serverChanged = false;
      if (typeof fetch === 'function') {
        try {
          const res = await fetch('/api/admin/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPin: cur, newPin: np })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.changed) {
              serverChanged = true;
            }
          }
        } catch {}
      }

      if (onUpdatePin) {
        await onUpdatePin(cur, np, serverChanged);
      }

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
    <div id="view-pin" className="tab-section" hidden={hidden}>
      <div className="section-header">
        <h2 className="section-title">Update Administrator PIN</h2>
        <p className="section-desc">
          Set a secure 4-digit PIN to protect the admin console. Changing your PIN updates Firestore directly.
        </p>
      </div>

      <div className="pin-card-wrapper">
        <form
          id="pin-form"
          ref={(form) => {
            if (form && !form._hasNativeSubmit) {
              form._hasNativeSubmit = true;
              form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleSubmit(e);
              });
            }
          }}
          onSubmit={handleSubmit}
          className="pin-update-form"
        >
          <div className="pin-field-group">
            <label htmlFor="current-pin" className="pin-label">CURRENT PIN</label>
            <input
              id="current-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              defaultValue=""
              placeholder="Enter current PIN"
              className="pin-input"
              disabled={busy}
            />
          </div>

          <div className="pin-field-group">
            <label htmlFor="new-pin" className="pin-label">NEW 4-DIGIT PIN</label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              defaultValue=""
              placeholder="Enter new 4-digit PIN"
              className="pin-input"
              disabled={busy}
            />
          </div>

          <div className="pin-field-group">
            <label htmlFor="confirm-pin" className="pin-label">CONFIRM NEW PIN</label>
            <input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              defaultValue=""
              placeholder="Re-enter new PIN"
              className="pin-input"
              disabled={busy}
            />
          </div>

          <p id="pin-error" className={`pin-error ${notice?.isError ? 'error' : 'success'}`}>
            {notice ? notice.text : ''}
          </p>

          <button
            id="save-pin"
            type="submit"
            className="btn-save-pin"
            disabled={busy}
          >
            <CheckIcon size={14} color="#FFFFFF" />
            <span>Save PIN & Lock Console</span>
          </button>
        </form>
      </div>
    </div>
  );
};
