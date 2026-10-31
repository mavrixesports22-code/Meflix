import React, { useEffect, useRef } from 'react';
import { CloseIcon, TrashIcon } from './Icons.jsx';

export const ConfirmModal = ({ title, message, onCancel, onConfirm }) => {
  const dialogRef = useRef(null);

  const handleClose = () => {
    const dialog = dialogRef.current || document.getElementById('confirm');
    if (dialog) dialog.open = false;
    if (onCancel) onCancel();
  };

  const handleConfirmAction = async () => {
    const dialog = dialogRef.current || document.getElementById('confirm');
    if (dialog) dialog.open = false;
    if (onConfirm) await onConfirm();
  };

  useEffect(() => {
    const dialog = dialogRef.current || document.getElementById('confirm');
    if (!dialog) return;
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; if (onCancel) onCancel(); };
    dialog.open = Boolean(title);
  }, [title, onCancel]);

  useEffect(() => {
    if (!title) return;
    const onPop = () => handleClose();
    const onKeyDown = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [title]);

  return (
    <dialog
      id="confirm"
      ref={dialogRef}
      className="sub-modal"
      open={Boolean(title)}
      style={{ display: title ? 'flex' : 'none' }}
      onClick={(e) => { if (e.target === dialogRef.current) handleClose(); }}
    >
      <div className="sub-modal-card" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal-header">
          <h2 id="confirm-title" className="sub-modal-title">{title}</h2>
          <button type="button" className="close-sub-modal-btn" onClick={handleClose} aria-label="Cancel">
            <CloseIcon size={16} color="#888888" />
          </button>
        </div>

        <div className="sub-modal-body">
          <p id="confirm-message" className="sub-modal-sub" style={{ marginTop: '8px' }}>
            {message}
          </p>
        </div>

        <div className="sub-modal-actions" style={{ marginTop: '20px' }}>
          <button
            id="cancel-confirm"
            type="button"
            className="btn-secondary-dark"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            id="accept-confirm"
            type="button"
            className="btn-danger-red"
            onClick={handleConfirmAction}
          >
            <TrashIcon size={13} color="#FFFFFF" />
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
