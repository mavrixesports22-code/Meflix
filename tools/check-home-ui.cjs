// UI lifecycle checks run without network traffic or a browser session.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
class Element {
  constructor() {
    Object.assign(this, { dataset: {}, style: {}, attributes: {}, textContent: '', innerHTML: '', value: '', isConnected: true });
    const classes = new Set();
    this.classList = { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, value) => { if (value ?? !classes.has(x)) classes.add(x); else classes.delete(x); } };
    this.nodes = new Map(); this.groups = new Map();
  }
  querySelector(selector) { return this.nodes.get(selector) || null; }
  querySelectorAll(selector) { return this.groups.get(selector) || []; }
  getAttribute(key) { return this.attributes[key] || null; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
}
function harness() {
  const elements = new Map(), groups = new Map(), timers = new Map(); let timerId = 0;
  const document = { body: new Element(), getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); }, querySelector(selector) { return document.getElementById(selector); }, querySelectorAll(selector) { return groups.get(selector) || []; } };
  const sandbox = { document, AbortController, window: { addEventListener() {} },
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
    localStorage: { getItem() { return '[]'; }, setItem() {} } };
  const catJs = fs.existsSync('js/catalog-service.js') ? 'js/catalog-service.js' : (fs.existsSync('netflix/js/catalog-service.js') ? 'netflix/js/catalog-service.js' : require('node:path').join(__dirname, '../js/catalog-service.js'));
  const netJs = fs.existsSync('js/netflix.js') ? 'js/netflix.js' : (fs.existsSync('netflix/js/netflix.js') ? 'netflix/js/netflix.js' : require('node:path').join(__dirname, '../js/netflix.js'));
  vm.runInNewContext(fs.readFileSync(catJs, 'utf8') + '\nthis.Service = NetflixCatalogService;', sandbox);
  vm.runInNewContext(fs.readFileSync(netJs, 'utf8') + '\nthis.App = NetflixApp;', sandbox);
  const app = Object.create(sandbox.App.prototype);
  Object.assign(app, { catalog: [], myList: [], shelves: [], currentView: 'home', browseRevision: 0, searchGrid: new Element(), searchQuerySpan: new Element(), shelvesContainer: new Element(), searchResultsContainer: new Element(), billboardTitle: new Element() });
  app.billboardTitle.closest = () => document.getElementById('billboard');
  app.showToast = () => {};
  return { app, sandbox, document, elements, groups, timers, Service: sandbox.Service };
}
async function main() {
  {
    const h = harness(), pending = deferred(), original = [{ id: 'local', items: [] }];
    h.app.shelves = original;
    const service = new h.Service(h.app); service.api = () => pending.promise;
    let rendered = 0; h.app.showCategoryView = () => rendered++; service.detail = async () => ({ title: 'Featured' }); h.app.renderBillboard = () => rendered++;
    const loading = service.loadHome(); h.app.browseInteracted = true;
    pending.resolve({ items: [], shelves: [{ id: 'live', items: [] }], featured: ['featured'] }); await loading;
    assert.equal(rendered, 0, 'Late home response must preserve an interacting user’s shelf and hero');
    assert.equal(h.app.shelves, original, 'Async home must not silently replace the active shelf model');
    assert.equal(h.app.remoteShelves[0].id, 'live', 'Fresh recommendations remain available on next navigation');
  }
  {
    const h = harness(), featured = deferred(), service = new h.Service(h.app);
    service.api = async () => ({ items: [], shelves: [], featured: ['featured'] }); service.detail = () => featured.promise;
    let rendered = 0; h.app.showCategoryView = () => {}; h.app.renderBillboard = () => rendered++;
    const loading = service.loadHome(); await Promise.resolve(); await Promise.resolve();
    h.app.browseRevision++; h.app.currentView = 'movies'; featured.resolve({ title: 'Late title' }); await loading;
    assert.equal(rendered, 0, 'A featured-title response cannot reset the hero after navigation');
  }
  {
    const h = harness(), result = deferred();
    h.app.catalogService = { search: () => result.promise }; h.app.showSearchArea = () => {}; h.app.showSearchMessage = () => {}; h.app.closeBrowseMenu = () => {}; h.app.renderShelves = () => {};
    h.app.remoteShelves = [{ id: 'movies', kind: 'movie' }];
    h.app.searchGrid.innerHTML = 'unchanged';
    const searching = h.app.handleSearch('old query', true);
    h.app.showCategoryView('movies');
    result.resolve([{ id: 'old', title: 'Stale result' }]); await searching;
    assert.equal(h.app.searchGrid.innerHTML, 'unchanged'); assert.equal(h.app.currentView, 'movies');
    assert.equal(h.app.shelves[0].id, 'movies');
  }
  {
    const h = harness(), card = new Element(), image = new Element(), caption = new Element(), title = new Element();
    card.nodes.set('.nf-card-caption', caption); card.nodes.set('.nf-hover-title', title); card.groups.set('img', [image]);
    Object.defineProperty(card, 'outerHTML', { set() { throw Error('Hydration replaced a focused card'); } });
    h.app.updateCatalogCard(card, { title: 'Hydrated title', backdrop: '/artwork', genres: [] });
    assert.equal(caption.textContent, 'Hydrated title'); assert.equal(title.textContent, 'Hydrated title'); assert.equal(image.src, '/artwork');
    image.onerror(); assert.ok(image.src.startsWith('data:image/svg+xml,')); assert.equal(image.onerror, null, 'Broken artwork uses one local fallback without an error loop');
    const html = h.app.createCardHTML({ id: 'minimal' });
    assert.ok(html.includes('Title unavailable')); assert.ok(!html.includes('undefined')); assert.ok(!html.includes('src=""'));
  }
  {
    const h = harness(), root = new Element(), card = new Element(); let plays = 0, pauses = 0;
    const video = { play() { plays++; return Promise.resolve(); }, pause() { pauses++; } };
    card.nodes.set('.nf-hover-video', video); card.matches = () => true; root.groups.set('.nf-card, .nf-top10-card', [card]);
    h.app.attachCardEventListeners(root); const enter = card.onmouseenter;
    h.app.attachCardEventListeners(root); assert.equal(card.onmouseenter, enter, 'Repeated hydration must not rebind preview handlers');
    card.onmouseenter(); assert.equal(h.timers.size, 1); card.onmouseleave(); assert.equal(h.timers.size, 0); assert.equal(pauses, 1);
    card.onmouseenter(); card.isConnected = false; [...h.timers.values()][0](); assert.equal(plays, 0, 'Detached previews must never start');
  }
  {
    const h = harness(), wrapper = new Element(), track = new Element(), left = new Element(), right = new Element();
    Object.assign(track, { clientWidth: 300, scrollWidth: 900, scrollLeft: 0, scrollBy({ left }) { this.scrollLeft = Math.min(this.scrollWidth - this.clientWidth, Math.max(0, this.scrollLeft + left)); this.onscroll(); } });
    wrapper.nodes.set('.nf-slider-track', track); wrapper.nodes.set('.nf-slider-arrow.left', left); wrapper.nodes.set('.nf-slider-arrow.right', right); h.groups.set('.nf-slider-wrapper', [wrapper]);
    h.app.initSliderScrollButtons(); assert.equal(left.disabled, true); assert.equal(right.disabled, false);
    right.onclick(); right.onclick(); right.onclick(); assert.equal(track.scrollLeft, 600); assert.equal(right.disabled, true);
    left.onclick(); assert.equal(left.disabled, false); assert.equal(right.disabled, false);
    track.clientWidth = 900; track.scrollLeft = 0; h.app.sliderUpdates[0](); assert.equal(left.disabled, true); assert.equal(right.disabled, true);
  }
  {
    const h = harness(), service = new h.Service(h.app), pending = deferred();
    h.app.catalog = [{ id: 'nm-1', netmirrorId: '1' }, { id: 'nm-2', netmirrorId: '2' }];
    service.queue.add('nm-1'); let requests = 0;
    service.api = () => { requests++; return pending.promise; };
    const loading = service.flush(); service.queue.add('nm-2'); await service.flush(); assert.equal(requests, 1, 'Only one hydration batch may be in flight');
    pending.resolve({ items: [] }); await loading; assert.equal(service.loading.size, 0); assert.equal(service.flushing, false); assert.equal(h.timers.size, 1, 'Queued work resumes after the current batch finishes');
  }
  console.log('PASS: stable home refresh, navigation/search races, in-place hydration, artwork fallback, single hover bindings, slider boundaries, and bounded hydration batches');
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
