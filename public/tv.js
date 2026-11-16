import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,setPersistence,inMemoryPersistence,signOut} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {firebaseConfig} from './firebase-config.js';
const byId=id=>document.getElementById(id),auth=getAuth(initializeApp(firebaseConfig,'meflix-tv-activation'));
let preview=null,busy=true;
const url=new URL(location.href);byId('code').value=url.searchParams.get('code')||'';
history.replaceState(null,'',location.pathname);
function error(text){byId('error').textContent=text;byId('error').hidden=false;}
function setBusy(value){busy=value;document.querySelectorAll('button').forEach(button=>{button.disabled=value;});}
async function run(operation){if(busy)return;setBusy(true);byId('error').hidden=true;try{await operation();}catch(cause){
 if(!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(cause.code))error(cause.message||'Could not connect. Please try again.');
}finally{setBusy(false);}}
async function api(action,body){const token=await auth.currentUser.getIdToken();const response=await fetch('/api/tv/'+action,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});const value=await response.json();if(!response.ok){const cause=new Error(value.message||'Could not connect your TV.');cause.code=value.error;throw cause;}return value;}
function signedIn(user){byId('password').value='';byId('account').textContent='Signed in as '+user.email;byId('login').hidden=true;byId('activation').hidden=false;}
try{await setPersistence(auth,inMemoryPersistence);setBusy(false);}catch{error('Could not start sign-in. Please reload this page.');}
byId('google').addEventListener('click',()=>run(async()=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});signedIn((await signInWithPopup(auth,provider)).user);}));
byId('email-form').addEventListener('submit',event=>{event.preventDefault();void run(async()=>{try{signedIn((await signInWithEmailAndPassword(auth,byId('email').value.trim(),byId('password').value)).user);}catch{throw new Error('The email or password is incorrect. Please try again.');}});});
byId('code-form').addEventListener('submit',event=>{event.preventDefault();void run(async()=>{
 const code=byId('code').value.toUpperCase().replace(/[\s-]/g,'');
 if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw new Error('Enter the 8-character code shown on your TV.');
 preview=await api('lookup',{code});byId('tv-name').textContent=preview.deviceName+' · '+preview.code;
 byId('replacement').textContent=preview.replacesTV?'Connecting will sign out '+preview.replacesTV+'.':'This will connect the TV showing '+preview.code+'.';
 byId('approval').textContent=preview.accessStatus==='approved'?'Your account has access.':preview.accessStatus==='rejected'?'Access is paused. Connecting will not restore access.':'Your TV will wait for administrator approval before playback.';
 byId('review').hidden=false;byId('code-form').hidden=true;
});});
byId('connect').addEventListener('click',()=>run(async()=>{
 if(!preview)return;
 try{const result=await api('confirm',{code:preview.code,confirmed:true,replaceSessionId:preview.replaceSessionId});
 byId('activation').hidden=true;byId('message').hidden=false;byId('message').textContent=result.accessStatus==='approved'?'Confirmed. Your TV will sign in shortly.':'Confirmed. Your TV will sign in and wait for administrator approval.';
 }catch(cause){byId('review').hidden=true;byId('code-form').hidden=false;preview=null;throw cause;}
}));
byId('cancel').addEventListener('click',()=>{preview=null;byId('review').hidden=true;byId('code-form').hidden=false;});
byId('switch').addEventListener('click',()=>run(async()=>{await signOut(auth);preview=null;byId('login').hidden=false;byId('activation').hidden=true;byId('review').hidden=true;byId('code-form').hidden=false;}));
