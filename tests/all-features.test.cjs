const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

test('all admin features working: history, online active users, KPI stats, approval presets, IP whitelist', async () => {
  const dom = new JSDOM(fs.readFileSync('public/index.html', 'utf8'), { url: 'http://localhost:5178' });
  const document = dom.window.document;
  let authListener;
  const writes = [];
  const api = [];

  const now = Date.now();
  const mockDevices = [
    {
      deviceId: 'DEV-DHYAN-01',
      name: 'Dhyan',
      platform: 'Android',
      ip: '152.58.63.170',
      status: 'approved',
      requestedAt: now,
      lastActiveAt: now - 30000, // active 30s ago
      isWatching: true,
      currentTitle: 'The Mentalist',
      currentEpisode: 'Nothing But Blue Skies',
      currentProgress: 62,
      watchHistory: [
        {
          title: 'The Mentalist',
          episode: 'Nothing But Blue Skies',
          progress: 62,
          updatedAt: now - 30000,
          type: 'series',
          poster: 'https://imgcdn.kim/poster/v/70155590.jpg'
        },
        {
          title: 'Dhindora',
          episode: 'Lag Gayi',
          progress: 98,
          updatedAt: now - 3600000,
          type: 'series',
          poster: 'https://imgcdn.kim/poster/v/82643833.jpg'
        }
      ]
    },
    {
      deviceId: 'DEV-RUSHIT-02',
      name: 'Rushit Patel',
      platform: 'Apple iOS',
      ip: '152.59.51.254',
      status: 'pending',
      requestedAt: now - 120000,
      lastActiveAt: now - 86400000,
      isWatching: false
    }
  ];

  const user = { uid: 'meflix-admin-console', isAnonymous: false, getIdToken: async () => 'id-token', getIdTokenResult: async () => ({ claims: { admin: true } }) };
  const auth = { currentUser: null };
  const model = await import('data:text/javascript;base64,' + fs.readFileSync('public/model.js').toString('base64'));

  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { if (!this.open) return; this.open = false; this.dispatchEvent(new dom.window.Event('close')); };

  let snapDevicesCb;
  let snapIpsCb;

  const context = {
    ...model,
    document,
    window: dom.window,
    Node: dom.window.Node,
    console,
    Date,
    AbortController,
    Blob,
    URL,
    firebaseConfig: {},
    initializeApp: () => ({}),
    getAuth: () => auth,
    getFirestore: () => ({}),
    setPersistence: async () => {},
    browserLocalPersistence: {},
    onAuthStateChanged: (_auth, callback) => { authListener = callback; },
    signOut: async () => { auth.currentUser = null; await authListener(null); },
    signInWithCustomToken: async () => { auth.currentUser = user; await authListener(user); },
    getDocFromServer: async () => ({ exists: () => true, data: () => ({ pin: '1234' }) }),
    setDoc: async (ref, patch) => { writes.push({ action: 'set', ref, patch }); },
    updateDoc: async (ref, patch) => { writes.push({ action: 'update', ref, patch }); },
    deleteDoc: async (ref) => { writes.push({ action: 'delete', ref }); },
    doc: (_db, c, id) => ({ c, id }),
    collection: (_db, c) => c,
    onSnapshot: (ref, optOrCb, next) => {
      const cb = typeof optOrCb === 'function' ? optOrCb : next;
      if (ref === 'device_requests') {
        snapDevicesCb = cb;
        cb({ docs: mockDevices.map(d => ({ id: d.deviceId, data: () => d })), metadata: { fromCache: false } });
      } else if (ref === 'whitelisted_ips') {
        snapIpsCb = cb;
        cb({ docs: [{ data: () => ({ ip: '152.58.63.170' }), id: '152_58_63_170' }] });
      }
      return () => {};
    },
    fetch: async (url, options) => {
      api.push({ url, options });
      if (url.endsWith('/login')) return { ok: true, json: async () => ({ token: 'custom-token' }) };
      return { ok: true, json: async () => ({ success: true }) };
    },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    setInterval: () => 0
  };

  const code = fs.readFileSync('public/admin.js', 'utf8').replace(/^import .*;$/mg, '');
  await vm.runInNewContext('(async()=>{' + code + '})()', context);

  // 1. Enter PIN and Unlock
  document.getElementById('pin').value = '1234';
  document.getElementById('login-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  for (let i = 0; i < 20; i++) await Promise.resolve();

  assert.equal(document.getElementById('workspace').hidden, false, 'Workspace must be unlocked');

  // 2. Verify Online Active Users & KPIs
  assert.equal(document.getElementById('count-all').textContent, '2', 'Total count is 2');
  assert.equal(document.getElementById('count-watching').textContent, '1', '1 streaming device active');
  assert.equal(document.getElementById('count-pending').textContent, '1', '1 pending request');
  assert.equal(document.getElementById('count-whitelist').textContent, '1', '1 whitelisted IP');
  assert.equal(document.getElementById('active-indicator').hidden, false, 'Active indicator shows for active streamer');
  assert.equal(document.getElementById('active-count').textContent, '1 Active');

  // 3. Verify Watching Stream Banner on Active Card
  const watchingCard = document.querySelector('.now-watching-banner');
  assert.ok(watchingCard, 'Active streamer card must have now-watching banner');
  assert.match(watchingCard.textContent, /The Mentalist/);
  assert.match(watchingCard.textContent, /62%/);

  // 4. Verify History Modal Feature
  const historyBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('History'));
  assert.ok(historyBtn, 'History button must be present on device with history');
  historyBtn.click();

  assert.equal(document.getElementById('history-modal').open, true, 'History modal must open');
  assert.equal(document.getElementById('history-device-name').textContent, 'Dhyan');
  assert.equal(document.getElementById('history-count-text').textContent, '2 titles recorded');
  const historyRows = document.querySelectorAll('.history-row');
  assert.equal(historyRows.length, 2, 'Must render 2 history rows');
  assert.match(historyRows[0].textContent, /The Mentalist/);
  assert.match(historyRows[0].textContent, /62%/);
  document.getElementById('history-modal').close();

  // 5. Verify Duration Presets Modal & Quick Approve
  // Test Quick 1-Mo button on pending device:
  const quickBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Quick 1-Mo'));
  assert.ok(quickBtn, 'Quick 1-Mo button must exist on pending card');
  quickBtn.click();
  for (let i = 0; i < 10; i++) await Promise.resolve();

  const quickUpdate = writes.find(w => w.action === 'update' && w.ref.id === 'DEV-RUSHIT-02');
  assert.ok(quickUpdate, 'Must issue update for quick approval');
  assert.equal(quickUpdate.patch.status, 'approved');
  assert.equal(quickUpdate.patch.accessMode, 'scheduled');

  // 6. Verify Duration Modal (No Limit VIP Pass)
  const activateBtn = [...document.querySelectorAll('.btn-primary-red')].find(b => b.textContent.includes('Extend Access') || b.textContent.includes('Activate User'));
  assert.ok(activateBtn, 'Activate / Extend button exists');
  activateBtn.click();
  assert.equal(document.getElementById('details').open, true, 'Details modal opens');

  // Click 'No Limit VIP Pass' in presets grid
  const vipPreset = document.querySelector('[data-days="permanent"]');
  assert.ok(vipPreset, 'VIP preset button exists');
  vipPreset.click();
  assert.equal(document.getElementById('access-mode').value, 'permanent');

  // Click Approve
  document.getElementById('approve').click();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  const vipUpdate = writes.find(w => w.action === 'update' && w.ref.id === 'DEV-DHYAN-01' && w.patch.accessMode === 'permanent');
  assert.ok(vipUpdate, 'Must save permanent VIP pass with null expiry');
  assert.equal(vipUpdate.patch.expiresAt, null);

  // 7. Verify IP Whitelist Tab
  document.getElementById('tab-whitelist').click();
  assert.equal(document.getElementById('view-whitelist').hidden, false);
  assert.equal(document.getElementById('view-devices').hidden, true);

  // Add new IP
  document.getElementById('manual-ip-input').value = '171.61.161.7';
  document.getElementById('add-ip-btn').click();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  const ipAdd = writes.find(w => w.action === 'set' && w.ref.c === 'whitelisted_ips' && w.patch.ip === '171.61.161.7');
  assert.ok(ipAdd, 'Must write IP to whitelisted_ips collection');

  // 8. Verify Search Filtering
  document.getElementById('tab-all').click();
  document.getElementById('search').value = 'Dhyan';
  document.getElementById('search').dispatchEvent(new dom.window.Event('input'));
  assert.equal(document.querySelectorAll('.device-card').length, 1);
  assert.match(document.querySelector('.device-name').textContent, /Dhyan/);

  console.log('ALL ADMIN FEATURES VERIFIED AND WORKING 100%!');
});
