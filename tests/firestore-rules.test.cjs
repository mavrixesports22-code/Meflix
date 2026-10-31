const {test}=require('node:test');const assert=require('node:assert/strict');
const active=!!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const project='demo-meflix-admin';
const{initializeApp}=require('firebase-admin/app');const{getAuth}=require('firebase-admin/auth');
async function adminIdentity(){const app=initializeApp({projectId:project},'rules-test');const token=await getAuth(app).createCustomToken('meflix-admin-console',{admin:true,pinVersion:1});const res=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,returnSecureToken:true})});const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return{uid:data.localId,token:data.idToken};}
function value(x){if(x===null)return {nullValue:null};if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};if(typeof x==='boolean')return{booleanValue:x};if(typeof x==='number')return{integerValue:String(x)};if(typeof x==='object')return{mapValue:{fields:fields(x)}};return{stringValue:String(x)};}
function fields(x){return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]));}
async function signup(email){const res=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true,...(email?{email,password:'EmulatorOnly-Test-Password!42'}:{})})});const json=await res.json();assert.equal(res.status,200,JSON.stringify(json));return{uid:json.localId,token:json.idToken};}
async function request(path,token,method='GET',body){return fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify({fields:fields(body)})}:{})});}
test('Firestore enforces admin role, device ownership, permanent approval and revocation',{skip:!active},async()=>{
 const device=await signup(),other=await signup(),admin=await adminIdentity(),outsider=await signup(`user-${Date.now()}@example.test`);
 const data={deviceId:device.uid,ownerUid:device.uid,name:'Test TV',ip:'',platform:'Fire TV',requestedAt:1,status:'pending'};
 assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',data)).status,200);
 assert.equal((await request(`device_requests/${device.uid}`,device.token)).status,200);
 assert.equal((await request(`device_requests/${device.uid}`,other.token)).status,403);
 assert.equal((await request('device_requests',device.token)).status,403);
 assert.equal((await request('admin_settings/security',device.token)).status,403);
 assert.equal((await request('admin_settings/security',device.token,'PATCH',{pinVersion:1})).status,403);
 assert.equal((await request(`admins/${device.uid}`,device.token,'PATCH',{enabled:true})).status,403);
 assert.equal((await request(`device_requests/${device.uid}`,device.token,'PATCH',{...data,status:'approved',expiresAt:null})).status,403);
 assert.equal((await request('device_requests',outsider.token)).status,403);
 assert.equal((await request('admin_settings/security','owner','PATCH',{pinVersion:1})).status,200);
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
 assert.equal((await request('admin_settings/security','owner','PATCH',{pinVersion:2})).status,200);
 assert.equal((await request('device_requests',admin.token)).status,403);
});
