const assert = require('node:assert/strict');
const { normalizeTitle, identified } = require('../lib/catalog-data');
// Actual movie response shape that previously crashed before opening details.
const movie = normalizeTitle({ title: 'GodFather (Hindi)', type: 'm', episodes: [null],
  moredetails: [{ k: 'Cast', v: 'Example One, Example Two' }], suggest: [null, { id: '81597036' }] });
assert.deepEqual(movie.episodes, []);
assert.deepEqual(movie.season, []);
assert.deepEqual(movie.suggest, [{ id: '81597036' }]);
assert.equal(movie.moredetails.find(x => x.k.toLowerCase() === 'cast').v, 'Example One, Example Two');
const series = normalizeTitle({ season: [null, { id: '200', s: 'Season 1', selected: true }],
  episodes: [null, { id: '301', ep: '1', t: 'Episode One', info: [null, 'E1', '45m'] }, { t: 'Invalid' }],
  moredetails: [null, { k: null }, { k: 'Genre', v: null }] });
assert.equal(series.season[0].selected, true);
assert.equal(series.episodes[0].id, '301');
assert.deepEqual(series.episodes[0].info, ['E1', '45m']);
assert.equal(series.episodes.length, 1);
assert.equal(series.moredetails[0].v, '');
assert.deepEqual(normalizeTitle(null).episodes, []);
assert.deepEqual(identified([null, {}, { id: 'bad' }]), []);
console.log('PASS: movie [null] episodes, absent seasons, series IDs/selection, and nullable metadata');
