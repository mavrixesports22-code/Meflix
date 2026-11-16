const { randomBytes, createHash } = require('node:crypto');
const TTL = 10 * 60 * 1000;
const INTERVAL = 3;
const hash = value => createHash('sha256').update(value).digest('hex');
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class TVAuthError extends Error {
  constructor(status, code, message) { super(message); this.status=status; this.code=code; }
}
const fail=(status,code,message)=>{throw new TVAuthError(status,code,message);};
function installation(value) {
  if(typeof value!=='string'||!/^[a-f0-9-]{32,64}$/.test(value))fail(400,'invalid_request','Invalid TV installation.');
  return value;
}
function codeOf(value) {
  const code=String(value||'').toUpperCase().replace(/[\s-]/g,'');
  if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))fail(400,'invalid_code','Enter the 8-character code shown on your TV.');
  return code;
}
function deviceKey(value) {
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(value))fail(400,'invalid_request','Invalid TV sign-in request.');
  return hash(value);
}
function account(user,now) {
  if(!user.email||!['google.com','password'].includes(user.firebase?.sign_in_provider)||user.admin===true)fail(403,'login_required','Sign in to your Meflix account first.');
}
function access(request,now) {
  if(!request)return'pending';
  return request.status==='approved'&&request.expiresAt&&request.expiresAt<=now?'rejected':request.status;
}

