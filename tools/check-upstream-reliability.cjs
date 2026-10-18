const assert = require('node:assert/strict');
const { createTransport, ServiceError } = require('../lib/upstream');
const { validManifest, readMediaStart, rewriteManifest } = require('../netmirror-service');
const validateUrl = async value => new URL(value);
function responseAt(body, path = 'https://cdn.example/media', options) {
  const response = new Response(body, options);
  Object.defineProperty(response, 'url', { value: path });
  return response;
}
const resetBody = () => new ReadableStream({ start(controller) { controller.error(new Error('reset after headers')); } });
async function main() {
  let calls = 0, sleeps = [];
  let request = createTransport({ validateUrl, sleep: async ms => sleeps.push(ms), fetchImpl: async () => {
    calls++; return calls < 3 ? new Response('temporary', { status: 503 }) : new Response('ready');
  } });
  assert.equal(await (await request('https://provider.example/test')).text(), 'ready');
  assert.equal(calls, 3); assert.deepEqual(sleeps, [250,500]);
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => { calls++; throw new TypeError('socket unavailable'); } });
  await assert.rejects(request('https://provider.example/test'), error => error.code === 'SOURCE_UNAVAILABLE' && error.retryable);
  assert.equal(calls, 3, 'A persistent outage must stop after three attempts');
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => { calls++; return new Response('denied', { status: 403 }); } });
  await assert.rejects(request('https://provider.example/test'), error => error.code === 'UPSTREAM_FORBIDDEN' && error.upstreamStatus === 403 && !error.retryable);
  assert.equal(calls, 1, 'Authentication/permission failures must not be blindly retried');
  const seen = [];
  request = createTransport({ validateUrl, fetchImpl: async (url, options) => {
    seen.push({ origin: url.origin, headers: options.headers });
    return seen.length === 1 ? new Response('', { status: 302, headers: { Location: 'https://cdn.example/stream' } }) : new Response('media');
  } });
  await request('https://provider.example/stream', { headers: { Usertoken: 'test-token', Otp: 'test-code', Cookie: 'test', Referer: 'https://provider.example/' } });
  assert.equal(seen[1].headers.has('Usertoken'), false);
  assert.equal(seen[1].headers.has('Otp'), false);
  assert.equal(seen[1].headers.has('Cookie'), false);
  assert.equal(seen[1].headers.get('Referer'), 'https://provider.example/');
  calls = 0;
  const controller = new AbortController(); controller.abort(new Error('cancelled'));
  request = createTransport({ validateUrl, fetchImpl: async () => { calls++; return new Response('no'); } });
  await assert.rejects(request('https://provider.example/test', { signal: controller.signal }), /cancelled/);
  assert.equal(calls, 0);
  assert.throws(() => validManifest('<html>Unavailable</html>'), error => error instanceof ServiceError && error.code === 'SOURCE_UNAVAILABLE');
  assert.throws(() => validManifest('#EXTM3U\n#EXT-X-VERSION:3\n'));
  assert.ok(validManifest('\uFEFF#EXTM3U\n#EXTINF:5,\nsegment.ts\n').startsWith('#EXTM3U'));
  // Header and body failures consume one shared budget, not nested budgets.
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => {
    calls++;
    if (calls === 1) return new Response('temporary', { status: 503 });
    return calls === 2 ? new Response(resetBody()) : new Response('{"ready":true}');
  } });
  assert.deepEqual(await request('https://provider.example/data', { attempts: 3, consume: response => response.json() }), { ready: true });
  assert.equal(calls, 3, 'HTTP and JSON body errors share the three-attempt limit');
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => { calls++; return new Response(resetBody()); } });
  await assert.rejects(request('https://provider.example/data', { attempts: 2, consume: response => response.json() }), error => error.retryable);
  assert.equal(calls, 2, 'Persistent body failure exhausts exactly the configured attempts');
  const redirected = [];
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async (url, options) => {
    redirected.push({ origin: url.origin, headers: options.headers });
    if (url.origin === 'https://provider.example') return new Response('', { status: 302, headers: { Location: 'https://cdn.example/data' } });
    return redirected.length === 2 ? new Response(resetBody()) : new Response('ready');
  } });
  assert.equal(await request('https://provider.example/data', { attempts: 2, headers: { Usertoken: 'test-token', Authorization: 'test-secret' }, consume: response => response.text() }), 'ready');
  assert.equal(redirected.length, 4);
  assert.ok(redirected.filter(x => x.origin === 'https://cdn.example').every(x => !x.headers.has('Usertoken') && !x.headers.has('Authorization')), 'Redirect credential stripping must survive whole-body retries');
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => {
    calls++; return responseAt(calls === 1 ? resetBody() : '#EXTM3U\n#EXTINF:5,\nsegment.ts\n', 'https://cdn.example/index.m3u8');
  } });
  const playlist = await request('https://cdn.example/index.m3u8', { attempts: 2, consume: response => readMediaStart(response, 'hls') });
  assert.match(playlist.text, /segment.ts/); assert.equal(calls, 2, 'Manifest preflight must retry a header-success/body-reset failure');
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => {
    calls++; return responseAt(calls === 1 ? resetBody() : new Uint8Array([1,2,3,4]));
  } });
  const segment = await request('https://cdn.example/segment.ts', { attempts: 3, consume: readMediaStart });
  assert.deepEqual([...segment.first.value], [1,2,3,4]); assert.equal(calls, 2, 'A failed first segment chunk may be retried before downstream headers');
  assert.equal((await segment.reader.read()).done, true, 'First chunk must not be duplicated in the remainder');
  segment.reader.releaseLock();
  calls = 0;
  request = createTransport({ validateUrl, sleep: async () => {}, fetchImpl: async () => {
    calls++;
    let reads = 0;
    const reader = { read: async () => { if (++reads === 1) return { done: false, value: new Uint8Array([7,8]) }; throw new Error('reset after emitted bytes'); }, cancel: async () => {}, releaseLock() {} };
    return { ok: true, status: 200, url: 'https://cdn.example/segment.ts', headers: new Headers(), body: { getReader: () => reader } };
  } });
  const started = await request('https://cdn.example/segment.ts', { consume: readMediaStart });
  assert.deepEqual([...started.first.value], [7,8]);
  await assert.rejects(started.reader.read(), /after emitted bytes/);
  assert.equal(calls, 1, 'A segment remainder must never be replayed by transport after output starts');

  // Children keep the API origin selected when this playback was resolved.
  const session = { resources: new Map(), resourceKeys: new Map(), token: 'test-token' };
  rewriteManifest('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\nsegment.ts\n', 'https://cdn.example/index.m3u8', session, 'https://provider.example/', 'https://provider.example');
  assert.ok([...session.resources.values()].every(entry => entry.apiOrigin === 'https://provider.example'));
  const fs = require('node:fs'), vm = require('node:vm'), { createRequire } = require('node:module');
  const serviceRequire = createRequire(require.resolve('../netmirror-service'));
  const mediaRequests = [];
  const sandbox = { module: { exports: {} }, URL, AbortSignal, Buffer, console,
    require(name) {
      if (name === 'node:dns/promises') return { lookup: async () => [{ address: '8.8.8.8' }] };
      if (name === './lib/catalog-cache') return { read() { return null; }, write() {} };
      if (name === './lib/upstream') return { ServiceError, createTransport: config => createTransport({ ...config, sleep: async () => {}, fetchImpl: async (url, options) => {
        assert.notEqual(url.hostname, 'mobiledetect.app', 'Ongoing media must never trigger discovery');
        mediaRequests.push({ url, headers: options.headers }); return responseAt('segment', url.href);
      } }) };
      return serviceRequire(name);
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../netmirror-service'), 'utf8') + '\nmodule.exports.sourceRequest = sourceRequest;', sandbox);
  for (const entry of session.resources.values()) await sandbox.module.exports.sourceRequest(entry, session);
  await sandbox.module.exports.sourceRequest({ url: 'https://provider.example/segment.ts', apiOrigin: 'https://provider.example' }, session);
  assert.ok(mediaRequests.slice(0, 2).every(request => !request.headers.has('Usertoken')), 'CDN requests must not receive API credentials');
  assert.equal(mediaRequests.at(-1).headers.get('Usertoken'), 'test-token', 'Captured API host still receives its session token');
  console.log('PASS: bounded shared header/body retries, JSON/manifest/first-chunk recovery, no segment replay, captured media origin, redirect credentials, cancellation, and invalid playlists');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
