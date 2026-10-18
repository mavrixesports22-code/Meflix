/* Local metadata and playback positions only; never media URLs or credentials. */
class MeflixWatchHistory {
  constructor(storage) {
    this.storage = storage;
    this.key = 'meflix_watch_history_v1';
    this.entries = [];
    try {
      const saved = JSON.parse(storage?.getItem(this.key) || '[]');
      if (Array.isArray(saved)) this.entries = saved.map(entry => this.normalize(entry)).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100);
    } catch {}
  }
  normalize(value) {
    if (!value || typeof value !== 'object' || !value.item?.title || !value.playId || !value.item.netmirrorId) return null;
    if (typeof value.playId !== 'string' || typeof value.item.netmirrorId !== 'string' || typeof value.item.title !== 'string') return null;
    const text = (value, limit = 300) => typeof value === 'string' ? value.slice(0, limit) : '';
    const position = Number(value.position), duration = Number(value.duration);
    if (!Number.isFinite(position) || position < 0 || !Number.isFinite(duration) || duration < 0) return null;
    const artwork = value => {
      value = text(value, 2000);
      return /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) ? value : '';
    };
    const item = { id: text(value.item.id) || 'nm-' + text(value.item.netmirrorId), netmirrorId: text(value.item.netmirrorId), title: text(value.item.title), type: value.item.type === 'movie' ? 'movie' : 'series', poster: artwork(value.item.poster), backdrop: artwork(value.item.backdrop) };
    const playId = text(value.playId), safePosition = duration ? Math.min(position, duration) : position;
    return { key: item.netmirrorId + ':' + playId, item, playId, seasonId: text(value.seasonId), episode: text(value.episode), position: safePosition, duration, completed: value.completed === true || (duration > 0 && safePosition / duration >= .95), updatedAt: Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : Date.now() };
  }
  record(value) {
    const entry = this.normalize({ ...value, updatedAt: Date.now() });
    if (!entry) return;
    this.entries = [entry, ...this.entries.filter(item => item.key !== entry.key)].slice(0, 100);
    this.persist();
    return entry;
  }
  persist() {
    try { this.storage?.setItem(this.key, JSON.stringify(this.entries)); } catch {}
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('meflix:history', { detail: this.entries }));
  }
  recent(limit = 12) {
    const seen = new Set();
    return this.entries.filter(entry => !seen.has(entry.item.netmirrorId) && seen.add(entry.item.netmirrorId)).slice(0, limit);
  }
  continuing(limit = 12) { return this.recent(100).filter(entry => !entry.completed && entry.position >= 5).slice(0, limit); }
  forTitle(id) { return this.recent(100).find(entry => entry.item.netmirrorId === id || entry.item.id === id); }
  remove(key) {
    const removed = this.entries.filter(entry => entry.key === key);
    this.entries = this.entries.filter(entry => entry.key !== key);
    for (const entry of removed) try { this.storage?.removeItem('netmirror_progress_' + entry.playId); } catch {}
    this.persist();
  }
  clear() { for (const entry of [...this.entries]) try { this.storage?.removeItem('netmirror_progress_' + entry.playId); } catch {} this.entries = []; this.persist(); }
}
if (typeof module !== 'undefined') module.exports = MeflixWatchHistory;
if (typeof window !== 'undefined') {
  window.MeflixWatchHistory = MeflixWatchHistory;
  let storage; try { storage = window.localStorage; } catch {}
  window.meflixHistory = new MeflixWatchHistory(storage);
}
