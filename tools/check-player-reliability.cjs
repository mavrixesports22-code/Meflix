// Deterministic lifecycle checks. No upstream traffic or OTP credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const WatchHistory = require(fs.existsSync(path.join(__dirname, '../js/watch-history.js')) ? '../js/watch-history.js' : '../netflix/js/watch-history.js');
const playerJs = fs.existsSync('js/netmirror-player.js') ? 'js/netmirror-player.js' : (fs.existsSync('netflix/js/netmirror-player.js') ? 'netflix/js/netmirror-player.js' : path.join(__dirname, '../js/netmirror-player.js'));
const source = fs.readFileSync(playerJs, 'utf8');
const tick = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function harness(useHls = true) {
  const elements = new Map(), timers = new Map(), requests = [], instances = [], storage = new Map();
  let timerId = 0, authenticated = true, routeHook;
  class Element {
    constructor() {
      Object.assign(this, { hidden: true, value: '', style: {}, attributes: {}, options: [], paused: true, currentTime: 0, duration: 120 });
      const classes = new Set();
      this.classList = { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x) };
    }
    replaceChildren() { this.options = []; this.value = ''; }
    add(option) { this.options.push(option); if (this.options.length === 1 || option.selected) this.value = option.value; }
    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k] || null; }
    removeAttribute(k) { delete this.attributes[k]; }
    contains() { return false; }
    focus() {}
    canPlayType() { return 'probably'; }
    pause() { this.paused = true; this.onpause?.(); }
    play() { this.paused = false; this.onplaying?.(); return Promise.resolve(); }
    load() { this.currentTime = 0; }
  }
  const document = { body: new Element(), getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); } };
  class Hls {
    static isSupported() { return useHls; }
    static Events = { MANIFEST_PARSED: 'manifest', ERROR: 'error', AUDIO_TRACKS_UPDATED: 'audioTracksUpdated', AUDIO_TRACK_SWITCHED: 'audioSwitched', SUBTITLE_TRACKS_UPDATED: 'subtitleTracksUpdated', SUBTITLE_TRACK_SWITCH: 'subtitleSwitch' };
    static ErrorTypes = { NETWORK_ERROR: 'network', MEDIA_ERROR: 'media' };
    constructor() { this.listeners = {}; instances.push(this); }
    on(name, fn) { this.listeners[name] = fn; }
    loadSource(url) { this.source = url; }
    attachMedia(video) { this.video = video; }
    destroy() { this.destroyed = true; }
    recoverMediaError() { this.recovered = (this.recovered || 0) + 1; }
    manifest() { this.video.onloadedmetadata?.(); this.listeners.manifest(); }
    network(status = 503) { this.listeners.error(null, { fatal: true, type: 'network', response: { code: status } }); }
  }
  const sandbox = { document, Hls, AbortController, window: { Hls, addEventListener() {} },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout(id) { timers.delete(id); },
    localStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, String(value)); } }, Option: class { constructor(text, value) { this.text = text; this.value = value; } },
    async fetch(path, options = {}) {
      const route = path.slice('/api/netmirror/'.length); requests.push(route);
      const custom = await routeHook?.(route, options);
      if (custom) return custom;
      let data, ok = true;
      if (route.startsWith('title?')) data = { title: 'Example', seasons: [{ id: 'season', s: 'Season 1' }], episodes: [] };
      else if (route.startsWith('episodes?')) data = { episodes: [{ id: 'one', ep: 1, t: 'One' }, { id: 'two', ep: 2, t: 'Two' }] };
      else if (route.startsWith('playback?')) {
        ok = authenticated;
        data = ok ? { title: 'Example', episode: 'Episode', url: '/media/' + requests.length } : { error: 'Connect again', code: 'AUTH_REQUIRED', retryable: false };
      } else if (route === 'auth' && options.method === 'POST') { authenticated = true; data = { authenticated: true }; }
      else if (route === 'auth') data = { message: 'Enter code', instructionImage: 'https://cdn.example/otp.jpg' };
      else throw Error('Unexpected route: ' + route);
      return { ok, json: async () => data };
    }
  };
  const history = new WatchHistory(sandbox.localStorage);
  sandbox.window.meflixHistory = history;
  vm.runInNewContext(source + '\nthis.Player = NetMirrorPlayer;', sandbox);
  const player = new sandbox.Player();
  return { player, elements, requests, instances, timers, storage, history,
    set hook(fn) { routeHook = fn; }, set authenticated(value) { authenticated = value; },
    async open() { await player.open({ title: 'Example', netmirrorId: 'title', selectedEpisode: 'two' }); },
    fireWatchdog() { const entry = [...timers].find(([, value]) => value.ms === 20000); assert.ok(entry, 'A watchdog must be armed'); timers.delete(entry[0]); entry[1].fn(); }
  };
}
async function main() {
  {
    const h = harness(); await h.open();
    h.instances[0].manifest();
    assert.equal(h.history.entries.length, 1, 'Real playing creates a history record');
    h.player.video.currentTime = 42;
    h.player.video.pause();
    assert.equal(h.history.entries[0].position, 42, 'Pause saves the current position without waiting for the throttle');
    assert.equal(h.history.entries[0].playId, 'two');
    assert.equal(h.history.entries[0].seasonId, 'season');
    const instance = h.instances[0];
    await h.player.minimize();
    assert.equal(h.player.overlay.classList.contains('minimized'), true);
    assert.ok(!instance.destroyed, 'Minimizing preserves the live media session');
    h.player.restore(); assert.equal(h.player.overlay.classList.contains('minimized'), false);
    h.player.video.currentTime = 47; h.player.close();
    assert.equal(h.history.entries[0].position, 47, 'Close saves before aborting the media generation');
    await h.open(); h.instances.at(-1).manifest();
    assert.equal(h.player.video.currentTime, 47, 'Stored history resumes the exact episode position');
    h.player.video.currentTime = 119; h.player.video.onended();
    assert.equal(h.history.entries[0].completed, true);
    assert.equal(h.history.continuing().length, 0);
    h.player.close();
  }
  {
    const h = harness(); await h.open(); const first = h.instances[0];
    first.subtitleTracks = [{ name: 'English [CC]', lang: 'en' }, { name: 'French', lang: 'fr' }];
    first.subtitleTrack = 0; first.manifest();
    assert.equal(first.subtitleDisplay, false, 'Captions default to Off even if the manifest selects a default');
    assert.equal(h.player.subtitleSelect.value, '-1'); assert.equal(h.player.subtitleSelect.options.length, 3);
    assert.equal(h.player.subtitleButton.disabled, false);
    h.player.video.currentTime = 42; h.player.subtitleButton.onclick();
    assert.equal(first.subtitleTrack, 0); assert.equal(first.subtitleDisplay, true);
    assert.equal(h.player.video.currentTime, 42); assert.equal(h.player.subtitleButton.getAttribute('aria-pressed'), 'true');
    const stale = first.listeners.subtitleTracksUpdated;
    first.network(403); await tick(); const next = h.instances[1];
    next.subtitleTracks = [{ name: 'French', lang: 'fr' }, { name: 'English [CC]', lang: 'en' }]; next.subtitleTrack = 0; next.manifest();
    assert.equal(next.subtitleTrack, 1, 'Caption language survives source recovery and reordered tracks');
    assert.equal(next.subtitleDisplay, true); assert.equal(h.player.video.currentTime, 42);
    stale(); assert.equal(h.player.subtitleSelect.value, '1', 'Old caption events cannot overwrite the current selection');
    h.player.subtitleSelect.value = '-1'; h.player.subtitleSelect.onchange();
    assert.equal(next.subtitleDisplay, false); assert.equal(next.subtitleTrack, -1);
    next.listeners.subtitleTracksUpdated(); assert.equal(next.subtitleDisplay, false, 'Off stays Off after track updates');
    assert.equal(JSON.parse(h.storage.get('netflix_subtitles')).enabled, false);
    assert.equal(h.player.video.style.objectFit, 'contain');
    h.player.fitSelect.value = 'cover'; h.player.fitSelect.onchange();
    assert.equal(h.player.video.style.objectFit, 'cover'); assert.equal(h.storage.get('netflix_video_fit'), 'cover');
    h.player.setVideoFit('stretch'); assert.equal(h.player.video.style.objectFit, 'contain', 'Unsupported fit never stretches the picture');
    const automatic = { line: 'auto', snapToLines: true }, authored = { line: 20, snapToLines: false }, bottom = { line: 90, snapToLines: false };
    h.player.video.textTracks = [{ mode: 'showing', activeCues: [automatic, authored, bottom] }];
    h.player.positionSubtitles(); assert.ok(automatic.line < 80); assert.equal(automatic.snapToLines, false); assert.equal(authored.line, 20); assert.equal(bottom.line, automatic.line);
    h.player.overlay.classList.add('idle'); h.player.positionSubtitles(); assert.equal(automatic.line, 'auto'); assert.equal(automatic.snapToLines, true); assert.equal(bottom.line, 90);
    assert.ok(!/netmirror/i.test(h.player.serviceText('Reconnect to NetMirror.')));
    h.player.close(); assert.equal(h.player.subtitleButton.disabled, true);
  }
  {
    const h = harness(false), listeners = new Map();
    const tracks = [{ kind: 'metadata', mode: 'hidden' }, { kind: 'captions', label: 'English', language: 'en', mode: 'disabled' }, { kind: 'subtitles', label: 'Hindi', language: 'hi', mode: 'disabled' }];
    tracks.addEventListener = (name, fn) => listeners.set(name, fn); tracks.removeEventListener = name => listeners.delete(name);
    h.player.video.textTracks = tracks; await h.open(); h.player.video.onloadedmetadata();
    h.player.subtitleSelect.value = '1'; h.player.subtitleSelect.onchange();
    assert.equal(tracks[1].mode, 'disabled'); assert.equal(tracks[2].mode, 'showing'); assert.equal(tracks[0].mode, 'hidden');
    h.player.toggleSubtitles(); assert.equal(tracks[2].mode, 'disabled');
    h.player.close(); assert.equal(listeners.size, 0);
  }
  {
    const h = harness(); await h.open(); h.instances[0].manifest();
    assert.equal(h.player.playButton.getAttribute('data-playing'), 'true');
    h.player.settingsButton.onclick();
    assert.equal(h.player.settingsPanel.hidden, false);
    assert.equal(h.player.settingsButton.getAttribute('aria-expanded'), 'true');
    h.player.closeSettings(true);
    assert.equal(h.player.settingsPanel.hidden, true);
    assert.equal(h.player.settingsButton.getAttribute('aria-expanded'), 'false');
    const volume = h.elements.get('player-vol-slider'), mute = h.elements.get('player-vol-btn');
    volume.oninput({ target: { value: '0.35' } });
    assert.equal(h.player.video.volume, .35); assert.equal(h.player.video.muted, false);
    mute.onclick(); assert.equal(mute.getAttribute('data-muted'), 'true'); assert.equal(mute.getAttribute('aria-label'), 'Unmute');
    mute.onclick(); assert.equal(mute.getAttribute('data-muted'), 'false'); assert.equal(volume.value, .35);
    h.player.video.duration = 9013; h.player.video.currentTime = 3661; h.player.updateTime();
    assert.equal(h.elements.get('player-timecode').textContent, '1:01:01 / 2:30:13');
    assert.equal(h.player.seek.getAttribute('aria-valuetext'), '1:01:01 of 2:30:13');
    h.player.toggle(); assert.equal(h.player.playButton.getAttribute('data-playing'), 'false');
    h.player.settingsButton.onclick(); h.player.close();
    assert.equal(h.player.settingsPanel.hidden, true, 'Closing playback must dismiss settings');
  }
  {
    const h = harness(); await h.open(); const old = h.instances[0];
    old.audioTracks = [{ name: 'English', lang: 'eng', default: true }, { name: 'Hindi', lang: 'hin' }, { name: 'Tamil', lang: 'tam' }];
    old.audioTrack = 0; old.manifest();
    const select = h.elements.get('player-audio-language');
    assert.equal(select.options.length, 3); assert.equal(select.disabled, false);
    h.player.video.currentTime = 35; select.value = '1'; select.onchange();
    assert.equal(old.audioTrack, 1); assert.equal(h.player.video.currentTime, 35);
    assert.equal(h.player.video.paused, false, 'Language change must not pause playback');
    assert.equal(JSON.parse(h.storage.get('netmirror_audio_language')).lang, 'hin');
    const staleAudio = old.listeners.audioTracksUpdated;
    old.network(403); await tick();
    const next = h.instances[1];
    next.audioTracks = [{ name: 'Hindi', lang: 'hin' }, { name: 'English', lang: 'eng', default: true }];
    next.audioTrack = 1; next.manifest();
    assert.equal(next.audioTrack, 0, 'Language must survive source refresh with reordered tracks');
    assert.equal(h.player.video.currentTime, 35);
    staleAudio(); assert.equal(select.options.length, 2, 'Old audio events cannot replace current choices');
    next.audioTracks = [{ name: 'English', lang: 'eng', default: true }]; next.audioTrack = 0;
    next.listeners.audioTracksUpdated();
    assert.equal(select.disabled, true, 'Single audio track is displayed without a fake language choice');
    assert.equal(select.value, '0');
    h.player.close(); assert.equal(select.disabled, true); assert.equal(select.options.length, 1);
  }
  {
    const h = harness(false), listeners = new Map();
    const tracks = [{ label: 'English', language: 'en', enabled: true }, { label: 'Hindi', language: 'hi', enabled: false }];
    tracks.addEventListener = (name, fn) => listeners.set(name, fn);
    tracks.removeEventListener = name => listeners.delete(name);
    h.player.video.audioTracks = tracks;
    await h.open(); h.player.video.onloadedmetadata();
    const select = h.elements.get('player-audio-language'); select.value = '1'; select.onchange();
    assert.equal(tracks[0].enabled, false); assert.equal(tracks[1].enabled, true);
    assert.equal(select.disabled, false);
    h.player.close(); assert.equal(listeners.size, 0, 'Native audio listeners must be removed on close');
  }
  {
    const h = harness(); await h.open(); h.instances[0].manifest();
    h.player.video.currentTime = 48; h.player.video.ontimeupdate();
    const oldManifest = h.instances[0].listeners.manifest;
    h.instances[0].network(403); await tick();
    assert.equal(h.player.playId, 'two');
    assert.equal(h.player.episodes.value, 'two');
    assert.equal(h.player.seasons.value, 'season');
    assert.ok(h.instances[0].destroyed);
    oldManifest(); assert.equal(h.player.video.paused, true, 'Destroyed manifest callback cannot start the new media');
    h.instances[1].manifest(); assert.equal(h.player.video.currentTime, 48, 'Refresh must resume exact real episode time');
    h.instances[1].network(); await tick(); h.instances[2].manifest();
    h.instances[2].network(); await tick();
    assert.equal(h.requests.filter(x => x.startsWith('playback')).length, 3, 'Two automatic source refreshes maximum');
    assert.equal(h.player.playId, null);
    assert.match(h.elements.get('player-status-text').textContent, /two recovery attempts/);
    assert.equal(h.timers.size, 0, 'Fatal failure stops watchdog and HUD timers');
    h.player.close();
  }
  {
    const h = harness();
    h.hook = route => route.startsWith('playback')
      ? { ok: false, json: async () => ({ error: 'Login required', code: 'AUTH_REQUIRED', retryable: false }) }
      : route === 'auth'
        ? { ok: false, json: async () => ({ error: 'Temporary upstream outage', code: 'SOURCE_UNAVAILABLE', retryable: true, requestId: 'auth-ref-1' }) }
        : null;
    await h.open();
    const image = h.elements.get('player-otp-image'), error = h.elements.get('player-auth-error'), retry = h.elements.get('player-auth-retry');
    assert.equal(image.hidden, true, 'Missing login instructions never show a broken image');
    assert.match(error.textContent, /load the login instructions/);
    assert.match(error.textContent, /auth-ref-1/);
    assert.doesNotMatch(error.textContent, /cannot provide this episode/);
    assert.equal(retry.hidden, false, 'Failed instruction requests expose an in-dialog retry');
    h.player.close();
  }
  {
    const h = harness();
    h.hook = route => route.startsWith('playback')
      ? { ok: false, json: async () => ({ error: 'Login required', code: 'AUTH_REQUIRED', retryable: false }) }
      : route === 'auth'
        ? { ok: false, json: async () => ({ error: 'Video service returned HTTP 403.', code: 'UPSTREAM_FORBIDDEN', upstreamStatus: 403, retryable: false, requestId: 'provider-403' }) }
        : null;
    await h.open();
    const error = h.elements.get('player-auth-error').textContent;
    assert.match(error, /video provider rejected the login-instructions request \(HTTP 403\)/i);
    assert.match(error, /provider-403/);
    h.player.close();
  }
  {
    const h = harness(), delayed = deferred();
    h.hook = route => route === 'title?id=slow' ? delayed.promise : null;
    const first = h.player.open({ title: 'Old', netmirrorId: 'slow' }); await tick();
    await h.open(); const current = h.player.hls;
    delayed.resolve({ ok: true, json: async () => ({ seasons: [], episodes: [], title: 'Old' }) });
    await first;
    assert.equal(h.player.hls, current, 'Response ignoring abort cannot overwrite new operation');
    assert.equal(h.player.playId, 'two');
    const stalePlaying = h.player.video.onplaying, staleManifest = current.listeners.manifest;
    h.player.close(); stalePlaying(); staleManifest();
    assert.equal(h.player.video.paused, true);
    assert.equal(h.player.status.hidden, true);
    assert.equal(h.timers.size, 0);
  }
  {
    const h = harness(); await h.open(); h.instances[0].manifest(); h.player.video.currentTime = 37;
    h.authenticated = false; h.instances[0].network(401); await tick();
    assert.equal(h.player.auth.hidden, false, 'Confirmed API auth expiry must show login');
    h.elements.get('player-otp').value = '123456';
    await h.elements.get('player-auth-form').onsubmit({ preventDefault() {} });
    h.instances[1].manifest();
    assert.equal(h.player.playId, 'two'); assert.equal(h.player.video.currentTime, 37);
    h.player.close();
  }
  {
    const h = harness(); await h.open(); h.instances[0].manifest();
    h.player.video.currentTime = 12; h.fireWatchdog(); await tick();
    assert.equal(h.instances.length, 1, 'Advancing playback must not refresh');
    h.fireWatchdog(); await tick(); assert.equal(h.instances.length, 2, 'Playback stalled for 20 seconds must refresh');
    h.instances[1].manifest(); h.player.toggle();
    assert.equal([...h.timers.values()].filter(x => x.ms === 20000).length, 0, 'User pause stops watchdog');
    h.player.close();
  }
  {
    const h = harness();
    h.hook = route => route.startsWith('playback') ? { ok: false, json: async () => ({ error: 'Unavailable', code: 'SOURCE_UNAVAILABLE', retryable: false, requestId: 'diagnostic-123' }) } : null;
    await h.open();
    assert.equal(h.player.auth.hidden, true, 'Unavailable source must never ask for another OTP');
    assert.match(h.elements.get('player-status-text').textContent, /diagnostic-123/);
    assert.equal(h.elements.get('player-retry').hidden, true, 'Non-retryable response must not offer retry');
    h.player.close();
  }
  {
    const h = harness();
    h.hook = (route, options) => route.startsWith('title') ? new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
    }) : null;
    const pending = h.open(); await tick();
    const timeout = [...h.timers].find(([, value]) => value.ms === 30000);
    assert.ok(timeout, 'Metadata request must have a finite deadline');
    h.timers.delete(timeout[0]); timeout[1].fn(); await pending;
    assert.match(h.elements.get('player-status-text').textContent, /too long/);
    assert.equal(h.elements.get('player-retry').hidden, false, 'Request timeout is retryable, not silent cancellation');
    assert.equal(h.timers.size, 0); h.player.close();
  }
  console.log('PASS: watch history and exact resume, mini-player lifecycle, HLS/native audio and subtitles, CC On/Off, caption placement, aspect fit, stale callbacks, bounded recovery, auth expiry, watchdog, and request timeout');
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
