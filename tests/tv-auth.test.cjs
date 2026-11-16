const {test}=require('node:test');const assert=require('node:assert/strict');
const {createTVAuth}=require('../lib/tv-auth-model.cjs');
const {createTVHandler}=require('../lib/tv-auth-backend.cjs');
const http=require('node:http');
const installA='a'.repeat(32),installB='b'.repeat(32);
function setup(){
 let time=1800000000000,queue=Promise.resolve();let values=new Map();const tokens=[];
 const store={transaction:callback=>{
  const work=queue.then(async()=>{
   const draft=new Map([...values].map(([key,value])=>[key,JSON.parse(JSON.stringify(value))]));let writing=false;
   const result=await callback({get:async(c,id)=>{assert.equal(writing,false,'Firestore transactions read before writing');return draft.get(c+'/'+id)||null;},set:(c,id,data)=>{writing=true;draft.set(c+'/'+id,data);}});
   values=draft;return result;
  });queue=work.catch(()=>{});return work;
 }};
 const auth={getUser:async uid=>({uid,email:uid+'@example.com',displayName:'Viewer',providerData:[{providerId:'google.com'}]}),createCustomToken:async(uid,claims)=>{tokens.push({uid,claims});return'token-'+tokens.length;}};
 const flow=createTVAuth({store,auth,now:()=>time});
 const account=uid=>({uid,email:uid+'@example.com',auth_time:Math.floor(time/1000),firebase:{sign_in_provider:'google.com'}});
 const guest=uid=>({uid,firebase:{sign_in_provider:'anonymous'}});
 const pair=(id='guest-a',install=installA)=>flow.start(guest(id),{installationId:install,deviceName:id});
 const confirm=async(user,pair)=>{const preview=await flow.lookup(user,{code:pair.userCode});await flow.confirm(user,{code:pair.userCode,confirmed:true,replaceSessionId:preview.replaceSessionId});return preview;};
 return{flow,auth,store,tokens,account,guest,pair,confirm,advance:ms=>{time+=ms;},get:(c,id)=>values.get(c+'/'+id),seed:(c,id,data)=>values.set(c+'/'+id,data)};
}
test('QR exposes only the user code; phone confirmation is required and a pairing code is single-use',async()=>{
 const x=setup(),pair=await x.pair();assert.match(pair.userCode,/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);assert.equal(pair.interval,3);
 assert.ok(!pair.verificationUriComplete.includes(pair.deviceCode));
 assert.equal((await x.flow.poll(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA})).status,'authorization_pending');
 await assert.rejects(x.flow.confirm(x.account('viewer'),{code:pair.userCode}),{code:'confirmation_required'});
 await x.confirm(x.account('viewer'),pair);x.advance(5000);
 const result=await x.flow.poll(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA});assert.equal(result.token,'token-1');
 assert.equal(x.tokens[0].uid,'viewer');assert.equal(x.tokens[0].claims.tvInstallationId,installA);
 await assert.rejects(x.flow.poll(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA}),{code:'slow_down'});
 await assert.rejects(x.flow.confirm(x.account('other'),{code:pair.userCode,confirmed:true}),{code:'already_used'});
});

test('lost confirm and token responses can be retried without creating another TV session',async()=>{
 const x=setup(),user=x.account('viewer'),pair=await x.pair(),body={deviceCode:pair.deviceCode,installationId:installA};
 await x.confirm(user,pair);await x.confirm(user,pair);
 await x.flow.poll(x.guest('guest-a'),body);const first=x.get('tv_sessions','viewer').sessionId;
 x.advance(3000);await x.flow.poll(x.guest('guest-a'),body);
 assert.equal(x.get('tv_sessions','viewer').sessionId,first);assert.deepEqual(x.tokens[0].claims,x.tokens[1].claims);
 await x.confirm(user,pair);assert.equal(x.get('tv_sessions','viewer').sessionId,first);
 const other=await x.pair('guest-b',installB);await x.confirm(user,other);
 await x.flow.poll(x.guest('guest-b'),{deviceCode:other.deviceCode,installationId:installB});x.advance(3000);
 await assert.rejects(x.flow.poll(x.guest('guest-a'),body),{code:'replacement_changed'});
});

