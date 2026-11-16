const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { initializeFirestore } = require('firebase-admin/firestore');

const clients = new Map();

function loadFirebaseAdmin(name) {
  if (clients.has(name)) return clients.get(name);
  const client = (async () => {
    try {
      const existing = getApps().find(app => app.name === name);
      const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : null;
      const credential = existing?.options.credential || (account ? cert(account) : applicationDefault());
      // Resolve credentials before Firestore starts any background RPC clients.
      await credential.getAccessToken();
      const app = existing || initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || account?.project_id || 'meflix-544c6',
        credential,
      }, name);
      return { db: initializeFirestore(app, { preferRest: true }), auth: getAuth(app) };
    } catch {
      const error = new Error('Firebase server credentials are unavailable. Configure FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS and restart the server.');
      error.code = 'firebase/configuration-unavailable';
      throw error;
    }
  })();
  clients.set(name, client);
  void client.catch(() => clients.delete(name));
  return client;
}

module.exports = { loadFirebaseAdmin };
