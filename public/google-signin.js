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

// Parse query params and hash
const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
let returnUrl = params.get('returnUrl') || '';
try {
  returnUrl = decodeURIComponent(returnUrl);
} catch {}

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
    sessionStorage.removeItem('meflix_redirecting');
    localStorage.removeItem('meflix_redirecting');
  } catch {}
  updateStatus('Completing sign-in...');
  const target = returnUrl || 'meflix://google-auth';
  const sep = target.includes('#') ? '&' : (target.includes('?') ? '&' : '#');
  window.location.replace(`${target}${sep}idToken=${encodeURIComponent(idToken)}&id_token=${encodeURIComponent(idToken)}`);
}

async function handlePopupSignIn() {
  if (button) button.disabled = true;
  if (errorElem) errorElem.hidden = true;
  updateStatus('Connecting to Google...');
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken =
      credential?.idToken ||
      result?._tokenResponse?.oauthIdToken ||
      result?._tokenResponse?.idToken;
    if (idToken) {
      finish(idToken);
    } else {
      throw new Error('Google did not return credentials. Please try again.');
    }
  } catch (err) {
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      if (button) button.disabled = false;
      return;
    }
    showFallback(err.message || 'Google sign-in failed. Please try again.');
  }
}

// Fallback button click uses signInWithPopup (reliable on mobile)
button?.addEventListener('click', handlePopupSignIn);

// Main execution
async function main() {
  let wasRedirecting = false;
  try {
    wasRedirecting =
      sessionStorage.getItem('meflix_redirecting') === '1' ||
      localStorage.getItem('meflix_redirecting') === '1';
  } catch {}

  // Reveal fallback button after 3.5s if redirect hasn't completed or navigated
  const fallbackTimer = setTimeout(() => {
    showFallback();
  }, 3500);

  if (wasRedirecting) {
    // Returning from Google redirect: process redirect credentials
    updateStatus('Completing sign-in...');
    try {
      const result = await getRedirectResult(auth);
      clearTimeout(fallbackTimer);
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
      try {
        sessionStorage.removeItem('meflix_redirecting');
        localStorage.removeItem('meflix_redirecting');
      } catch {}
      showFallback('Sign-in cancelled. Tap below to continue.');
    } catch (err) {
      clearTimeout(fallbackTimer);
      try {
        sessionStorage.removeItem('meflix_redirecting');
        localStorage.removeItem('meflix_redirecting');
      } catch {}
      showFallback(err.message || 'Google sign-in failed. Please try again.');
    }
    return;
  }

  // Fresh visit: DO NOT wait for getRedirectResult (which can hang on mobile)
  // Immediately start redirect to Google
  try {
    sessionStorage.setItem('meflix_redirecting', '1');
    localStorage.setItem('meflix_redirecting', '1');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  } catch (err) {
    clearTimeout(fallbackTimer);
    try {
      sessionStorage.removeItem('meflix_redirecting');
      localStorage.removeItem('meflix_redirecting');
    } catch {}
    showFallback(err.message || 'Could not start Google sign-in.');
  }
}

main();