test('production phone waits for authenticated TV acknowledgment before success',async()=>{
 const x=setup(),user=x.account('viewer');
 const pair=await x.flow.start(x.guest('guest-a'),{installationId:installA,deviceName:'Living room',protocolVersion:2});
 await x.confirm(user,pair);
 assert.equal((await x.flow.connection(user,{code:pair.userCode})).status,'connecting');
 await x.flow.poll(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA});
 assert.equal((await x.flow.connection(user,{code:pair.userCode})).status,'connecting');
 await assert.rejects(x.flow.ready(user,{installationId:installA}),{code:'access_denied'});
 await assert.rejects(x.flow.connection(x.account('other'),{code:pair.userCode}),{code:'access_denied'});
 const tv={...user,...x.tokens[0].claims,firebase:{sign_in_provider:'custom'}};
 await x.flow.ready(tv,{installationId:installA});await x.flow.ready(tv,{installationId:installA});
 assert.equal((await x.flow.connection(user,{code:pair.userCode})).status,'complete');
});

test('one connect request authorizes a new TV but still requires consent before replacing a TV',async()=>{
 const x=setup(),user=x.account('viewer'),a=await x.pair();
 assert.equal((await x.flow.connect(user,{code:a.userCode})).confirmed,true);
 assert.equal((await x.flow.connect(user,{code:a.userCode})).confirmed,true);
 await x.flow.poll(x.guest('guest-a'),{deviceCode:a.deviceCode,installationId:installA});
 const b=await x.pair('guest-b',installB),preview=await x.flow.connect(user,{code:b.userCode});
 assert.equal(preview.confirmed,false);assert.equal(preview.replacesTV,'guest-a');
 assert.equal(x.get('tv_sessions','viewer').installationId,installA);
});

test('scan-to-pair protocol requires Pair on the bound TV before issuing a login token',async()=>{
 const x=setup(),user=x.account('viewer'),pair=await x.flow.start(x.guest('guest-a'),{installationId:installA,deviceName:'Living room',protocolVersion:3});
 assert.equal((await x.flow.connect(user,{code:pair.userCode})).confirmed,true);
 const body={deviceCode:pair.deviceCode,installationId:installA};
 const challenge=await x.flow.poll(x.guest('guest-a'),body);assert.equal(challenge.status,'confirmation_required');assert.equal(challenge.accountEmail,user.email);assert.equal(x.tokens.length,0);
 assert.equal((await x.flow.connection(user,{code:pair.userCode})).status,'awaiting_tv');
 await assert.rejects(x.flow.approve(x.guest('other'),{...body,confirmed:true}),{code:'access_denied'});
 await x.flow.approve(x.guest('guest-a'),{...body,confirmed:true});await x.flow.approve(x.guest('guest-a'),{...body,confirmed:true});
 assert.equal((await x.flow.connect(user,{code:pair.userCode})).confirmed,true);
 assert.equal((await x.flow.poll(x.guest('guest-a'),body)).status,'complete');assert.equal(x.tokens.length,1);
});

test('TV No is idempotent, sends no login token, and leaves the old TV connected',async()=>{
 const x=setup(),user=x.account('viewer');x.seed('tv_sessions','viewer',{sessionId:'old-session',installationId:installB,status:'active',deviceName:'Bedroom TV'});
 const pair=await x.flow.start(x.guest('guest-a'),{installationId:installA,protocolVersion:3});
 assert.equal((await x.flow.connect(user,{code:pair.userCode})).confirmed,true);
 const body={deviceCode:pair.deviceCode,installationId:installA};assert.equal((await x.flow.poll(x.guest('guest-a'),body)).replacesTV,'Bedroom TV');
 await x.flow.approve(x.guest('guest-a'),{...body,confirmed:false});await x.flow.approve(x.guest('guest-a'),{...body,confirmed:false});
 await assert.rejects(x.flow.connection(user,{code:pair.userCode}),{code:'access_denied'});
 assert.equal(x.tokens.length,0);assert.equal(x.get('tv_sessions','viewer').sessionId,'old-session');
});

