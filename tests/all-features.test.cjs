const{test}=require('node:test');const assert=require('node:assert/strict');const{setup}=require('./console-harness.cjs');
test('live metrics, history, search and permanent access work without network/IP grants',async()=>{
 const now=Date.now();const devices=[{deviceId:'a',ownerUid:'a',name:'Family TV',platform:'Fire TV',status:'approved',expiresAt:null,isWatching:true,lastActiveAt:now,currentTitle:'Example show',currentProgress:62,watchHistory:[{title:'Example show',progress:62,updatedAt:now}]},{deviceId:'b',ownerUid:'b',name:'Phone',platform:'Android',status:'pending',requestedAt:now}];
 const x=await setup({devices});await x.login();
 assert.equal(x.document.getElementById('count-all').textContent,'2');assert.equal(x.document.getElementById('count-watching').textContent,'1');assert.equal(x.document.getElementById('count-approved').textContent,'1');assert.equal(x.document.getElementById('tab-whitelist'),null);
 const history=[...x.document.querySelector('[aria-label="Manage Family TV"]').querySelectorAll('button')].find(b=>b.textContent.includes('History'));assert.ok(history);history.click();await x.flush();assert.match(x.document.getElementById('history-list').textContent,/Example show/);
 x.document.querySelector('[aria-label="Manage Family TV"]').click();await x.flush();assert.equal(x.document.getElementById('access-mode').value,'permanent');
 assert.equal(x.reads.some(r=>r==='whitelisted_ips'),false);
});
test('preview URL and a forged browser storage flag cannot authorize or subscribe',async()=>{const x=await setup({url:'http://localhost:5178/?preview=1',localFlag:true});assert.equal(x.document.getElementById('workspace').hidden,true);assert.equal(x.reads.length,0);});
test('failed server PIN verification cannot fall back to browser/Firestore defaults',async()=>{const x=await setup({loginFails:true});await x.login();assert.equal(x.document.getElementById('workspace').hidden,true);assert.equal(x.reads.length,0);assert.match(x.document.getElementById('login-error').textContent,/unavailable/);});

test('PIN keypad renders and accepts input while Firebase is still loading',async()=>{const x=await setup({deferBootstrap:true});assert.equal(x.document.getElementById('lock').hidden,false);x.document.querySelector('[data-digit="2"]').click();await x.flush();assert.equal(x.document.querySelectorAll('#pin-dots .filled').length,1);assert.equal(x.reads.length,0);});
