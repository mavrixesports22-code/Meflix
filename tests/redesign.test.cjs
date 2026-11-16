const {test}=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./console-harness.cjs');
test('expired and paused filters remain accessible and approved count excludes expired access',async()=>{
  const x=await setup({devices:[{deviceId:'a',name:'Expired account',status:'approved',expiresAt:Date.now()-1000},{deviceId:'b',name:'Paused account',status:'rejected'}]});await x.login();
  assert.equal(x.document.getElementById('count-approved').textContent,'0');
  x.click('tab-expired');await x.flush();assert.match(x.document.getElementById('device-list').textContent,/Expired account/);assert.doesNotMatch(x.document.getElementById('device-list').textContent,/Paused account/);
  x.click('tab-rejected');await x.flush();assert.match(x.document.getElementById('device-list').textContent,/Paused account/);
});
test('three-hour trial expires after three hours instead of rounding to a 30-day pass',async()=>{
  const x=await setup();await x.login();x.document.querySelector('[aria-label="Manage Living room TV"]').click();await x.flush();
  x.document.querySelector('[data-days="0.125"]')?.click();
  const trial=[...x.document.querySelectorAll('.duration-option')].find(button=>button.textContent.includes('3 hours'));trial.click();await x.flush();x.click('approve');await x.flush();
  assert.equal(x.writes[0].patch.expiresAt-x.writes[0].patch.approvedAt,3*60*60*1000);
});
test('connected TVs show account identity and unpair requires explicit confirmation',async()=>{
  const x=await setup({tvSessions:[{accountUid:'device-a',sessionId:'reviewed',deviceName:'Living room Fire TV',connectedAt:Date.now()}]});await x.login();x.click('tab-tvs');await x.flush();
  assert.match(x.document.querySelector('.tv-session-list').textContent,/Living room Fire TV/);
  [...x.document.querySelectorAll('button')].find(button=>button.textContent==='Unpair TV').click();await x.flush();
  assert.equal(x.api.some(row=>row.url.endsWith('/unpair-tv')),false);assert.equal(x.document.getElementById('confirm').open,true);
  x.click('accept-confirm');await x.flush();
  const sent=x.api.find(row=>row.url.endsWith('/unpair-tv'));assert.deepEqual(JSON.parse(sent.options.body),{accountUid:'device-a',sessionId:'reviewed'});
  assert.equal(x.writes.length,0,'unpair must not change approval or phone records');
});
test('failed unpair keeps confirmation open and displays an actionable error',async()=>{
  const x=await setup({unpairFails:true,tvSessions:[{accountUid:'device-a',sessionId:'old',deviceName:'TV'}]});await x.login();x.click('tab-tvs');await x.flush();
  [...x.document.querySelectorAll('button')].find(button=>button.textContent==='Unpair TV').click();await x.flush();x.click('accept-confirm');await x.flush();
  assert.equal(x.document.getElementById('confirm').open,true);assert.match(x.document.getElementById('confirm').textContent,/changed/);
});