function createTVAuth({store,auth,now=Date.now,origin='https://meflix-roan.vercel.app'}) {
  async function budget(tx,kind,uid,max) {
    const key=hash(kind+':'+uid),old=await tx.get('tv_rate_limits',key),time=now();
    const value=!old||time-old.windowAt>=60000?{windowAt:time,count:1}:{...old,count:old.count+1};
    if(value.count>max)fail(429,'slow_down','Too many attempts. Wait a minute and try again.');
    return()=>tx.set('tv_rate_limits',key,value);
  }
  async function limit(kind,uid,max) {
    await store.transaction(async tx=>{const apply=await budget(tx,kind,uid,max);apply();});
  }
  function valid(session,allowConsumed=false) {
    if(!session||session.expiresAt<=now())fail(410,'expired_token','This TV code has expired. Generate a new code on the TV.');
    if(session.status==='cancelled')fail(403,'access_denied',session.declinedAt?'Pairing was declined on your TV.':'This TV sign-in was cancelled.');
    if(session.status==='consumed'&&!allowConsumed)fail(409,'already_used','This TV code has already been used. Generate a new code.');
  }
  async function profile(user) {
    account(user,now());
    const person=await auth.getUser(user.uid);
    if(person.disabled||!person.email)fail(403,'account_disabled','This account cannot connect a TV.');
    return {name:(person.displayName||person.email.split('@')[0]).slice(0,80),email:person.email,
      signInMethod:person.providerData?.some(item=>item.providerId==='google.com')?'google':'password'};
  }
  function pendingRequest(uid,person) {
    return {deviceId:uid,ownerUid:uid,...person,ip:'',platform:'TV account',requestedAt:now(),status:'pending'};
  }
  function ownedRequest(request,uid) {
    if(request&&(request.deviceId!==uid||request.ownerUid!==uid))fail(403,'identity_mismatch','This accountâ€™s access record needs administrator review.');
  }
  async function connect(tx,uid,installId,deviceName) {
    const sessionId=randomBytes(24).toString('hex');
    // Claims belong to this Firebase login, not global user claims (mobile stays signed in).
    const token=await auth.createCustomToken(uid,{tvSessionId:sessionId,tvInstallationId:installId});
    tx.set('tv_sessions',uid,{sessionId,installationId:installId,deviceName,connectedAt:now(),status:'active'});
    return {status:'complete',token,sessionId};
  }
  return {
    async start(user,body) {
      const installId=installation(body.installationId);
      const deviceName=String(body.deviceName||'Meflix TV').trim().slice(0,80)||'Meflix TV';
      for(let attempt=0;attempt<4;attempt++) {
        const deviceCode=randomBytes(32).toString('base64url'),key=hash(deviceCode);
        const userCode=Array.from(randomBytes(8),byte=>alphabet[byte&31]).join('');
        const expiresAt=now()+TTL;
        const created=await store.transaction(async tx=>{
          const limit=await budget(tx,'start',user.uid,5);
          const collision=await tx.get('tv_codes',userCode);
          const previous=await tx.get('tv_pairing_installations',installId);
          const old=previous?await tx.get('tv_pairings',previous.key):null;
          if(collision&&collision.expiresAt>now())return false;
          limit();
          if(old&&old.status!=='consumed')tx.set('tv_pairings',previous.key,{...old,status:'cancelled'});
          tx.set('tv_pairings',key,{ownerUid:user.uid,installationId:installId,deviceName,userCode,expiresAt,status:'pending',lastPollAt:0,ackRequired:body.protocolVersion>=2,tvConfirmationRequired:body.protocolVersion>=3});
          tx.set('tv_codes',userCode,{key,expiresAt});
          tx.set('tv_pairing_installations',installId,{key});
          return true;
        });
        if(created)return {deviceCode,userCode:userCode.slice(0,4)+'-'+userCode.slice(4),expiresAt,expiresIn:TTL/1000,interval:INTERVAL,
          verificationUri:origin+'/tv.html',verificationUriComplete:origin+'/tv.html?code='+userCode};
      }
      fail(503,'temporarily_unavailable','Could not create a TV code. Please try again.');
    },
    async lookup(user,body) {
      account(user,now());await limit('code',user.uid,10);const code=codeOf(body.code);
      return store.transaction(async tx=>{
        const index=await tx.get('tv_codes',code),session=index?await tx.get('tv_pairings',index.key):null;
        const active=await tx.get('tv_sessions',user.uid);
        const request=await tx.get('device_requests',user.uid);
        valid(session,true);
        const confirmed=session.accountUid===user.uid&&['authorized','tv_approved','consumed'].includes(session.status);
        if(session.status!=='pending'&&!confirmed)fail(409,'already_used','This TV code has already been confirmed.');
        return {deviceName:session.deviceName,code:code.slice(0,4)+'-'+code.slice(4),expiresAt:session.expiresAt,
          replacesTV:!confirmed&&active?.status==='active'&&active.installationId!==session.installationId?active.deviceName:null,
          replaceSessionId:active?.status==='active'?active.sessionId:null,
          accessStatus:access(request,now())};
      });
    },
    async connect(user,body) {
      account(user,now());await limit('code',user.uid,10);
      const person=await profile(user),code=codeOf(body.code);
      return store.transaction(async tx=>{
        const index=await tx.get('tv_codes',code),session=index?await tx.get('tv_pairings',index.key):null;
        const request=await tx.get('device_requests',user.uid),active=await tx.get('tv_sessions',user.uid);
        valid(session,true);ownedRequest(request,user.uid);
        const confirmed=session.accountUid===user.uid&&['authorized','tv_approved','consumed'].includes(session.status);
        if(session.status!=='pending'&&!confirmed)fail(409,'already_used','This TV code has already been confirmed.');
        const replacesTV=!confirmed&&active?.status==='active'&&active.installationId!==session.installationId?active.deviceName:null;
        const preview={deviceName:session.deviceName,code:code.slice(0,4)+'-'+code.slice(4),expiresAt:session.expiresAt,
          replacesTV,replaceSessionId:active?.status==='active'?active.sessionId:null,accessStatus:access(request,now())};
        if(replacesTV&&!session.tvConfirmationRequired)return {...preview,confirmed:false};
        if(confirmed){
          const expected=session.status==='consumed'?session.deliveredSessionId:session.expectedSessionId;
          if((active?.sessionId||null)!==expected)fail(409,'replacement_changed','Your active TV changed. Review the connection again.');
        }else{
          tx.set('tv_pairings',index.key,{...session,status:'authorized',accountUid:user.uid,accountName:person.name,accountEmail:person.email,authorizedAt:now(),expectedSessionId:active?.sessionId||null});
          if(!request)tx.set('device_requests',user.uid,pendingRequest(user.uid,person));
        }
        return {...preview,confirmed:true};
      });
    },
    async confirm(user,body) {
      account(user,now());await limit('code',user.uid,10);
      const person=await profile(user),code=codeOf(body.code);
      if(body.confirmed!==true)fail(400,'confirmation_required','Confirm that this is the TV you want to connect.');
      return store.transaction(async tx=>{
        const index=await tx.get('tv_codes',code),session=index?await tx.get('tv_pairings',index.key):null;
        const request=await tx.get('device_requests',user.uid);
        const active=await tx.get('tv_sessions',user.uid);
        valid(session,true);ownedRequest(request,user.uid);
        if(session.accountUid===user.uid&&['authorized','tv_approved','consumed'].includes(session.status)) {
          const expected=session.status==='consumed'?session.deliveredSessionId:session.expectedSessionId;
          if((active?.sessionId||null)!==expected)fail(409,'replacement_changed','Your active TV changed. Review the connection again.');
          return {status:'authorized',accessStatus:access(request,now())};
        }
        if(session.status!=='pending')fail(409,'already_used','This TV code has already been confirmed.');
        const replacesTV=active?.status==='active'&&active.installationId!==session.installationId;
        if(replacesTV&&body.replaceSessionId!==active.sessionId)fail(409,'replacement_changed','Your active TV changed. Review the connection again.');
        tx.set('tv_pairings',index.key,{...session,status:'authorized',accountUid:user.uid,accountName:person.name,accountEmail:person.email,authorizedAt:now(),expectedSessionId:active?.sessionId||null});
        if(!request)tx.set('device_requests',user.uid,pendingRequest(user.uid,person));
        return {status:'authorized',accessStatus:access(request,now())};
      });
    },
    async poll(user,body) {
      const key=deviceKey(body.deviceCode),installId=installation(body.installationId);
      return store.transaction(async tx=>{
        const session=await tx.get('tv_pairings',key);
        valid(session,true);
        if(session.ownerUid!==user.uid||session.installationId!==installId)fail(403,'access_denied','This sign-in request belongs to another TV.');
        if(session.lastPollAt&&now()-session.lastPollAt<INTERVAL*1000-250)fail(429,'slow_down','Please wait before checking the TV code again.');
        if(session.status==='pending') {tx.set('tv_pairings',key,{...session,lastPollAt:now()});return {status:'authorization_pending',interval:INTERVAL};}
        const active=await tx.get('tv_sessions',session.accountUid);
        if(session.status==='authorized'&&session.tvConfirmationRequired){
          if((active?.sessionId||null)!==session.expectedSessionId)fail(409,'replacement_changed','Your connected TV changed. Scan a new code.');
          return {status:'confirmation_required',accountName:session.accountName,accountEmail:session.accountEmail,
            replacesTV:active?.status==='active'&&active.installationId!==installId?active.deviceName:null};
        }
        if(session.status==='consumed') {
          if(active?.status!=='active'||active.sessionId!==session.deliveredSessionId||active.installationId!==installId)fail(409,'replacement_changed','This TV connection was replaced. Generate a new code.');
          const token=await auth.createCustomToken(session.accountUid,{tvSessionId:active.sessionId,tvInstallationId:installId});
          tx.set('tv_pairings',key,{...session,lastPollAt:now()});
          return {status:'complete',token};
        }
        if(!['authorized','tv_approved'].includes(session.status))fail(403,'access_denied','This sign-in request is unavailable.');
        if((active?.sessionId||null)!==session.expectedSessionId)fail(409,'replacement_changed','Another TV connected first. Generate a new code and confirm again.');
        const result=await connect(tx,session.accountUid,installId,session.deviceName);
        tx.set('tv_pairings',key,{...session,status:'consumed',consumedAt:now(),lastPollAt:now(),deliveredSessionId:result.sessionId});
        return result;
      });
    },
    async approve(user,body){
      const key=deviceKey(body.deviceCode),installId=installation(body.installationId);
      if(typeof body.confirmed!=='boolean')fail(400,'confirmation_required','Choose Pair or No on your TV.');
      return store.transaction(async tx=>{
        const session=await tx.get('tv_pairings',key);
        if(!session||session.ownerUid!==user.uid||session.installationId!==installId)fail(403,'access_denied','This pairing belongs to another TV.');
        if(session.status==='cancelled'&&session.declinedAt&&body.confirmed===false)return {status:'declined'};
        valid(session,true);
        const active=await tx.get('tv_sessions',session.accountUid);
        if(!session.tvConfirmationRequired||!['authorized','tv_approved'].includes(session.status))fail(409,'already_used','This pairing is no longer waiting for TV confirmation.');
        if((active?.sessionId||null)!==session.expectedSessionId)fail(409,'replacement_changed','Your connected TV changed. Scan a new code.');
        tx.set('tv_pairings',key,{...session,status:body.confirmed?'tv_approved':'cancelled',...(body.confirmed?{tvApprovedAt:now()}:{declinedAt:now()})});
        return {status:body.confirmed?'approved':'declined'};
      });
    },
    async ready(user,body) {
      const installId=installation(body.installationId);
      return store.transaction(async tx=>{
        const index=await tx.get('tv_pairing_installations',installId);
        if(!index)fail(404,'not_found','No TV connection to verify.');
        const key=index.key,session=await tx.get('tv_pairings',key);valid(session,true);
        const active=await tx.get('tv_sessions',user.uid);
        if(session.accountUid!==user.uid||session.installationId!==installId||session.status!=='consumed'||
          active?.status!=='active'||active.sessionId!==session.deliveredSessionId||
          user.tvSessionId!==active.sessionId||user.tvInstallationId!==installId)
          fail(403,'access_denied','This TV connection is unavailable.');
        tx.set('tv_pairings',key,{...session,readyAt:session.readyAt||now()});
        return {status:'complete'};
      });
    },
    async connection(user,body) {
      account(user,now());await limit('connection',user.uid,60);const code=codeOf(body.code);
      return store.transaction(async tx=>{
        const index=await tx.get('tv_codes',code),session=index?await tx.get('tv_pairings',index.key):null;
        valid(session,true);
        if(session.accountUid!==user.uid)fail(403,'access_denied','This TV connection is unavailable.');
        const active=await tx.get('tv_sessions',user.uid),request=await tx.get('device_requests',user.uid);
        if(session.status==='consumed'&&(active?.status!=='active'||active.sessionId!==session.deliveredSessionId))fail(409,'replacement_changed','This TV connection was replaced.');
        return {status:session.status==='consumed'&&(!session.ackRequired||session.readyAt)?'complete':session.status==='authorized'&&session.tvConfirmationRequired?'awaiting_tv':'connecting',deviceName:session.deviceName,accessStatus:access(request,now()),device:active?.status==='active'?{deviceName:active.deviceName,sessionId:active.sessionId,connectedAt:active.connectedAt}:null};
      });
    },
    async cancel(user,body) {
      const key=deviceKey(body.deviceCode);
      await store.transaction(async tx=>{
        const session=await tx.get('tv_pairings',key);
        if(session&&session.ownerUid===user.uid&&session.status!=='consumed')tx.set('tv_pairings',key,{...session,status:'cancelled'});
      });return {status:'cancelled'};
    },
    async activate(user,body) {
      const person=await profile(user),installId=installation(body.installationId);
      return store.transaction(async tx=>{
        const limit=await budget(tx,'activate',user.uid,5);
        const request=await tx.get('device_requests',user.uid);
        await tx.get('tv_sessions',user.uid);ownedRequest(request,user.uid);
        const result=await connect(tx,user.uid,installId,String(body.deviceName||'Meflix TV').slice(0,80));
        limit();if(!request)tx.set('device_requests',user.uid,pendingRequest(user.uid,person));
        return result;
      });
    },
    async release(user) {
      await store.transaction(async tx=>{
        const active=await tx.get('tv_sessions',user.uid);
        if(active&&typeof user.tvSessionId==='string'&&active.sessionId===user.tvSessionId&&active.installationId===user.tvInstallationId)
          tx.set('tv_sessions',user.uid,{...active,status:'signed_out',signedOutAt:now()});
      });return {status:'signed_out'};
    },
    async device(user) {
      account(user,now());
      return store.transaction(async tx=>{
        const active=await tx.get('tv_sessions',user.uid);
        return {device:active?.status==='active'?{deviceName:active.deviceName,sessionId:active.sessionId,connectedAt:active.connectedAt}:null};
      });
    },
    async unpair(user,body) {
      account(user,now());await limit('unpair',user.uid,10);
      if(typeof body.sessionId!=='string'||!body.sessionId)fail(400,'invalid_request','Choose the TV to unpair.');
      return store.transaction(async tx=>{
        const active=await tx.get('tv_sessions',user.uid);
        if(!active)return {status:'unpaired'};
        if(active.sessionId!==body.sessionId)fail(409,'replacement_changed','Your connected TV changed. Refresh and try again.');
        if(active.status==='active')tx.set('tv_sessions',user.uid,{...active,status:'signed_out',signedOutAt:now()});
        return {status:'unpaired'};
      });
    },
  };
}
module.exports={createTVAuth,TVAuthError};
