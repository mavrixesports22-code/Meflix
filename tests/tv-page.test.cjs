const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const flush=()=>new Promise(resolve=>setTimeout(resolve,15));
async function page({changed=false}={}) {
 const dom=new JSDOM(fs.readFileSync('public/tv.html','utf8'),{url:'https://meflix-roan.vercel.app/tv.html?code=ABCDEFGH'});
 const user={email:'viewer@example.com',getIdToken:async()=> 'verified-id-token'},auth={currentUser:null},calls=[];
 class GoogleAuthProvider {setCustomParameters(){}}
 const sdk={initializeApp:()=>({}),getAuth:()=>auth,setPersistence:async()=>{},inMemoryPersistence:{},GoogleAuthProvider,
  signInWithPopup:async()=>{auth.currentUser=user;return{user};},signInWithEmailAndPassword:async()=>{auth.currentUser=user;return{user};},signOut:async()=>{auth.currentUser=null;},firebaseConfig:{}};
 const source=fs.readFileSync('public/tv.js','utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm,'');
 await vm.runInNewContext(`(async()=>{const{${Object.keys(sdk).join(',')}}=__sdk;${source}})()`,{
  __sdk:sdk,document:dom.window.document,location:dom.window.location,history:dom.window.history,URL,Error,
  fetch:async(url,options)=>{
   assert.equal(options.headers.Authorization,'Bearer verified-id-token');const body=JSON.parse(options.body);calls.push({url,body});
   const lookup={deviceName:'<img src=x onerror=alert(1)>',code:'ABCD-EFGH',replacesTV:'Living room TV',replaceSessionId:'previous-session',accessStatus:'pending'};
   return{ok:!changed||url.endsWith('lookup'),json:async()=>url.endsWith('lookup')?lookup:changed?{error:'replacement_changed',message:'Review the active TV again.'}:{accessStatus:'pending'}};
  },
 });
 const doc=dom.window.document;
 return{doc,calls,click:async id=>{doc.getElementById(id).click();await flush();},submit:async id=>{doc.getElementById(id).dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await flush();},location:dom.window.location};
}
test('phone QR page signs in first, displays replacement warning and sends explicit consent only on Connect',async()=>{
 const p=await page();assert.equal(p.doc.getElementById('code').value,'ABCDEFGH');assert.equal(p.location.search,'');
 await p.click('google');assert.equal(p.doc.getElementById('activation').hidden,false);
 await p.submit('code-form');assert.equal(p.calls.length,1);assert.match(p.doc.getElementById('replacement').textContent,/sign out Living room TV/);
 assert.match(p.doc.getElementById('approval').textContent,/administrator approval/);assert.equal(p.doc.querySelectorAll('#tv-name img').length,0);
 await p.click('connect');assert.equal(p.calls[1].body.confirmed,true);assert.equal(p.calls[1].body.replaceSessionId,'previous-session');
 assert.match(p.doc.getElementById('message').textContent,/wait for administrator approval/);
});
test('cancelling phone confirmation does not connect or replace any TV',async()=>{
 const p=await page();await p.click('google');await p.submit('code-form');await p.click('cancel');assert.equal(p.calls.length,1);assert.equal(p.doc.getElementById('code-form').hidden,false);
});
test('a changed active TV requires reviewing the code again instead of silently retrying replacement',async()=>{
 const p=await page({changed:true});await p.click('google');await p.submit('code-form');await p.click('connect');
 assert.equal(p.doc.getElementById('review').hidden,true);assert.equal(p.doc.getElementById('code-form').hidden,false);assert.match(p.doc.getElementById('error').textContent,/Review/);
});
