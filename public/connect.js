const raw=new URL(location.href).searchParams.get('code')||'';
const code=raw.toUpperCase().replace(/[\s-]/g,'');
history.replaceState(null,'',location.pathname);
if(/^[A-HJ-NP-Z2-9]{8}$/.test(code)){
 document.getElementById('code').textContent=code.slice(0,4)+'-'+code.slice(4);
 const open=document.getElementById('open');open.href='meflix://tv?code='+encodeURIComponent(code);open.hidden=false;
}else document.getElementById('code').textContent='Refresh the code on your TV.';
