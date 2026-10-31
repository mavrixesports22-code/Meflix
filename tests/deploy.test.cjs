const{test}=require('node:test');const assert=require('node:assert/strict');const{spawnSync}=require('node:child_process');const fs=require('node:fs');const{Readable}=require('node:stream');const{jsonBody}=require('../lib/admin-backend.cjs');
test('Vercel ignore rules retain all static assets, functions and build inputs',()=>{
 for(const file of ['public/index.html','public/admin.css','public/admin.js','public/model.js','public/firebase-config.js','api/admin/[action].js','lib/admin-auth.cjs','lib/admin-backend.cjs','tools/build-admin.cjs','package.json','package-lock.json']){
  assert.ok(fs.existsSync(file),file);
  const check=spawnSync('git',['-c','core.excludesFile=.vercelignore','check-ignore','--no-index',file],{encoding:'utf8'});
  assert.equal(check.status,1,`${file} must be uploaded: ${check.stdout} ${check.stderr}`);
 }
 assert.equal(JSON.parse(fs.readFileSync('package.json')).engines.node,'24.x');
});
test('PIN API accepts both Vercel-parsed JSON and native Node request streams',async()=>{
 assert.deepEqual(await jsonBody({body:{pin:'2468'}}),{pin:'2468'});
 assert.deepEqual(await jsonBody({body:'{"pin":"2468"}'}),{pin:'2468'});
 assert.deepEqual(await jsonBody(Readable.from([Buffer.from('{"pin":"2468"}')])),{pin:'2468'});
 await assert.rejects(jsonBody({body:{pin:'1'.repeat(3000)}}),e=>e.status===413);
 await assert.rejects(jsonBody({body:null}),e=>e.status===400);
});
