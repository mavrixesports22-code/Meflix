const{test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const{handler}=require('../server');
test('only admin assets are served; repository, media APIs and secrets stay unreachable',async t=>{const server=http.createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base=`http://127.0.0.1:${server.address().port}`;
for(const path of ['/','/admin.js','/model.js','/google-signin.html','/google-signin.js','/google-signin.css']){const res=await fetch(base+path);assert.equal(res.status,200);assert.match(res.headers.get('content-security-policy'),/frame-ancestors 'none'/);}
for(const path of ['/.git/config','/.env','/firestore.rules','/api/netmirror/search','/js/app.js','/assets/anything','/server.js'])assert.equal((await fetch(base+path)).status,404,path);
assert.equal((await fetch(base+'/',{method:'POST'})).status,405);});

test('TV administration endpoints never accept unauthenticated listing or unpairing',async t=>{
 const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(base+'/api/admin/tv-sessions')).status,401);
 assert.equal((await fetch(base+'/api/admin/unpair-tv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountUid:'a',sessionId:'x'})})).status,401);
});
