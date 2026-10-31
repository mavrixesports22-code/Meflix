if (typeof queueMicrotask === 'undefined') {
  const qm = (fn) => Promise.resolve().then(fn);
  try { window.queueMicrotask = qm; } catch {}
  try { globalThis.queueMicrotask = qm; } catch {}
}

import React from 'react';
import { render } from 'react-dom';
import { initializeApp as _initApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth as _getAuth, signInAnonymously as _signInAnon } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getFirestore as _getFirestore, doc as _doc, getDocFromServer as _getDocFromServer, collection as _collection, onSnapshot as _onSnapshot, updateDoc as _updateDoc, setDoc as _setDoc, deleteDoc as _deleteDoc } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { firebaseConfig as _fbConfig } from './firebase-config.js';
import { AdminApp } from './AdminApp.jsx';

const safeInitApp = typeof initializeApp === 'function' ? initializeApp : (typeof _initApp !== 'undefined' ? _initApp : null);
const safeGetAuth = typeof getAuth === 'function' ? getAuth : (typeof _getAuth !== 'undefined' ? _getAuth : null);
const safeSignInAnon = typeof signInAnonymously === 'function' ? signInAnonymously : (typeof _signInAnon !== 'undefined' ? _signInAnon : null);
const safeGetFirestore = typeof getFirestore === 'function' ? getFirestore : (typeof _getFirestore !== 'undefined' ? _getFirestore : null);
const safeDoc = typeof doc === 'function' ? doc : (typeof _doc !== 'undefined' ? _doc : null);
const safeGetDoc = typeof getDocFromServer === 'function' ? getDocFromServer : (typeof _getDocFromServer !== 'undefined' ? _getDocFromServer : null);
const safeCollection = typeof collection === 'function' ? collection : (typeof _collection !== 'undefined' ? _collection : null);
const safeOnSnapshot = typeof onSnapshot === 'function' ? onSnapshot : (typeof _onSnapshot !== 'undefined' ? _onSnapshot : null);
const safeUpdateDoc = typeof updateDoc === 'function' ? updateDoc : (typeof _updateDoc !== 'undefined' ? _updateDoc : null);
const safeSetDoc = typeof setDoc === 'function' ? setDoc : (typeof _setDoc !== 'undefined' ? _setDoc : null);
const safeDeleteDoc = typeof deleteDoc === 'function' ? deleteDoc : (typeof _deleteDoc !== 'undefined' ? _deleteDoc : null);
const safeFbConfig = typeof firebaseConfig !== 'undefined' ? firebaseConfig : (typeof _fbConfig !== 'undefined' ? _fbConfig : {});

const app = safeInitApp ? safeInitApp(safeFbConfig) : null;
const auth = safeGetAuth ? safeGetAuth(app) : null;
const db = safeGetFirestore ? safeGetFirestore(app) : null;

try {
  if (typeof safeSignInAnon === 'function' && auth) {
    safeSignInAnon(auth).catch(() => {});
  }
} catch {}

const rootElement = document.getElementById('root');
if (rootElement) {
  render(
    <AdminApp
      firebase={{
        app,
        auth,
        db,
        doc: safeDoc,
        getDocFromServer: safeGetDoc,
        collection: safeCollection,
        onSnapshot: safeOnSnapshot,
        updateDoc: safeUpdateDoc,
        setDoc: safeSetDoc,
        deleteDoc: safeDeleteDoc
      }}
    />,
    rootElement
  );
}
