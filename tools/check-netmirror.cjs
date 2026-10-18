// Optional live smoke test: NETMIRROR_TEST_OTP must be supplied by the operator.
// Authentication tokens and upstream signed media URLs are never printed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { isPrivate, rewriteManifest, cardFrom, playbackResult } = require('../netmirror-service');
async function checkPlayerFlow(useHls = false) {
  const elements = new Map();
  class Element {
    constructor() {
      this.hidden = true; this.value = ''; this.style = {}; this.attributes = {}; this.options = [];
      this.paused = true; this.currentTime = 0; this.duration = 120; this.tagName = 'DIV';
      const classes = new Set();
      this.classList = { add: (...items) => items.forEach(x => classes.add(x)), remove: (...items) => items.forEach(x => classes.delete(x)), contains: x => classes.has(x) };
    }
    replaceChildren() { this.options = []; this.value = ''; }
    add(option) { this.options.push(option); if (this.options.length === 1 || option.selected) this.value = option.value; }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key] || null; }
    removeAttribute(key) { delete this.attributes[key]; }
    contains() { return false; }
    focus() {}
    canPlayType() { return 'probably'; }
    pause() { this.paused = true; this.onpause?.(); }
    play() { if (this.playError) return Promise.reject(this.playError); this.paused = false; this.onplaying?.(); return Promise.resolve(); }
    load() {}
  }
  const document = { body: new Element(), activeElement: null, fullscreenElement: null,
    getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); } };
  let authenticated = false;
  const selectedEpisodes = [];
  const sandbox = { document, AbortController, setTimeout, clearTimeout, Option: class { constructor(text, value) { this.text = text; this.value = value; } }, localStorage: { getItem() { return null; }, setItem() {} },
    window: { addEventListener() {} },
    async fetch(path, options = {}) {
      let status = 200, data;
      const route = path.slice('/api/netmirror/'.length);
      if (route.startsWith('search')) data = { results: [{ id: '100', title: 'Example' }] };
      else if (route.startsWith('title')) data = { title: 'Example', seasons: [{ id: '200', s: 'Season 1' }], episodes: [] };
      else if (route.startsWith('episodes')) data = { episodes: [{ id: '301', ep: '1', t: 'One' }, { id: '302', ep: '2', t: 'Two' }] };
      else if (route === 'auth' && options.method === 'POST') { authenticated = true; data = { authenticated: true }; }
      else if (route === 'auth') data = { instructionImage: 'https://service.example/login.jpg' };
      else if (route.startsWith('playback')) {
        selectedEpisodes.push(new URLSearchParams(route.split('?')[1]).get('id'));
        if (!authenticated) { status = 401; data = { error: 'Login required', code: 'AUTH_REQUIRED' }; }
        else data = { title: 'Example', episode: 'Two', url: '/api/netmirror/media/example' };
      } else throw Error('Unexpected test request');
      return { ok: status === 200, json: async () => data };
    }
  };
  class FakeHls {
    static isSupported() { return true; }
    static Events = { MANIFEST_PARSED: 'manifest', ERROR: 'error' };
    static ErrorTypes = { MEDIA_ERROR: 'media' };
    constructor() { this.listeners = {}; }
    on(event, handler) { this.listeners[event] = handler; }
    loadSource(url) { this.source = url; }
    attachMedia(video) { this.video = video; this.listeners.manifest(); }
    destroy() { this.destroyed = true; }
  }
  if (useHls) { sandbox.Hls = FakeHls; sandbox.window.Hls = FakeHls; }
  const playerJs = fs.existsSync('js/netmirror-player.js') ? 'js/netmirror-player.js' : (fs.existsSync('netflix/js/netmirror-player.js') ? 'netflix/js/netmirror-player.js' : require('node:path').join(__dirname, '../js/netmirror-player.js'));
  vm.runInNewContext(fs.readFileSync(playerJs, 'utf8') + '\nthis.Player = NetMirrorPlayer;', sandbox);
  const player = new sandbox.Player();
  await player.open({ title: 'Example' }, 'Episode 2', 2);
  assert.equal(elements.get('player-auth').hidden, false, 'Play must request login when the service requires it');
  elements.get('player-otp').value = '123456';
  await elements.get('player-auth-form').onsubmit({ preventDefault() {} });
  assert.equal(elements.get('player-auth').hidden, true);
  assert.equal(player.playId, '302', 'OTP recovery must preserve the selected real episode');
  if (useHls) {
    assert.ok(player.hls instanceof FakeHls, 'MSE must be preferred even when canPlayType advertises native HLS');
    assert.equal(player.hls.source, '/api/netmirror/media/example');
    assert.equal(player.video.src, undefined, 'Do not feed the HLS URL directly to Chromium');
  } else assert.equal(player.video.src, '/api/netmirror/media/example');
  assert.equal(player.video.paused, false);
  player.skip(10); assert.equal(player.video.currentTime, 10);
  player.toggle(); assert.equal(player.video.paused, true);
  player.video.playError = Object.assign(new Error('Unsupported format'), { name: 'NotSupportedError' });
  await player.startPlayback();
  assert.ok(elements.get('player-status-text').textContent.includes('stream format'));
  assert.equal(elements.get('player-retry').hidden, false);
  player.video.playError.name = 'NotAllowedError';
  await player.startPlayback();
  assert.equal(elements.get('player-status-text').textContent, 'Press Play to start the video.');
  assert.equal(elements.get('player-retry').hidden, true);
  assert.deepEqual(selectedEpisodes, ['302', '302']);
  player.close();
  assert.equal(player.overlay.classList.contains('active'), false);
  assert.equal(player.playId, null);
  console.log('PASS: ' + (useHls ? 'MSE preference' : 'native HLS fallback') + ', login recovery, controls, error classification, cleanup');
}
async function main() {
  assert.equal(isPrivate('127.0.0.1'), true);
  assert.equal(isPrivate('10.1.1.1'), true);
  assert.equal(isPrivate('169.254.169.254'), true);
  assert.equal(isPrivate('::1'), true);
  assert.equal(isPrivate('8.8.8.8'), false);
  const seededCard = cardFrom('82813021');
  assert.equal(seededCard.backdrop, 'https://imgcdn.kim/poster/h/82813021.jpg', 'Public artwork uses the browser path instead of blocked Vercel egress');
  assert.equal(seededCard.poster, 'https://imgcdn.kim/poster/v/82813021.jpg');
  {
    const calls = [];
    const response = await playbackResult('episode-1', { token: 'session-token' }, async (...args) => {
      calls.push(args);
      return calls.length === 1
        ? { data: { status: 'unavailable' }, apiOrigin: 'https://old.example' }
        : { data: { status: 'ok', video_link: 'https://cdn.example/video.m3u8' }, apiOrigin: 'https://new.example' };
    }, async (_signal, refresh) => { assert.equal(refresh, true); return 'https://new.example'; });
    assert.equal(calls.length, 2, 'No-player response retries once only after discovery changes host');
    assert.equal(calls[1][4], 'https://new.example');
    assert.equal(response.data.status, 'ok');
  }
  const session = { resources: new Map(), resourceKeys: new Map() };
  const rewritten = rewriteManifest('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\nclip.ts?part=1\n', 'https://media.example/season/index.m3u8', session, 'https://example.com');
  assert.equal(session.resources.size, 2);
  assert.ok(rewritten.includes('URI="/api/netmirror/media/'));
  assert.ok(!rewritten.includes('clip.ts'));
  rewriteManifest('clip.ts?part=1', 'https://media.example/season/index.m3u8', session, 'https://example.com');
  assert.equal(session.resources.size, 2, 'Manifest reloads must reuse media handles');
  const htmlPath = fs.existsSync('index.html') ? 'index.html' : (fs.existsSync('netflix/index.html') ? 'netflix/index.html' : require('node:path').join(__dirname, '../index.html'));
  const playerPath = fs.existsSync('js/netmirror-player.js') ? 'js/netmirror-player.js' : (fs.existsSync('netflix/js/netmirror-player.js') ? 'netflix/js/netmirror-player.js' : require('node:path').join(__dirname, '../js/netmirror-player.js'));
  const html = fs.readFileSync(htmlPath, 'utf8');
  const player = fs.readFileSync(playerPath, 'utf8');
  for (const [,id] of player.matchAll(/getElementById\('([^']+)'\)/g)) assert.ok(html.includes(`id="${id}"`), `Missing player control: ${id}`);
  console.log('PASS: manifest rewriting, resource reuse, host restrictions, and player control markup');
  await checkPlayerFlow();
  await checkPlayerFlow(true);
  if (!process.env.NETMIRROR_TEST_OTP) return;
  const base = 'http://localhost:5173';
  let cookie = '';
  async function api(route, options = {}) {
    const response = await fetch(base + '/api/netmirror/' + route, { ...options, headers: { Cookie: cookie, ...options.headers } });
    if (route === 'auth' && options.method === 'POST') assert.ok(response.headers.get('set-cookie'), 'Successful login must issue its session cookie');
    else assert.equal(response.headers.get('set-cookie'), null, 'Read requests must not replace the authenticated session');
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const data = await response.json();
    assert.equal(response.ok, true, `${route.split('?')[0]} failed: ${data.error}`);
    return data;
  }
  const denied = await fetch(base + '/api/netmirror/playback?id=80077368');
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get('set-cookie'), null, 'Denied anonymous playback must not create a cookie');
  const invalid = await fetch(base + '/api/netmirror/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp: 'not-a-code' }) });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get('set-cookie'), null, 'Invalid login must not create a cookie');
  await api('auth');
  const auth = await api('auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp: process.env.NETMIRROR_TEST_OTP }) });
  assert.equal(auth.authenticated, true);
  const search = await api('search?q=Stranger%20Things');
  const title = search.results.find(x => x.title === 'Stranger Things');
  assert.ok(title);
  const details = await api('title?id=' + title.id);
  const episodes = await api('episodes?id=' + details.seasons[0].id);
  assert.ok(episodes.episodes.length);
  const playback = await api('playback?id=' + episodes.episodes[0].id);
  let path = playback.url, manifestCount = 0;
  for (; manifestCount < 5; manifestCount++) {
    const response = await fetch(base + path, { headers: { Cookie: cookie } });
    assert.equal(response.ok, true, 'Media proxy failed');
    const text = await response.text();
    assert.ok(text.startsWith('#EXTM3U'), 'Expected HLS manifest');
    const lines = text.split('\n').filter(x => x && !x.startsWith('#'));
    assert.ok(lines.length);
    assert.ok(lines.every(x => x.startsWith('/api/netmirror/media/')), 'All media must use same-origin proxy');
    path = lines[0];
    if (text.includes('#EXTINF:')) break;
  }
  assert.ok(manifestCount < 5, 'Could not reach media playlist');
  const segment = await fetch(base + path, { headers: { Cookie: cookie, Range: 'bytes=0-1023' } });
  assert.ok(segment.ok, 'Media segment unavailable');
  const reader = segment.body.getReader();
  const chunk = await reader.read();
  assert.ok(chunk.value?.length > 0, 'Media segment empty');
  await reader.cancel();
  const isolated = await fetch(base + path);
  assert.equal(isolated.status, 401, 'Media must not be accessible without its authenticated session');
  await api('auth', { method: 'DELETE' });
  const loggedOut = await api('auth');
  assert.equal(loggedOut.authenticated, false);
  console.log('PASS: OTP, title search, real season/episode IDs, HLS playlists, media segment, session isolation, logout');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
