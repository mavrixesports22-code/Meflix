const fs=require('node:fs'),vm=require('node:vm'),esbuild=require('esbuild');const{JSDOM}=require('jsdom');
let compiled;
async function bundle(){
 if(!compiled)compiled=esbuild.build({entryPoints:['public/admin.js'],bundle:true,format:'esm',write:false,plugins:[{name:'mock-sdk',setup(build){build.onResolve({filter:/^https:\/\/www\.gstatic\.com/},args=>({path:args.path,namespace:'sdk'}));build.onLoad({filter:/.*/,namespace:'sdk'},()=>({contents:`const s=globalThis.__sdk;export const {initializeApp,getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged,signInWithCustomToken,signOut,getFirestore,doc,getDocFromServer,collection,onSnapshot,updateDoc,setDoc,deleteDoc}=s;`,loader:'js'}));build.onResolve({filter:/^\.\/firebase-config\.js$/},()=>({path:'config',namespace:'sdk-config'}));build.onLoad({filter:/.*/,namespace:'sdk-config'},()=>({contents:'export const firebaseConfig={};',loader:'js'}));}}]}).then(result=>result.outputFiles[0].text);
 return compiled;
}
async function setup(options={}){
 const dom=new JSDOM(fs.readFileSync('public/index.html','utf8'),{url:options.url||'http://localhost:5178',pretendToBeVisual:true});const document=dom.window.document,writes=[],api=[],reads=[],listeners=[];
 const devices=options.devices||[{deviceId:'device-a',ownerUid:'device-a',name:'Living room TV',platform:'Fire TV',status:'pending',requestedAt:Date.now(),note:''},{deviceId:'device-b',ownerUid:'device-b',name:'Phone <script>alert(1)</script>',platform:'Android',status:'approved',expiresAt:null,requestedAt:1}];
 const user={uid:'meflix-admin-console',isAnonymous:false,getIdToken:async()=> 'id-token',getIdTokenResult:async()=>({claims:{admin:true,pinVersion:1}})},auth={currentUser:null};
 if(options.localFlag)dom.window.sessionStorage.setItem('meflix_admin_auth','true');
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const sdk={initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>({}),setPersistence:async()=>{if(options.deferBootstrap)await new Promise(()=>{});},browserLocalPersistence:{},
 onAuthStateChanged:(_auth,fn)=>{listeners.push(fn);fn(auth.currentUser);return()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};},
 signOut:async()=>{auth.currentUser=null;await Promise.all(listeners.map(fn=>fn(null)));},
 signInWithCustomToken:async()=>{auth.currentUser=user;await Promise.all(listeners.map(fn=>fn(user)));},
 doc:(_db,c,id)=>({c,id}),collection:(_db,c)=>c,getDocFromServer:async ref=>{reads.push(ref);return{exists:()=>false};},
 onSnapshot:(ref,opt,next)=>{reads.push(ref);next({docs:devices.map(d=>({id:d.deviceId,data:()=>d})),metadata:{fromCache:false}});return()=>{};},
 updateDoc:async(ref,patch)=>{writes.push({ref,patch});const d=devices.find(d=>d.deviceId===ref.id);if(d)Object.assign(d,patch);},setDoc:async(ref,patch)=>writes.push({ref,patch}),deleteDoc:async ref=>writes.push({deleted:ref}),};
 const timer=(fn,ms,...args)=>{const handle=setTimeout(fn,ms,...args);if(ms>500)handle.unref();return handle;};
 const context={__sdk:sdk,document,window:dom.window,Node:dom.window.Node,console,Date,AbortController,Blob,URL,queueMicrotask,requestAnimationFrame:fn=>timer(fn,0),cancelAnimationFrame:clearTimeout,setTimeout:timer,clearTimeout,setInterval:(fn,ms)=>{const t=setInterval(fn,ms);t.unref();return t;},clearInterval,
 fetch:async(url,request={})=>{api.push({url,options:request});if(options.loginFails&&url.endsWith('/login'))return{ok:false,json:async()=>({error:'Server login unavailable.'})};return{ok:true,json:async()=>url.endsWith('/login')?{token:'custom-token'}:url.endsWith('/pin')?{changed:true}:{authorized:true}};}};
 await vm.runInNewContext('(async()=>{'+await bundle()+'})()',context);
 const flush=async()=>{await new Promise(resolve=>setTimeout(resolve,100));};await flush();
 const click=id=>document.getElementById(id).click();
 const login=async()=>{document.getElementById('pin').value='2468';document.getElementById('login-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));await flush();};
 return{dom,document,writes,reads,api,devices,click,login,flush};
}
module.exports={setup};
