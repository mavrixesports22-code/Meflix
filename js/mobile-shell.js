/* Mobile navigation and browser/Android Back behavior for the Meflix shell. */
window.addEventListener('DOMContentLoaded', () => {
  const app = window.app;
  if (!app) return;
  const phone = () => window.matchMedia('(max-width: 700px)').matches;
  const tabs = [...document.querySelectorAll('[data-mobile-nav]')];
  let applying = false, suppress = 0;
  const scrollPositions = new Map();
  const current = () => history.state?.meflixMobile;
  const state = (kind, id) => ({ kind, id, view: app.currentView || 'home', scroll: window.scrollY, query: document.getElementById('search-input').value });
  function remember() {
    const previous = current();
    if (previous) history.replaceState({ ...history.state, meflixMobile: { ...previous, scroll: window.scrollY, query: document.getElementById('search-input').value } }, '');
  }
  function record(kind, id, replace = false) {
    if (!phone() || applying || suppress) return;
    remember();
    const next = { ...history.state, meflixMobile: state(kind, id) };
    if (replace) history.replaceState(next, ''); else history.pushState(next, '');
  }
  function syncTabs() {
    for (const tab of tabs) {
      const active = tab.dataset.mobileNav === 'home' ? ['home', 'tv', 'movies'].includes(app.currentView) : tab.dataset.mobileNav === 'my-list' ? ['my-list', 'history'].includes(app.currentView) : tab.dataset.mobileNav === app.currentView;
      if (active) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    }
    document.body.dataset.mobileView = app.currentView;
  }
  if (phone() && !current()) history.replaceState({ ...history.state, meflixMobile: state('browse') }, '');
  const category = app.showCategoryView.bind(app);
  app.showCategoryView = function(view, userNavigation = true) {
    if (phone() && userNavigation && !applying && !suppress) scrollPositions.set(app.currentView, window.scrollY);
    let result;
    suppress++;
    try { result = category(view, userNavigation); } finally { suppress--; }
    syncTabs();
    if (phone() && userNavigation && !applying && !suppress) {
      if (current()?.kind !== 'browse' || current()?.view !== view) record('browse');
      window.scrollTo({ top: scrollPositions.get(view) || 0, behavior: 'instant' });
    }
    return result;
  };
  tabs.forEach(tab => tab.onclick = () => app.showCategoryView(tab.dataset.mobileNav));
  syncTabs();

  const detail = app.openDetailModal.bind(app);
  app.openDetailModal = function(item) {
    if (item) record('detail', item.id, current()?.kind === 'detail');
    return detail(item);
  };
  const closeDetail = app.closeDetailModal.bind(app);
  app.closeDetailModal = function() {
    const open = app.modalBackdrop.classList.contains('open');
    const result = closeDetail();
    if (phone() && open && !applying && !suppress && current()?.kind === 'detail') history.back();
    return result;
  };
  const play = app.openVideoPlayer.bind(app);
  app.openVideoPlayer = function(item, ...args) {
    if (item) record('player', item.id, current()?.kind === 'detail');
    suppress++;
    try { return play(item, ...args); } finally { suppress--; }
  };
  const closePlayer = app.mediaPlayer.close.bind(app.mediaPlayer);
  app.mediaPlayer.onMinimize = () => { if (phone() && !applying && current()?.kind === 'player') history.back(); };
  app.mediaPlayer.onRestore = () => { if (current()?.kind !== 'player') record('player', app.mediaPlayer.item?.id); };
  app.mediaPlayer.close = function() {
    const open = this.overlay.classList.contains('active');
    const result = closePlayer();
    if (phone() && open && !applying && !suppress && current()?.kind === 'player') history.back();
    return result;
  };
  // On touch devices a video tap reveals controls; Play/Pause is explicit.
  app.mediaPlayer.video.onclick = () => {
    if (window.matchMedia('(pointer: coarse)').matches) app.mediaPlayer.wake();
    else app.mediaPlayer.toggle();
  };

  const searchButton = document.getElementById('search-toggle-btn');
  const search = searchButton.onclick;
  searchButton.onclick = function(event) {
    suppress++;
    try { search.call(this, event); } finally { suppress--; }
    if (app.searchOpen) record('search');
    else if (phone() && !applying && current()?.kind === 'search') history.back();
  };
  window.addEventListener('popstate', event => {
    const destination = event.state?.meflixMobile;
    if (!destination || !phone()) return;
    applying = true;
    try {
      if (!app.mediaPlayer.overlay.classList.contains('minimized')) app.closeVideoPlayer();
      app.closeDetailModal();
      app.showCategoryView(destination.view || 'home', false);
      if (destination.kind === 'search') {
        search.call(searchButton);
        const input = document.getElementById('search-input');
        input.value = destination.query || '';
        if (input.value) app.handleSearch(input.value, true);
      } else if (destination.kind === 'detail' || destination.kind === 'player') {
        const item = app.catalog.find(item => item.id === destination.id);
        if (item) {
          if (destination.kind === 'detail') app.openDetailModal(item);
          else app.openVideoPlayer(item);
        }
      }
      requestAnimationFrame(() => window.scrollTo({ top: destination.scroll || 0, behavior: 'instant' }));
    } finally { applying = false; }
  });
});