test('TV Pair cannot replace a connection that changed after the scan',async()=>{
 const x=setup(),user=x.account('viewer'),pair=await x.flow.start(x.guest('guest-a'),{installationId:installA,protocolVersion:3});
 await x.flow.connect(user,{code:pair.userCode});
 x.seed('tv_sessions','viewer',{sessionId:'new-session',installationId:installB,status:'active',deviceName:'New TV'});
 await assert.rejects(x.flow.approve(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA,confirmed:true}),{code:'replacement_changed'});assert.equal(x.tokens.length,0);
});
test('connecting a second TV atomically replaces only the old TV session; stale logout cannot disconnect the new TV',async()=>{
 const x=setup(),user=x.account('viewer');const a=await x.pair();await x.confirm(user,a);
 await x.flow.poll(x.guest('guest-a'),{deviceCode:a.deviceCode,installationId:installA});const old=x.tokens[0].claims;
 const b=await x.pair('guest-b',installB),preview=await x.flow.lookup(user,{code:b.userCode});assert.equal(preview.replacesTV,'guest-a');
 await assert.rejects(x.flow.confirm(user,{code:b.userCode,confirmed:true}),{code:'replacement_changed'});
 await x.flow.confirm(user,{code:b.userCode,confirmed:true,replaceSessionId:preview.replaceSessionId});
 await x.flow.poll(x.guest('guest-b'),{deviceCode:b.deviceCode,installationId:installB});
 const active=x.get('tv_sessions','viewer');assert.equal(active.installationId,installB);assert.notEqual(active.sessionId,old.tvSessionId);
 await x.flow.release({...user,...old});assert.equal(x.get('tv_sessions','viewer').status,'active');
 await assert.rejects(x.flow.activate({...user,...old,firebase:{sign_in_provider:'custom'}},{installationId:installA}),{code:'login_required'});
 await x.flow.release({...user,...x.tokens[1].claims});assert.equal(x.get('tv_sessions','viewer').status,'signed_out');
});

test('logout without a TV session is harmless',async()=>{const x=setup();assert.equal((await x.flow.release(x.account('viewer'))).status,'signed_out');});

test('phone shows its connected device and unpairs only the reviewed TV session',async()=>{
 const x=setup(),user=x.account('viewer'),pair=await x.pair();await x.confirm(user,pair);
 assert.equal((await x.flow.device(user)).device,null);
 await x.flow.poll(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA});
 const device=(await x.flow.device(user)).device;assert.equal(device.deviceName,'guest-a');assert.ok(device.connectedAt);
 assert.equal((await x.flow.device(x.account('other'))).device,null);
 await assert.rejects(x.flow.device(x.guest('guest')),{code:'login_required'});
 await assert.rejects(x.flow.unpair(user,{sessionId:'stale-session'}),{code:'replacement_changed'});
 assert.equal(x.get('tv_sessions','viewer').status,'active');
 await x.flow.unpair(user,{sessionId:device.sessionId});await x.flow.unpair(user,{sessionId:device.sessionId});
 assert.equal((await x.flow.device(user)).device,null);assert.equal(x.get('device_requests','viewer').status,'pending');
});

