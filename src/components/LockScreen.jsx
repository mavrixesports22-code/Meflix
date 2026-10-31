import React, { useState, useEffect } from 'react';
import { ShieldIcon } from './Icons.jsx';

export const LockScreen = ({ hidden = false, onUnlock, db, doc, getDocFromServer, auth, signInWithCustomToken }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const updateDots = (len) => {
    const dots = document.getElementById('pin-dots');
    if (dots) {
      dots.setAttribute('aria-label', `${len} of 4 digits entered`);
      [...dots.children].forEach((dot, i) => {
        if (i < len) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    }
  };

  const handleSubmit = async (pinValue) => {
    const inputEl = document.getElementById('pin');
    const val = pinValue || inputEl?.value || '';
    if (busy || val.length !== 4) {
      return;
    }
    setBusy(true);
    setError('');
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';

    try {
      let loggedIn = false;

      // 1. Try server login if available
      if (typeof fetch === 'function') {
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: val })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.token) {
              if (auth && typeof signInWithCustomToken === 'function') {
                await signInWithCustomToken(auth, data.token);
              }
              loggedIn = true;
            }
          }
        } catch {
          // Server backend unavailable (e.g. no Vercel env), fallback to direct Firestore
        }
      }

      // 2. Direct Firestore fallback
      if (!loggedIn) {
        let targetPin = null;

        // Check app_config/security
        try {
          const snap1 = await getDocFromServer(doc(db, 'app_config', 'security'));
          if (snap1 && (typeof snap1.exists === 'function' ? snap1.exists() : snap1.exists)) {
            const d1 = typeof snap1.data === 'function' ? snap1.data() : (typeof snap1.data === 'object' ? snap1.data : {});
            const dataObj = typeof d1 === 'function' ? d1() : d1;
            targetPin = String(dataObj.pin !== undefined ? dataObj.pin : (dataObj.password !== undefined ? dataObj.password : '')).trim();
          }
        } catch {}

        // Check admin_settings/security
        if (!targetPin) {
          try {
            const snap2 = await getDocFromServer(doc(db, 'admin_settings', 'security'));
            if (snap2 && (typeof snap2.exists === 'function' ? snap2.exists() : snap2.exists)) {
              const d2 = typeof snap2.data === 'function' ? snap2.data() : (typeof snap2.data === 'object' ? snap2.data : {});
              const dataObj = typeof d2 === 'function' ? d2() : d2;
              targetPin = String(dataObj.pin !== undefined ? dataObj.pin : (dataObj.password !== undefined ? dataObj.password : '')).trim();
            }
          } catch {}
        }

        if (!targetPin) targetPin = '1234';

        if (val !== targetPin) {
          throw new Error('Incorrect PIN. Please try again.');
        }
      }

      // Unlock console
      try { sessionStorage.setItem('meflix_admin_auth', 'true'); } catch {}
      setPin('');
      if (inputEl) inputEl.value = '';
      updateDots(0);

      const ws = document.getElementById('workspace');
      if (ws) ws.hidden = false;
      const lk = document.getElementById('lock');
      if (lk) lk.hidden = true;

      onUnlock();
    } catch (err) {
      const msg = err.message || 'Unable to unlock console.';
      setError(msg);
      if (errEl) errEl.textContent = msg;
      setPin('');
      if (inputEl) inputEl.value = '';
      updateDots(0);
    } finally {
      setBusy(false);
    }
  };

  const handleDigit = (digit) => {
    if (busy) return;
    setError('');
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
    const inputEl = document.getElementById('pin');
    const currentVal = inputEl?.value || '';
    const nextPin = (currentVal + digit).slice(0, 4);
    if (inputEl) inputEl.value = nextPin;
    setPin(nextPin);
    updateDots(nextPin.length);
    if (nextPin.length === 4) {
      handleSubmit(nextPin);
    }
  };

  const handleBackspace = () => {
    if (busy) return;
    setError('');
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
    const inputEl = document.getElementById('pin');
    const currentVal = inputEl?.value || '';
    const nextPin = currentVal.slice(0, -1);
    if (inputEl) inputEl.value = nextPin;
    setPin(nextPin);
    updateDots(nextPin.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (hidden || busy || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const inputEl = document.getElementById('pin');
        handleSubmit(inputEl?.value || pin);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, busy, hidden]);

  return (
    <main id="lock" className="pin-lock" hidden={hidden}>
      <div className="privacy-panel">
        <div className="brand-logo-wrap">
          <div className="brand-mark-box">
            <ShieldIcon size={22} color="#FFFFFF" />
          </div>
          <div className="brand-copy">
            <div className="brand-top-row">
              <span className="brand-title">MEFLIX CONSOLE</span>
              <span className="admin-pill">ADMIN</span>
            </div>
            <span className="brand-sub">Device Authorization & Security</span>
          </div>
        </div>

        <h1>Enter privacy password</h1>
        <p className="lock-desc">Enter your 4-digit password to unlock the admin console.</p>

        <form
          id="login-form"
          ref={(form) => {
            if (form && !form._hasNativeSubmit) {
              form._hasNativeSubmit = true;
              form.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputEl = document.getElementById('pin');
                handleSubmit(inputEl?.value || pin);
              });
            }
          }}
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = document.getElementById('pin');
            handleSubmit(inputEl?.value || pin);
          }}
        >
          <input
            id="pin"
            type="password"
            readOnly
            inputMode="numeric"
            pattern="[0-9]{4}"
            minLength={4}
            maxLength={4}
            autoComplete="off"
            aria-label="4-digit admin PIN"
            className="sr-only"
            value={pin}
          />
          <div id="pin-dots" className="pin-dots" aria-label={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map(i => (
              <span key={i} className={i < pin.length ? 'filled' : ''} />
            ))}
          </div>

          <p id="login-error" role="alert" className="pin-error">{error}</p>

          <div id="keypad" className="keypad" aria-label="Numeric keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                type="button"
                data-digit={d}
                disabled={busy}
                onClick={() => handleDigit(d)}
              >
                {d}
              </button>
            ))}
            <span aria-hidden="true" />
            <button
              type="button"
              data-digit="0"
              disabled={busy}
              onClick={() => handleDigit('0')}
            >
              0
            </button>
            <button
              id="backspace"
              type="button"
              className="backspace"
              aria-label="Backspace"
              disabled={busy}
              onClick={handleBackspace}
            >
              ⌫
            </button>
          </div>

          <button id="sign-in" type="submit" className="sr-only" tabIndex={-1} disabled={busy}>
            Unlock console
          </button>
        </form>
      </div>
    </main>
  );
};
