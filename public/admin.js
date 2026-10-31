import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signInWithCustomToken, signOut, signInAnonymously } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getFirestore, doc, getDocFromServer, collection, onSnapshot, updateDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { statusOf, filteredDevices, approvalPatch, relativeTime, csvCell } from './model.js';
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const $ = id => document.getElementById(id);
const state = { devices:[], filter:'all', query:'', selected:null, unsub:null, roleUnsub:null, busy:false, activity:Date.now(), authorized:false, authGeneration:0 };
function element(tag, attrs = {}, children = []) {
  const node=document.createElement(tag);
  for (const [key,value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(),value);
    else if (value !== undefined && value !== null) node.setAttribute(key,String(value));
  }
  for (const child of [children].flat(Infinity)) if (child != null) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
const statusLabel=s=>({approved:'Approved',pending:'Pending',rejected:'Paused',expired:'Expired'}[s] || s);
function toast(text) { $('toast').textContent=text; $('toast').hidden=false; clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('toast').hidden=true,3500); }
function stop() { state.unsub?.(); state.roleUnsub?.(); state.unsub=null; state.roleUnsub=null; state.authorized=false; state.devices=[]; state.selected=null; $('details').close(); $('confirm').close(); $('security').close(); $('updates').close(); render(); }
async function lock(message='') { ++state.authGeneration; try{sessionStorage.removeItem('meflix_admin_auth');}catch{} stop(); $('workspace').hidden=true; $('lock').hidden=false; $('pin').value=''; pinDots(); $('login-error').textContent=message; if(auth.currentUser&&!auth.currentUser.isAnonymous)await signOut(auth); }
function render() {
  const devices=state.devices, active=devices.filter(d=>statusOf(d)==='approved');
  const stats=[['Total devices',devices.length,'Registered installations','▦',''],['Approved',active.length,'Access enabled','✓','approved'],['Pending requests',devices.filter(d=>statusOf(d)==='pending').length,'Waiting for your review','◷','pending'],['Watching now',active.filter(d=>d.isWatching && Date.now()-(d.lastActiveAt||0)<120000).length,'Active in the last 2 minutes','▷','']];
  $('stats').replaceChildren(...stats.map(([label,value,hint,icon,cls])=>element('div',{class:`stat ${cls}`},[element('div',{class:'stat-top'},[label,element('span',{class:'stat-symbol','aria-hidden':true},icon)]),element('strong',{},value),element('small',{},hint)])));
  $('nav-count').textContent=devices.length;
  const filters=[['all','All devices'],['watching','Watching'],['pending','Pending'],['approved','Approved'],['rejected','Paused'],['expired','Expired']];
  $('filters').replaceChildren(...filters.map(([key,label])=>element('button',{class:'filter','aria-pressed':state.filter===key,onClick:()=>{state.filter=key;render();}},label)));
  const rows=filteredDevices(devices,state.filter,state.query);
  $('result-count').textContent=`${rows.length} ${rows.length===1?'device':'devices'}`;
  $('device-list').replaceChildren(...(rows.length?rows.map(d=>{
    const status=statusOf(d);
    return element('button',{class:'device-row','aria-label':`Manage ${d.name || d.deviceId}`,onClick:()=>openDetails(d.deviceId)},[
      element('span',{class:'device-name'},[element('span',{class:'device-icon','aria-hidden':true},/tv/i.test(d.platform||'')?'▣':/ios|android/i.test(d.platform||'')?'▯':'▤'),element('span',{class:'device-copy'},[element('strong',{},d.name||'Unnamed device'),element('small',{},`${d.platform||'Unknown platform'} · ${d.deviceId.slice(0,8)}`)])]),
      element('span',{class:'access-cell'},[element('span',{class:`badge ${status}`},`• ${statusLabel(status)}`),element('small',{},d.expiresAt?`Until ${new Date(d.expiresAt).toLocaleDateString()}`:status==='approved'?'Permanent access':d.ownerUid?'Device-bound':'Legacy · review migration')]),
      element('span',{class:'last-seen'},relativeTime(d.lastActiveAt)),element('span',{class:'row-arrow','aria-hidden':true},'↗')]);
  }):[element('div',{class:'empty'},devices.length?'No devices match this view.':'No devices yet. New requests from the updated app appear here automatically.')]));
}
function field(label,value,wide=false) { return element('div',{class:`detail-field ${wide?'wide':''}`},[element('label',{},label),element('p',{},value||'Not recorded')]); }
function openDetails(id) {
  const d=state.devices.find(device=>device.deviceId===id); if(!d) return;
  state.selected=id; $('detail-name').textContent=d.name||'Unnamed device'; $('detail-error').textContent='';
  const mode=element('select',{id:'access-mode','aria-label':'Access mode'},[element('option',{value:'permanent'},'Permanent · approve once'),element('option',{value:'scheduled'},'Scheduled access')]);
  mode.value=d.expiresAt?'scheduled':'permanent';
  const days=element('input',{id:'access-days',type:'number',min:1,max:3650,value:30,'aria-label':'Access duration in days'});
  const duration=element('div',{class:'detail-field',id:'duration-field'},[element('label',{for:'access-days'},'Duration in days'),days]);
  duration.hidden=mode.value!=='scheduled'; mode.addEventListener('change',()=>duration.hidden=mode.value!=='scheduled');
  const notes=element('textarea',{id:'device-note',maxlength:1000,'aria-label':'Private device note'}); notes.value=d.note||'';
  const history=Array.isArray(d.watchHistory)?d.watchHistory.slice(0,20):[];
  const grid=element('div',{class:'details-grid'},[
    field('Platform',d.platform),field('Last seen',relativeTime(d.lastActiveAt)),field('Device identity',d.deviceId,true),
    field('Requested',d.requestedAt?new Date(d.requestedAt).toLocaleString():''),field('Approved',d.approvedAt?new Date(d.approvedAt).toLocaleString():''),
    ...(d.legacyDeviceId?[field('Previous installation ID',d.legacyDeviceId,true)]:[]),
    ...(!d.ownerUid?[field('Migration required','This is an older unbound record. Approve its new authenticated request in the updated app; do not grant access based on its IP.',true)]:[]),
    element('div',{class:'detail-field wide'},[element('label',{for:'access-mode'},'Access policy'),mode,element('p',{class:'mode-note'},'Permanent access has no expiry. Only this device is approved.')]),duration,
    element('div',{class:'detail-field wide'},[element('label',{for:'device-note'},'Private note'),notes,element('div',{class:'note-actions'},[element('button',{class:'text-button',type:'button',onClick:()=>run(async()=>{await updateDoc(doc(db,'device_requests',id),{note:notes.value.trim()});toast('Note saved.');})},'Save note'),element('button',{class:'text-danger',type:'button',onClick:async()=>{if(await confirmAction('Delete device record?','The updated app will need a new approval. Pausing access is reversible and keeps its history.')) await run(async()=>{await deleteDoc(doc(db,'device_requests',id));$('details').close();toast('Device record deleted.');});}},'Delete record')])]),
    element('div',{class:'detail-field wide'},[element('label',{},'Recent viewing'),element('div',{class:'activity-list'},history.length?history.map(item=>element('div',{class:'activity-entry'},[element('strong',{},item.title||'Untitled'),element('span',{},relativeTime(item.updatedAt))])):[element('p',{},'No viewing activity recorded.')])])]);
  $('detail-content').replaceChildren(element('span',{class:`badge ${statusOf(d)}`},statusLabel(statusOf(d))),grid);
  $('revoke').disabled=d.status==='rejected'; $('approve').disabled=!d.ownerUid;
  $('approve').textContent=d.status==='approved'?'Save access policy':'Approve device';
  if(!$('details').open) $('details').showModal();
}
async function run(operation) {
  if(state.busy || !state.authorized) return;
  state.busy=true; const buttons=[...$('details').querySelectorAll('button')]; const disabled=buttons.map(b=>b.disabled); buttons.forEach(b=>b.disabled=true);
  try { await operation(); } catch(error) {
    $('detail-error').textContent=error.code==='permission-denied'?'Your admin permission is no longer available. Lock and sign in again.':'Could not save the change. Check your connection and retry.';
  } finally { state.busy=false; buttons.forEach((b,i)=>b.disabled=disabled[i]); }
}
function confirmAction(title,message) {
  return new Promise(resolve=>{
    const dialog=$('confirm'); $('confirm-title').textContent=title; $('confirm-message').textContent=message;
    let settled=false; const finish=value=>{if(settled)return;settled=true;dialog.close();$('accept-confirm').onclick=null;$('cancel-confirm').onclick=null;dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',close);resolve(value);};
    const cancel=event=>{event.preventDefault();finish(false);};const close=()=>finish(false);
    $('accept-confirm').onclick=()=>finish(true);$('cancel-confirm').onclick=()=>finish(false);dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',close);dialog.showModal();
  });
}
function listen() {
  state.unsub?.(); $('connection').className='connection';$('connection').textContent='Connecting…';
  state.unsub=onSnapshot(collection(db,'device_requests'),{includeMetadataChanges:true},snapshot=>{
    state.devices=snapshot.docs.map(d=>({...d.data(),deviceId:d.id})); $('load-error').hidden=true;
    $('connection').textContent=snapshot.metadata.fromCache?'Offline · cached':'Live updates'; $('connection').className=snapshot.metadata.fromCache?'connection':'connection live';
    render();
    if(state.selected && !state.devices.some(d=>d.deviceId===state.selected)) $('details').close();
  },(error)=>{if(error.code==='permission-denied'||error.code==='unauthenticated'){void lock('Console locked. Enter your admin PIN.');return;}$('connection').textContent='Connection unavailable';$('connection').className='connection';$('load-error').hidden=false;$('load-error').textContent='Device data could not be loaded. Check your console session and published Firestore rules, then refresh.';});
}
async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    return null;
  }
}
async function api(action,body) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try {
    const token=action==='login'?null:await auth.currentUser?.getIdToken();
    const response=await fetch(`/api/admin/${action}`,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});
    let data;if(typeof response.text==='function'){const text=await response.text();try{data=JSON.parse(text);}catch{const clean=text.replace(/<[^>]*>/g,'').trim();throw Error(response.ok?'Unexpected server response.':clean?('Server error ('+response.status+'): '+clean.slice(0,100)):('Server request failed with status '+response.status));}}else{data=await response.json();}if(!response.ok)throw Error(data.error||'Console request failed.');return data;
  }finally{clearTimeout(timer);}
}
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();if(pinBusy||$('pin').value.length!==4)return;pinBusy=true;$('sign-in').disabled=true;$('login-error').textContent='';$('keypad').querySelectorAll('button').forEach(button=>button.disabled=true);
  const pinValue=$('pin').value;
  try {
    let loggedIn=false;
    try {
      const {token}=await api('login',{pin:pinValue});
      if (token) {
        await signInWithCustomToken(auth,token);
        loggedIn=true;
      }
    } catch(apiErr) {
      // Backend server not available (e.g. static hosting on Vercel without env)
    }
    if(!loggedIn) {
      await ensureAuth();
      const snap=await getDocFromServer(doc(db,'admin_settings','security'));
      if(!snap.exists())throw Error('Security config not found in Firestore (admin_settings/security).');
      const data=snap.data();
      const targetPin=String(data.pin!==undefined?data.pin:(data.password!==undefined?data.password:'1234')).trim();
      if(pinValue!==targetPin)throw Error('Incorrect PIN.');
      state.authorized=true;
      try{sessionStorage.setItem('meflix_admin_auth','true');}catch{}
      $('account-email').textContent='PIN Verified (Firestore)';
      $('lock').hidden=true;
      $('workspace').hidden=false;
      listen();
    }
  }
  catch(error) { $('login-error').textContent=error.name==='AbortError'?'Connection timed out. Please retry.':error.message||'Unable to unlock console.'; }
  finally { pinBusy=false;$('sign-in').disabled=false;$('pin').value='';pinDots();$('keypad').querySelectorAll('button').forEach(button=>button.disabled=false); }
});
let pinBusy=false;
function pinDots(){const value=$('pin').value;$('pin-dots').setAttribute('aria-label',`${value.length} of 4 digits entered`);[...$('pin-dots').children].forEach((dot,i)=>dot.classList.toggle('filled',i<value.length));}
function digit(value){if(pinBusy||$('lock').hidden)return;$('login-error').textContent='';$('pin').value=($('pin').value+value).slice(0,4);pinDots();if($('pin').value.length===4)$('login-form').requestSubmit();}
$('keypad').addEventListener('click',event=>{const button=event.target.closest('[data-digit]');if(button)digit(button.dataset.digit);});
$('backspace').onclick=()=>{if(!pinBusy){$('pin').value=$('pin').value.slice(0,-1);$('login-error').textContent='';pinDots();}};
document.addEventListener('keydown',event=>{if($('lock').hidden||event.ctrlKey||event.metaKey||event.altKey)return;if(/^[0-9]$/.test(event.key)){event.preventDefault();digit(event.key);}else if(event.key==='Backspace'){event.preventDefault();$('backspace').click();}else if(event.key==='Enter'&&$('pin').value.length===4&&!pinBusy){event.preventDefault();$('login-form').requestSubmit();}});
const openSecurity=()=>{if(!state.authorized)return;for(const id of ['current-pin','new-pin','confirm-pin'])$(id).value='';$('pin-error').textContent='';$('security').showModal();};
$('security-nav').onclick=openSecurity;$('security-top').onclick=openSecurity;
async function loadRelease(){
  $('release-error').textContent='';
  try{const target=$('release-platform').value;const snap=await getDocFromServer(doc(db,'app_config',`version_${target}`));const data=snap.exists()?snap.data():{};
  $('release-name').value=data.versionName||'';$('release-code').value=data.versionCode||'';$('release-url').value=data.apkUrl||'';$('release-notes').value=Array.isArray(data.changelog)?data.changelog.join('\n'):'';$('release-force').checked=!!data.isForceUpdate;
  }catch{$('release-error').textContent='Could not load release settings.';}
}
$('updates-nav').onclick=()=>{if(state.authorized){$('updates').showModal();void loadRelease();}};
$('release-platform').onchange=()=>void loadRelease();
$('release-form').addEventListener('submit',async event=>{
  event.preventDefault();$('release-error').textContent='';
  const target=$('release-platform').value,code=Number($('release-code').value),url=$('release-url').value.trim();
  if(!Number.isSafeInteger(code)||code<1){$('release-error').textContent='Use a positive integer version code.';return;}
  try{if(new URL(url).protocol!=='https:')throw Error();}catch{$('release-error').textContent='Use a valid HTTPS download URL.';return;}
  $('publish-release').disabled=true;
  try{await setDoc(doc(db,'app_config',`version_${target}`),{platform:target,versionCode:code,versionName:$('release-name').value.trim(),apkUrl:url,changelog:$('release-notes').value.split('\n').map(line=>line.trim()).filter(Boolean).slice(0,40),isForceUpdate:$('release-force').checked,publishedAt:Date.now()},{merge:true});$('updates').close();toast('Release settings published.');}
  catch{$('release-error').textContent='Could not publish release settings. Check your session and retry.';}
  finally{$('publish-release').disabled=false;}
});
$('pin-form').addEventListener('submit',async event=>{
  event.preventDefault();$('pin-error').textContent='';
  if($('new-pin').value!==$('confirm-pin').value){$('pin-error').textContent='New PINs do not match.';return;}
  const currentPin=$('current-pin').value.trim(), newPin=$('new-pin').value.trim();
  $('save-pin').disabled=true;
  try{
    let changed=false;
    try {
      await api('pin',{currentPin,newPin});
      changed=true;
    } catch(apiErr) {
      // Backend API not available, update directly in Firestore
    }
    if(!changed) {
      const snap=await getDocFromServer(doc(db,'admin_settings','security'));
      const data=snap.exists()?snap.data():{};
      const targetPin=String(data.pin!==undefined?data.pin:(data.password!==undefined?data.password:'1234')).trim();
      if(currentPin!==targetPin)throw Error('Current PIN is incorrect.');
      if(newPin.length!==4)throw Error('Use exactly 4 digits.');
      if(newPin===currentPin)throw Error('Choose a different PIN.');
      await updateDoc(doc(db,'admin_settings','security'),{
        pin:newPin,
        pinVersion:(data.pinVersion||1)+1,
        changedAt:Date.now()
      });
    }
    await lock('PIN changed. Unlock using your new PIN.');
  }
  catch(error){$('pin-error').textContent=error.message||'Unable to change PIN.';}
  finally{$('save-pin').disabled=false;for(const id of ['current-pin','new-pin','confirm-pin'])$(id).value='';}
});
$('logout').onclick=()=>void lock(); $('refresh').onclick=()=>{if(state.authorized)listen();};
$('search').addEventListener('input',event=>{state.query=event.target.value;render();});
$('devices-nav').onclick=()=>{state.filter='all';state.query='';$('search').value='';render();};
$('details').addEventListener('close',()=>state.selected=null);
$('approve').onclick=()=>void run(async()=>{
  const id=state.selected, mode=$('access-mode').value;
  const patch=approvalPatch(mode,Number($('access-days').value));
  await updateDoc(doc(db,'device_requests',id),patch); $('details').close();toast(mode==='permanent'?'Device approved permanently.':'Access schedule saved.');
});
$('revoke').onclick=async()=>{
  const id=state.selected;
  if(await confirmAction('Pause device access?','This device will lock when it reconnects. Its saved record and viewing history stay available.')) await run(async()=>{await updateDoc(doc(db,'device_requests',id),{status:'rejected',revokedAt:Date.now(),isWatching:false});$('details').close();toast('Device access paused.');});
};
$('export').onclick=()=>{
  if(!state.authorized)return;
  const rows=[['Name','Device ID','Platform','Status','Expiry','Last active','Note'],...filteredDevices(state.devices,state.filter,state.query).map(d=>[d.name,d.deviceId,d.platform,statusOf(d),d.expiresAt?new Date(d.expiresAt).toISOString():'Permanent',d.lastActiveAt?new Date(d.lastActiveAt).toISOString():'',d.note])];
  const url=URL.createObjectURL(new Blob([rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));const a=element('a',{href:url,download:'meflix-devices.csv'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
await setPersistence(auth,browserLocalPersistence);
await ensureAuth().catch(()=>{});
onAuthStateChanged(auth,async user=>{
  const generation=++state.authGeneration;
  if(!user){stop();$('workspace').hidden=true;$('lock').hidden=false;return;}
  try{
    if(sessionStorage.getItem('meflix_admin_auth')==='true'){
      state.authorized=true;state.activity=Date.now();$('account-email').textContent='PIN Verified (Firestore)';$('lock').hidden=true;$('workspace').hidden=false;
      listen();
      return;
    }
  }catch{}
  try {
    if(user.isAnonymous)throw Error('Enter PIN');
    const claims=await user.getIdTokenResult();
    if(user.uid!=='meflix-admin-console'||claims.claims.admin!==true)throw Error('Enter PIN');
    await api('session');
    if(generation!==state.authGeneration)return;
    state.authorized=true;state.activity=Date.now();$('account-email').textContent='PIN protected';$('lock').hidden=true;$('workspace').hidden=false;
    listen();
  } catch {
    if(generation===state.authGeneration) {
      let isAuthed=false;
      try{isAuthed=sessionStorage.getItem('meflix_admin_auth')==='true';}catch{}
      if(isAuthed){
        state.authorized=true;$('lock').hidden=true;$('workspace').hidden=false;
        listen();
      }else{
        await lock('Console locked. Enter your admin PIN.');
      }
    }
  }
});
