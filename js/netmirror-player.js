/* NetMirror playback adapter for the existing Netflix catalogue. */
class NetMirrorPlayer {
  constructor() {
    this.generation = 0;
    this.mediaGeneration = 0;
    this.overlay = document.getElementById('player-overlay');
    this.video = document.getElementById('player-video');
    this.status = document.getElementById('player-status');
    this.auth = document.getElementById('player-auth');
    this.controls = document.getElementById('player-controls');
    this.seasons = document.getElementById('player-season');
    this.episodes = document.getElementById('player-episode');
    this.audioSelect = document.getElementById('player-audio-language');
    try { this.audioPreference = JSON.parse(localStorage.getItem('netmirror_audio_language') || 'null'); } catch {}
    this.audioSelect.onchange = () => this.chooseAudio();
    this.subtitleSelect = document.getElementById('player-subtitle-language');
    this.subtitleButton = document.getElementById('player-subtitles-btn');
    try { this.subtitlePreference = JSON.parse(localStorage.getItem('netflix_subtitles') || 'null'); } catch {}
    this.subtitleSelect.onchange = () => this.chooseSubtitle(Number(this.subtitleSelect.value));
    this.subtitleButton.onclick = () => this.toggleSubtitles();
    this.fitSelect = document.getElementById('player-video-fit');
    this.fitSelect.onchange = () => this.setVideoFit(this.fitSelect.value);
    let savedFit; try { savedFit = localStorage.getItem('netflix_video_fit'); } catch {}
    this.setVideoFit(savedFit, false);
    this.seek = document.getElementById('player-seek');
    this.playButton = document.getElementById('player-play-pause-btn');
    this.settingsButton = document.getElementById('player-settings-btn');
    this.settingsPanel = document.getElementById('player-settings-panel');
    this.settingsButton.onclick = () => {
      this.closeEpisodePicker();
      this.settingsPanel.hidden = !this.settingsPanel.hidden;
      this.settingsButton.setAttribute('aria-expanded', String(!this.settingsPanel.hidden));
      this.wake();
    };
    this.overlay.onpointerdown = event => {
      if (!document.getElementById('player-settings').contains(event.target)) this.closeSettings();
      if (!document.getElementById('player-series-controls').contains(event.target) && !document.getElementById('player-episodes-btn').contains(event.target)) this.closeEpisodePicker();
    };
    document.getElementById('player-back-btn').onclick = () => this.close();
    document.getElementById('player-minimize-btn').onclick = () => this.minimize();
    document.getElementById('player-mini-restore').onclick = () => this.restore();
    document.getElementById('player-mini-close').onclick = () => this.close();
    document.getElementById('player-mini-toggle').onclick = () => this.toggle();
    window.addEventListener?.('pagehide', () => this.saveWatchProgress(true));
    this.playButton.onclick = () => this.toggle();
    document.getElementById('player-settings-close').onclick = () => { this.closeSettings(true); this.wake(); };
    document.getElementById('player-episodes-close').onclick = () => { this.closeEpisodePicker(true); this.wake(); };
    document.getElementById('player-episodes-btn').onclick = () => {
      const panel = document.getElementById('player-series-controls');
      const open = !panel.classList.contains('mf-episodes-open');
      this.closeSettings();
      if (open) panel.classList.add('mf-episodes-open'); else panel.classList.remove('mf-episodes-open');
      document.getElementById('player-episodes-btn').setAttribute('aria-expanded', String(open));
      this.wake();
    };
    const transportHome = this.playButton.parentElement;
    const transportLayout = window.matchMedia?.('(max-width: 700px), (max-height: 500px) and (max-width: 1000px)');
    const moveTransport = () => {
      if (!transportHome) return;
      const center = document.getElementById('player-center-controls');
      const back = document.getElementById('player-rewind-btn'), forward = document.getElementById('player-forward-btn');
      center.hidden = !transportLayout.matches;
      this.compactControls = transportLayout.matches;
      if (transportLayout.matches) center.append(back, this.playButton, forward);
      else transportHome.prepend(this.playButton, back, forward);
      this.closeEpisodePicker();
      this.wake();
    };
    if (transportLayout) { moveTransport(); transportLayout.addEventListener?.('change', moveTransport); }
    this.video.onclick = () => this.toggle();
    document.getElementById('player-rewind-btn').onclick = () => this.skip(-10);
    document.getElementById('player-forward-btn').onclick = () => this.skip(10);
    this.seek.oninput = () => { if (Number.isFinite(this.video.duration)) { this.video.currentTime = +this.seek.value * this.video.duration / 1000; this.updateTime(); } };
    document.getElementById('player-vol-slider').oninput = e => { this.video.volume = +e.target.value; this.video.muted = false; this.updateVolume(); };
    document.getElementById('player-vol-btn').onclick = () => {
      this.video.muted = !this.video.muted;
      this.updateVolume();
    };
    this.video.onvolumechange = () => this.updateVolume();
    this.updateVolume();
    document.getElementById('player-speed-btn').onchange = e => { this.video.playbackRate = +e.target.value; };
    document.getElementById('player-fullscreen-btn').onclick = () => {
      const operation = document.fullscreenElement ? document.exitFullscreen() : this.overlay.requestFullscreen();
      operation?.catch(() => this.message('Fullscreen is unavailable in this browser.'));
    };
    document.addEventListener?.('fullscreenchange', () => {
      const full = document.fullscreenElement === this.overlay;
      const button = document.getElementById('player-fullscreen-btn');
      button.setAttribute('data-fullscreen', String(full));
      button.setAttribute('aria-label', full ? 'Exit fullscreen' : 'Enter fullscreen');
      button.setAttribute('data-tooltip', full ? 'Exit fullscreen (F)' : 'Fullscreen (F)');
    });
    this.seasons.onchange = () => { const id = this.seasons.value; return this.run(op => this.loadSeason(id, op)); };
    this.episodes.onchange = () => { const id = this.episodes.value; return this.run(op => this.loadVideo(id, op)); };
    document.getElementById('player-retry').onclick = () => this.run(this.retry);
    document.getElementById('player-auth-retry').onclick = () => this.showAuth(this.operation);
    document.getElementById('player-auth-form').onsubmit = async e => {
      e.preventDefault();
      const button = document.getElementById('player-connect');
      const op = this.operation;
      button.disabled = true;
      try {
        await this.api('auth', { method: 'POST', body: JSON.stringify({ otp: document.getElementById('player-otp').value }), headers: { 'Content-Type': 'application/json' } }, op);
        this.assertCurrent(op);
        document.getElementById('player-otp').value = '';
        this.auth.hidden = true;
        await this.run(this.retry);
      } catch (error) {
        if (this.isCurrent(op) && error.name !== 'AbortError') {
          document.getElementById('player-auth-error').textContent = this.authErrorText(error, true);
          document.getElementById('player-auth-retry').hidden = false;
        }
      }
      finally { if (this.isCurrent(op)) button.disabled = false; }
    };
    document.getElementById('player-title-choice').onchange = e => { const id = e.target.value; return this.run(op => this.loadTitle(id, op)); };
    this.overlay.onpointermove = () => this.wake();
    this.overlay.onfocusin = () => this.wake();
    window.addEventListener('keydown', e => {
      if (!this.overlay.classList.contains('active')) return;
      if (this.overlay.classList.contains('minimized') && (e.key === 'Tab' || !this.overlay.contains(e.target))) return;
      if (e.key === 'Tab') {
        const targets = [...this.overlay.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled])')].filter(element => element.getClientRects().length);
        const first = targets[0], last = targets.at(-1);
        if (first && ((e.shiftKey && (document.activeElement === first || document.activeElement === this.overlay)) || (!e.shiftKey && document.activeElement === last))) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        return;
      }
      if (/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); this.skip(e.key === 'ArrowLeft' ? -10 : 10); }
      else if (e.key.toLowerCase() === 'f') document.getElementById('player-fullscreen-btn').click();
      else if (e.key.toLowerCase() === 'm') document.getElementById('player-vol-btn').click();
      else if (e.key.toLowerCase() === 'c') this.toggleSubtitles();
      this.wake();
    });
  }
  closeSettings(returnFocus = false) {
    this.settingsPanel.hidden = true;
    this.settingsButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) this.settingsButton.focus();
  }
  closeEpisodePicker(returnFocus = false) {
    document.getElementById('player-series-controls').classList.remove('mf-episodes-open');
    document.getElementById('player-episodes-btn').setAttribute('aria-expanded', 'false');
    if (returnFocus) document.getElementById('player-episodes-btn').focus();
  }
  setVideoFit(mode, remember = true) {
    mode = mode === 'cover' ? 'cover' : 'contain';
    this.fitSelect.value = mode;
    this.overlay.setAttribute('data-video-fit', mode);
    this.video.style.objectFit = mode;
    document.getElementById('player-fit-note').textContent = mode === 'cover' ? 'Fills the screen; picture edges may be cropped.' : 'Shows the full picture without stretching.';
    if (remember) { try { localStorage.setItem('netflix_video_fit', mode); } catch {} }
  }
  serviceText(value) { return String(value || '').replace(/netmirror/gi, 'video service'); }
  updateVolume() {
    const muted = this.video.muted || this.video.volume === 0;
    const button = document.getElementById('player-vol-btn');
    button.setAttribute('data-muted', String(!!muted));
    button.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    button.setAttribute('data-tooltip', muted ? 'Unmute (M)' : 'Mute (M)');
    const slider = document.getElementById('player-vol-slider');
    slider.value = muted ? 0 : (this.video.volume ?? 1);
    slider.style.setProperty?.('--nf-volume', Number(slider.value) * 100 + '%');
  }
  isCurrent(op) { return !!op && this.operation === op && !op.controller.signal.aborted && this.overlay.classList.contains('active'); }
  assertCurrent(op) {
    if (!this.isCurrent(op)) throw Object.assign(new Error('Playback operation was superseded.'), { name: 'AbortError' });
  }
  async api(route, options = {}, op = this.operation) {
    this.assertCurrent(op);
    const request = new AbortController();
    const cancel = () => request.abort();
    op.controller.signal.addEventListener('abort', cancel, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; request.abort(); }, 30000);
    try {
      const response = await fetch('/api/netmirror/' + route, { ...options, signal: request.signal });
      let data;
      try { data = await response.json(); }
      catch (error) {
        if (error.name === 'AbortError') throw error;
        this.assertCurrent(op);
        throw Object.assign(new Error('The video service returned an invalid response. Please retry.'), { retryable: true });
      }
      this.assertCurrent(op);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('The video service returned an invalid response. Please retry.'), { retryable: true });
      if (!response.ok) {
        const error = new Error(this.serviceText(data.error || 'The video service is unavailable.'));
        Object.assign(error, { code: data.code, upstreamStatus: data.upstreamStatus, retryable: data.retryable, requestId: data.requestId });
        throw error;
      }
      return data;
    } catch (error) {
      this.assertCurrent(op);
      if (timedOut) throw Object.assign(new Error('The video service took too long to respond. Please retry.'), { retryable: true });
      throw error;
    } finally {
      clearTimeout(timer);
      op.controller.signal.removeEventListener('abort', cancel);
    }
  }
  errorText(error) {
    const text = error.upstreamStatus === 403 || error.code === 'UPSTREAM_FORBIDDEN'
      ? 'The video service rejected this request (HTTP 403). Retry later or contact the service provider.'
      : error.code === 'SOURCE_UNAVAILABLE'
        ? 'The video service cannot provide this episode right now. Please try again later.'
        : error.message;
    return this.serviceText(text) + (error.requestId ? ' Reference: ' + error.requestId : '');
  }
  authErrorText(error, verifying = false) {
    const text = error.code === 'AUTH_REQUIRED'
      ? 'That login code was not accepted. Check the code and try again.'
      : verifying
        ? 'Could not verify the login code right now. Please try again.'
        : 'Could not load the login instructions. Please try again.';
    return text + (error.requestId ? ' Reference: ' + error.requestId : '');
  }
  message(text, retry = false) {
    this.status.hidden = false;
    this.status.classList.toggle?.('is-loading', /^(Loading|Finding|Buffering)/.test(text));
    document.getElementById('player-status-text').textContent = this.serviceText(text);
    document.getElementById('player-retry').hidden = !retry;
    this.wake();
  }
  async run(action) {
    if (typeof action !== 'function' || !this.overlay.classList.contains('active')) return;
    this.abort?.abort();
    this.abort = new AbortController();
    const op = this.operation = { generation: ++this.generation, controller: this.abort };
    this.stopMedia();
    this.retry = action;
    try { await action(op); }
    catch (error) {
      if (!this.isCurrent(op) || error.name === 'AbortError') return;
      if (error.code === 'AUTH_REQUIRED') {
        this.message('Connect to the video service to continue.');
        await this.showAuth(op);
      } else { this.stopMedia(); this.auth.hidden = true; this.message(this.errorText(error), error.retryable !== false); }
    }
  }
  async showAuth(op = this.operation) {
    if (!this.isCurrent(op)) return;
    this.stopMedia();
    this.auth.hidden = false;
    this.status.hidden = true;
    document.getElementById('player-connect').disabled = false;
    const errorNode = document.getElementById('player-auth-error');
    const retryButton = document.getElementById('player-auth-retry');
    const image = document.getElementById('player-otp-image');
    const message = document.getElementById('player-auth-message');
    const requestGeneration = this.authRequestGeneration = (this.authRequestGeneration || 0) + 1;
    errorNode.textContent = '';
    retryButton.hidden = true;
    retryButton.disabled = true;
    image.onload = null;
    image.onerror = null;
    image.removeAttribute('src');
    image.hidden = true;
    message.textContent = 'Loading login instructions…';
    try {
      const info = await this.api('auth', {}, op);
      if (!this.isCurrent(op) || requestGeneration !== this.authRequestGeneration) return;
      message.textContent = this.serviceText(info.message || 'Enter the login code shown below.');
      if (typeof info.instructionImage === 'string' && /^https:\/\//i.test(info.instructionImage)) {
        image.hidden = false;
        image.onerror = () => {
          if (!this.isCurrent(op) || requestGeneration !== this.authRequestGeneration) return;
          image.hidden = true;
          errorNode.textContent = 'The login instruction image could not be loaded. Reload it to try again.';
          retryButton.hidden = false;
          retryButton.disabled = false;
        };
        image.src = info.instructionImage;
      } else {
        errorNode.textContent = 'The login instructions are temporarily unavailable. Reload to try again.';
        retryButton.hidden = false;
      }
      document.getElementById('player-otp').focus();
    } catch (error) {
      if (this.isCurrent(op) && requestGeneration === this.authRequestGeneration && error.name !== 'AbortError') {
        message.textContent = 'Enter the login code shown below.';
        errorNode.textContent = this.authErrorText(error);
        retryButton.hidden = false;
      }
    } finally {
      if (this.isCurrent(op) && requestGeneration === this.authRequestGeneration) retryButton.disabled = false;
    }
  }
  async open(item, extraTitle = '', episodeNum) {
    this.close();
    this.item = item;
    this.requestedEpisode = episodeNum;
    document.getElementById('player-title-display').textContent = item.title + (extraTitle ? ' • ' + extraTitle : '');
    this.overlay.classList.add('active');
    this.playerReturnFocus = document.activeElement;
    this.overlay.focus?.({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    this.controls.hidden = true;
    document.getElementById('player-series-controls').hidden = true;
    document.getElementById('player-title-picker').hidden = true;
    this.preview = document.getElementById('billboard-iframe');
    this.previewTitle = window.app?.featuredItem?.id;
    this.previewSource = this.preview?.getAttribute('src');
    this.preview?.removeAttribute('src');
    await this.run(async op => {
      if (item.netmirrorId) return this.loadTitle(item.netmirrorId, op);
      this.message('Finding ' + item.title + '…');
      const data = await this.api('search?q=' + encodeURIComponent(item.title), {}, op);
      const normal = title => title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      const result = data.results.find(x => normal(x.title) === normal(item.title));
      if (result) return this.loadTitle(result.id, op);
      if (!data.results.length) throw new Error('This title was not found in the video catalogue.');
      const select = document.getElementById('player-title-choice');
      this.options(select, data.results, x => x.id, x => x.title, 'Choose a title');
      document.getElementById('player-title-picker').hidden = false;
      this.status.hidden = true;
    });
  }
  options(select, items, key, label, placeholder) {
    select.replaceChildren();
    if (placeholder) { const option = new Option(placeholder, ''); option.disabled = true; option.selected = true; select.add(option); }
    for (const item of items) select.add(new Option(label(item), String(key(item))));
  }
  async loadTitle(id, op = this.operation) {
    this.assertCurrent(op);
    document.getElementById('player-title-picker').hidden = true;
    this.message('Loading title…');
    const title = await this.api('title?id=' + encodeURIComponent(id), {}, op);
    this.title = title;
    this.playbackCard = title.card || this.item;
    this.historyTitleId = String(id);
    if (title.seasons.length) {
      this.options(this.seasons, title.seasons, x => x.id, x => x.s);
      const selected = title.seasons.find(x => String(x.id) === String(this.item.selectedSeason));
      if (selected) this.seasons.value = selected.id;
      document.getElementById('player-series-controls').hidden = false;
      await this.loadSeason(this.seasons.value, op);
    } else if (title.episodes.length) {
      this.setEpisodes(title.episodes);
      document.getElementById('player-series-controls').hidden = false;
      await this.loadVideo(this.episodes.value, op);
    } else await this.loadVideo(id, op);
  }
  setEpisodes(episodes) {
    this.options(this.episodes, episodes, x => x.id, x => 'E' + x.ep + ' · ' + x.t);
    const selected = episodes.find(x => this.item.selectedEpisode ? String(x.id) === String(this.item.selectedEpisode) : +x.ep === +this.requestedEpisode);
    if (selected) this.episodes.value = selected.id;
    this.requestedEpisode = undefined;
    this.item.selectedEpisode = undefined;
    if (!episodes.length) throw new Error('No episodes are available for this season.');
  }
  async loadSeason(id, op = this.operation) {
    this.assertCurrent(op);
    this.stopMedia();
    this.message('Loading episodes…');
    const data = await this.api('episodes?id=' + encodeURIComponent(id), {}, op);
    this.setEpisodes(data.episodes);
    await this.loadVideo(this.episodes.value, op);
  }
  async loadVideo(id, op = this.operation, recovery = null) {
    this.assertCurrent(op);
    recovery ||= { id: String(id), attempts: 0, resume: null };
    this.recovery = recovery;
    this.retry = next => this.loadVideo(id, next, { ...recovery, attempts: 0 });
    this.stopMedia();
    this.controls.hidden = true;
    this.message('Loading video…');
    const data = await this.api('playback?id=' + encodeURIComponent(id), {}, op);
    if (!data.url) throw Object.assign(new Error('The service returned no video source for this episode.'), { code: 'SOURCE_UNAVAILABLE', retryable: true });
    this.playId = String(id);
    this.hasPlayed = false;
    this.historyEpisode = data.episode && data.episode !== 'MOVIE' ? data.episode : '';
    this.historyLastSaved = 0;
    document.getElementById('player-mini-title').textContent = data.title || this.item.title;
    this.savedTime = 0;
    const generation = this.mediaGeneration;
    const current = () => this.isCurrent(op) && this.mediaGeneration === generation && this.playId === String(id);
    this.mediaCurrent = current;
    this.wantPlayback = true;
    document.getElementById('player-title-display').textContent = data.title + (data.episode && data.episode !== 'MOVIE' ? ' • ' + data.episode : '');
    this.auth.hidden = true;
    this.controls.hidden = false;
    this.video.style.display = 'block';
    this.bindMediaEvents(current, recovery);
    // Chromium may advertise native HLS support while rejecting TS streams.
    // Prefer the MSE player; use native HLS only when MSE is unavailable.
    if (window.Hls?.isSupported()) {
      this.hls = new Hls({ maxBufferLength: 30, backBufferLength: 30 });
      const hls = this.hls;
      hls.subtitleDisplay = false;
      let recoveredMedia = false;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (current() && this.hls === hls) { this.refreshAudio(current, true); this.refreshSubtitles(current, true); this.startPlayback(current); }
      });
      for (const event of [Hls.Events.AUDIO_TRACKS_UPDATED, Hls.Events.AUDIO_TRACK_SWITCHED]) {
        if (event) hls.on(event, () => { if (current() && this.hls === hls) this.refreshAudio(current, event === Hls.Events.AUDIO_TRACKS_UPDATED); });
      }
      for (const event of [Hls.Events.SUBTITLE_TRACKS_UPDATED, Hls.Events.SUBTITLE_TRACK_SWITCH]) {
        if (event) hls.on(event, () => { if (current() && this.hls === hls) this.refreshSubtitles(current, event === Hls.Events.SUBTITLE_TRACKS_UPDATED); });
      }
      for (const event of [Hls.Events.SUBTITLE_FRAG_PROCESSED, Hls.Events.CUES_PARSED]) {
        if (event) hls.on(event, () => {
          if (current() && this.hls === hls) {
            this.positionSubtitles();
          }
        });
      }
      this.hls.on(Hls.Events.ERROR, (_, error) => {
        if (!current() || this.hls !== hls) return;
        if (/subtitle|vtt/i.test(error.details || '')) {
          document.getElementById('player-subtitle-note').textContent = 'Subtitles could not load. Turn them off and on to retry.';
          return;
        }
        if (!error.fatal) return;
        // Media 401 may mean an expired signed URL. Refresh through the JSON
        // API, which can distinguish source expiry from account authentication.
        if (error.type === Hls.ErrorTypes.NETWORK_ERROR || [401, 403, 404, 410].includes(error.response?.code)) {
          this.refreshSource(current, recovery);
        } else if (error.type === Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
          recoveredMedia = true;
          hls.recoverMediaError();
          this.armWatchdog(current, recovery);
        } else this.failMedia('The video could not be decoded. Retry playback or choose another episode.', current, recovery);
      });
      this.armWatchdog(current, recovery);
      this.hls.loadSource(data.url);
      this.hls.attachMedia(this.video);
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      const subtitles = this.video.textTracks;
      if (subtitles?.addEventListener) {
        const update = () => this.refreshSubtitles(current, true);
        const changed = () => this.refreshSubtitles(current);
        subtitles.addEventListener('addtrack', update); subtitles.addEventListener('removetrack', update); subtitles.addEventListener('change', changed);
        this.subtitleCleanup = () => { subtitles.removeEventListener('addtrack', update); subtitles.removeEventListener('removetrack', update); subtitles.removeEventListener('change', changed); };
      }
      const tracks = this.video.audioTracks;
      if (tracks?.addEventListener) {
        const update = () => this.refreshAudio(current, true);
        const changed = () => this.refreshAudio(current);
        tracks.addEventListener('addtrack', update);
        tracks.addEventListener('removetrack', update);
        tracks.addEventListener('change', changed);
        this.audioCleanup = () => {
          tracks.removeEventListener('addtrack', update);
          tracks.removeEventListener('removetrack', update);
          tracks.removeEventListener('change', changed);
        };
      }
      this.video.src = data.url;
      this.armWatchdog(current, recovery);
      this.startPlayback(current);
    } else this.failMedia('This browser does not support HLS video. Use a current Chrome, Edge, Firefox, or Safari.', current, recovery);
  }
  audioTracks() { return Array.from(this.hls ? (this.hls.audioTracks || []) : (this.video.audioTracks || [])); }
  audioIdentity(track) { return { lang: String(track.lang || track.language || '').toLowerCase(), name: String(track.name || track.label || '') }; }
  refreshAudio(current, restore = false) {
    if (!current?.()) return;
    const tracks = this.audioTracks();
    this.audioSelect.replaceChildren();
    if (!tracks.length) {
      this.audioSelect.add(new Option('Original audio', ''));
      this.audioSelect.setAttribute('title', 'This video has one audio track.');
      this.audioSelect.disabled = true;
      return;
    }
    const languages = { eng: 'English', hin: 'Hindi', tam: 'Tamil', tel: 'Telugu', mal: 'Malayalam', kan: 'Kannada', en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada' };
    const labels = tracks.map((track, index) => {
      const identity = this.audioIdentity(track);
      return identity.name.replace(/^\d+\.\s*/, '') || languages[identity.lang] || identity.lang || 'Audio track ' + (index + 1);
    });
    tracks.forEach((track, index) => {
      const label = labels.filter(value => value === labels[index]).length > 1 ? labels[index] + ' · Track ' + (index + 1) : labels[index];
      this.audioSelect.add(new Option(label, String(index)));
    });
    this.audioSelect.disabled = tracks.length < 2;
    this.audioSelect.setAttribute('title', tracks.length < 2 ? 'This video has one audio track.' : 'Choose an available audio language.');
    let selected = this.hls ? this.hls.audioTrack : tracks.findIndex(track => track.enabled);
    if (restore && this.audioPreference) {
      const preference = this.audioPreference;
      let preferred = tracks.findIndex(track => { const identity = this.audioIdentity(track); return identity.lang === preference.lang && identity.name === preference.name; });
      if (preferred < 0 && preference.lang && preference.lang !== 'und') preferred = tracks.findIndex(track => this.audioIdentity(track).lang === preference.lang);
      if (preferred >= 0 && preferred !== selected) { this.applyAudio(preferred, tracks); selected = preferred; }
    }
    if (selected < 0 || selected >= tracks.length) selected = Math.max(0, tracks.findIndex(track => track.default));
    this.audioSelect.value = String(selected);
  }
  applyAudio(index, tracks = this.audioTracks()) {
    if (this.hls) this.hls.audioTrack = index;
    else tracks.forEach((track, i) => { track.enabled = i === index; });
  }
  chooseAudio() {
    if (!this.mediaCurrent?.() || this.audioSelect.disabled || this.audioSelect.value === '') return;
    const tracks = this.audioTracks(), index = Number(this.audioSelect.value);
    if (!Number.isInteger(index) || !tracks[index]) return;
    this.audioPreference = this.audioIdentity(tracks[index]);
    try { localStorage.setItem('netmirror_audio_language', JSON.stringify(this.audioPreference)); } catch {}
    this.applyAudio(index, tracks);
    this.wake();
  }
  subtitleTracks() {
    return this.hls ? Array.from(this.hls.subtitleTracks || []) : Array.from(this.video.textTracks || []).filter(track => track.kind === 'subtitles' || track.kind === 'captions');
  }
  subtitleIndex(tracks = this.subtitleTracks()) { return this.hls ? (this.hls.subtitleDisplay ? this.hls.subtitleTrack : -1) : tracks.findIndex(track => track.mode === 'showing'); }
  preferredSubtitle(tracks) {
    const pref = this.subtitlePreference;
    if (!pref) return -1;
    let index = tracks.findIndex(track => { const identity = this.audioIdentity(track); return identity.lang === pref.lang && identity.name === pref.name; });
    if (index < 0 && pref.lang) index = tracks.findIndex(track => this.audioIdentity(track).lang === pref.lang);
    return index;
  }
  applySubtitle(index, tracks = this.subtitleTracks()) {
    if (this.hls) {
      if (index < 0) this.hls.subtitleDisplay = false;
      if (this.hls.subtitleTrack !== index) this.hls.subtitleTrack = index;
      if (index >= 0) this.hls.subtitleDisplay = true;
    } else tracks.forEach((track, i) => { track.mode = i === index ? 'showing' : 'disabled'; });
  }
  refreshSubtitles(current, restore = false) {
    if (!current?.()) return;
    const tracks = this.subtitleTracks();
    this.subtitleSelect.replaceChildren();
    this.subtitleSelect.add(new Option('Off', '-1'));
    tracks.forEach((track, index) => {
      const identity = this.audioIdentity(track);
      this.subtitleSelect.add(new Option(identity.name.replace(/^\d+\.\s*/, '') || identity.lang || 'Subtitles ' + (index + 1), String(index)));
    });
    let active = this.subtitleIndex(tracks);
    if (restore) {
      active = this.subtitlePreference?.enabled ? this.preferredSubtitle(tracks) : -1;
      this.applySubtitle(active, tracks);
    }
    if (active < 0 || active >= tracks.length) active = -1;
    this.subtitleSelect.value = String(active);
    this.subtitleSelect.disabled = !tracks.length;
    this.subtitleButton.disabled = !tracks.length;
    this.subtitleButton.setAttribute('aria-pressed', String(active >= 0));
    this.subtitleButton.setAttribute('aria-label', !tracks.length ? 'Subtitles unavailable' : active >= 0 ? 'Disable subtitles' : 'Enable subtitles');
    this.subtitleButton.setAttribute('data-tooltip', !tracks.length ? 'No subtitles available' : active >= 0 ? 'Turn subtitles off (C)' : 'Turn subtitles on (C)');
    document.getElementById('player-subtitle-note').textContent = tracks.length ? this.compactControls ? 'Choose Off to hide subtitles.' : 'Use CC or press C to toggle subtitles.' : 'No subtitles are available for this title.';
    this.positionSubtitles();
  }
  chooseSubtitle(index) {
    if (!this.mediaCurrent?.()) return;
    const tracks = this.subtitleTracks();
    if (!Number.isInteger(index) || index < -1 || index >= tracks.length) return;
    this.subtitlePreference = index < 0 ? { ...this.subtitlePreference, enabled: false } : { ...this.audioIdentity(tracks[index]), enabled: true };
    try { localStorage.setItem('netflix_subtitles', JSON.stringify(this.subtitlePreference)); } catch {}
    this.applySubtitle(index, tracks);
    this.refreshSubtitles(this.mediaCurrent);
    this.wake();
  }
  toggleSubtitles() {
    const tracks = this.subtitleTracks();
    if (!tracks.length) return;
    this.chooseSubtitle(this.subtitleIndex(tracks) >= 0 ? -1 : Math.max(0, this.preferredSubtitle(tracks)));
  }
  positionSubtitles() {
    // Temporarily lift bottom captions above the controls, including tracks
    // with an authored percentage position. Restore their placement when idle.
    this.positionedCues ||= new WeakMap();
    const visible = !this.overlay.classList.contains('idle') && !this.overlay.classList.contains('minimized');
    const height = this.video.clientHeight || 900;
    let clearance = (this.controls.offsetHeight || 180) + 24;
    const center = document.getElementById('player-center-controls');
    const seekTop = this.seek?.getBoundingClientRect?.().top;
    const videoTop = this.video.getBoundingClientRect?.().top;
    if (center && !center.hidden && Number.isFinite(seekTop) && Number.isFinite(videoTop)) clearance = Math.max(16, height - (seekTop - videoTop) + 28);
    const safeLine = Math.max(15, Math.min(80, 100 - clearance / height * 100));
    for (const track of Array.from(this.video.textTracks || [])) {
      if (track.mode !== 'showing') continue;
      for (const cue of Array.from(track.activeCues || [])) {
        let original = this.positionedCues.get(cue);
        if (!original && (cue.line === 'auto' || (cue.snapToLines === false ? cue.line >= 65 : cue.line < 0))) {
          original = { line: cue.line, snapToLines: cue.snapToLines };
          this.positionedCues.set(cue, original);
        }
        if (original) {
          cue.snapToLines = visible ? false : original.snapToLines;
          cue.line = visible ? safeLine : original.line;
        }
      }
    }
  }
  bindMediaEvents(current, recovery) {
    this.video.onplaying = () => {
      if (!current()) return;
      this.hasPlayed = true; this.saveWatchProgress(true);
      document.getElementById('player-minimize-btn').disabled = false;
      this.status.hidden = true; this.wantPlayback = true; this.setPlaying(true); this.wake();
      this.armWatchdog(current, recovery);
    };
    this.video.onpause = () => { if (current()) { this.saveWatchProgress(true); clearTimeout(this.stallTimer); this.stallTimer = null; this.setPlaying(false); this.wake(); } };
    this.video.onended = () => { if (current()) { this.saveWatchProgress(true, true); this.wantPlayback = false; clearTimeout(this.stallTimer); this.stallTimer = null; this.setPlaying(false); this.wake(); } };
    const waiting = () => {
      if (current() && this.wantPlayback && this.auth.hidden) { this.message('Buffering…'); this.armWatchdog(current, recovery); }
    };
    this.video.onwaiting = waiting;
    this.video.onstalled = waiting;
    this.video.onerror = () => {
      if (!current()) return;
      if (this.video.error?.code === 2) this.refreshSource(current, recovery);
      else this.failMedia(this.video.error?.code === 4
        ? 'This browser could not play the stream format. Retry playback.'
        : 'The video could not be decoded. Retry playback.', current, recovery);
    };
    this.video.onloadedmetadata = () => {
      if (!current()) return;
      this.refreshAudio(current, true);
      this.refreshSubtitles(current, true);
      let resume = recovery.resume;
      if (resume === null) {
        const saved = window.meflixHistory?.entries.find(entry => entry.playId === this.playId && entry.item.netmirrorId === this.historyTitleId);
        try { resume = saved ? (saved.completed ? 0 : saved.position) : +localStorage.getItem('netmirror_progress_' + this.playId) || 0; } catch { resume = 0; }
        if (resume >= this.video.duration - 15) resume = 0;
      }
      if (resume > 0 && Number.isFinite(this.video.duration)) this.video.currentTime = Math.min(resume, Math.max(0, this.video.duration - 0.1));
      this.updateTime();
      this.saveWatchProgress();
    };
    this.video.ontimeupdate = () => {
      if (!current()) return;
      this.updateTime();
      this.saveWatchProgress();
      if (this.video.currentTime > 0) recovery.resume = this.video.currentTime;
      if (Math.abs(this.video.currentTime - (this.savedTime || 0)) > 5) {
        this.savedTime = this.video.currentTime;
        try { localStorage.setItem('netmirror_progress_' + this.playId, String(this.savedTime)); } catch {}
      }
    };
    this.video.onseeked = () => { if (current() && this.wantPlayback) this.armWatchdog(current, recovery); };
  }
  armWatchdog(current, recovery) {
    // Repeated waiting/stalled notifications must not postpone the deadline.
    if (this.stallTimer || !current() || !this.wantPlayback) return;
    const before = this.video.currentTime;
    this.stallTimer = setTimeout(() => {
      this.stallTimer = null;
      if (!current() || !this.wantPlayback || this.video.ended) return;
      if (this.video.currentTime > before + 0.25) this.armWatchdog(current, recovery);
      else this.refreshSource(current, recovery);
    }, 20000);
  }
  saveWatchProgress(force = false, completed = false) {
    if (!this.playId || !this.hasPlayed || !this.mediaCurrent?.() || !window.meflixHistory) return;
    if (!force && Date.now() - (this.historyLastSaved || 0) < 5000) return;
    this.historyLastSaved = Date.now();
    const item = this.playbackCard || this.item;
    window.meflixHistory.record({ item: { ...item, netmirrorId: this.historyTitleId }, playId: this.playId, seasonId: this.title?.seasons?.length ? this.seasons.value : '', episode: this.historyEpisode, position: completed ? this.video.duration : this.video.currentTime, duration: Number.isFinite(this.video.duration) ? this.video.duration : 0, completed });
  }
  async minimize() {
    if (!this.overlay.classList.contains('active') || !this.hasPlayed || !this.playId) return;
    this.saveWatchProgress(true);
    if (document.fullscreenElement === this.overlay) { try { await document.exitFullscreen(); } catch { return; } }
    this.closeSettings();
    this.overlay.classList.add('minimized');
    this.overlay.setAttribute('aria-modal', 'false');
    document.body.style.overflow = '';
    this.playerReturnFocus?.focus?.({ preventScroll: true });
    this.onMinimize?.();
    window.dispatchEvent?.(new CustomEvent('meflix:player'));
  }
  restore() {
    if (!this.overlay.classList.contains('active')) return;
    this.overlay.classList.remove('minimized');
    this.overlay.setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';
    this.overlay.focus?.({ preventScroll: true });
    this.wake();
    this.onRestore?.();
    window.dispatchEvent?.(new CustomEvent('meflix:player'));
  }
  refreshSource(current, recovery) {
    if (!current()) return;
    const resume = this.video.currentTime;
    if (Number.isFinite(resume) && resume > 0) recovery.resume = resume;
    if (recovery.attempts >= 2) {
      this.failMedia('This episode’s video source is unavailable after two recovery attempts. Retry playback or try again later.', current, recovery);
      return;
    }
    recovery.attempts++;
    return this.run(op => this.loadVideo(recovery.id, op, recovery));
  }
  failMedia(text, current, recovery) {
    if (!current()) return;
    const resume = this.video.currentTime;
    if (Number.isFinite(resume) && resume > 0) recovery.resume = resume;
    this.stopMedia();
    this.message(text, true);
  }
  async startPlayback(current = this.mediaCurrent) {
    if (!current?.()) return;
    this.wantPlayback = true;
    try { await this.video.play(); }
    catch (error) {
      if (error.name === 'AbortError' || !current()) return;
      this.wantPlayback = false;
      clearTimeout(this.stallTimer); this.stallTimer = null;
      if (error.name === 'NotAllowedError') this.message('Press Play to start the video.');
      else if (error.name === 'NotSupportedError') this.message('This browser could not play the stream format. Retry playback.', true);
      else this.message('Video could not start. Retry playback. (' + error.name + ')', true);
    }
  }
  setPlaying(playing) {
    const mini = document.getElementById('player-mini-toggle');
    mini.textContent = playing ? '❚❚' : '▶';
    mini.setAttribute('aria-label', playing ? 'Pause mini video' : 'Play mini video');
    this.overlay.setAttribute('data-playing', String(playing));
    this.playButton.setAttribute('data-playing', String(playing));
    this.playButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    this.playButton.setAttribute('data-tooltip', playing ? 'Pause (Space)' : 'Play (Space)');
  }
  toggle() {
    if (this.video.paused) this.startPlayback();
    else { this.wantPlayback = false; this.video.pause(); }
  }
  skip(delta) { if (Number.isFinite(this.video.duration)) this.video.currentTime = Math.min(this.video.duration, Math.max(0, this.video.currentTime + delta)); }
  updateTime() {
    const format = value => {
      value = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      const hours = Math.floor(value / 3600), minutes = Math.floor(value % 3600 / 60), seconds = String(value % 60).padStart(2, '0');
      return (hours ? hours + ':' + String(minutes).padStart(2, '0') : minutes) + ':' + seconds;
    };
    const duration = this.video.duration;
    this.seek.value = Number.isFinite(duration) && duration > 0 ? this.video.currentTime / duration * 1000 : 0;
    this.seek.style.setProperty?.('--nf-progress', Number(this.seek.value) / 10 + '%');
    let buffered = 0;
    if (Number.isFinite(duration) && duration > 0) {
      for (let i = 0; i < (this.video.buffered?.length || 0); i++) {
        if (this.video.buffered.start(i) <= this.video.currentTime + .1 && this.video.buffered.end(i) >= this.video.currentTime) buffered = Math.min(100, this.video.buffered.end(i) / duration * 100);
      }
    }
    this.seek.style.setProperty?.('--nf-buffered', buffered + '%');
    this.seek.setAttribute('aria-valuetext', format(this.video.currentTime) + ' of ' + format(duration));
    this.positionSubtitles();
    document.getElementById('player-timecode').textContent = format(this.video.currentTime) + ' / ' + format(duration);
  }
  wake() {
    this.overlay.classList.remove('idle');
    this.positionSubtitles();
    clearTimeout(this.hudTimer);
    if (!this.video.paused && this.status.hidden && this.auth.hidden) this.hudTimer = setTimeout(() => {
      const keyboardFocus = this.overlay.contains(document.activeElement) && document.activeElement !== this.overlay && document.activeElement?.matches?.(':focus-visible');
      if (!keyboardFocus && this.settingsPanel.hidden && !document.getElementById('player-series-controls').classList.contains('mf-episodes-open')) { this.overlay.classList.add('idle'); this.positionSubtitles(); }
    }, 3000);
  }
  stopMedia() {
    this.saveWatchProgress(true);
    this.closeEpisodePicker();
    document.getElementById('player-minimize-btn').disabled = true;
    this.closeSettings();
    ++this.mediaGeneration;
    this.mediaCurrent = null;
    this.audioCleanup?.(); this.audioCleanup = null;
    this.subtitleCleanup?.(); this.subtitleCleanup = null;
    for (const track of Array.from(this.video.textTracks || [])) if (track.kind === 'subtitles' || track.kind === 'captions') track.mode = 'disabled';
    this.positionedCues = new WeakMap();
    this.subtitleSelect.replaceChildren(); this.subtitleSelect.add(new Option('Off', '-1'));
    this.subtitleSelect.disabled = true; this.subtitleButton.disabled = true;
    this.subtitleButton.setAttribute('aria-pressed', 'false');
    this.subtitleButton.setAttribute('aria-label', 'Subtitles unavailable');
    document.getElementById('player-subtitle-note').textContent = 'Loading available subtitles…';
    this.audioSelect.replaceChildren();
    this.audioSelect.add(new Option('Loading audio…', ''));
    this.audioSelect.disabled = true;
    this.wantPlayback = false;
    clearTimeout(this.stallTimer); this.stallTimer = null;
    for (const event of ['playing', 'pause', 'ended', 'waiting', 'stalled', 'error', 'loadedmetadata', 'timeupdate', 'seeked']) this.video['on' + event] = null;
    this.hls?.destroy(); this.hls = null;
    this.video.pause(); this.video.removeAttribute('src'); this.video.load();
    this.playId = null;
    this.setPlaying(false);
  }
  close() {
    this.saveWatchProgress(true);
    const wasOpen = this.overlay.classList.contains('active');
    this.abort?.abort();
    this.operation = null;
    ++this.generation;
    this.stopMedia();
    clearTimeout(this.hudTimer);
    this.overlay.classList.remove('active', 'idle', 'minimized');
    this.overlay.setAttribute('aria-modal', 'true');
    if (wasOpen && this.playerReturnFocus?.isConnected) this.playerReturnFocus.focus({ preventScroll: true });
    this.auth.hidden = true;
    this.status.hidden = true;
    document.body.style.overflow = '';
    if (this.preview && this.previewSource && (!this.previewTitle || this.previewTitle === window.app?.featuredItem?.id)) this.preview.src = this.previewSource;
    this.previewTitle = null;
    this.preview = null; this.previewSource = null;
    if (document.fullscreenElement === this.overlay) document.exitFullscreen().catch(() => {});
    window.dispatchEvent?.(new CustomEvent('meflix:player'));
  }
}
