const sa = require('C:/Users/ASUS/Downloads/meflix-544c6-firebase-adminsdk-fbsvc-9994c4a6d7.json');
const { GoogleAuth } = require('google-auth-library');

async function getRules() {
  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
  });
  const client = await auth.getClient();
  const url = `https://firebaserules.googleapis.com/v1/projects/meflix-544c6/releases`;
  const res = await client.request({ url });
  console.log('Releases:', JSON.stringify(res.data, null, 2));

  // Find the release for firestore
  const fsRelease = res.data.releases?.find(r => r.name.includes('firestore'));
  if (fsRelease) {
    const rulesetName = fsRelease.rulesetName;
    console.log('Ruleset name:', rulesetName);
    const rsRes = await client.request({ url: `https://firebaserules.googleapis.com/v1/${rulesetName}` });
    console.log('Rules source:\n', rsRes.data.source.files[0].content);
  }
}

getRules().catch(console.error);

