# Cloud Run deployment

This repository's Node server serves the Meflix UI and `/api/netmirror/*` from one Cloud Run service. It uses the same `server.js` and `lib/netmirror-service.js` as local development; no home PC is part of production.

## Deploy from Windows PowerShell

Cloud Run requires a Google Cloud project with billing enabled. A billing account is required even if usage stays within a no-cost quota.

1. Install the Google Cloud CLI, then sign in and select your project. Replace the project ID and region values below. Use a region near the provider/backend.

```powershell
$PROJECT_ID = "YOUR_GOOGLE_CLOUD_PROJECT_ID"
$REGION = "asia-south1"
gcloud auth login
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

2. Create a runtime service account and a Secret Manager secret. This generates the session secret locally and sends it to Secret Manager through stdin; it is not printed or stored in the repository.

```powershell
gcloud iam service-accounts create meflix-runtime --display-name="Meflix Cloud Run runtime"
$RUNTIME_SA = "meflix-runtime@$PROJECT_ID.iam.gserviceaccount.com"
gcloud secrets create meflix-session-secret --replication-policy=automatic
$SESSION_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$SESSION_SECRET | gcloud secrets versions add meflix-session-secret --data-file=-
Remove-Variable SESSION_SECRET
gcloud secrets add-iam-policy-binding meflix-session-secret --member="serviceAccount:$RUNTIME_SA" --role="roles/secretmanager.secretAccessor"
```

3. From this directory (`deploy/meflix`), deploy the service:

```powershell
gcloud run deploy meflix `
  --source . `
  --project $PROJECT_ID `
  --region $REGION `
  --port 8080 `
  --service-account $RUNTIME_SA `
  --allow-unauthenticated `
  --set-env-vars NODE_ENV=production `
  --set-secrets SESSION_SECRET=meflix-session-secret:latest
```

Keep the returned Cloud Run URL for testing. Do not point your production domain to it until the smoke checks below pass.

## Provider authorization and egress

Cloud Run moves the backend into production cloud infrastructure, but does not make it appear to come from a developer's PC. Its default outbound addresses are dynamic. If the provider requires a stable source IP, Google Cloud requires VPC egress through Cloud NAT with a reserved address; that networking has separate charges. If you control the provider, prefer its supported server-to-server authorization for this Cloud Run service. Switching hosts alone does not clear an upstream HTTP 403.

## Smoke checks

After deployment, verify `https://<service-url>/api/health` returns `{"status":"healthy","service":"Meflix",...}` and that `/api/netmirror/health` reports the expected environment. Then test sign-in and playback with an account you are authorized to use.
