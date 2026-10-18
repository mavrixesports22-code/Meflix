// Live catalogue metadata. Playback authentication stays in the player.
class NetflixCatalogService {
  constructor(app) {
    this.app = app;
    this.queue = new Set();
    this.loading = new Set();
    this.observed = new Set();
    this.observer = window.IntersectionObserver ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        this.observer.unobserve(entry.target);
        this.observed.delete(entry.target);
        const id = entry.target.dataset.id;
        const item = this.app.catalog.find(x => x.id === id);
        if (item?.netmirrorId && !item.hydrated && !this.loading.has(id)) this.queue.add(id);
      }
      clearTimeout(this.queueTimer);
      if (this.queue.size) this.queueTimer = setTimeout(() => this.flush(), 60);
    }, { rootMargin: '100px' }) : null;
    try { this.upsert(JSON.parse(localStorage.getItem('netflix_saved_titles') || '[]')); } catch {}
  }
  async api(route, signal) {
    const response = await fetch('/api/netmirror/' + route, { signal });
    const data = await response.json();
    if (!response.ok) throw new Error(String(data.error || 'The catalogue is unavailable.').replace(/netmirror/gi, 'video service'));
    return data;
  }
  upsert(items) {
    items = Array.isArray(items) ? items.filter(item => item?.id && item.netmirrorId) : [];
    for (const item of items) {
      if (!item?.id || !item.netmirrorId) continue;
      const existing = this.app.catalog.find(x => x.id === item.id);
      if (existing) {
        if (item.hydrated || !existing.hydrated) Object.assign(existing, item);
      } else this.app.catalog.push(item);
    }
    this.saveListTitles();
    return (items || []).map(x => this.app.catalog.find(c => c.id === x.id)).filter(Boolean);
  }
  saveListTitles() {
    try {
      const ids = new Set(this.app.myList || []);
      localStorage.setItem('netflix_saved_titles', JSON.stringify(this.app.catalog.filter(x => x.netmirrorId && ids.has(x.id))));
    } catch {}
  }
  async loadHome() {
    const revision = this.app.browseRevision || 0;
    const canRefresh = () => revision === (this.app.browseRevision || 0) && !this.app.browseInteracted && !this.app.searchQuery && !this.app.searchOpen && !this.app.modalBackdrop?.classList.contains('open') && !this.app.mediaPlayer?.overlay.classList.contains('active');
    try {
      const data = await this.api('home');
      this.upsert(data.items);
      this.app.featuredIds = data.featured || [];
      this.app.remoteShelves = data.shelves.filter(shelf => !/continue watching|recently (played|watched)|now playing/i.test(shelf.title || '')).map(shelf => ({ ...shelf, title: String(shelf.title || '').replace(/netflix/gi, 'Meflix') }));
      if (data.stale) this.app.showToast('Recommendations are temporarily unavailable. Showing previously loaded titles.');
      if (canRefresh()) this.app.showCategoryView(this.app.currentView || 'home', false);
      const featured = data.featured?.[0];
      if (featured) {
        const item = await this.detail(featured);
        if (canRefresh() && this.app.currentView === 'home') this.app.renderBillboard(item);
      }
    } catch {
      this.app.showToast('Live recommendations are unavailable. You can still browse the titles already shown.');
    }
  }
  async detail(id, signal) {
    const item = this.app.catalog.find(x => x.id === id);
    if (!item?.netmirrorId) return item;
    const data = await this.api('title?id=' + item.netmirrorId, signal);
    this.upsert([data.card, ...(data.card.suggestions || [])]);
    return this.app.catalog.find(x => x.id === id);
  }
  async search(query, signal) {
    const data = await this.api('search?q=' + encodeURIComponent(query), signal);
    return this.upsert(data.items);
  }
  observe(root) {
    for (const node of this.observed) if (!node.isConnected) { this.observer?.unobserve(node); this.observed.delete(node); }
    for (const card of root.querySelectorAll('.nf-card, .nf-top10-card')) {
      const item = this.app.catalog.find(x => x.id === card.dataset.id);
      if (item?.netmirrorId && !item.hydrated) {
        if (this.loading.has(item.id)) continue;
        if (this.observer) { this.observer.observe(card); this.observed.add(card); }
        else this.queue.add(item.id);
      }
    }
    if (!this.observer && this.queue.size) this.flush();
  }
  prioritize(items) {
    this.queue = new Set([...items.filter(x => x.netmirrorId && !x.hydrated).map(x => x.id), ...this.queue]);
    if (this.queue.size) this.flush();
  }
  async flush() {
    if (this.flushing) return;
    for (const id of this.queue) if (!this.app.catalog.some(item => item.id === id && !item.hydrated)) this.queue.delete(id);
    const ids = [...this.queue].filter(id => !this.loading.has(id)).slice(0, 24);
    if (!ids.length) return;
    this.flushing = true;
    ids.forEach(id => { this.queue.delete(id); this.loading.add(id); });
    try {
      const data = await this.api('cards?ids=' + ids.map(id => id.slice(3)).join(','));
      const items = this.upsert(data.items);
      for (const item of items) {
        if (!item.hydrated) continue;
        for (const card of document.querySelectorAll(`.nf-card[data-id="${item.id}"]`)) this.app.updateCatalogCard(card, item);
        for (const card of document.querySelectorAll(`.nf-top10-card[data-id="${item.id}"]`)) {
          card.title = item.title || 'Title unavailable';
          card.setAttribute('aria-label', item.title || 'Title unavailable');
          this.app.setArtwork(card.querySelector('img'), item.poster, item.title);
          const label = card.querySelector('.nf-top10-title'); if (label) label.textContent = item.title || 'Title unavailable';
        }
      }
      for (const id of ['shelves-container','search-grid','modal-recommendations-grid']) {
        const root = document.getElementById(id);
        if (root) this.app.attachCardEventListeners(root);
      }
    } catch { /* A card can still be opened and retried independently. */ }
    finally {
      ids.forEach(id => this.loading.delete(id));
      this.flushing = false;
      if (this.queue.size) this.queueTimer = setTimeout(() => this.flush(), 60);
    }
  }
}
