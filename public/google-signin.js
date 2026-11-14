import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
let returnUrl = params.get('returnUrl') || '';
try {
  returnUrl = decodeURIComponent(returnUrl);
} catch {}

function finish(idToken) {
  if (!idToken) return;
  const target = returnUrl || 'meflix://google-auth';
  const sep = target.includes('?') ? '&' : '#';
  window.location.replace(`${target}${sep}idToken=${encodeURIComponent(idToken)}`);
}

const button = document.getElementById('google');
const error = document.getElementById('error');

function showError(msg) {
  if (!error) return;
  error.textContent = msg;
  error.hidden = false;
  if (button) button.disabled = false;
}

// 1. Check if returning from a Google redirect
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.idToken) {
        finish(credential.idToken);
      }
    }
  })
  .catch((err) => {
    showError(err.message || 'Could not complete Google sign-in.');
  });

// 2. Official Google sign-in on button click
button?.addEventListener('click', async () => {
  button.disabled = true;
  if (error) error.hidden = true;

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.idToken) {
      finish(credential.idToken);
    } else {
      throw new Error('Google did not return credentials. Please try again.');
    }
  } catch (cause) {
    if (cause?.code === 'auth/popup-blocked') {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
      return;
    }
    if (cause?.code === 'auth/popup-closed-by-user' || cause?.code === 'auth/cancelled-popup-request') {
      button.disabled = false;
      return;
    }
    showError(cause?.message || 'Google sign-in failed. Please try again.');
  }
});
