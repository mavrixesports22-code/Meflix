const assert = require('node:assert/strict');
const { resource, lookupResource, resetResources, CACHE_LIMIT } = require('../lib/media-resources');
const { rewriteManifest } = require('../netmirror-service');
const session = () => ({ resources: new Map(), resourceKeys: new Map() });
const idOf = path => path.split('/').at(-1);
const s = session();
const root = resource(s, 'https://cdn.example/master.m3u8?token=private', 'https://provider.example/', 'hls', 'https://provider.example');
assert.equal(resource(s, 'https://cdn.example/master.m3u8?token=private', 'https://provider.example/', 'hls', 'https://provider.example'), root);
assert.ok(!root.includes('private') && !root.includes('cdn.example'));
// More segments than the previous hard limit, across multiple audio tracks.
for (let track = 0; track < 4; track++) {
  const lines = ['#EXTM3U'];
  for (let segment = 0; segment < 6000; segment++) lines.push('#EXTINF:2,', `audio-${track}/segment-${segment}.ts`);
  const rewritten = rewriteManifest(lines.join('\n'), 'https://cdn.example/master.m3u8', s, 'https://provider.example/', 'https://provider.example');
  assert.equal(rewritten.split('\n').filter(line => line.startsWith('/api/netmirror/media/')).length, 6000);
  assert.ok(s.resources.size <= CACHE_LIMIT);
  assert.equal(s.resourceKeys.size, s.resources.size);
}
assert.ok(!s.resources.has(idOf(root)), 'Old root should have been evicted from the cache');
const decoded = lookupResource(s, idOf(root));
assert.equal(decoded.url, 'https://cdn.example/master.m3u8?token=private');
assert.equal(decoded.referer, 'https://provider.example/');
assert.equal(decoded.apiOrigin, 'https://provider.example');
assert.equal(decoded.kind, 'hls');
// Seeking to old segments still works after later playlists are rewritten.
const first = resource(s, 'https://cdn.example/early.ts', '', undefined, 'https://provider.example');
for (let i = 0; i < CACHE_LIMIT + 1; i++) resource(s, 'https://cdn.example/later-' + i + '.ts');
assert.equal(lookupResource(s, idOf(first)).url, 'https://cdn.example/early.ts');
assert.equal(lookupResource(session(), idOf(root)), undefined, 'Another login cannot resolve this session’s link');
const other = session(); resource(other, 'https://cdn.example/other.ts');
assert.equal(lookupResource(other, idOf(root)), undefined, 'Different session keys must reject the same link');
const handle = idOf(root), offset = 30;
assert.equal(lookupResource(s, handle.slice(0, offset) + (handle[offset] === 'A' ? 'B' : 'A') + handle.slice(offset + 1)), undefined, 'Tampered links must be rejected');
assert.equal(lookupResource(s, 'v1_' + 'A'.repeat(17000)), undefined);
resetResources(s);
assert.equal(s.resources.size, 0); assert.equal(s.resourceKeys.size, 0);
assert.equal(lookupResource(s, idOf(root)), undefined, 'Logout/reconnect must invalidate old links');
resource(s, 'https://cdn.example/new.ts');
assert.equal(lookupResource(s, idOf(root)), undefined, 'Reauthentication cannot restore previous links');
console.log('PASS: 24,000 segment links, bounded cache, seek after eviction, encrypted session isolation, tamper rejection, and logout invalidation');
