const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

test('local startup loads private env files with shell > .env.local > .env precedence', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'meflix-env-test-'));
  try {
    fs.writeFileSync(path.join(directory, '.env.local'), 'MEFLIX_TEST_VALUE=local\nMEFLIX_TEST_SHELL=file\n');
    fs.writeFileSync(path.join(directory, '.env'), 'MEFLIX_TEST_VALUE=base\nMEFLIX_TEST_DEFAULT=base\n');
    const script = `require(${JSON.stringify(require.resolve('../lib/local-env.cjs'))}).loadLocalEnvironment(${JSON.stringify(directory)}); console.log(JSON.stringify([process.env.MEFLIX_TEST_VALUE,process.env.MEFLIX_TEST_SHELL,process.env.MEFLIX_TEST_DEFAULT]));`;
    const env = { ...process.env, MEFLIX_TEST_SHELL: 'shell' };
    delete env.MEFLIX_TEST_VALUE; delete env.MEFLIX_TEST_DEFAULT;
    const result = spawnSync(process.execPath, ['-e', script], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), ['local', 'shell', 'base']);
  } finally {
    fs.unlinkSync(path.join(directory, '.env.local'));
    fs.unlinkSync(path.join(directory, '.env'));
    fs.rmdirSync(directory);
  }
});

function credentialFixture() {
  let fail = true, tokenCalls = 0, firestoreCalls = 0, appCalls = 0;
  const credential = { getAccessToken: async () => { tokenCalls++; if (fail) throw Error('NO_ADC_FOUND'); return { access_token: 'test-token' }; } };
  const imports = {
    'firebase-admin/app': { getApps: () => [], applicationDefault: () => credential, cert: () => credential, initializeApp: () => { appCalls++; return {}; } },
    'firebase-admin/auth': { getAuth: () => ({}) },
    'firebase-admin/firestore': { initializeFirestore: () => { firestoreCalls++; return {}; } },
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../lib/firebase-admin-client.cjs'), 'utf8'), {
    module, exports: module.exports, process: { env: {} }, require: name => imports[name],
  });
  return { ...module.exports, recover: () => { fail = false; }, counts: () => ({ tokenCalls, firestoreCalls, appCalls }) };
}

test('missing ADC is handled before any Firestore RPC client starts, and configuration can retry', async () => {
  const f = credentialFixture();
  await assert.rejects(f.loadFirebaseAdmin('test-admin'), /server credentials are unavailable/);
  assert.deepEqual(f.counts(), { tokenCalls: 1, firestoreCalls: 0, appCalls: 0 });
  f.recover(); await f.loadFirebaseAdmin('test-admin');
  assert.deepEqual(f.counts(), { tokenCalls: 2, firestoreCalls: 1, appCalls: 1 });
});

test('simultaneous PIN/session requests share one Firebase initialization', async () => {
  const f = credentialFixture(); f.recover();
  const [first, second] = await Promise.all([f.loadFirebaseAdmin('test-admin'), f.loadFirebaseAdmin('test-admin')]);
  assert.equal(first, second);
  assert.deepEqual(f.counts(), { tokenCalls: 1, firestoreCalls: 1, appCalls: 1 });
});

test('a PIN request with missing credentials returns 503 rather than rejecting the server handler', async () => {
  const { AccessError } = require('../lib/admin-auth.cjs');
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../lib/admin-backend.cjs'), 'utf8'), {
    module, exports: module.exports, process: { env: {} }, URL, Buffer,
    require: name => ({
      './firebase-admin-client.cjs': { loadFirebaseAdmin: async () => { throw Error('NO_ADC_FOUND'); } },
      './admin-auth.cjs': { AccessError }, './admin-tv.cjs': {},
    })[name],
  });
  const response = { setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  assert.equal(await module.exports.handleAdmin({
    url: '/api/admin/login', method: 'POST', headers: { 'content-type': 'application/json' }, body: { pin: '1234' },
  }, response), true);
  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /\.env.local/);
  assert.doesNotMatch(response.body.error, /NO_ADC_FOUND/);
});
