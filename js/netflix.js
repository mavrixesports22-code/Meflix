// ==========================================================================
// NETFLIX WEB CLONE - CONTROLLER & UI APPLICATION ENGINE
// ==========================================================================

const htmlText = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const artworkFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#24232b"/><path d="M280 140L360 180L280 220Z" fill="#575360"/></svg>');

class NetflixApp {
  constructor() {
    this.catalog = [...NETFLIX_CATALOG];
    this.shelves = NETFLIX_SHELVES;
    this.myList = this.loadMyList();
    this.currentPlayingTitle = null;
    this.hudTimer = null;
    this.isMuted = true;
    this.searchQuery = '';
    this.currentView = 'home';
    this.browseRevision = 0;
    this.browseInteracted = false;
    this.catalogService = new NetflixCatalogService(this);

    this.initDOM();
    this.initNavbar();
    this.renderBillboard(this.catalog[0]); // Default featured title (Stranger Things)
    this.renderShelves();
    this.initModals();
    this.initPlayer();
    this.initSearch();
    this.catalogService.loadHome();
  }

  // --- LocalStorage My List ---
  loadMyList() {
    try {
      const saved = localStorage.getItem('netflix_my_list');
      const ids = saved ? JSON.parse(saved) : ['stranger-things', 'wednesday', 'arcane'];
      return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
    } catch {
      return ['stranger-things', 'wednesday', 'arcane'];
    }
  }

  saveMyList() {
    try {
      localStorage.setItem('netflix_my_list', JSON.stringify(this.myList));
      this.catalogService?.saveListTitles();
    } catch (e) {
      console.error('Failed to save My List', e);
    }
  }

  toggleMyList(id) {
    const item = this.catalog.find(c => c.id === id);
    if (!item) return;

    const idx = this.myList.indexOf(id);
    if (idx > -1) {
      this.myList.splice(idx, 1);
      this.showToast(`Removed "${item.title}" from My List`);
    } else {
      this.myList.push(id);
      this.showToast(`Added "${item.title}" to My List`);
    }
    this.saveMyList();
    this.updateAllListButtons(id);

    // If currently on My List view, re-render
    if (document.querySelector('.nf-nav-link[data-nav="my-list"]').classList.contains('active')) {
      this.showCategoryView('my-list');
    }
  }

  isInMyList(id) {
    return this.myList.includes(id);
  }

  updateAllListButtons(id) {
    const inList = this.isInMyList(id);
    const mobileList = document.getElementById('billboard-mobile-list-btn');
    if (mobileList?.dataset.id === id) {
      mobileList.setAttribute('aria-pressed', String(inList));
      mobileList.innerHTML = `<span aria-hidden="true">${inList ? '✓' : '＋'}</span> My List`;
    }
    document.querySelectorAll(`.nf-btn-list[data-id="${id}"]`).forEach(btn => {
      btn.innerHTML = inList
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
      btn.title = inList ? 'Remove from My List' : 'Add to My List';
      btn.classList.toggle('active-list', inList);
    });
  }

  // --- Toast Notifications ---
  showToast(message) {
    let container = document.querySelector('.nf-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'nf-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'nf-toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#E50914"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      <span>${htmlText(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- DOM Setup ---
  initDOM() {
    this.billboardBackdrop = document.getElementById('billboard-backdrop');
    this.billboardVideo = document.getElementById('billboard-video');
    this.billboardIframe = document.getElementById('billboard-iframe');
    this.billboardTitle = document.getElementById('billboard-title');
    this.billboardSynopsis = document.getElementById('billboard-synopsis');
    this.billboardMatch = document.getElementById('billboard-match');
    this.billboardRating = document.getElementById('billboard-rating');
    this.billboardVolumeBtn = document.getElementById('billboard-vol-btn');
    this.shelvesContainer = document.getElementById('shelves-container');
    this.searchResultsContainer = document.getElementById('search-results-section');
    this.searchGrid = document.getElementById('search-grid');
    this.searchQuerySpan = document.getElementById('search-query-display');
    this.modalIframe = document.getElementById('modal-iframe');
  }

  // --- Sticky Glassmorphic Navbar ---
  initNavbar() {
    const navbar = document.querySelector('.nf-navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) this.browseInteracted = true;
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    window.addEventListener('resize', () => this.sliderUpdates?.forEach(update => update()));

    // Nav Category Clicks
    document.querySelectorAll('.nf-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        document.querySelectorAll('.nf-nav-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const cat = e.currentTarget.getAttribute('data-nav');
        this.showCategoryView(cat);
      });
    });
    const toggle = document.getElementById('profile-toggle');
    const dropdown = document.getElementById('profile-dropdown');
    toggle.onclick = () => { dropdown.hidden = !dropdown.hidden; toggle.setAttribute('aria-expanded', String(!dropdown.hidden)); };
    document.addEventListener('pointerdown', event => { this.browseInteracted = true; if (!event.target.closest('.nf-profile-menu')) this.closeBrowseMenu(); });
    document.addEventListener('pointerover', event => { if (event.target.closest('.nf-card, .nf-top10-card, .nf-billboard-actions, .nf-slider-wrapper')) this.browseInteracted = true; });
    window.addEventListener('keydown', event => {
      this.browseInteracted = true;
      if (event.key === 'Escape' && !dropdown.hidden) { this.closeBrowseMenu(); toggle.focus(); }
    });
  }

