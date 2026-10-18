// The service uses [null] for movies' episodes; accept only real records.
const records = value => Array.isArray(value)
  ? value.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [];
const identified = value => records(value).filter(item => /^\d{1,20}$/.test(String(item.id || '')));
function normalizeTitle(value) {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return { ...data,
    moredetails: records(data.moredetails).filter(item => typeof item.k === 'string').map(item => ({ ...item, v: typeof item.v === 'string' ? item.v : '' })),
    season: identified(data.season),
    episodes: identified(data.episodes).map(item => ({ ...item, info: Array.isArray(item.info) ? item.info.filter(x => typeof x === 'string') : [] })),
    suggest: identified(data.suggest)
  };
}
module.exports = { normalizeTitle, identified };
