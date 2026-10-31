# Cloud Run

Build with the supplied Dockerfile using Node 24. Supply `FIREBASE_PROJECT_ID`, server credentials through the runtime service identity/ADC, and a private four-digit `MEFLIX_ADMIN_INITIAL_PIN` for first setup. The service account needs Firestore access, Firebase Authentication token verification/user administration, and permission to sign Firebase custom tokens (a private service-account credential or an appropriate IAM signing setup). The container listens on `PORT`, default 8080.

Never put service-account keys or PINs in a Docker image or Git. Follow README migration/Firestore-rules steps before replacing the old app rollout. Public clients receive only static console assets and authenticated Firebase tokens, never the private PIN hash or server credential.
