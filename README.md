# Meflix Admin

A separate administration console for Meflix. This repository now serves the admin console only; the movie catalog/player and proxy endpoints have been removed.

## Simple PIN access

The entry screen follows the supplied reference: black background, four dots, a circular numeric keypad and backspace. Enter four digits to unlock automatically. There is **no email sign-in, failed-attempt cooldown, attempt lockout or idle auto-lock**. Sessions persist until you choose Lock or the PIN changes. PINs are verified on the server against a salted scrypt hash stored in Firestore, not compared with a public browser value.

The dashboard includes device search, watching/pending/approved/paused/expired filters, permanent approval by default, optional scheduled access, private notes, viewing activity, CSV export, app release settings and PIN changes.

## Run locally

Use Node 22 or later. Run `npm ci`, set the server environment variables below, then `npm start`. The default local URL is http://localhost:5173. `npm run build` prepares the static assets in `dist`; the Node API must also run for PIN verification.

## Firebase / Vercel setup

1. In Firebase Authentication, enable **Anonymous** sign-in for app device identities. The admin does not need an email/password account or an `admins/<UID>` allowlist entry.
2. In the hosting provider's private server environment, set `FIREBASE_PROJECT_ID=meflix-544c6` and `FIREBASE_SERVICE_ACCOUNT_JSON` to a Firebase Admin service account JSON credential for this project. On a Google-managed runtime, Application Default Credentials can be used instead. Keep this credential out of Git, browser code and chat.
3. Set `MEFLIX_ADMIN_INITIAL_PIN` privately to your chosen **four digits**. No PIN is hardcoded or supplied by this repository. The first successful setup creates `admin_settings/security` with a salted hash. After initialization you can remove the initial-PIN environment variable; Firebase retains the current PIN.
4. Deploy the updated native app together with `firestore.rules`. Publish rules using `firebase deploy --only firestore:rules --project meflix-544c6` **after coordinating the migration** below. The PIN API uses a Firebase custom token; Firestore rules verify its admin claim and current PIN version.
5. Import this repo in Vercel or keep its existing integration. Its build is `npm run build`, output is `dist`, and `/api/admin/[action].js` supplies the PIN API. Configure the same server variables for every deployed environment that should work. Deploy on HTTPS.

Open **Security → Change admin PIN** in the console whenever you want to change the PIN. It updates Firebase and invalidates old console sessions; existing approved app devices are unaffected. If you lose the PIN, use your trusted server/Firebase credentials to reset the private security record and reinitialize it with a new private initial PIN. Public clients cannot read or edit that security record.

## Device access: approve once

The updated native app uses a persisted Firebase anonymous identity for each installation. The document ID and `ownerUid` are that identity. IP addresses neither grant nor revoke access. Reopening the app, restarting the device, updating the signed APK, or changing Wi-Fi does not create another request. A repeat request cannot replace an existing approval with pending.

Permanent approval stores `expiresAt: null`; access remains until you pause or delete the device. Optional dated passes remain available. Online revocations are observed through Firestore. An offline device can keep its last verified approval until it reconnects, so immediate offline revocation is not claimed.

Clearing app data/uninstalling can remove the identity and require a new approval. A software installation identity is not a hardware serial number and cannot promise persistence through a factory reset.

### One-time migration from the old app

Older records used locally generated IDs and IP whitelists without authenticated ownership. The new app preserves its previous ID as `legacyDeviceId` on its new request so you can match it, but does not automatically claim another record's approval. Approve the new device once, then retire its legacy record. Existing legacy documents remain visible for review; they cannot be approved through the new console until they have an authenticated owner. Do not delete old approvals or publish new rules before the updated app and console are ready.

The old in-app/TV admin screen and local PIN self-approval path have been removed. Client-side IP whitelist grants are disabled in the new rules.

## Verification

`npm test` runs PIN/server/model/DOM interaction tests; the rule test skips when emulators are absent. Run all tests, including real Firestore authorization rules, with:

```
firebase emulators:exec --only "auth,firestore" --project demo-meflix-admin "npm test"
```

The `demo-` project and local emulators isolate these tests from production data. Tests cover incorrect-PIN immediate retry, PIN changes, session invalidation, device ownership, self-approval denial, legacy/IP denial, app-update metadata, UI actions and CSV formula escaping. Browser control was unavailable for a complete visual pass in this environment; DOM interaction tests do not establish pixel-perfect rendering.

There are no secrets in the public Firebase client configuration. `FIREBASE_SERVICE_ACCOUNT_JSON` and the initial PIN must remain server-only.
