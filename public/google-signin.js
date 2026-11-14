import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Parse query params and hash
const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
let returnUrl = params.get('returnUrl') || '';
try {
  returnUrl = decodeURIComponent(returnUrl);
} catch {}

const nonce = params.get('nonce') || '';

// Persist or restore returnUrl
if (returnUrl) {
  try {
    sessionStorage.setItem('meflix_return_url', returnUrl);
    localStorage.setItem('meflix_return_url', returnUrl);
  } catch {}
} else {
  try {
    returnUrl = sessionStorage.getItem('meflix_return_url') || localStorage.getItem('meflix_return_url') || '';
  } catch {}
}

const loader = document.getElementById('loader');
const statusElem = document.getElementById('status');
const fallback = document.getElementById('fallback');
const button = document.getElementById('google');
const errorElem = document.getElementById('error');

function updateStatus(text) {
  if (statusElem) statusElem.textContent = text;
}

function showFallback(message) {
  if (loader) loader.hidden = true;
  if (fallback) fallback.hidden = false;
  if (button) button.disabled = false;
  if (message && errorElem) {
    errorElem.textContent = message;
    errorElem.hidden = false;
  }
}

function finish(idToken) {
  if (!idToken) return;
  try {
    sessionStorage.removeItem('meflix_auth_attempted');
    sessionStorage.removeItem('meflix_last_nonce');
    localStorage.removeItem('meflix_auth_attempted');
    localStorage.removeItem('meflix_last_nonce');
  } catch {}
  updateStatus('Completing sign-in...');
  const target = returnUrl || 'meflix://google-auth';
  const sep = target.includes('#') ? '&' : (target.includes('?') ? '&' : '#');
  window.location.replace(`${target}${sep}idToken=${encodeURIComponent(idToken)}&id_token=${encodeURIComponent(idToken)}`);
}

async function startGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    sessionStorage.setItem('meflix_auth_attempted', '1');
    localStorage.setItem('meflix_auth_attempted', '1');
    if (nonce) {
      sessionStorage.setItem('meflix_last_nonce', nonce);
      localStorage.setItem('meflix_last_nonce', nonce);
    }
  } catch {}
  await signInWithRedirect(auth, provider);
}

// User clicked fallback button manually to retry
button?.addEventListener('click', async () => {
  button.disabled = true;
  if (errorElem) errorElem.hidden = true;
  if (fallback) fallback.hidden = true;
  if (loader) loader.hidden = false;
  updateStatus('Connecting to Google...');
  try {
    await startGoogleRedirect();
  } catch (err) {
    showFallback(err.message || 'Could not redirect to Google.');
  }
});

// Main execution flow
async function main() {
  // 1. First, check if returning from a successful Google redirect
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken =
        credential?.idToken ||
        result?._tokenResponse?.oauthIdToken ||
        result?._tokenResponse?.idToken;
      if (idToken) {
        finish(idToken);
        return;
      }
    }
  } catch (err) {
    showFallback(err.message || 'Google sign-in failed. Please try again.');
    return;
  }

  // 2. Check if we already attempted redirect for this nonce/session
  let alreadyAttempted = false;
  try {
    const lastNonce = sessionStorage.getItem('meflix_last_nonce') || localStorage.getItem('meflix_last_nonce');
    const wasAttempted =
      sessionStorage.getItem('meflix_auth_attempted') === '1' ||
      localStorage.getItem('meflix_auth_attempted') === '1';
    if (nonce && lastNonce === nonce && wasAttempted) {
      alreadyAttempted = true;
    }
  } catch {}

  if (alreadyAttempted) {
    // Redirect completed or user backed out with null result: show retry button
    try {
      sessionStorage.removeItem('meflix_auth_attempted');
      localStorage.removeItem('meflix_auth_attempted');
    } catch {}
    showFallback('Sign-in was cancelled or delayed.');
    return;
  }

  // 3. Fresh session: automatically launch Google sign-in immediately (One-Tap!)
  try {
    updateStatus('Connecting to Google...');
    await startGoogleRedirect();
  } catch (err) {
    showFallback(err.message || 'Could not start Google sign-in.');
  }
}

main();
