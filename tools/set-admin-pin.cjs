#!/usr/bin/env node
const { hashPin, validPin } = require('../lib/admin-auth.cjs');

async function main() {
  const pin = process.argv[2] || process.env.MEFLIX_ADMIN_INITIAL_PIN || '1234';

  if (!validPin(pin)) {
    console.error('Error: PIN must be exactly 4 numeric digits (e.g. 1234).');
    process.exit(1);
  }

  const { salt, pinHash } = await hashPin(pin);
  const now = Date.now();

  const firestoreDocument = {
    pin: pin,
    pinVersion: 1,
    salt: salt,
    pinHash: pinHash,
    changedAt: now,
  };

  console.log('\n======================================================');
  console.log('       MEFLIX ADMIN - FIRESTORE PASSWORD CONFIG       ');
  console.log('======================================================\n');
  console.log(`Configured PIN: ${pin}\n`);
  console.log('You can set or change this password anytime in Firebase Console:');
  console.log('  1. Go to Firebase Console -> Firestore Database');
  console.log('     https://console.firebase.google.com/project/meflix-544c6/firestore');
  console.log('  2. Open (or create) collection: "admin_settings"');
  console.log('  3. Open (or create) document ID: "security"');
  console.log('  4. Set the fields below:\n');
  console.log(JSON.stringify(firestoreDocument, null, 2));
  console.log('\nTip: You can simply change the "pin" field in Firestore anytime');
  console.log('     and your Admin Panel will immediately accept the new PIN!');

  // If service account is available, attempt to write directly to Firestore
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const { initializeApp, cert, getApps } = require('firebase-admin/app');
      const { initializeFirestore } = require('firebase-admin/firestore');
      const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      const projectId = process.env.FIREBASE_PROJECT_ID || credentials.project_id || 'meflix-544c6';
      const app = getApps().find(a => a.name === 'meflix-cli') || initializeApp({ projectId, credential: cert(credentials) }, 'meflix-cli');
      const db = initializeFirestore(app, { preferRest: true });
      await db.doc('admin_settings/security').set(firestoreDocument, { merge: true });
      console.log('\n SUCCESS: Directly updated admin_settings/security in Firestore!');
    } catch (err) {
      console.log('\nNote: Automatic direct write skipped (' + err.message + '). Use Firebase Console to paste the values.');
    }
  }
  console.log('\n======================================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

