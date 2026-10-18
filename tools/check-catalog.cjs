const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
async function main() {
  const values = new Map();
  const sandbox = { window: { addEventListener() {} }, document: { getElementById(id) { if (!values.has(id)) values.set(id, { value: '' }); return values.get(id); } },
    AbortController, setTimeout, clearTimeout, localStorage: { getItem() { return '[]'; }, setItem() {} } };
  const netflixJs = fs.existsSync('js/netflix.js') ? 'js/netflix.js' : (fs.existsSync('netflix/js/netflix.js') ? 'netflix/js/netflix.js' : require('node:path').join(__dirname, '../js/netflix.js'));
  vm.runInNewContext(fs.readFileSync(netflixJs, 'utf8') + '\nthis.App = NetflixApp; this.escape = htmlText;', sandbox);
  const app = Object.create(sandbox.App.prototype);
  let finishOld;
  const old = new Promise(resolve => { finishOld = resolve; });
  app.catalogService = { search: async query => query === 'old' ? old : [{ id: 'new', title: 'New result' }] };
  app.searchGrid = {};
  app.searchQuerySpan = {};
  app.showSearchArea = () => {};
  app.showSearchMessage = () => {};
  app.attachCardEventListeners = () => {};
  app.renderRecentSearches = () => {};
  app.createCardHTML = item => item.title;
  const pending = app.handleSearch('old', true);
  await app.handleSearch('new', true);
  finishOld([{ id: 'old', title: 'Stale result' }]);
  await pending;
  assert.equal(app.searchGrid.innerHTML, 'New result', 'A stale search response must not replace a newer query');
  assert.ok(app.searchQuerySpan.textContent.includes('new'));
  assert.equal(sandbox.escape('<img src=x onerror="test">'), '&lt;img src=x onerror=&quot;test&quot;&gt;');
  let cleared = false;
  app.showSearchSuggestions = () => { cleared = true; };
  app.handleSearch('   ', true);
  assert.equal(cleared, true);
  console.log('PASS: search response races, cleared queries, and escaped remote text');
  if (!process.argv.includes('--live')) return;
  async function api(path) { const r=await fetch('http://localhost:5173/api/netmirror/'+path); const x=await r.json(); assert.ok(r.ok,x.error);return x; }
  const home=await api('home');
  assert.ok(home.shelves.length > 10);
  assert.ok(home.items.length > 100);
  const known=new Set(home.items.map(x=>x.id));
  assert.ok(home.shelves.every(row=>row.items.every(id=>known.has(id))));
  const search=await api('search?q=Squid%20Game');
  const title=search.items.find(x=>x.title==='Squid Game'); assert.ok(title);
  const details=await api('title?id='+title.netmirrorId);
  assert.ok(details.card.suggestions.length);
  assert.ok(details.card.suggestions.every(x=>x.id!==title.id));
  const requested=details.card.suggestions.slice(0,2).map(x=>x.netmirrorId);
  const cards=await api('cards?ids='+requested.join(','));
  assert.deepEqual(cards.items.map(x=>x.netmirrorId), requested);
  assert.ok(cards.items.every(x=>x.hydrated&&x.title!=='View title'));
  const image=await fetch('http://localhost:5173'+title.poster);
  assert.ok(image.ok); assert.ok(image.headers.get('content-type').startsWith('image/')); await image.body.cancel();
  const missing=await api('search?q=zzqxvnoexist123456789');
  assert.equal(missing.items.length,0);
  for (const id of ['81597036', '81648072', '82787383']) {
    const movie = await api('title?id=' + id);
    assert.equal(movie.card.type, 'movie');
    assert.deepEqual(movie.card.episodes, [], 'Movie null episode entries must not crash title details');
    assert.ok(movie.card.title && movie.card.cast.length);
  }
  console.log('PASS: GodFather, GodFather (Hindi), and Mandaadi movie details');
  console.log('PASS: live home rows, expanded search, service suggestions, metadata ordering, artwork, and no-results response');
}
main().catch(error=>{ console.error(error.message);process.exitCode=1; });
