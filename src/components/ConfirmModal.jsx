import React, { useEffect, useRef } from 'react';
import { CloseIcon, TrashIcon } from './Icons.jsx';

export const ConfirmModal = ({ title, message, onCancel, onConfirm }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current || document.getElementById('confirm');
    if (!dialog) return;
    const handleNativeClose = () => {
      if (onCancel) onCancel();
    };
    dialog.addEventListener('close', handleNativeClose);
    return () => dialog.removeEventListener('close', handleNativeClose);
  }, [onCancel]);

  return (
    <dialog
      id="confirm"
      ref={dialogRef}
      className="sub-modal"
      open={Boolean(title)}
      style={{ display: title ? 'flex' : 'none' }}
    >
      <div className="sub-modal-card" style={{ maxWidth: '380px' }}>
        <div className="sub-modal-header">
          <h2 id="confirm-title" className="sub-modal-title">{title || 'Confirm Action'}</h2>
          <button type="button" className="close-sub-modal-btn" onClick={onCancel} aria-label="Cancel">
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
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            id="accept-confirm"
            type="button"
            className="btn-danger-red"
            onClick={onConfirm}
          >
            <TrashIcon size={13} color="#FFFFFF" />
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