test('an old phone screen cannot unpair a newer TV connection',async()=>{
 const x=setup(),user=x.account('viewer'),a=await x.pair();await x.confirm(user,a);
 await x.flow.poll(x.guest('guest-a'),{deviceCode:a.deviceCode,installationId:installA});const old=(await x.flow.device(user)).device;
 const b=await x.pair('guest-b',installB);await x.confirm(user,b);
 await x.flow.poll(x.guest('guest-b'),{deviceCode:b.deviceCode,installationId:installB});
 await assert.rejects(x.flow.unpair(user,{sessionId:old.sessionId}),{code:'replacement_changed'});
 assert.equal((await x.flow.device(user)).device.deviceName,'guest-b');
});
test('existing approval and pending requests are retained; new accounts remain pending',async()=>{
 for(const status of ['pending','approved','rejected']){
  const x=setup(),request={deviceId:'viewer',ownerUid:'viewer',status,requestedAt:123,expiresAt:1};x.seed('device_requests','viewer',request);
  const pair=await x.pair();await x.confirm(x.account('viewer'),pair);assert.deepEqual(x.get('device_requests','viewer'),request);
 }
 const x=setup(),pair=await x.pair();await x.confirm(x.account('viewer'),pair);
 assert.equal(x.get('device_requests','viewer').status,'pending');assert.equal(x.get('device_requests','viewer').email,'viewer@example.com');
});
test('expired, refreshed and cancelled codes cannot authorize a TV',async()=>{
 const x=setup(),old=await x.pair();const next=await x.pair();
 await assert.rejects(x.flow.lookup(x.account('viewer'),{code:old.userCode}),{code:'access_denied'});
 await x.flow.cancel(x.guest('guest-a'),{deviceCode:next.deviceCode});await assert.rejects(x.flow.lookup(x.account('viewer'),{code:next.userCode}),{code:'access_denied'});
 const expired=await x.pair('guest-b',installB);x.advance(600001);
 await assert.rejects(x.flow.lookup(x.account('viewer'),{code:expired.userCode}),{code:'expired_token'});
});
test('polling is bound to the requesting TV and enforces the server interval',async()=>{
 const x=setup(),pair=await x.pair(),body={deviceCode:pair.deviceCode,installationId:installA};
 await assert.rejects(x.flow.poll(x.guest('other'),body),{code:'access_denied'});
 await assert.rejects(x.flow.poll(x.guest('guest-a'),{...body,installationId:installB}),{code:'access_denied'});
 await x.flow.poll(x.guest('guest-a'),body);await assert.rejects(x.flow.poll(x.guest('guest-a'),body),{code:'slow_down'});
});
test('invalid guesses consume a rate limit and anonymous phone sessions are refused',async()=>{
 const x=setup(),user=x.account('viewer');for(let i=0;i<10;i++)await assert.rejects(x.flow.lookup(user,{code:'ABCDEFGH'}),{code:'expired_token'});
 await assert.rejects(x.flow.lookup(user,{code:'ABCDEFGH'}),{code:'slow_down'});
 await assert.rejects(x.flow.lookup(x.guest('guest'),{code:'ABCDEFGH'}),{code:'login_required'});
 x.advance(600001);await assert.rejects(x.flow.lookup(user,{code:'ABCDEFGH'}),{code:'expired_token'});
});

test('an existing signed-in phone account connects without another login',async()=>{
 const x=setup(),user=x.account('viewer');x.advance(24*60*60*1000);
 const pair=await x.pair();
 const preview=await x.flow.lookup(user,{code:pair.userCode});assert.ok(preview.deviceName);
 await x.confirm(user,pair);
 const result=await x.flow.poll(x.guest('guest-a'),{deviceCode:pair.deviceCode,installationId:installA});
 assert.equal(result.status,'complete');
});
test('simultaneous pairings cannot silently replace a TV that connected after consent',async()=>{
 const x=setup(),user=x.account('viewer'),a=await x.pair(),b=await x.pair('guest-b',installB);
 await x.confirm(user,a);await x.confirm(user,b);
 const results=await Promise.allSettled([x.flow.poll(x.guest('guest-a'),{deviceCode:a.deviceCode,installationId:installA}),x.flow.poll(x.guest('guest-b'),{deviceCode:b.deviceCode,installationId:installB})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'replacement_changed');assert.equal(x.tokens.length,1);
});
test('TV API validates identity, method, JSON and origin before activating a session',async t=>{
 const x=setup(),handle=createTVHandler(()=>({flow:x.flow,auth:{verifyIdToken:async token=>{if(token!=='valid')throw Error('invalid');return x.guest('guest-a');}}}));
 const server=http.createServer((req,res)=>handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}/api/tv/start`,body=JSON.stringify({installationId:installA});
 assert.equal((await fetch(base)).status,405);
 assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body})).status,401);
 assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer invalid'},body})).status,401);
 assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer valid',Origin:'https://other.example'},body})).status,403);
 assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer valid'},body})).status,200);
});
