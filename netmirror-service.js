const crypto = require('node:crypto');
const dns = require('node:dns/promises');
const net = require('node:net');
const { Readable } = require('node:stream');
const { createTransport, ServiceError } = require('./lib/upstream');
const catalogCache = require('./lib/catalog-cache');
const { normalizeTitle, identified } = require('./lib/catalog-data');
const { resource, lookupResource, resetResources } = require('./lib/media-resources');

const sessions = new Map();
let discovery;
let homeCache;
const titleCache = new Map();
const pendingTitles = new Map();
const recentFailures = [];

const envSecret = typeof process !== 'undefined' && process?.env ? process.env.SESSION_SECRET : null;
const SERVER_SECRET = crypto.createHash('sha256').update(envSecret || 'meflix-netmirror-vercel-production-key-2026').digest();

function sealSession(data) {
  try {
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', SERVER_SECRET, nonce);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    return 's1_' + Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64url');
  } catch { return null; }
}

function unsealSession(tokenString) {
  if (!tokenString || !tokenString.startsWith('s1_')) return null;
  try {
    const bytes = Buffer.from(tokenString.slice(3), 'base64url');
    if (bytes.length < 29) return null;
    const nonce = bytes.subarray(0, 12);
    const tag = bytes.subarray(12, 28);
    const ciphertext = bytes.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', SERVER_SECRET, nonce);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const data = JSON.parse(decrypted);
    if (data && data.until > Date.now()) return data;
  } catch {}
  return null;
}

const savedCatalog = catalogCache.read();
if (savedCatalog) {
  homeCache = savedCatalog.home || null;
  for (const entry of savedCatalog.titles) if (/^\d{1,20}$/.test(entry.id) && entry.value?.card?.netmirrorId === entry.id) titleCache.set(entry.id, entry);
}
function persistCatalog() { catalogCache.write({ home: homeCache, titles: [...titleCache].map(([id, entry]) => ({ id, ...entry })) }); }

const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};

function isPrivate(address) {
  if (net.isIP(address) === 6) return !/^[23]/i.test(address);
  const [a,b] = address.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19));
}

async function publicUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new ServiceError('Unsupported media address.', 502, 'SOURCE_UNAVAILABLE', false);
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(x => isPrivate(x.address))) throw new ServiceError('Unsupported media host.', 502, 'SOURCE_UNAVAILABLE', false);
  return url;
}

const request = createTransport({ validateUrl: publicUrl });
let discovering;

async function baseUrl(signal, refresh = false) {
  if (refresh) discovery = null;
  if (discovery && discovery.until > Date.now()) return discovery.base;
  if (!discovering) discovering = (async () => {
    const data = await request('https://mobiledetect.app/checknewtv.php', { attempts: 2, timeoutMs: 6000, consume: response => response.json() });
    const url = await publicUrl(Buffer.from(data.token_hash || '', 'base64').toString('utf8'));
    discovery = { base: url.origin, until: Date.now() + 300000 };
    return discovery.base;
  })().finally(() => { discovering = null; });
  return discovering;
}

async function api(route, session, headers = {}, withOrigin = false) {
  const signal = AbortSignal.timeout(18000);
  const base = await baseUrl(signal);
  const options = { attempts: 2, timeoutMs: 6000, signal, consume: response => response.json(),
    headers: { Accept: 'application/json', Ott: 'nf', Usertoken: session.token || 'none', ...headers } };
  let data, apiOrigin = base;
  try { data = await request(base + '/newtv/' + route, options); }
  catch (error) {
    if (!error.retryable || signal.aborted) throw error;
    const updated = await baseUrl(signal, true);
    if (updated === base) throw error;
    apiOrigin = updated;
    data = await request(updated + '/newtv/' + route, options);
  }
  return withOrigin ? { data, apiOrigin } : data;
}

const idsFrom = value => (Array.isArray(value) ? value.map(x => String(x?.id || x || '')) : String(value || '').split(',')).filter(x => /^\d{1,20}$/.test(x));
const artwork = (id, layout = 'h') => `/api/netmirror/artwork?id=${id}&layout=${layout}`;

function cardFrom(id, title = '') {
  return { id: 'nm-' + id, netmirrorId: String(id), title: title || 'View title', type: 'title',
    poster: artwork(id, 'v'), backdrop: artwork(id), synopsis: '', year: '', maturity: '', duration: '',
    match: '', resolution: '', audio: '', tags: [], genres: [], cast: [], creator: '', isOriginal: false, episodes: [] };
}