  closeBrowseMenu() {
    document.getElementById('profile-dropdown').hidden = true;
    document.getElementById('profile-toggle').setAttribute('aria-expanded', 'false');
  }

  async disconnectService() {
    this.closeBrowseMenu();
    try {
      const response = await fetch('/api/netmirror/auth', { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not disconnect. Please try again.');
      this.closeVideoPlayer();
      this.showToast('Video service disconnected. Connect again when you next press Play.');
    } catch (error) { this.showToast(error.message); }
  }

  showCategoryView(cat, userNavigation = true) {
    if (userNavigation) { this.browseInteracted = true; this.browseRevision = (this.browseRevision || 0) + 1; }
    this.closeBrowseMenu();
    if (this.modalBackdrop?.classList.contains('open')) this.closeDetailModal();
    this.currentView = cat;
    this.searchQuery = '';
    clearTimeout(this.searchTimer);
    this.searchAbort?.abort();
    this.searchSequence = (this.searchSequence || 0) + 1;
    document.getElementById('search-input').value = '';
    this.searchOpen = false;
    document.querySelector('.nf-search-box').classList.remove('open');
    document.getElementById('search-toggle-btn').setAttribute('aria-expanded', 'false');
    document.getElementById('search-toggle-btn').setAttribute('aria-label', 'Search');
    document.querySelectorAll('.nf-nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === cat);
      if (link.dataset.nav === cat) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    this.billboardTitle.closest('#billboard').style.display = cat === 'home' ? 'flex' : 'none';
    const mainShelves = document.getElementById('shelves-container');
    const searchSection = document.getElementById('search-results-section');
    searchSection.classList.remove('active');
    mainShelves.style.display = 'flex';
    mainShelves.classList.toggle('without-hero', cat !== 'home');

    if (this.remoteShelves && cat !== 'my-list') {
      this.shelves = cat === 'home' ? this.remoteShelves : this.remoteShelves.filter(row =>
        cat === 'tv' ? row.kind === 'series' : cat === 'movies' ? row.kind === 'movie' : /new|top\s*10|popular/i.test(row.title));
      this.renderShelves();
      return;
    }
    if (cat === 'home') {
      this.renderShelves();
    } else if (cat === 'tv') {
      const tvItems = this.catalog.filter(c => c.type === 'series').map(c => c.id);
      this.renderCustomShelfView("TV Shows & Series", tvItems);
    } else if (cat === 'movies') {
      const movieItems = this.catalog.filter(c => c.type === 'movie').map(c => c.id);
      this.renderCustomShelfView("Blockbuster Movies", movieItems);
    } else if (cat === 'popular') {
      const popItems = ["oppenheimer", "stranger-things", "dune-part-two", "arcane", "breaking-bad"];
      this.renderCustomShelfView("New & Popular Blockbusters", popItems);
    } else if (cat === 'my-list') {
      if (this.myList.length === 0) {
        mainShelves.innerHTML = `
          <div class="nf-empty-state">
            <span class="nf-empty-symbol" aria-hidden="true">＋</span>
            <p class="nf-eyebrow">YOUR PERSONAL COLLECTION</p>
            <h1>Your next watch, all in one place.</h1>
            <p>Save movies and shows with the + button. They'll be waiting for you here.</p>
            <button class="nf-btn nf-btn-primary" onclick="window.app.showCategoryView('home')">Find something to watch</button>
          </div>
        `;
      } else {
        this.renderCustomShelfView("My List", this.myList);
      }
    }
  }

  renderCustomShelfView(title, itemIds) {
    this.sliderObserver?.disconnect();
    this.sliderUpdates = [];
    const mainShelves = document.getElementById('shelves-container');
    this.billboardTitle.closest('#billboard').style.display = 'none';
    mainShelves.classList.add('without-hero');
    this.searchResultsContainer.classList.remove('active');
    mainShelves.style.display = 'flex';
    const items = itemIds.map(id => this.catalog.find(c => c.id === id)).filter(Boolean);

    let cardsHtml = items.length ? items.map(item => this.createCardHTML(item)).join('') : '<p class="nf-collection-empty">No titles are available here yet. Try another category or search for a title.</p>';

    mainShelves.innerHTML = `
      <section class="nf-shelf nf-collection">
        <div class="nf-browse-heading">
          <p class="nf-eyebrow">MADE FOR YOUR NEXT MOVIE NIGHT</p>
          <h1>${htmlText(title)}</h1>
          <p>${items.length} ${items.length === 1 ? 'title' : 'titles'} to discover</p>
        </div>
        <div class="nf-search-grid">
          ${cardsHtml}
        </div>
      </section>
    `;
    this.attachCardEventListeners(mainShelves);
  }

  // --- Billboard Spotlight ---
  renderBillboard(item) {
    if (!item) return;
    this.featuredItem = item;
    this.billboardTitle.textContent = item.title || 'Title unavailable';
    this.billboardSynopsis.textContent = item.synopsis || 'Explore this title for more details.';
    this.billboardMatch.textContent = item.match || '';
    this.billboardRating.textContent = item.maturity || '';
    document.getElementById('billboard-kind').textContent = item.type === 'movie' ? 'FEATURED FILM' : 'FEATURED SERIES';
    document.getElementById('billboard-resolution').textContent = item.resolution || '';
    document.getElementById('billboard-duration').textContent = item.duration || '';
    document.getElementById('billboard-rating-pill').textContent = item.maturity || '';
    this.setArtwork(this.billboardBackdrop, item.backdrop || item.poster, item.title);
    this.setArtwork(document.getElementById('billboard-mobile-poster'), item.poster || item.backdrop, '');
    const mobileGenres = document.getElementById('billboard-mobile-genres');
    if (mobileGenres) mobileGenres.textContent = (item.genres || item.tags || []).slice(0, 3).join(' · ');
    const mobileList = document.getElementById('billboard-mobile-list-btn');
    if (mobileList) {
      mobileList.dataset.id = item.id;
      mobileList.setAttribute('aria-pressed', String(this.isInMyList(item.id)));
      mobileList.innerHTML = `<span aria-hidden="true">${this.isInMyList(item.id) ? '✓' : '＋'}</span> My List`;
      mobileList.onclick = () => { this.toggleMyList(item.id); mobileList.setAttribute('aria-pressed', String(this.isInMyList(item.id))); mobileList.innerHTML = `<span aria-hidden="true">${this.isInMyList(item.id) ? '✓' : '＋'}</span> My List`; };
    }
    clearTimeout(this.billboardPreviewTimer);
    this.billboardIframe?.removeAttribute('src');
    this.billboardIframe?.classList.remove('playing');
    this.billboardVideo?.pause();

    // Autoplay real official trailer preview in billboard
    if (this.billboardIframe && item.youtubeId && !window.matchMedia?.('(max-width: 700px), (prefers-reduced-motion: reduce)').matches) {
      this.billboardIframe.src = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.youtubeId}&rel=0&modestbranding=1&iv_load_policy=3`;
      this.billboardPreviewTimer = setTimeout(() => {
        this.billboardIframe.classList.add('playing');
      }, 1500);
      if (this.billboardVideo) this.billboardVideo.style.display = 'none';
    }

    // Billboard Buttons
    const playBtn = document.getElementById('billboard-play-btn');
    const infoBtn = document.getElementById('billboard-info-btn');

    playBtn.onclick = () => this.openVideoPlayer(item);
    infoBtn.onclick = () => this.openDetailModal(item);

    // Sound toggle
    if (this.billboardVolumeBtn) {
      this.billboardVolumeBtn.onclick = () => {
        this.openVideoPlayer(item);
      };
    }
  }

  // --- Render Carousels ---
  renderShelves() {
    this.shelvesContainer.innerHTML = '';
    if (this.currentView !== 'home') {
      const heading = document.createElement('div'); heading.className = 'nf-browse-heading';
      const titles = { tv: 'TV Shows', movies: 'Movies', popular: 'New & Popular' };
      heading.innerHTML = `<p class="nf-eyebrow">FIND YOUR NEXT FAVORITE</p><h1>${htmlText(titles[this.currentView] || 'Discover')}</h1><p>Great stories. One more episode. Something for every mood.</p>`;
      this.shelvesContainer.appendChild(heading);
    }

    this.shelves.forEach(shelf => {
      const shelfElem = document.createElement('section');
      shelfElem.className = 'nf-shelf';
      shelfElem.setAttribute('data-shelf-id', shelf.id);

      if (shelf.isTop10) {
        shelfElem.innerHTML = this.createTop10ShelfHTML(shelf);
      } else {
        shelfElem.innerHTML = this.createStandardShelfHTML(shelf);
      }

      this.shelvesContainer.appendChild(shelfElem);
    });
    if (!this.shelves.length) {
      const empty = document.createElement('p'); empty.className = 'nf-collection-empty';
      empty.textContent = 'No titles are available in this category yet. Try Home or search for a title.';
      this.shelvesContainer.appendChild(empty);
    }

    this.initSliderScrollButtons();
    this.attachCardEventListeners(this.shelvesContainer);
  }

  createStandardShelfHTML(shelf) {
    const items = shelf.items.map(id => this.catalog.find(c => c.id === id)).filter(Boolean);

    const cardsHtml = items.map(item => this.createCardHTML(item)).join('');

    return `
      <div class="nf-shelf-header">
        <h2 class="nf-shelf-title">
          <span>${htmlText(shelf.title)}</span>
          ${shelf.badge ? `<span style="font-size: 0.8rem; background: var(--nf-red); padding: 2px 8px; border-radius: 3px; font-weight: 700; color: #fff;">${shelf.badge}</span>` : ''}
        </h2>
        <button class="nf-shelf-explore" data-explore="${shelf.id}">Explore All &rsaquo;</button>
      </div>
      <div class="nf-slider-wrapper">
        <button class="nf-slider-arrow left" aria-label="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <div class="nf-slider-track">
          ${cardsHtml}
        </div>
        <button class="nf-slider-arrow right" aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>
    `;
  }

  createTop10ShelfHTML(shelf) {
    const items = shelf.items.map(id => this.catalog.find(c => c.id === id)).filter(Boolean);

    const cardsHtml = items.map((item, idx) => {
      const rank = idx + 1;
      return `
        <button class="nf-top10-card" data-id="${item.id}" aria-label="More about ${htmlText(item.title)}">
          <div class="nf-top10-rank">${rank}</div>
          <div class="nf-top10-poster-wrap">
            <img class="nf-top10-poster" src="${htmlText(item.poster || artworkFallback)}" alt="${htmlText(item.title || 'Title unavailable')}" loading="lazy">
            <span class="nf-top10-title">${htmlText(item.title || 'Title unavailable')}</span>
          </div>
        </button>
      `;
    }).join('');

    return `
      <div class="nf-shelf-header">
        <h2 class="nf-shelf-title">
          <span style="color: #E50914; font-weight: 900;">TOP 10</span>
          <span>${htmlText(shelf.title)}</span>
        </h2>
        <button class="nf-shelf-explore" data-explore="${shelf.id}">Explore All &rsaquo;</button>
      </div>
      <div class="nf-slider-wrapper">
        <button class="nf-slider-arrow left" aria-label="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <div class="nf-top10-track">
          ${cardsHtml}
        </div>
        <button class="nf-slider-arrow right" aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>
    `;
  }

  createCardHTML(item) {
    const inList = this.isInMyList(item.id);
    item = { genres: [], match: '', maturity: '', duration: '', ...item, title: item.title || 'Title unavailable' };
    if (!Array.isArray(item.genres)) item.genres = [];
    item = Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === 'string' ? htmlText(value) : Array.isArray(value) && key === 'genres' ? value.map(htmlText) : value]));
    const genreSpans = item.genres.slice(0, 3).map((g, i) => `${i > 0 ? '<span class="nf-genre-bullet">&#9679;</span>' : ''}<span>${g}</span>`).join(' ');

    return `
      <article class="nf-card" data-id="${item.id}" tabindex="0" aria-label="${item.title}">
        <img class="nf-card-thumb" src="${item.backdrop || item.poster || artworkFallback}" alt="${item.title}" loading="lazy">
        <img class="mf-mobile-card-poster" src="${item.poster || item.backdrop || artworkFallback}" alt="" loading="lazy" decoding="async">
        <span class="nf-card-caption">${item.title}</span>
        ${item.isOriginal ? `<span class="nf-card-badge">MX SERIES</span>` : ''}

        <!-- Hover Card Preview -->
        <div class="nf-hover-card">
          <div class="nf-hover-media">
            <img class="nf-hover-thumb" src="${item.backdrop || item.poster || artworkFallback}" alt="${item.title}" loading="lazy">
            ${item.trailerUrl ? `<video class="nf-hover-video" src="${item.trailerUrl}" muted loop playsinline></video>` : ''}
          </div>
          <div class="nf-hover-body">
            <div class="nf-hover-actions">
              <div class="nf-action-group-left">
                <button class="nf-round-btn primary nf-btn-play" data-id="${item.id}" title="Play ${item.title}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button class="nf-round-btn nf-btn-list ${inList ? 'active-list' : ''}" data-id="${item.id}" title="${inList ? 'Remove from My List' : 'Add to My List'}">
                  ${inList 
                    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
                    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`
                  }
                </button>
                <button class="nf-round-btn nf-btn-like" data-id="${item.id}" title="I like this">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                </button>
              </div>
              <button class="nf-round-btn nf-btn-details" data-id="${item.id}" title="More Information">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
              </button>
            </div>
            <div class="nf-hover-title">${item.title}</div>
            <div class="nf-hover-meta">
              <span class="nf-meta-match">${item.match}</span>
              <span class="nf-meta-badge">${item.maturity}</span>
              <span style="color: var(--nf-gray);">${item.duration}</span>
              <span class="nf-meta-badge" style="font-size: 0.65rem;">${item.resolution || ''}</span>
            </div>
            <div class="nf-hover-genres">
              ${genreSpans}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // --- Attach Interaction Handlers ---
  setArtwork(image, source, title = '') {
    if (!image) return;
    image.alt = title || 'Title artwork';
    image.onerror = () => { image.onerror = null; image.src = artworkFallback; image.classList.add('artwork-unavailable'); };
    const next = source || artworkFallback;
    if (image.getAttribute('src') !== next) { image.classList.remove('artwork-unavailable'); image.src = next; }
  }

  updateCatalogCard(card, item) {
    // Hydration fills the existing node so focus, hover, and carousel position
    // survive an asynchronous recommendation response.
    card.setAttribute('aria-label', item.title || 'Title unavailable');
    for (const selector of ['.nf-card-caption', '.nf-hover-title']) {
      const node = card.querySelector(selector); if (node) node.textContent = item.title || 'Title unavailable';
    }
    for (const image of card.querySelectorAll('img')) this.setArtwork(image, image.classList.contains('mf-mobile-card-poster') ? item.poster || item.backdrop : item.backdrop || item.poster, image.classList.contains('mf-mobile-card-poster') ? '' : item.title);
    const play = card.querySelector('.nf-btn-play'); if (play) play.title = 'Play ' + (item.title || 'title');
    const metadata = card.querySelector('.nf-hover-meta');
    if (metadata) metadata.textContent = [item.maturity, item.duration, item.resolution].filter(Boolean).join(' · ');
    const genres = card.querySelector('.nf-hover-genres'); if (genres) genres.textContent = (item.genres || []).slice(0, 3).join(' · ');
  }

  attachCardEventListeners(parent) {
    for (const image of parent.querySelectorAll('img')) {
      if (!image.dataset.artworkBound) {
        image.dataset.artworkBound = 'true';
        this.setArtwork(image, image.getAttribute('src'), image.alt);
        if (image.complete && image.naturalWidth === 0) image.onerror?.();
      }
    }
    parent.querySelectorAll('[data-explore]').forEach(button => {
      button.onclick = () => {
        const shelf = this.shelves.find(x => x.id === button.dataset.explore);
        if (shelf) { this.billboardTitle.closest('#billboard').style.display = 'none'; this.renderCustomShelfView(shelf.title, shelf.items); }
      };
    });
    // Play button
    parent.querySelectorAll('.nf-btn-play').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.catalog.find(c => c.id === id);
        if (item) this.openVideoPlayer(item);
      };
    });

    // My List button
    parent.querySelectorAll('.nf-btn-list').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.toggleMyList(id);
      };
    });

    // Like button
    parent.querySelectorAll('.nf-btn-like').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.catalog.find(c => c.id === id);
        btn.classList.toggle('active-list');
        this.showToast(`Rated "${item.title}" with Thumbs Up!`);
      };
    });

    // Detail button or card click
    parent.querySelectorAll('.nf-btn-details').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.catalog.find(c => c.id === id);
        if (item) this.openDetailModal(item);
      };
    });

    parent.querySelectorAll('.nf-card, .nf-top10-card').forEach(card => {
      card.onkeydown = event => {
        if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); card.click(); }
      };
      card.onclick = (e) => {
        // If clicked on round action buttons, don't trigger modal
        if (e.target.closest('.nf-round-btn')) return;
        const id = card.getAttribute('data-id');
        const item = this.catalog.find(c => c.id === id);
        if (item) this.openDetailModal(item);
      };

      // Play video preview on card hover
      const hoverVideo = card.querySelector('.nf-hover-video');
      if (hoverVideo && !card.dataset.previewBound) {
        card.dataset.previewBound = 'true';
        card.onmouseenter = () => {
          clearTimeout(card.previewTimer);
          card.previewTimer = setTimeout(() => {
            if (card.isConnected && card.matches(':hover')) {
              hoverVideo.currentTime = 0;
              hoverVideo.play().catch(() => {});
            }
          }, 350);
        };
        card.onmouseleave = () => {
          clearTimeout(card.previewTimer);
          hoverVideo.pause();
        };
      }
    });
    this.catalogService?.observe(parent);
  }

  initSliderScrollButtons() {
    this.sliderObserver?.disconnect();
    this.sliderObserver = window.ResizeObserver ? new ResizeObserver(() => this.sliderUpdates.forEach(update => update())) : null;
    this.sliderUpdates = [];
    document.querySelectorAll('.nf-slider-wrapper').forEach(wrapper => {
      const track = wrapper.querySelector('.nf-slider-track') || wrapper.querySelector('.nf-top10-track');
      const leftBtn = wrapper.querySelector('.nf-slider-arrow.left');
      const rightBtn = wrapper.querySelector('.nf-slider-arrow.right');

      if (!track || !leftBtn || !rightBtn) return;
      const update = () => {
        const end = Math.max(0, track.scrollWidth - track.clientWidth);
        leftBtn.disabled = track.scrollLeft <= 1;
        rightBtn.disabled = track.scrollLeft >= end - 1;
        leftBtn.setAttribute('aria-disabled', String(leftBtn.disabled));
        rightBtn.setAttribute('aria-disabled', String(rightBtn.disabled));
      };
      track.onscroll = update;
      this.sliderUpdates.push(update);
      this.sliderObserver?.observe(track);
      update();

      leftBtn.onclick = () => {
        const scrollAmount = track.clientWidth * 0.75;
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      };

      rightBtn.onclick = () => {
        const scrollAmount = track.clientWidth * 0.75;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      };
    });
  }

  // --- Detail Information Modal ---
  initModals() {
    this.modalBackdrop = document.getElementById('detail-modal-backdrop');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

    this.modalCloseBtn.onclick = () => this.closeDetailModal();
    this.modalBackdrop.onclick = (e) => {
      if (e.target === this.modalBackdrop) this.closeDetailModal();
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('player-series-controls').classList.contains('mf-episodes-open')) { this.mediaPlayer.closeEpisodePicker(true); this.mediaPlayer.wake(); e.preventDefault(); return; }
        if (this.mediaPlayer?.settingsPanel.hidden === false) { this.mediaPlayer.closeSettings(true); this.mediaPlayer.wake(); e.preventDefault(); return; }
        if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
        if (this.modalBackdrop.classList.contains('open')) { this.closeDetailModal(); e.preventDefault(); return; }
        this.closeDetailModal();
        if (!this.mediaPlayer?.overlay.classList.contains('minimized') || this.mediaPlayer.overlay.contains(e.target)) this.closeVideoPlayer();
      }
      if (e.key === 'Tab' && this.modalBackdrop.classList.contains('open')) {
        const targets = [...this.modalBackdrop.querySelectorAll('button:not([disabled]), select, [href], [tabindex="0"]')].filter(element => element.getClientRects().length);
        const first = targets[0], last = targets.at(-1);
        if (first && ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last))) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      }
    });
  }

  async openDetailModal(item) {
    if (!item) return;
    const detailRequest = this.detailRequest = (this.detailRequest || 0) + 1;
    if (!this.modalBackdrop.classList.contains('open')) this.detailReturnFocus = document.activeElement;
    this.modalBackdrop.classList.add('open', 'loading');
    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-play-btn').disabled = true;
    document.getElementById('modal-video').poster = item.backdrop || item.poster;
    this.modalIframe?.removeAttribute('src');
    this.modalIframe?.classList.remove('playing');
    document.body.style.overflow = 'hidden';
    this.modalCloseBtn.focus({ preventScroll: true });
    if (!item.netmirrorId) {
      try {
        const matches = await this.catalogService.search(item.title);
        const normalize = value => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        item = matches.find(x => normalize(x.title) === normalize(item.title)) || item;
      } catch { /* Saved details remain available during a service outage. */ }
      if (this.detailRequest !== detailRequest) return;
    }
    if (item.netmirrorId) {
      try { item = await this.catalogService.detail(item.id); }
      catch (error) { if (this.detailRequest === detailRequest) { this.closeDetailModal(); this.showToast(error.message); } return; }
      if (this.detailRequest !== detailRequest) return;
    }

    const modalTitle = document.getElementById('modal-title');
    const modalVideo = document.getElementById('modal-video');
    const modalSynopsis = document.getElementById('modal-synopsis');
    const modalMatch = document.getElementById('modal-match');
    const modalYear = document.getElementById('modal-year');
    const modalDuration = document.getElementById('modal-duration');
    const modalMaturity = document.getElementById('modal-maturity');
    const modalResolution = document.getElementById('modal-resolution');
    const modalCast = document.getElementById('modal-cast');
    const modalCreator = document.getElementById('modal-creator');
    const modalGenres = document.getElementById('modal-genres');
    const modalTags = document.getElementById('modal-tags');
    const modalPlayBtn = document.getElementById('modal-play-btn');
    const modalListBtn = document.getElementById('modal-list-btn');
    const episodesSection = document.getElementById('modal-episodes-section');
    const episodesList = document.getElementById('modal-episodes-list');
    const recommendationsGrid = document.getElementById('modal-recommendations-grid');

    modalTitle.textContent = item.title;
    modalSynopsis.textContent = item.synopsis;
    modalMatch.textContent = item.match;
    modalYear.textContent = item.year;
    modalDuration.textContent = item.duration;
    modalMaturity.textContent = item.maturity;
    modalResolution.textContent = item.resolution || '';
    modalCast.textContent = item.cast.join(', ');
    modalCreator.textContent = item.creator || '';
    modalGenres.textContent = item.genres.join(', ');
    modalTags.textContent = item.tags.join(', ');

    // Video banner preview in modal using official studio trailer
    this.modalIframe?.removeAttribute('src');
    this.modalIframe?.classList.remove('playing');
    if (modalVideo) { modalVideo.pause(); modalVideo.removeAttribute('src'); modalVideo.poster = item.backdrop; modalVideo.style.display = 'block'; }
    if (this.modalIframe) this.modalIframe.style.display = 'none';
    if (this.modalIframe && item.youtubeId) {
      this.modalIframe.src = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.youtubeId}&rel=0&modestbranding=1&iv_load_policy=3`;
      this.modalIframe.classList.add('playing');
      this.modalIframe.style.display = 'block';
      if (modalVideo) modalVideo.style.display = 'none';
    }

    // Actions
    modalPlayBtn.onclick = () => {
      this.openVideoPlayer(item);
    };

    const inList = this.isInMyList(item.id);
    modalListBtn.setAttribute('data-id', item.id);
    modalListBtn.classList.toggle('active-list', inList);
    modalListBtn.innerHTML = inList
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;

    modalListBtn.onclick = () => {
      this.toggleMyList(item.id);
      const updatedInList = this.isInMyList(item.id);
      modalListBtn.classList.toggle('active-list', updatedInList);
      modalListBtn.innerHTML = updatedInList
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
    };

    // Episodes list for series
    if (!item.netmirrorId && item.episodes && item.episodes.length > 0) {
      episodesSection.style.display = 'flex';
      episodesList.innerHTML = item.episodes.map(ep => `
        <div class="nf-episode-card" onclick="window.app.playEpisode('${item.id}', ${ep.num})">
          <div class="nf-ep-num">${ep.num}</div>
          <div class="nf-ep-thumb-wrap">
            <img class="nf-ep-thumb" src="${ep.thumb || item.backdrop}" alt="${ep.title}">
            <div class="nf-ep-play-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="nf-ep-details">
            <div class="nf-ep-header">
              <span class="nf-ep-title">${ep.title}</span>
              <span class="nf-ep-duration">${ep.duration}</span>
            </div>
            <p class="nf-ep-desc">${ep.synopsis}</p>
          </div>
        </div>
      `).join('');
    } else {
      episodesSection.style.display = 'none';
    }

    // "More Like This" recommendations
    const related = item.netmirrorId ? (item.suggestions || []).map(x => this.catalog.find(c => c.id === x.id)).filter(Boolean) : this.catalog.filter(c => c.id !== item.id && c.genres.some(g => item.genres.includes(g))).slice(0, 6);
    recommendationsGrid.innerHTML = related.map(rel => this.createCardHTML(rel)).join('');
    this.attachCardEventListeners(recommendationsGrid);
    if (item.netmirrorId) this.catalogService.prioritize(related);
    if (item.netmirrorId) this.renderRemoteEpisodes(item);

    this.modalBackdrop.classList.add('open');
    this.modalBackdrop.classList.remove('loading');
    modalPlayBtn.disabled = false;
    document.body.style.overflow = 'hidden';
  }

  renderRemoteEpisodes(item) {
    const detailRequest = this.detailRequest;
    const section = document.getElementById('modal-episodes-section');
    const list = document.getElementById('modal-episodes-list');
    const season = document.getElementById('modal-season');
    section.style.display = item.type === 'series' ? 'flex' : 'none';
    season.replaceChildren();
    for (const entry of item.seasons || []) season.add(new Option(entry.s, String(entry.id)));
    season.value = item.selectedSeason || season.value;
    const render = episodes => {
      list.innerHTML = episodes.map(ep => `
        <button class="nf-episode-card" data-episode="${ep.netmirrorId}" style="text-align:left;color:inherit;">
          <span class="nf-ep-num">${htmlText(ep.num)}</span>
          <span class="nf-ep-details"><span class="nf-ep-header"><span class="nf-ep-title">${htmlText(ep.title)}</span><span class="nf-ep-duration">${htmlText(ep.duration)}</span></span><span class="nf-ep-desc">${htmlText(ep.synopsis)}</span></span>
        </button>`).join('');
      for (const button of list.querySelectorAll('[data-episode]')) button.onclick = () => {
        const episode = episodes.find(x => x.netmirrorId === button.dataset.episode);
        this.openVideoPlayer({ ...item, selectedSeason: season.value, selectedEpisode: episode.netmirrorId }, 'Episode ' + episode.num);
      };
    };
    render(item.episodes || []);
    let request = 0;
    season.onchange = async () => {
      const current = ++request;
      item.selectedSeason = season.value;
      list.textContent = 'Loading episodes…';
      try {
        const data = await this.catalogService.api('episodes?id=' + season.value);
        if (current !== request || detailRequest !== this.detailRequest) return;
        item.episodes = data.episodes.map(ep => ({ netmirrorId: String(ep.id), num: +ep.ep, title: ep.t, synopsis: ep.ep_desc || '', duration: ep.info?.find(x => /m$/.test(x)) || '' }));
        render(item.episodes);
      } catch (error) { if (current === request && detailRequest === this.detailRequest) list.textContent = error.message; }
    };
    season.hidden = !(item.seasons || []).length;
  }

  playEpisode(titleId, epNum) {
    const item = this.catalog.find(c => c.id === titleId);
    if (!item) return;
    this.openVideoPlayer(item, `Episode ${epNum}`, epNum);
  }

  closeDetailModal() {
    const wasOpen = this.modalBackdrop.classList.contains('open');
    this.detailRequest = (this.detailRequest || 0) + 1;
    this.modalBackdrop.classList.remove('open', 'loading');
    if (wasOpen && this.detailReturnFocus?.isConnected) this.detailReturnFocus.focus({ preventScroll: true });
    document.body.style.overflow = '';
    if (this.modalIframe) {
      this.modalIframe.src = '';
      this.modalIframe.classList.remove('playing');
    }
    const modalVideo = document.getElementById('modal-video');
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.src = '';
    }
  }

  // --- Video playback ---
  initPlayer() {
    this.mediaPlayer = new NetMirrorPlayer();
  }

  async openVideoPlayer(item, extraTitle = '', episodeNum) {
    if (!item) return;
    this.closeDetailModal();
    this.currentPlayingTitle = item;
    await this.mediaPlayer.open(item, extraTitle, episodeNum);
  }

  closeVideoPlayer() {
    this.mediaPlayer?.close();
  }

  // --- Live Search ---
  initSearch() {
    const searchBox = document.querySelector('.nf-search-box');
    const searchBtn = document.getElementById('search-toggle-btn');
    const searchInput = document.getElementById('search-input');

    searchBtn.onclick = () => {
      this.searchOpen = !this.searchOpen;
      searchBtn.setAttribute('aria-expanded', String(this.searchOpen));
      searchBtn.setAttribute('aria-label', this.searchOpen ? 'Close search' : 'Search');
      searchBox.classList.toggle('open', this.searchOpen);
      if (this.searchOpen) {
        searchInput.focus();
        this.showSearchSuggestions();
      } else {
        searchInput.value = '';
        this.showCategoryView(this.currentView);
      }
    };

    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value.trim());
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.handleSearch(searchInput.value.trim(), true); }
      if (e.key === 'Escape') { e.preventDefault(); this.showCategoryView(this.currentView); }
    });
  }

  showSearchArea() {
    this.billboardTitle.closest('#billboard').style.display = 'none';
    this.shelvesContainer.style.display = 'none';
    this.searchResultsContainer.classList.add('active');
  }

  showSearchMessage(heading, message = '', retry) {
    const box = document.createElement('div');
    box.className = 'nf-search-state';
    const title = document.createElement('h3'); title.textContent = heading; box.append(title);
    const detail = document.createElement('p'); detail.textContent = message; box.append(detail);
    if (retry) { const button = document.createElement('button'); button.textContent = 'Retry search'; button.onclick = retry; box.append(button); }
    this.searchGrid.replaceChildren(box);
  }

  showSearchSuggestions() {
    clearTimeout(this.searchTimer);
    this.searchAbort?.abort();
    this.searchSequence = (this.searchSequence || 0) + 1;
    this.searchQuery = '';
    this.showSearchArea();
    this.searchQuerySpan.textContent = 'Popular suggestions';
    const shelf = (this.remoteShelves || this.shelves).find(x => x.isTop10) || this.shelves[0];
    const items = (shelf?.items || []).map(id => this.catalog.find(x => x.id === id)).filter(Boolean);
    this.searchGrid.innerHTML = items.map(item => this.createCardHTML(item)).join('');
    this.attachCardEventListeners(this.searchGrid);
    this.renderRecentSearches();
  }

  renderRecentSearches() {
    const root = document.getElementById('search-recent'); root.replaceChildren();
    let queries = [];
    try { queries = JSON.parse(localStorage.getItem('netflix_recent_searches') || '[]'); } catch {}
    for (const query of queries.slice(0, 8)) {
      const button = document.createElement('button'); button.textContent = query;
      button.onclick = () => { document.getElementById('search-input').value = query; this.handleSearch(query, true); };
      root.append(button);
    }
  }

  handleSearch(query, immediate = false) {
    query = query.trim();
    clearTimeout(this.searchTimer);
    this.searchAbort?.abort();
    const sequence = this.searchSequence = (this.searchSequence || 0) + 1;
    this.searchQuery = query;
    if (!query) { this.showSearchSuggestions(); return; }
    this.showSearchArea();
    this.searchQuerySpan.textContent = 'Searching for “' + query + '”…';
    this.showSearchMessage('Searching the live catalogue…');
    const search = async () => {
      const abort = this.searchAbort = new AbortController();
      try {
        const items = await this.catalogService.search(query, abort.signal);
        if (sequence !== this.searchSequence || abort.signal.aborted) return;
        this.searchQuerySpan.textContent = '“' + query + '” · ' + items.length + ' titles';
        if (items.length) {
          this.searchGrid.innerHTML = items.map(item => this.createCardHTML(item)).join('');
          this.attachCardEventListeners(this.searchGrid);
          let recent = [];
          try { recent = JSON.parse(localStorage.getItem('netflix_recent_searches') || '[]'); } catch {}
          try { localStorage.setItem('netflix_recent_searches', JSON.stringify([query, ...recent.filter(x => x !== query)].slice(0, 8))); } catch {}
          this.renderRecentSearches();
        } else this.showSearchMessage('No titles found for “' + query + '”', 'Try a different movie or series title.');
      } catch (error) {
        if (error.name === 'AbortError' || sequence !== this.searchSequence) return;
        this.searchQuerySpan.textContent = 'Search unavailable';
        this.showSearchMessage('Search is temporarily unavailable', error.message, () => this.handleSearch(query, true));
      }
    };
    if (immediate) return search();
    this.searchTimer = setTimeout(search, 250);
  }
}

// Global bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.app = new NetflixApp();
});
