import React, { useEffect, useRef } from 'react';
import { CloseIcon, PlayIcon } from './Icons.jsx';

export const HistoryModal = ({ device, onClose, relativeTime }) => {
  const dialogRef = useRef(null);

  const handleClose = () => {
    const dialog = dialogRef.current || document.getElementById('history-modal');
    if (dialog) dialog.open = false;
    if (onClose) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current || document.getElementById('history-modal');
    if (!dialog) return;
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; if (onClose) onClose(); };
    dialog.open = Boolean(device);
  }, [device, onClose]);

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

  const history = (device && Array.isArray(device.watchHistory)) ? device.watchHistory : [];

  return (
    <dialog
      id="history-modal"
      ref={dialogRef}
      className="sub-modal"
      open={Boolean(device)}
      style={{ display: device ? 'flex' : 'none' }}
      onClick={(e) => { if (e.target === dialogRef.current) handleClose(); }}
    >
      <div className="sub-modal-card history-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal-header">
          <div>
            <span className="sub-modal-eyebrow">VIEWING ACTIVITY</span>
            <h2 id="history-device-name" className="sub-modal-title">
              {device ? (device.name || device.deviceId) : 'Watch History'}
            </h2>
          </div>
          <button type="button" className="close-sub-modal-btn" onClick={handleClose} aria-label="Close history">
            <CloseIcon size={16} color="#888888" />
          </button>
        </div>

        <div id="history-list" className="history-list">
          {history.length === 0 ? (
            <p className="empty-state">No viewing history recorded for this device.</p>
          ) : (
            history.map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="history-row">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="history-thumb" />
                ) : (
                  <div className="history-thumb-placeholder">
                    <PlayIcon size={14} color="#666666" />
                  </div>
                )}
                <div className="history-info">
                  <span className="history-title">{item.title || 'Untitled'}</span>
                  {item.episode && <span className="history-ep">{item.episode}</span>}
                  <div className="history-progress-meta">
                    <span className="history-progress-pct">Progress: {item.progress || 0}%</span>
                    {item.updatedAt && (
                      <span className="history-date">{relativeTime(item.updatedAt)}</span>
                    )}
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, Math.max(5, item.progress || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="history-footer">
          <span id="history-count-text">
            {history.length} title{history.length === 1 ? '' : 's'} recorded
          </span>
          <button type="button" className="btn-secondary-dark" onClick={handleClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
};