async function readHome() {
  if (homeCache && homeCache.until > Date.now()) return homeCache;
  let data;
  try { data = await api('main.php', { token: '' }); }
  catch (error) {
    if (!homeCache) throw error;
    homeCache = { ...homeCache, until: Date.now() + 30000, stale: true };
    return homeCache;
  }
  const rows = (data.post || []).map((row, index) => ({ id: 'live-' + index, title: row.cate || 'Discover',
    isTop10: /top\s*10/i.test(row.cate || ''),
    kind: /series|\btv\b/i.test(row.cate || '') ? 'series' : /movies|films|cinema/i.test(row.cate || '') ? 'movie' : '',
    items: idsFrom(row.ids).map(id => 'nm-' + id) })).filter(x => x.items.length);
  if (!rows.length) throw new ServiceError('NetMirror did not return any catalogue rows.');
  homeCache = { until: Date.now() + 300000, updatedAt: new Date().toISOString(), stale: false, rows,
    featured: idsFrom(data.slider),
    templates: { h: data.detailsimgcdn || data.imgcdn_h || data.imgcdn, v: data.imgcdn_v || data.imgcdn },
    referer: data.img_referer || '' };
  persistCatalog();
  return homeCache;
}

async function readTitle(id) {
  const cached = titleCache.get(id);
  if (cached && cached.until > Date.now()) return cached.value;
  if (pendingTitles.has(id)) return pendingTitles.get(id);
  const work = (async () => {
    let data;
    try { data = await api('post.php?id=' + id, { token: '' }); }
    catch (error) { if (cached?.value) return { ...cached.value, stale: true }; throw error; }
    data = normalizeTitle(data);
    if (!data.title) throw new ServiceError('Title information is unavailable.', 404);
    const details = key => (data.moredetails || []).find(x => x.k?.toLowerCase() === key)?.v || '';
    const list = key => details(key).split(',').map(x => x.trim()).filter(Boolean);
    const card = { ...cardFrom(id, data.title), hydrated: true, type: data.type === 't' ? 'series' : 'movie',
      synopsis: data.desc || '', year: data.year || '', maturity: data.ua || '', duration: data.runtime || '',
      resolution: data.hdsd || '', genres: list('genre'), cast: list('cast'), tags: list('this movie is'),
      creator: details('creator') || details('director'),
      seasons: data.season || [], selectedSeason: (data.season || []).find(x => x.selected)?.id || data.season?.[0]?.id,
      episodes: (data.episodes || []).map(x => ({ num: +x.ep, netmirrorId: String(x.id), title: x.t || 'Episode ' + x.ep,
        synopsis: x.ep_desc || '', duration: (x.info || []).find(s => /m$/.test(s)) || '', thumb: artwork(id) })),
      suggestions: idsFrom(data.suggest).filter(x => x !== id).map(x => cardFrom(x)) };
    const value = { id, title: data.title, type: data.type, seasons: data.season || [], episodes: data.episodes || [], card };
    titleCache.set(id, { until: Date.now() + 600000, value });
    if (titleCache.size > 2000) titleCache.delete(titleCache.keys().next().value);
    persistCatalog();
    return value;
  })();
  pendingTitles.set(id, work);
  try { return await work; } finally { pendingTitles.delete(id); }
}

