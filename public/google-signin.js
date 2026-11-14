import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, inMemoryPersistence, setPersistence, signOut } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getFirestore, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const params = new URLSearchParams(location.hash.slice(1));
const sessionId = params.get('session');
const secret = params.get('key');
let returnUrl = '';
try {
  const url=new URL(params.get('returnUrl'));
  if (['exp:','exps:','meflix:'].includes(url.protocol) && !url.username && !url.password) returnUrl=url.href;
} catch {}
history.replaceState(null,'',location.pathname);
const button=document.getElementById('google');
const message=document.getElementById('message');
const error=document.getElementById('error');
const returnLink=document.getElementById('return');
const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const firestore=getFirestore(app);

function showError(text) { error.textContent=text;error.hidden=false; }
function base64(bytes) { return btoa(Array.from(new Uint8Array(bytes),byte=>String.fromCharCode(byte)).join('')); }
if (!/^[a-f0-9]{64}$/.test(sessionId||'') || !/^[a-f0-9]{64}$/.test(secret||'')) {
  showError('Open Google sign-in from your Meflix app.');
} else {
  try { await setPersistence(auth,inMemoryPersistence);button.disabled=false; }
  catch {showError('Could not connect. Please open sign-in again in Meflix.');}
}

button.addEventListener('click',async()=>{
  if (button.disabled) return;
  button.disabled=true;error.hidden=true;
  try {
    const provider=new GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    const result=await signInWithPopup(auth,provider);
    const credential=GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.idToken) throw new Error('Google did not verify this account. Please try again.');
    const keyBytes=Uint8Array.from(secret.match(/../g),pair=>parseInt(pair,16));
    const key=await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt']);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const payload=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(sessionId)},key,new TextEncoder().encode(credential.idToken));
    await updateDoc(doc(firestore,'google_signin_sessions',sessionId),{status:'ready',iv:base64(iv),payload:base64(payload)});
    await signOut(auth);
    button.hidden=true;
    message.textContent='You’re signed in. Return to Meflix to continue. You can also tap Done or close this browser.';
    if (returnUrl) {returnLink.href=returnUrl;returnLink.hidden=false;}
  } catch(cause) {
    button.disabled=false;
    if (cause.code === 'auth/popup-closed-by-user' || cause.code === 'auth/cancelled-popup-request') return;
    const text=cause.code === 'auth/popup-blocked' ? 'Allow pop-ups, then tap Continue with Google again.'
      : cause.code === 'auth/unauthorized-domain' ? 'This sign-in address is not enabled yet. Please contact the administrator.'
        : cause.code === 'permission-denied' || cause.code === 'not-found' ? 'This sign-in expired or was cancelled. Please start again in Meflix.'
          : cause.code ? 'Could not sign in with Google. Please try again.' : cause.message;
    showError(text);
  }
});
