const{test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const{handler}=require('../server');
test('only admin assets are served; repository, media APIs and secrets stay unreachable',async t=>{const server=http.createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base=`http://127.0.0.1:${server.address().port}`;
for(const path of ['/','/admin.js','/model.js']){const res=await fetch(base+path);assert.equal(res.status,200);assert.match(res.headers.get('content-security-policy'),/frame-ancestors 'none'/);}
for(const path of ['/.git/config','/.env','/firestore.rules','/api/netmirror/search','/js/app.js','/assets/anything','/server.js'])assert.equal((await fetch(base+path)).status,404,path);
assert.equal((await fetch(base+'/',{method:'POST'})).status,405);});
