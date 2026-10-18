const crypto = require('node:crypto');
const CACHE_LIMIT = 2048;
const prefix = '/api/netmirror/media/';
function remember(session, id, entry, key) {
  const previous = session.resourceKeys.get(key);
  if (previous && previous !== id) session.resources.delete(previous);
  session.resources.delete(id);
  entry.cacheKey = key;
  session.resources.set(id, entry);
  session.resourceKeys.delete(key);
  session.resourceKeys.set(key, id);
  while (session.resources.size > CACHE_LIMIT) {
    const [oldId, oldEntry] = session.resources.entries().next().value;
    session.resources.delete(oldId);
    if (session.resourceKeys.get(oldEntry.cacheKey) === oldId) session.resourceKeys.delete(oldEntry.cacheKey);
  }
  return entry;
}
function keyFor(entry) { return JSON.stringify([entry.url, entry.referer || '', entry.kind || '', entry.apiOrigin || '']); }
function resource(session, url, referer, kind, apiOrigin = '') {
  const entry = { url, referer, kind, apiOrigin }, key = keyFor(entry);
  const cached = session.resourceKeys.get(key);
  if (cached && session.resources.has(cached)) {
    remember(session, cached, session.resources.get(cached), key);
    return prefix + cached;
  }
  session.mediaKey ||= crypto.randomBytes(32);
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', session.mediaKey, nonce);
  const encrypted = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
  // Authenticated, encrypted handles remain resolvable after cache eviction.
  // Neither the upstream URL nor its credentials are exposed to the browser.
  const id = 'v1_' + Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64url');
  remember(session, id, entry, key);
  return prefix + id;
}
function lookupResource(session, id) {
  const cached = session.resources.get(id);
  if (cached) return remember(session, id, cached, cached.cacheKey || keyFor(cached));
  if (!session.mediaKey || typeof id !== 'string' || id.length > 16384 || !/^v1_[A-Za-z0-9_-]+$/.test(id)) return;
  try {
    const bytes = Buffer.from(id.slice(3), 'base64url');
    if (bytes.length < 29) return;
    const decipher = crypto.createDecipheriv('aes-256-gcm', session.mediaKey, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const key = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
    const values = JSON.parse(key);
    if (!Array.isArray(values) || values.length !== 4 || !values.every(value => typeof value === 'string')) return;
    const [url, referer, kind, apiOrigin] = values;
    return remember(session, id, { url, referer, kind: kind || undefined, apiOrigin }, key);
  } catch { return; }
}
function resetResources(session) {
  session.resources.clear();
  session.resourceKeys.clear();
  delete session.mediaKey;
}
module.exports = { resource, lookupResource, resetResources, CACHE_LIMIT };