async function artworkResponse(req, res, url) {
  const id = idParam(url);
  const home = await readHome();
  const layout = url.searchParams.get('layout') === 'v' ? 'v' : 'h';
  const template = home.templates[layout];
  if (!template?.includes('------------------')) throw new ServiceError('Artwork is unavailable.', 404);
  const upstream = await request(template.replace('------------------', id), { headers: home.referer ? { Referer: home.referer } : {} });
  res.writeHead(200, { 'Content-Type': upstream.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=1800' });
  const stream = Readable.fromWeb(upstream.body);
  res.once('close', () => stream.destroy());
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

function sessionFor(req, res, create = false) {
  const cookieMatch = /(?:^|;\s*)netmirror_session=([A-Za-z0-9_.-]+)(?:;|$)/.exec(req.headers.cookie || '');
  const rawKey = cookieMatch?.[1];

  let unsealed = unsealSession(rawKey);
  let sessionKey = unsealed ? unsealed.id : rawKey;
  let session = sessionKey ? sessions.get(sessionKey) : null;

  if (unsealed) {
    if (!session) {
      session = {
        id: unsealed.id,
        token: unsealed.token || '',
        resources: new Map(),
        resourceKeys: new Map(),
        until: unsealed.until,
        mediaKey: crypto.createHmac('sha256', SERVER_SECRET).update('mediaKey:' + unsealed.id).digest()
      };
      sessions.set(unsealed.id, session);
    } else {
      session.token = unsealed.token || session.token;
      session.until = unsealed.until;
      if (!session.mediaKey) {
        session.mediaKey = crypto.createHmac('sha256', SERVER_SECRET).update('mediaKey:' + unsealed.id).digest();
      }
    }
  } else if (!session || session.until < Date.now()) {
    if (sessionKey) sessions.delete(sessionKey);
    if (!create) return { token: '', resources: new Map(), resourceKeys: new Map(), until: 0 };
    const id = crypto.randomBytes(24).toString('hex');
    session = {
      id,
      token: '',
      resources: new Map(),
      resourceKeys: new Map(),
      until: Date.now() + 21600000,
      mediaKey: crypto.createHmac('sha256', SERVER_SECRET).update('mediaKey:' + id).digest()
    };
    sessions.set(id, session);
    const sealed = sealSession({ id, token: '', until: session.until });
    const isHttps = req?.headers?.['x-forwarded-proto'] === 'https' || (typeof process !== 'undefined' && !!process?.env?.VERCEL);
    const secureFlag = isHttps ? '; Secure' : '';
    res.setHeader('Set-Cookie', `netmirror_session=${sealed || id}; HttpOnly; SameSite=Strict${secureFlag}; Path=/api/netmirror; Max-Age=21600`);
  }

  session.until = Date.now() + 21600000;
  for (const [id, s] of sessions) if (s.until < Date.now()) sessions.delete(id);
  return session;
}

function idParam(url, name = 'id') {
  const id = url.searchParams.get(name) || '';
  if (!/^\d{1,20}$/.test(id)) throw new ServiceError('Invalid title or episode ID.', 400, 'INVALID_ID');
  return id;
}

function rewriteManifest(text, base, session, referer, apiOrigin = '') {
  return text.split(/\r?\n/).map(line => {
    if (!line.trim()) return line;
    const proxy = value => resource(session, new URL(value, base).href, referer, undefined, apiOrigin);
    if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${proxy(uri)}"`);
    return proxy(line.trim());
  }).join('\n');
}

async function bodyJson(req) {
  let body = '';
  for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new ServiceError('Request too large.', 413); }
  try { return JSON.parse(body); } catch { throw new ServiceError('Invalid request.', 400); }
}

async function sourceRequest(entry, session, range, preflight = false, consume) {
  const headers = { Ott: 'nf', 'Accept-Encoding': 'identity' };
  if (entry.apiOrigin && new URL(entry.url).origin === entry.apiOrigin) headers.Usertoken = session.token;
  if (entry.referer) headers.Referer = entry.referer;
  if (range) headers.Range = range;
  try {
    return await request(entry.url, { headers, consume, attempts: preflight ? 2 : 3, timeoutMs: preflight ? 4000 : 12000,
      signal: AbortSignal.timeout(preflight ? 9000 : 60000) });
  } catch (error) {
    if ([401,403,404,410].includes(error.upstreamStatus)) throw new ServiceError('This video link expired. Refreshing the source may restore playback.', 410, 'SOURCE_EXPIRED', true, error.upstreamStatus);
    throw error;
  }
}

function validManifest(text) {
  if (text.length > 2 * 1024 * 1024 || !text.trimStart().startsWith('#EXTM3U') || !text.split(/\r?\n/).some(line => line.trim() && !line.startsWith('#'))) {
    throw new ServiceError('The service returned no playable video playlist.', 502, 'SOURCE_UNAVAILABLE', true);
  }
  return text.replace(/^\uFEFF/, '').trimStart();
}

async function readMediaStart(upstream, kind) {
  const type = upstream.headers.get('content-type') || '';
  const isManifest = kind === 'hls' || /\.m3u8$/i.test(new URL(upstream.url).pathname) || /mpegurl/i.test(type);
  if (isManifest) return { upstream, type, text: validManifest(await upstream.text()) };
  const reader = upstream.body.getReader();
  try {
    let first;
    do { first = await reader.read(); } while (!first.done && !first.value.length);
    if (first.done) throw new ServiceError('The video service returned an empty media segment.');
    return { upstream, type, reader, first };
  } catch (error) {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
    throw error;
  }
}

async function media(req, res, session, handle) {
  if (!session.token) throw new ServiceError('Connect to NetMirror first.', 401, 'AUTH_REQUIRED');
  const entry = lookupResource(session, handle);
  if (!entry) throw new ServiceError('Playback link expired. Press Play again.', 410, 'SOURCE_EXPIRED', true);
  if (entry.preflight && entry.preflight.until > Date.now()) {
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' });
    res.end(rewriteManifest(entry.preflight.text, entry.preflight.base, session, entry.referer, entry.apiOrigin));
    return;
  }
  const { upstream, type, text, reader, first } = await sourceRequest(entry, session, req.headers.range, false, response => readMediaStart(response, entry.kind));
  if (text !== undefined) {
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' });
    res.end(rewriteManifest(text, upstream.url, session, entry.referer, entry.apiOrigin));
    return;
  }
  const bytes = first.value;
  const mediaType = bytes.length > 188 && bytes[0] === 0x47 && bytes[188] === 0x47 ? 'video/mp2t' : type || 'application/octet-stream';
  const outgoing = { 'Content-Type': mediaType, 'Cache-Control': 'private, no-store' };
  for (const header of ['content-length','content-range','accept-ranges']) {
    if (header === 'content-length' && upstream.headers.get('content-encoding') && upstream.headers.get('content-encoding') !== 'identity') continue;
    if (upstream.headers.has(header)) outgoing[header] = upstream.headers.get(header);
  }
  res.writeHead(upstream.status, outgoing);
  const stream = Readable.from((async function* () {
    try {
      yield first.value;
      while (true) { const next = await reader.read(); if (next.done) break; yield next.value; }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  })());
  res.once('close', () => stream.destroy());
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

async function handleNetMirror(req, res, url) {
  if (!url.pathname.startsWith('/api/netmirror/')) return false;
  try {
    if (req.headers.origin) {
      try {
        const originUrl = new URL(req.headers.origin);
        const host = req.headers['x-forwarded-host'] || req.headers.host || '';
        const isSelf = originUrl.host === host || originUrl.host === req.headers.host;
        const isLocal = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
        const isVercel = originUrl.hostname.endsWith('.vercel.app');
        if (!isSelf && !isLocal && !isVercel) {
          throw new ServiceError('Use the player on this server.', 403);
        }
      } catch (e) {
        if (e instanceof ServiceError) throw e;
        throw new ServiceError('Use the player on this server.', 403);
      }
    }

    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
      res.writeHead(204);
      res.end();
      return true;
    }

    if (url.pathname === '/api/netmirror/artwork' && req.method === 'GET') { await artworkResponse(req, res, url); return true; }
    const session = sessionFor(req, res);
    const action = url.pathname.slice('/api/netmirror/'.length);
    if (action.startsWith('media/') && req.method === 'GET') { await media(req, res, session, action.slice(6)); return true; }
    if (action === 'health' && req.method === 'GET') {
      json(res, 200, { provider: 'NetMirror', sourceMode: 'remote', authenticated: !!session.token,
        lastDiscoveryAt: discovery ? new Date(discovery.until - 300000).toISOString() : null,
        recentFailures: recentFailures.slice(-20) });
    } else if (action === 'auth' && req.method === 'GET') {
      const info = await api('otp.php', session);
      json(res, 200, { authenticated: !!session.token, instructionImage: info.pub_msg_img?.img || '', message: info.pub_msg || '' });
    } else if (action === 'auth' && req.method === 'POST') {
      const { otp } = await bodyJson(req);
      if (!/^\d{4,10}$/.test(otp || '')) throw new ServiceError('Enter the code shown in the NetMirror login image.', 400);
      const result = await api('otp.php', session, { Otp: otp });
      if (result.status !== 'ok' || !result.usertoken) throw new ServiceError(result.error_msg || 'Invalid OTP. Please try again.', 401, 'AUTH_REQUIRED');
      const authenticated = sessionFor(req, res, true);
      authenticated.token = String(result.usertoken);
      resetResources(authenticated);
      authenticated.mediaKey = crypto.createHmac('sha256', SERVER_SECRET).update('mediaKey:' + (authenticated.id || 'default')).digest();
      const sealed = sealSession({ id: authenticated.id, token: authenticated.token, until: authenticated.until });
      const isHttps = req?.headers?.['x-forwarded-proto'] === 'https' || (typeof process !== 'undefined' && !!process?.env?.VERCEL);
      const secureFlag = isHttps ? '; Secure' : '';
      res.setHeader('Set-Cookie', `netmirror_session=${sealed || authenticated.id}; HttpOnly; SameSite=Strict${secureFlag}; Path=/api/netmirror; Max-Age=21600`);
      json(res, 200, { authenticated: true });
    } else if (action === 'auth' && req.method === 'DELETE') {
      session.token = ''; resetResources(session);
      res.setHeader('Set-Cookie', 'netmirror_session=; HttpOnly; SameSite=Strict; Path=/api/netmirror; Max-Age=0');
      json(res, 200, { authenticated: false });
    } else if (action === 'home' && req.method === 'GET') {
      const home = await readHome();
      const ids = [...new Set([...home.featured, ...home.rows.flatMap(x => x.items.map(id => id.slice(3)))])];
      json(res, 200, { shelves: home.rows, items: ids.map(id => titleCache.get(id)?.value?.card || cardFrom(id)), featured: home.featured.map(id => 'nm-' + id), stale: !!home.stale, updatedAt: home.updatedAt });
    } else if (action === 'cards' && req.method === 'GET') {
      const ids = [...new Set(idsFrom(url.searchParams.get('ids')))].slice(0, 24);
      if (!ids.length) throw new ServiceError('Choose valid title IDs.', 400);
      const items = [];
      let cursor = 0;
      await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => {
        while (cursor < ids.length) { const id = ids[cursor++]; try { items.push((await readTitle(id)).card); } catch { items.push(cardFrom(id)); } }
      }));
      json(res, 200, { items: ids.map(id => items.find(x => x.netmirrorId === id)) });
    } else if (action === 'search' && req.method === 'GET') {
      const query = (url.searchParams.get('q') || '').trim().slice(0, 200);
      if (!query) throw new ServiceError('Enter a title.', 400);
      const result = await api('search.php?s=' + encodeURIComponent(query), session);
      const results = (result.searchResult || []).filter(x => /^\d{1,20}$/.test(x.id)).map(x => ({ id: String(x.id), title: x.t || 'View title' }));
      json(res, 200, { results, items: results.map(x => cardFrom(x.id, x.title)) });
    } else if (action === 'title' && req.method === 'GET') {
      json(res, 200, await readTitle(idParam(url)));
    } else if (action === 'episodes' && req.method === 'GET') {
      const result = await api('episodes.php?id=' + idParam(url), session);
      json(res, 200, { episodes: identified(result.episodes) });
    } else if (action === 'playback' && req.method === 'GET') {
      if (!session.token) throw new ServiceError('Connect to NetMirror to play this title.', 401, 'AUTH_REQUIRED');
      const { data: result, apiOrigin } = await api('player.php?id=' + idParam(url), session, {}, true);
      if (result.status === 'otp') { session.token = ''; throw new ServiceError('Your NetMirror session expired. Enter the current OTP.', 401, 'AUTH_REQUIRED'); }
      if (result.status !== 'ok' || !result.video_link) throw new ServiceError('This video is currently unavailable from the service.', 502, 'SOURCE_UNAVAILABLE', true);
      await publicUrl(result.video_link);
      const referer = result.referer ? (await publicUrl(result.referer)).href : '';
      const address = resource(session, result.video_link, referer, 'hls', apiOrigin);
      const entry = lookupResource(session, address.split('/').at(-1));
      const { upstream: preflight, text } = await sourceRequest(entry, session, null, true, response => readMediaStart(response, 'hls'));
      entry.preflight = { text, base: preflight.url, until: Date.now() + 5000 };
      json(res, 200, { url: address, type: 'hls', title: result.title, episode: result.ep_title, source: 'netmirror' });
    } else json(res, 404, { error: 'Unknown NetMirror endpoint.' });
  } catch (error) {
    const requestId = crypto.randomBytes(6).toString('hex');
    const code = error instanceof ServiceError ? error.code : 'SOURCE_UNAVAILABLE';
    if ((error.status || 502) >= 500 || error.code === 'SOURCE_EXPIRED') {
      const record = { requestId, at: new Date().toISOString(), operation: url.pathname.split('/')[3] || 'unknown', code, upstreamStatus: error.upstreamStatus || null };
      recentFailures.push(record);
      if (recentFailures.length > 200) recentFailures.shift();
      console.error('[netmirror]', JSON.stringify(record));
    }
    if (!res.headersSent) json(res, error.status || 502, { error: error instanceof ServiceError ? error.message : 'Could not reach NetMirror. Try again shortly.',
      code, retryable: error instanceof ServiceError ? error.retryable : true, requestId });
    else res.destroy();
  }
  return true;
}

module.exports = { handleNetMirror, rewriteManifest, isPrivate, validManifest, readMediaStart, sessionFor, SERVER_SECRET };
