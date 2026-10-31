const {initializeApp,getApps,cert,applicationDefault}=require('firebase-admin/app');const{getAuth}=require('firebase-admin/auth');const{initializeFirestore}=require('firebase-admin/firestore');const{createAdminAuth,AccessError}=require('./admin-auth.cjs');
let services;
function backend(){
 if(services)return services;
 try{
  const credentials=process.env.FIREBASE_SERVICE_ACCOUNT_JSON?JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON):null;
  const projectId=process.env.FIREBASE_PROJECT_ID||credentials?.project_id||'meflix-544c6';
  const app=getApps().find(a=>a.name==='meflix-console')||initializeApp({projectId,credential:credentials?cert(credentials):applicationDefault()},'meflix-console');
  const db=initializeFirestore(app,{preferRest:true});const auth=getAuth(app),ref=db.doc('admin_settings/security');
  const store={
   read:async()=>{const snap=await ref.get();return snap.exists?snap.data():null;},
   transaction:callback=>db.runTransaction(async tx=>{const snap=await tx.get(ref);const result=await callback(snap.exists?snap.data():null);tx.set(ref,result);return result;}),
   issueToken:(uid,claims)=>auth.createCustomToken(uid,claims),verifyToken:token=>auth.verifyIdToken(token,true),revokeTokens:uid=>auth.revokeRefreshTokens(uid),
  };
  services=createAdminAuth(store,{initialPin:process.env.MEFLIX_ADMIN_INITIAL_PIN});return services;
 }catch{throw new AccessError(503,'Firebase server configuration is required.');}
}
async function jsonBody(req){let bytes=0,body='';for await(const chunk of req){bytes+=chunk.length;if(bytes>2048)throw new AccessError(413,'Request is too large.');body+=chunk;}try{return JSON.parse(body);}catch{throw new AccessError(400,'Invalid request.');}}
async function handleAdmin(req,res){
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(!pathname.startsWith('/api/admin/'))return false;
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const action=pathname.split('/').pop();
 try{
  const allowed=action==='session'?'GET':'POST';if(!['login','pin','session'].includes(action))throw new AccessError(404,'Not found.');
  if(req.method!==allowed){res.setHeader('Allow',allowed);throw new AccessError(405,'Method not allowed.');}
  const origin=req.headers.origin;
  if(origin){let host;try{host=new URL(origin).host;}catch{throw new AccessError(403,'Origin denied.');}if(host!==req.headers.host)throw new AccessError(403,'Origin denied.');}
  const token=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(action!=='login'&&!token)throw new AccessError(401,'Enter your PIN to continue.');
  if(action!=='session'&&!String(req.headers['content-type']||'').startsWith('application/json'))throw new AccessError(415,'Send a JSON request.');
  const body=action==='session'?{}:await jsonBody(req);const service=backend();
  const data=action==='login'?await service.login(body.pin):action==='pin'?await service.changePin(token,body.currentPin,body.newPin):await service.session(token);
  res.writeHead(200);res.end(JSON.stringify(data));
 }catch(error){const status=error.status||((error.code||'').startsWith('auth/')?401:503);res.writeHead(status);res.end(JSON.stringify({error:error.status?error.message:status===401?'Console session expired. Enter your PIN again.':'Admin service is unavailable. Check the Firebase server configuration.'}));}
 return true;
}
module.exports={handleAdmin};
