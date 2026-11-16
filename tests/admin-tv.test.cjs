const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAdminTV } = require('../lib/admin-tv.cjs');
function fixture() {
  const record = { status: 'active', sessionId: 'reviewed-session', installationId: 'private-installation', deviceName: 'Living room Fire TV', connectedAt: 123 };
  const writes=[];
  const db={doc:path=>path,collection:()=>({where:()=>({limit:()=>({get:async()=>({docs:[{id:'account-a',data:()=>record}]})})})}),
    runTransaction:async callback=>callback({get:async()=>({data:()=>record}),update:(path,patch)=>{writes.push({path,patch});Object.assign(record,patch);}})};
  return {service:createAdminTV(db,()=>999),record,writes};
}
test('admin TV listing exposes only device metadata and the reviewed session',async()=>{
  const {service}=fixture();const result=await service.list();
  assert.deepEqual(result.sessions,[{accountUid:'account-a',sessionId:'reviewed-session',deviceName:'Living room Fire TV',connectedAt:123}]);
  assert.equal(result.sessions[0].installationId,undefined);
});
test('admin unpair signs out only the reviewed TV session, with idempotent retry',async()=>{
  const {service,writes}=fixture();
  await service.unpair({accountUid:'account-a',sessionId:'reviewed-session'});
  await service.unpair({accountUid:'account-a',sessionId:'reviewed-session'});
  assert.deepEqual(writes,[{path:'tv_sessions/account-a',patch:{status:'signed_out',signedOutAt:999}}]);
});
test('stale admin confirmation cannot unpair a replacement TV',async()=>{
  const {service,record,writes}=fixture();record.sessionId='replacement-session';
  await assert.rejects(service.unpair({accountUid:'account-a',sessionId:'reviewed-session'}),error=>error.status===409);
  assert.equal(writes.length,0);
});
test('admin TV mutation rejects invalid account paths and missing session IDs',async()=>{
  const {service}=fixture();
  for(const body of [{accountUid:'../other',sessionId:'x'},{accountUid:'a'},{sessionId:'x'}])
    await assert.rejects(service.unpair(body),error=>error.status===400);
});
