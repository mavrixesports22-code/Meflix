/* Home discovery, local watch activity and the currently playing session. */
window.addEventListener('DOMContentLoaded', () => {
  const app = window.app, history = window.meflixHistory;
  if (!app || !history) return;
  const home = document.getElementById('watch-home');
  const page = document.getElementById('watch-history-page');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const format = value => { value = Math.floor(Math.max(0, value || 0)); return (value >= 3600 ? Math.floor(value / 3600) + ':' + String(Math.floor(value % 3600 / 60)).padStart(2, '0') : Math.floor(value / 60)) + ':' + String(value % 60).padStart(2, '0'); };
  const remaining = entry => entry.completed ? 'Finished' : entry.duration ? Math.max(1, Math.ceil((entry.duration - entry.position) / 60)) + ' min left' : 'Resume at ' + format(entry.position);
  const find = key => history.entries.find(entry => entry.key === key);
  const putInCatalogue = entry => {
    if (!app.catalog.some(item => item.id === entry.item.id)) app.catalog.push({ genres: [], synopsis: '', ...entry.item });
  };
  for (const entry of history.entries) putInCatalogue(entry);
  function resume(entry) {
    if (!entry) return;
    putInCatalogue(entry);
    const player = app.mediaPlayer;
    if (player.overlay.classList.contains('active') && player.playId === entry.playId && player.historyTitleId === entry.item.netmirrorId) player.restore();
    else app.openVideoPlayer({ ...entry.item, selectedSeason: entry.seasonId, selectedEpisode: entry.playId });
  }
  function tile(entry) {
    const percent = entry.duration ? Math.min(100, entry.position / entry.duration * 100) : 0;
    return `<article class="mf-watch-card">
      <button class="mf-watch-art" data-resume="${esc(entry.key)}" aria-label="${entry.completed ? 'Play again' : 'Resume'} ${esc(entry.item.title)}">
        <img src="${esc(entry.item.backdrop || entry.item.poster || artworkFallback)}" alt="" loading="lazy"><span class="mf-watch-play" aria-hidden="true">▶</span>
        ${entry.duration ? `<span class="mf-watch-progress" role="progressbar" aria-label="Watch progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${percent}%"></span></span>` : ''}
      </button>
      <div class="mf-watch-caption"><div><h3>${esc(entry.item.title)}</h3><p>${esc(remaining(entry))}</p></div><button data-remove-watch="${esc(entry.key)}" aria-label="Remove ${esc(entry.item.title)} from history" title="Remove from history">×</button></div>
    </article>`;
  }
  function row(title, entries) {
    return `<section class="mf-watch-shelf"><div class="mf-watch-heading"><h2>${title}</h2><button data-view-history>View history <span aria-hidden="true">↗</span></button></div><div class="mf-watch-track" data-watch-track="continue">${entries.map(entry => tile(entry)).join('')}</div></section>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-resume]').forEach(button => button.onclick = () => resume(find(button.dataset.resume)));
    root.querySelectorAll('[data-remove-watch]').forEach(button => button.onclick = () => { history.remove(button.dataset.removeWatch); render(true); });
    root.querySelectorAll('[data-view-history]').forEach(button => button.onclick = () => app.showCategoryView('history'));
    root.querySelectorAll('img').forEach(image => app.setArtwork(image, image.getAttribute('src'), ''));
  }
  function render(force = false) {
    const isHistory = app.currentView === 'history' && !app.searchOpen;
    home.hidden = app.currentView !== 'home' || app.searchOpen || !!app.searchQuery;
    page.hidden = !isHistory;
    if (!home.hidden) {
      const positions = new Map([...home.querySelectorAll('[data-watch-track]')].map(track => [track.dataset.watchTrack, track.scrollLeft]));
      const focused = document.activeElement;
      if (force || !home.contains(focused)) {
        const continuing = history.continuing();
        home.hidden = !continuing.length;
        home.innerHTML = continuing.length ? row('Continue Watching', continuing) : '';
        bind(home);
        home.querySelectorAll('[data-watch-track]').forEach(track => { track.scrollLeft = positions.get(track.dataset.watchTrack) || 0; });
      }
    }
    if (isHistory) {
      document.getElementById('shelves-container').style.display = 'none';
      const rows = history.entries.map(entry => `<article class="mf-history-entry"><button class="mf-history-thumb" data-resume="${esc(entry.key)}" aria-label="${entry.completed ? 'Play again' : 'Resume'} ${esc(entry.item.title)}"><img src="${esc(entry.item.backdrop || entry.item.poster || artworkFallback)}" alt="" loading="lazy"><span aria-hidden="true">▶</span></button><div><h2>${esc(entry.item.title)}</h2><p>${esc(entry.episode || (entry.item.type === 'movie' ? 'Movie' : 'Episode'))}</p><small>${esc(remaining(entry))} · ${new Date(entry.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></div><button data-remove-watch="${esc(entry.key)}" aria-label="Remove ${esc(entry.item.title)} from history">×</button></article>`).join('');
      page.innerHTML = `<div class="mf-history-header"><div><h1 id="watch-history-title">Watch history</h1><p>${history.entries.length ? history.entries.length + ' watched ' + (history.entries.length === 1 ? 'title or episode' : 'titles and episodes') + ' · Saved on this device' : 'Your watched titles will be saved on this device.'}</p></div>${history.entries.length ? '<button id="clear-watch-history">Clear history</button>' : ''}</div>${rows || '<div class="mf-history-empty"><span aria-hidden="true">◷</span><h2>No watch history yet</h2><p>Titles you watch appear here.</p><button class="nf-btn nf-btn-primary" id="history-start-browsing">Browse titles</button></div>'}`;
      bind(page);
      const clear = document.getElementById('clear-watch-history');
      if (clear) clear.onclick = () => { history.clear(); render(); app.showToast('Watch history cleared on this device.'); };
      const browse = document.getElementById('history-start-browsing'); if (browse) browse.onclick = () => app.showCategoryView('home');
    }
  }
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; if (!app.mediaPlayer.overlay.classList.contains('active') || app.mediaPlayer.overlay.classList.contains('minimized')) render(true); });
  }
  const category = app.showCategoryView.bind(app);
  app.showCategoryView = (...args) => { const result = category(...args); render(); return result; };
  const showSearch = app.showSearchArea.bind(app);
  app.showSearchArea = (...args) => { home.hidden = true; page.hidden = true; return showSearch(...args); };
  const collection = app.renderCustomShelfView.bind(app);
  app.renderCustomShelfView = (...args) => { home.hidden = true; page.hidden = true; return collection(...args); };
  window.addEventListener('meflix:history', schedule);
  window.addEventListener('meflix:player', schedule);
  window.addEventListener('storage', event => { if (event.key === history.key) { history.entries = new window.MeflixWatchHistory(window.localStorage).entries; schedule(); } });

  function featureTools(item) {
    document.getElementById('hero-details-btn').onclick = () => app.openDetailModal(item);
  }
  const billboard = app.renderBillboard.bind(app);
  app.renderBillboard = item => { billboard(item); if (item) featureTools(item); };
  if (app.featuredItem) featureTools(app.featuredItem);
  render();
});
