const {loadFirebaseAdmin}=require('./firebase-admin-client.cjs');
const {createTVAuth,TVAuthError}=require('./tv-auth-model.cjs');
let cached;
async function services() {
  if(cached)return cached;
  const {db,auth}=await loadFirebaseAdmin('meflix-tv');
  if(cached)return cached;
  const store={transaction:callback=>db.runTransaction(tx=>callback({
    get:async(collection,id)=>{const snap=await tx.get(db.collection(collection).doc(id));return snap.exists?snap.data():null;},
    set:(collection,id,data)=>tx.set(db.collection(collection).doc(id),data),
  }))};
  return cached={auth,flow:createTVAuth({store,auth,origin:process.env.MEFLIX_PUBLIC_ORIGIN||'https://meflix-roan.vercel.app'})};
}
async function readBody(req) {
  let body=req.body;
  if(body===undefined){let bytes=0,text='';for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)throw new TVAuthError(413,'invalid_request','Request is too large.');text+=chunk;}body=text;}
  if(Buffer.isBuffer(body))body=body.toString('utf8');
  if(typeof body==='string'){if(Buffer.byteLength(body)>4096)throw new TVAuthError(413,'invalid_request','Request is too large.');try{body=JSON.parse(body);}catch{throw new TVAuthError(400,'invalid_request','Invalid JSON.');}}
  if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>4096)throw new TVAuthError(400,'invalid_request','Invalid request.');
  return body;
}
function createTVHandler(load=services) {
 return async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith('/api/tv/'))return false;
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  try {
    const action=req.query?.action||path.split('/').pop();
    if(!['start','lookup','connect','confirm','poll','approve','ready','connection','cancel','activate','release','device','unpair'].includes(action))throw new TVAuthError(404,'not_found','Not found.');
    if(req.method!=='POST'){res.setHeader('Allow','POST');throw new TVAuthError(405,'invalid_request','Use POST.');}
    if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new TVAuthError(415,'invalid_request','Send JSON.');
    if(req.headers.origin){let host;try{host=new URL(req.headers.origin).host;}catch{throw new TVAuthError(403,'access_denied','Origin denied.');}if(host!==(req.headers['x-forwarded-host']||req.headers.host))throw new TVAuthError(403,'access_denied','Origin denied.');}
    const token=String(req.headers.authorization||'').match(/^Bearer (\S+)$/)?.[1];
    if(!token)throw new TVAuthError(401,'login_required','Sign in to continue.');
    const body=await readBody(req),{auth,flow}=await load();let user;
    try{user=await auth.verifyIdToken(token,true);}catch{throw new TVAuthError(401,'login_required','Your sign-in expired. Sign in again.');}
    const result=await flow[action](user,body);res.statusCode=200;res.end(JSON.stringify(result));
  }catch(error){if(!(error instanceof TVAuthError))console.error('TV API failed',{code:error.code||error.name,message:String(error.message||'Unknown error').slice(0,300)});res.statusCode=error instanceof TVAuthError?error.status:503;res.end(JSON.stringify({error:error instanceof TVAuthError?error.code:'temporarily_unavailable',message:error instanceof TVAuthError?error.message:'TV sign-in is unavailable. Please try again.'}));}
  return true;
 };
}
module.exports={handleTV:createTVHandler(),createTVHandler};
