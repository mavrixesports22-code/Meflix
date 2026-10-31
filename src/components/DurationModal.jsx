import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, CheckIcon } from './Icons.jsx';

export const DURATION_PRESETS = [
  { id: '3h', label: 'Demo for 3hr', subtitle: 'Short 3-hour trial demo pass', ms: 3 * 60 * 60 * 1000, days: '0.125' },
  { id: '24h', label: '24 hr Pass', subtitle: '1-Day standard pass', ms: 24 * 60 * 60 * 1000, days: '1' },
  { id: '30d', label: '1 Month Subscription Pass', subtitle: 'Standard ₹200/month plan (30 Days)', ms: 30 * 24 * 60 * 60 * 1000, days: '30' },
  { id: '180d', label: '6 Month Pass', subtitle: 'Half-year pass (180 Days)', ms: 180 * 24 * 60 * 60 * 1000, days: '180' },
  { id: 'perm', label: 'No Limit VIP Pass', subtitle: 'Permanent unlimited streaming pass', ms: null, days: 'permanent' },
  { id: 'custom', label: 'Custom Option', subtitle: 'Set custom number of days', ms: 0, days: 'custom' },
];

export const DurationModal = ({ device, onClose, onApprove, onRevoke, onSaveNote, approvalPatch }) => {
  const dialogRef = useRef(null);
  const [selectedPreset, setSelectedPreset] = useState('30d');
  const [accessMode, setAccessMode] = useState('scheduled');
  const [customDays, setCustomDays] = useState('30');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    const dialog = dialogRef.current || document.getElementById('details');
    if (dialog) dialog.open = false;
    if (onClose) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current || document.getElementById('details');
    if (!dialog) return;

    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; if (onClose) onClose(); };

    if (device) {
      dialog.open = true;
      setNote(device.note || '');
      const noteEl = document.getElementById('device-note');
      if (noteEl) noteEl.value = device.note || '';

      const modeEl = document.getElementById('access-mode');
      if (!device.expiresAt && device.status === 'approved') {
        setSelectedPreset('perm');
        setAccessMode('permanent');
        if (modeEl) modeEl.value = 'permanent';
      } else {
        setSelectedPreset('30d');
        setAccessMode('scheduled');
        setCustomDays('30');
        if (modeEl) modeEl.value = 'scheduled';
      }
    } else {
      dialog.open = false;
    }
  }, [device, onClose]);

  // Mobile back button / keyboard escape
  useEffect(() => {
    if (!device) return;
    const onPop = () => handleClose();
    const onKeyDown = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [device]);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    const modeEl = document.getElementById('access-mode');
    const daysEl = document.getElementById('access-days');
    const fieldEl = document.getElementById('duration-field');

    if (preset.id === 'perm') {
      setAccessMode('permanent');
      if (modeEl) modeEl.value = 'permanent';
      if (fieldEl) fieldEl.hidden = true;
    } else if (preset.id === 'custom') {
      setAccessMode('scheduled');
      if (modeEl) modeEl.value = 'scheduled';
      if (fieldEl) fieldEl.hidden = false;
    } else {
      setAccessMode('scheduled');
      setCustomDays(String(Math.round(Number(preset.days))));
      if (modeEl) modeEl.value = 'scheduled';
      if (daysEl) daysEl.value = String(Math.round(Number(preset.days)));
      if (fieldEl) fieldEl.hidden = true;
    }
  };

  const handleSave = async () => {
    const currentDev = device || (typeof window !== 'undefined' ? window._activeDevice : null);
    if (!currentDev) return;
    setBusy(true);
    setError('');
    try {
      const mode = (typeof document !== 'undefined' && document.getElementById('access-mode')?.value) || accessMode;
      const days = mode === 'permanent' ? undefined : Number((typeof document !== 'undefined' && document.getElementById('access-days')?.value) || customDays) || 30;
      const patch = approvalPatch(mode, days);
      await onApprove(currentDev.deviceId, patch);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to apply access pass.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      id="details"
      ref={dialogRef}
      className="sub-modal"
      open={Boolean(device)}
      style={{ display: device ? 'flex' : 'none' }}
      onClick={(e) => { if (e.target === dialogRef.current) handleClose(); }}
    >
      <div className="sub-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal-header">
          <div>
            <span className="sub-modal-eyebrow">DEVICE AUTHORIZATION</span>
            <h2 id="detail-name" className="sub-modal-title">
              {device ? (device.name || device.deviceId) : 'Device Details'}
            </h2>
          </div>
          <button type="button" className="close-sub-modal-btn" onClick={handleClose} aria-label="Close dialog">
            <CloseIcon size={16} color="#888888" />
          </button>
        </div>

        <div className="sub-modal-body">
          <p className="sub-modal-sub">
            Choose a subscription duration pass for this device. Approvals are bound to the device identity permanently.
          </p>

          <div id="presets-grid" className="duration-presets-grid">
            {DURATION_PRESETS.map(preset => {
              const isTarget = selectedPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`duration-option ${isTarget ? 'active' : ''}`}
                  data-days={preset.days}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div className="duration-info">
                    <strong className="duration-label">{preset.label}</strong>
                    <span className="duration-sub">{preset.subtitle}</span>
                  </div>
                  {isTarget && <CheckIcon size={14} color="#E50914" />}
                </div>
              );
            })}
          </div>

          <div className="access-mode-row" hidden>
            <select
              id="access-mode"
              value={accessMode}
              onChange={(e) => {
                setAccessMode(e.target.value);
                handleSelectPreset(e.target.value === 'permanent' ? DURATION_PRESETS[4] : DURATION_PRESETS[2]);
              }}
            >
              <option value="permanent">Permanent access</option>
              <option value="scheduled">Scheduled access</option>
            </select>
          </div>

          <div
            id="duration-field"
            className="custom-days-box"
            hidden={selectedPreset !== 'custom'}
          >
            <label htmlFor="access-days" className="pin-label">CUSTOM DURATION (DAYS)</label>
            <div className="custom-days-row">
              <input
                id="access-days"
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="custom-days-input"
              />
              <span className="unit-label">Days</span>
            </div>
          </div>

          <div className="note-field-wrap" style={{ marginTop: '12px' }}>
            <label htmlFor="device-note" className="pin-label">PRIVATE NOTE</label>
            <textarea
              id="device-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Private note..."
              className="pin-input"
              style={{ width: '100%', height: '60px', marginTop: '4px' }}
              rows={2}
            />
            <div style={{ marginTop: '6px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const currentDev = device || (typeof window !== 'undefined' ? window._activeDevice : null);
                  const noteVal = (document.getElementById('device-note')?.value !== undefined ? document.getElementById('device-note').value : note) || '';
                  if (currentDev && onSaveNote) {
                    await onSaveNote(currentDev.deviceId, noteVal);
                  }
                }}
              >
                Save note
              </button>
            </div>
          </div>

          {error && <p id="detail-error" className="pin-error">{error}</p>}
        </div>

        <div className="sub-modal-footer">
          <button
            id="revoke"
            type="button"
            className="btn-danger-outline"
            onClick={() => {
              if (device && onRevoke) onRevoke(device.deviceId);
            }}
          >
            Pause access
          </button>
          <button
            id="approve"
            type="button"
            className="btn-primary-red"
            onClick={handleSave}
            disabled={busy}
          >
            <CheckIcon size={14} color="#FFFFFF" />
            <span>Approve device</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
