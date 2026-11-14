const {test}=require('node:test');const assert=require('node:assert/strict');
const active=!!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const project='demo-meflix-admin';
const{initializeApp}=require('firebase-admin/app');const{getAuth}=require('firebase-admin/auth');
async function adminIdentity(){const app=initializeApp({projectId:project},'rules-test');const token=await getAuth(app).createCustomToken('meflix-admin-console',{admin:true,pinVersion:1});const res=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,returnSecureToken:true})});const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return{uid:data.localId,token:data.idToken};}
function value(x){if(x===null)return {nullValue:null};if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};if(typeof x==='boolean')return{booleanValue:x};if(typeof x==='number')return{integerValue:String(x)};if(typeof x==='object')return{mapValue:{fields:fields(x)}};return{stringValue:String(x)};}
function fields(x){return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]));}
async function signup(email){const res=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true,...(email?{email,password:'EmulatorOnly-Test-Password!42'}:{})})});const json=await res.json();assert.equal(res.status,200,JSON.stringify(json));return{uid:json.localId,token:json.idToken};}
async function request(path,token,method='GET',body){return fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify({fields:fields(body)})}:{})});}

async function googleUser() {
 const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const idToken=b64({alg:'none',typ:'JWT'})+'.'+b64({iss:'https://accounts.google.com',aud:'demo-client',sub:'google-'+Date.now(),email:'google@example.test',email_verified:true,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600})+'.';
 const res=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postBody:new URLSearchParams({id_token:idToken,providerId:'google.com'}).toString(),requestUri:'http://localhost',returnSecureToken:true})});
 const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return {uid:data.localId,token:data.idToken};
}

test('Expo Go Google handoff limits reads, requires Google, expires and cannot be replayed',{skip:!active},async()=>{
 const owner=await signup(),other=await signup(),google=await googleUser();
 const id='a'.repeat(64),name=`projects/${project}/databases/(default)/documents/google_signin_sessions/${id}`;
 const created=await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents:commit`,{method:'POST',headers:{Authorization:`Bearer ${owner.token}`,'Content-Type':'application/json'},body:JSON.stringify({writes:[{update:{name,fields:fields({ownerUid:owner.uid,status:'pending'})},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]}]})});
 assert.equal(created.status,200,await created.text());
 assert.equal((await request(`google_signin_sessions/${id}`,owner.token)).status,200);
 assert.equal((await request(`google_signin_sessions/${id}`,google.token)).status,403);
 assert.equal((await request('google_signin_sessions',owner.token)).status,403);
 const write=async(token,patch)=>fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents/google_signin_sessions/${id}?updateMask.fieldPaths=status&updateMask.fieldPaths=iv&updateMask.fieldPaths=payload`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({fields:fields(patch)})});
 const payload={status:'ready',iv:'a'.repeat(16),payload:'b'.repeat(200)};
 assert.equal((await write(other.token,payload)).status,403);
 assert.equal((await write(google.token,payload)).status,200);
 assert.equal((await write(google.token,payload)).status,403);
 assert.equal((await request(`google_signin_sessions/${id}`,other.token,'DELETE')).status,403);
 assert.equal((await request(`google_signin_sessions/${id}`,owner.token,'DELETE')).status,200);
 // Admin seed only: validate that an expired session cannot receive a browser result.
 await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents/google_signin_sessions/${id}`,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{...fields({ownerUid:owner.uid,status:'pending'}),createdAt:{timestampValue:'2020-01-01T00:00:00Z'}}})});
 assert.equal((await write(google.token,payload)).status,403);
});

test('guest and account requests accept contact email but cannot grant themselves access',{skip:!active},async()=>{
 for(const method of ['guest','password','google']) {
  const device=await signup();const data={deviceId:device.uid,ownerUid:device.uid,name:'Viewer',email:'viewer@example.test',signInMethod:method,ip:'',platform:'Android',requestedAt:1,status:'pending'};
  assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',data)).status,200);
  assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',{...data,status:'approved'})).status,403);
 }
 const device=await signup();const data={deviceId:device.uid,ownerUid:device.uid,name:'Viewer',email:'invalid',signInMethod:'guest',ip:'',platform:'Android',requestedAt:1,status:'pending'};
 assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',data)).status,403);
});
test('Firestore enforces admin role, device ownership, permanent approval and revocation',{skip:!active},async()=>{
 const device=await signup(),other=await signup(),admin=await adminIdentity(),outsider=await signup(`user-${Date.now()}@example.test`);
 const data={deviceId:device.uid,ownerUid:device.uid,name:'Test TV',ip:'',platform:'Fire TV',requestedAt:1,status:'pending'};
 assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',data)).status,200);
 assert.equal((await request(`device_requests/${device.uid}`,device.token)).status,200);
 assert.equal((await request(`device_requests/${device.uid}`,other.token)).status,403);
 assert.equal((await request('device_requests',device.token)).status,403);
 assert.equal((await request('app_config/security',device.token)).status,403);
 assert.equal((await request('app_config/security',device.token,'PATCH',{pinVersion:1})).status,403);
 assert.equal((await request(`admins/${device.uid}`,device.token,'PATCH',{enabled:true})).status,403);
 assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',{...data,status:'approved',expiresAt:null})).status,403);
 assert.equal((await request('device_requests',outsider.token)).status,403);
 assert.equal((await request('app_config/security','owner','PATCH',{pinVersion:1})).status,200);
 assert.equal((await request('device_requests',admin.token)).status,200);
 assert.equal((await request('app_config/version_tv',admin.token,'PATCH',{versionName:'1.5.0',versionCode:9,apkUrl:'https://example.test/update.apk'})).status,200);
 assert.equal((await request('app_config/version_tv',device.token)).status,200);
 assert.equal((await request('app_config/version_tv',device.token,'PATCH',{versionCode:100})).status,403);
 assert.equal((await request(`device_requests/${device.uid}`,admin.token,'PATCH',{...data,status:'approved',accessMode:'permanent',approvedAt:2,expiresAt:null})).status,200);
 const permanent=await(await request(`device_requests/${device.uid}`,device.token)).json();assert.equal(permanent.fields.expiresAt.nullValue,null);
 assert.equal((await request(`device_requests/${device.uid}`,admin.token,'PATCH',{...data,ownerUid:other.uid,status:'approved'})).status,403);
 assert.equal((await request(`device_requests/${device.uid}`,admin.token,'PATCH',{...data,status:'rejected',revokedAt:3})).status,200);
 assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',{...data,status:'approved'})).status,403);
 assert.equal((await request('whitelisted_ips/test',device.token)).status,403);
 assert.equal((await request('app_config/security','owner','PATCH',{pinVersion:2})).status,200);
 assert.equal((await request('device_requests',admin.token)).status,403);
});
