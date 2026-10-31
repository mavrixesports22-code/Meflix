import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signInWithCustomToken, signOut, signInAnonymously } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getFirestore, doc, getDocFromServer, collection, onSnapshot, updateDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { statusOf, filteredDevices, approvalPatch, relativeTime, csvCell } from './model.js';

const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const $ = id => document.getElementById(id);

const DURATION_PRESETS = [
  { id: '3h', label: 'Demo for 3hr', subtitle: 'Short 3-hour trial demo pass', ms: 3 * 60 * 60 * 1000 },
  { id: '24h', label: '24 hr Pass', subtitle: '1-Day standard pass', ms: 24 * 60 * 60 * 1000 },
  { id: '30d', label: '1 Month Subscription Pass', subtitle: 'Standard ₹200/month plan (30 Days)', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: '180d', label: '6 Month Pass', subtitle: 'Half-year pass (180 Days)', ms: 180 * 24 * 60 * 60 * 1000 },
  { id: 'perm', label: 'No Limit VIP Pass', subtitle: 'Permanent unlimited streaming pass', ms: null },
  { id: 'custom', label: 'Custom Option', subtitle: 'Set custom number of days', ms: 0 },
];

const state = {
  devices: [],
  whitelistedIps: [],
  filter: 'all',
  currentTab: 'all',
  query: '',
  selected: null,
  selectedPreset: '30d',
  unsubDevices: null,
  unsubWhitelist: null,
  busy: false,
  activity: Date.now(),
  authorized: false,
  authGeneration: 0
};

function element(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }
  for (const child of [children].flat(Infinity)) {
    if (child != null) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('toast').hidden = true, 3500);
}

function stop() {
  state.unsubDevices?.();
  state.unsubWhitelist?.();
  state.unsubDevices = null;
  state.unsubWhitelist = null;
  state.authorized = false;
  state.devices = [];
  state.whitelistedIps = [];
  state.selected = null;
  $('details').close();
  $('confirm').close();
  $('history-modal')?.close();
  $('updates').close();
}

async function lock(message = '') {
  ++state.authGeneration;
  try { sessionStorage.removeItem('meflix_admin_auth'); } catch {}
  stop();
  $('workspace').hidden = true;
  $('lock').hidden = false;
  $('pin').value = '';
  pinDots();
  $('login-error').textContent = message;
  if (auth.currentUser && !auth.currentUser.isAnonymous) await signOut(auth);
}

const isStreaming = d => Boolean(d.isWatching && d.lastActiveAt && (Date.now() - d.lastActiveAt < 300000));

function getExpirationDetails(d) {
  if (d.status === 'pending') {
    return { badge: 'Pending Approval', cls: 'pending', detail: 'Awaiting activation' };
  }
  if (d.status === 'rejected') {
    return { badge: 'Access Revoked', cls: 'rejected', detail: d.revokedAt ? `Revoked: ${new Date(d.revokedAt).toLocaleDateString()}` : 'Access disabled' };
  }
  if (!d.expiresAt) {
    return { badge: 'Lifetime VIP', cls: 'approved', detail: 'Permanent unlimited streaming pass' };
  }
  const diff = d.expiresAt - Date.now();
  const formattedEnd = new Date(d.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  if (diff <= 0) {
    return { badge: 'Plan Expired', cls: 'rejected', detail: `Expired on ${formattedEnd}` };
  }
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;
  const remainingText = days >= 1 ? `${days}d ${remainHours}h left` : `${totalHours}h ${mins}m left`;
  return { badge: `Active (${remainingText})`, cls: 'approved', detail: `Valid until ${formattedEnd}` };
}

function renderStats() {
  const devices = state.devices;
  const streamingCount = devices.filter(isStreaming).length;
  const pendingCount = devices.filter(d => d.status === 'pending').length;
  const ipsCount = state.whitelistedIps.length;

  $('count-all').textContent = devices.length;
  $('count-watching').textContent = streamingCount;
  $('count-pending').textContent = pendingCount;
  $('count-whitelist').textContent = ipsCount;
  $('nav-count').textContent = devices.length;

  if (streamingCount > 0) {
    $('active-indicator').hidden = false;
    $('active-count').textContent = `${streamingCount} Active`;
  } else {
    $('active-indicator').hidden = true;
  }

  const kpis = [
    { id: 'all', label: 'TOTAL DEVICES', num: devices.length, sub: 'Tracked in system', color: '#FFF' },
    { id: 'watching', label: 'STREAMING NOW', num: streamingCount, sub: streamingCount > 0 ? 'Active viewers' : 'Idle', color: streamingCount > 0 ? '#46D369' : '#FFF', hasDot: streamingCount > 0 },
    { id: 'pending', label: 'PENDING APPROVAL', num: pendingCount, sub: pendingCount > 0 ? 'Needs action' : 'Queue clear', color: pendingCount > 0 ? '#FFA726' : '#FFF' },
    { id: 'whitelist', label: 'IP WHITELIST', num: ipsCount, sub: 'Network passes', color: '#FFF' }
  ];

  $('stats').replaceChildren(...kpis.map(k => {
    return element('div', {
      class: `stat-card ${state.currentTab === k.id ? 'active' : ''}`,
      role: 'button',
      onClick: () => switchTab(k.id)
    }, [
      element('div', { class: 'stat-label-row' }, [
        element('span', { class: 'stat-label' }, k.label),
        k.hasDot ? element('span', { class: 'green-dot' }) : null
      ]),
      element('div', { class: 'stat-number', style: `color: ${k.color}` }, String(k.num)),
      element('div', { class: 'stat-sub' }, k.sub)
    ]);
  }));
}

function renderDeviceList() {
  const devices = state.devices;
  const rows = filteredDevices(devices, state.filter, state.query);
  $('result-count').textContent = `${rows.length} ${rows.length === 1 ? 'device' : 'devices'}`;

  if (!rows.length) {
    $('device-list').replaceChildren(
      element('div', { class: 'empty-state' }, [
        element('p', {}, devices.length ? (state.query ? `No matches for "${state.query}"` : 'No devices in this category.') : 'No devices yet. Requests appear here automatically.')
      ])
    );
    return;
  }

  $('device-list').replaceChildren(...rows.map(d => {
    const watching = isStreaming(d);
    const exp = getExpirationDetails(d);
    const historyCount = d.watchCount || (Array.isArray(d.watchHistory) ? d.watchHistory.length : 0);
    const platformIcon = /tv/i.test(d.platform || '') ? '📺' : /ios|android/i.test(d.platform || '') ? '📱' : '💻';

    return element('div', {
      class: 'device-card device-row',
      'aria-label': `Manage ${d.name || d.deviceId}`,
      onClick: (e) => {
        if (e && e.target && e.target.closest && e.target.closest('button')) return;
        openDetails(d.deviceId);
      }
    }, [
      // Card Header
      element('div', { class: 'card-header' }, [
        element('div', { class: 'card-header-main' }, [
          element('div', { class: 'device-glyph' }, platformIcon),
          element('div', {}, [
            element('div', { class: 'name-row' }, [
              element('strong', { class: 'device-name' }, d.name || 'Unnamed device')
            ]),
            element('div', { class: 'platform-meta' }, [
              'Platform: ', element('strong', {}, d.platform || 'Device'),
              '  •  Registered: ', element('strong', {}, d.requestedAt ? new Date(d.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown')
            ])
          ])
        ]),
        element('div', {}, [
          watching ? element('div', { class: 'watching-now-badge' }, [
            element('span', { class: 'green-dot' }),
            'WATCHING NOW'
          ]) : element('div', { class: `status-tag ${exp.cls}` }, exp.badge)
        ])
      ]),

      // 4-Column Metadata Grid
      element('div', { class: 'details-grid' }, [
        element('div', { class: 'detail-block' }, [
          element('span', { class: 'detail-label' }, 'IP ADDRESS'),
          element('span', { class: 'detail-mono' }, d.ip || 'Not recorded')
        ]),
        element('div', { class: 'detail-block' }, [
          element('span', { class: 'detail-label' }, 'DEVICE ID'),
          element('span', { class: 'detail-mono' }, d.deviceId)
        ]),
        element('div', { class: 'detail-block' }, [
          element('span', { class: 'detail-label' }, 'LAST ACTIVE'),
          element('span', { class: 'detail-value' }, relativeTime(d.lastActiveAt || d.requestedAt))
        ]),
        element('div', { class: 'detail-block' }, [
          element('span', { class: 'detail-label' }, 'SUBSCRIPTION VALIDITY'),
          element('span', { class: 'detail-value', style: `color: ${exp.cls === 'approved' ? '#46D369' : exp.cls === 'pending' ? '#FFA726' : '#E50914'}` }, exp.detail)
        ])
      ]),

      // Currently Watching Banner (if streaming)
      watching && d.currentTitle ? element('div', { class: 'now-watching-banner' }, [
        element('div', { class: 'now-watching-header' }, [
          element('span', { class: 'now-watching-title' }, [
            '▶ ', d.currentTitle, d.currentEpisode ? ` — ${d.currentEpisode}` : ''
          ]),
          element('span', { class: 'now-watching-pct' }, `${d.currentProgress ? d.currentProgress : 0}%`)
        ]),
        element('div', { class: 'progress-track' }, [
          element('div', { class: 'progress-fill', style: `width: ${Math.min(100, Math.max(5, d.currentProgress || 0))}%` })
        ])
      ]) : null,

      // Actions Row
      element('div', { class: 'card-actions' }, [
        element('div', { class: 'action-buttons' }, [
          element('button', {
            type: 'button',
            class: 'action-btn',
            onClick: () => openHistory(d)
          }, `⏱ History (${historyCount})`),

          element('button', {
            type: 'button',
            class: 'btn-primary-red',
            onClick: () => openDetails(d.deviceId)
          }, [
            '✓ ', d.status === 'approved' ? 'Extend Access' : 'Activate User'
          ]),

          d.status === 'pending' ? element('button', {
            type: 'button',
            class: 'action-btn btn-quick',
            onClick: () => quickApprove(d.deviceId)
          }, 'Quick 1-Mo (₹200)') : null,

          d.status === 'approved' ? element('button', {
            type: 'button',
            class: 'action-btn btn-revoke',
            onClick: () => revokeAccess(d.deviceId)
          }, 'Pause access') : null
        ]),

        element('button', {
          type: 'button',
          class: 'trash-btn',
          title: 'Delete device record',
          onClick: () => deleteDevice(d.deviceId)
        }, '🗑')
      ])
    ]);
  }));
}

function renderWhitelist() {
  const ips = state.whitelistedIps;
  if (!ips.length) {
    $('whitelist-list').replaceChildren(
      element('div', { class: 'empty-state' }, [
        element('p', {}, 'No whitelisted IP addresses. Add an IP above to grant automatic access.')
      ])
    );
    return;
  }
  $('whitelist-list').replaceChildren(...ips.map(ip => {
    return element('div', { class: 'ip-item' }, [
      element('span', { class: 'ip-text' }, ip),
      element('button', {
        type: 'button',
        class: 'action-btn btn-revoke',
        onClick: () => removeWhitelistedIp(ip)
      }, '✕ Remove')
    ]);
  }));
}

function render() {
  renderStats();
  renderDeviceList();
  renderWhitelist();
}

function switchTab(tabId) {
  state.currentTab = tabId;
  for (const t of ['all', 'watching', 'pending', 'whitelist', 'pin']) {
    const btn = $(`tab-${t}`);
    if (btn) btn.classList.toggle('active', t === tabId);
  }

  if (tabId === 'all' || tabId === 'watching' || tabId === 'pending') {
    state.filter = tabId;
    $('view-devices').hidden = false;
    $('view-whitelist').hidden = true;
    $('view-pin').hidden = true;
    $('search-box').hidden = false;
    renderDeviceList();
  } else if (tabId === 'whitelist') {
    $('view-devices').hidden = true;
    $('view-whitelist').hidden = false;
    $('view-pin').hidden = true;
    $('search-box').hidden = true;
    renderWhitelist();
  } else if (tabId === 'pin') {
    $('view-devices').hidden = true;
    $('view-whitelist').hidden = true;
    $('view-pin').hidden = false;
    $('search-box').hidden = true;
  }
  renderStats();
}

// Open Access / Duration Details
function openDetails(id) {
  const d = state.devices.find(device => device.deviceId === id);
  if (!d) return;
  state.selected = id;
  $('detail-name').textContent = d.name || 'Unnamed device';
  $('detail-error').textContent = '';

  const mode = $('access-mode');
  mode.value = d.expiresAt ? 'scheduled' : 'permanent';

  const daysInput = $('access-days');
  daysInput.value = '30';
  $('duration-field').hidden = mode.value !== 'scheduled';

  // Highlight default 30d preset
  updateDurationPresetsUI(d.expiresAt ? '30d' : 'perm');

  $('device-note').value = d.note || '';
  $('revoke').disabled = d.status === 'rejected';
  $('approve').disabled = false;
  $('approve').textContent = d.status === 'approved' ? 'Save access policy' : 'Approve device';

  if (!$('details').open) $('details').showModal();
}

function updateDurationPresetsUI(presetId) {
  state.selectedPreset = presetId;
  const items = $('presets-grid').querySelectorAll('.duration-item');
  items.forEach(item => {
    const isTarget = (presetId === 'perm' && item.dataset.days === 'permanent') ||
                     (presetId === '30d' && item.dataset.days === '30') ||
                     (presetId === '180d' && item.dataset.days === '180') ||
                     (presetId === '24h' && item.dataset.days === '1') ||
                     (presetId === '3h' && item.dataset.days === '0.125') ||
                     (presetId === 'custom' && item.dataset.days === 'custom');
    item.classList.toggle('active', isTarget);
    item.querySelector('.duration-radio').textContent = isTarget ? '✓' : '';
  });
}

// Preset clicks
$('presets-grid').addEventListener('click', event => {
  const btn = event.target.closest('.duration-item');
  if (!btn) return;
  const days = btn.dataset.days;
  if (days === 'permanent') {
    $('access-mode').value = 'permanent';
    $('duration-field').hidden = true;
    updateDurationPresetsUI('perm');
  } else if (days === 'custom') {
    $('access-mode').value = 'scheduled';
    $('duration-field').hidden = false;
    updateDurationPresetsUI('custom');
  } else {
    $('access-mode').value = 'scheduled';
    $('duration-field').hidden = true;
    $('access-days').value = String(Math.round(Number(days)));
    updateDurationPresetsUI(days === '30' ? '30d' : days === '180' ? '180d' : days === '1' ? '24h' : '3h');
  }
});

$('access-mode').addEventListener('change', () => {
  const isSched = $('access-mode').value === 'scheduled';
  $('duration-field').hidden = !isSched;
  updateDurationPresetsUI(isSched ? '30d' : 'perm');
});

// Watch History Modal
function openHistory(d) {
  $('history-device-name').textContent = d.name || d.deviceId;
  const history = Array.isArray(d.watchHistory) ? d.watchHistory : [];
  $('history-count-text').textContent = `${history.length} title${history.length === 1 ? '' : 's'} recorded`;

  if (!history.length) {
    $('history-list').replaceChildren(
      element('div', { class: 'empty-state' }, [
        element('p', {}, 'No viewing history recorded for this device.')
      ])
    );
  } else {
    $('history-list').replaceChildren(...history.map(item => {
      return element('div', { class: 'history-row' }, [
        item.poster ? element('img', { class: 'history-thumb', src: item.poster, alt: item.title }) : element('div', { class: 'history-thumb-placeholder' }, '🎬'),
        element('div', { class: 'history-info' }, [
          element('span', { class: 'history-title' }, item.title || 'Untitled'),
          item.episode ? element('span', { class: 'history-ep' }, item.episode) : null,
          element('div', { class: 'now-watching-header', style: 'margin-top: 4px;' }, [
            element('span', { style: 'font-size: 10px; color: #888;' }, `Progress: ${item.progress || 0}%`),
            element('span', { class: 'history-date' }, item.updatedAt ? relativeTime(item.updatedAt) : '')
          ]),
          element('div', { class: 'progress-track', style: 'margin-top: 2px;' }, [
            element('div', { class: 'progress-fill', style: `width: ${Math.min(100, Math.max(5, item.progress || 0))}%` })
          ])
        ])
      ]);
    }));
  }

  $('history-modal').showModal();
}

async function quickApprove(deviceId) {
  const patch = approvalPatch('scheduled', 30);
  const target = state.devices.find(d => d.deviceId === deviceId);
  await updateDoc(doc(db, 'device_requests', deviceId), patch);
  if (target?.ip) {
    const safeIpKey = target.ip.trim().replace(/[\.\:\/]/g, '_');
    try {
      await setDoc(doc(db, 'whitelisted_ips', safeIpKey), {
        ip: target.ip.trim(),
        addedAt: Date.now(),
        approvedFor: target.name || deviceId,
        expiresAt: patch.expiresAt,
        note: 'Quick 1-Mo (₹200)'
      }, { merge: true });
    } catch {}
  }
  toast('Activated 1 Month Subscription Pass');
}

async function revokeAccess(deviceId) {
  const target = state.devices.find(d => d.deviceId === deviceId);
  if (await confirmAction('Pause device access?', 'This device will lock when it reconnects. Its saved record and viewing history stay available.')) {
    await updateDoc(doc(db, 'device_requests', deviceId), { status: 'rejected', revokedAt: Date.now(), isWatching: false });
    if (target?.ip) {
      const safeIpKey = target.ip.trim().replace(/[\.\:\/]/g, '_');
      try { await deleteDoc(doc(db, 'whitelisted_ips', safeIpKey)); } catch {}
    }
    $('details').close();
    toast('Device access paused.');
  }
}

async function deleteDevice(deviceId) {
  const target = state.devices.find(d => d.deviceId === deviceId);
  if (await confirmAction('Delete device record?', 'The device will need a new approval to reconnect.')) {
    await deleteDoc(doc(db, 'device_requests', deviceId));
    if (target?.ip) {
      const safeIpKey = target.ip.trim().replace(/[\.\:\/]/g, '_');
      try { await deleteDoc(doc(db, 'whitelisted_ips', safeIpKey)); } catch {}
    }
    toast('Device record deleted.');
  }
}

async function removeWhitelistedIp(ip) {
  const safeIpKey = ip.trim().replace(/[\.\:\/]/g, '_');
  await deleteDoc(doc(db, 'whitelisted_ips', safeIpKey));
  toast(`Removed IP: ${ip}`);
}

function confirmAction(title, message) {
  return new Promise(resolve => {
    const dialog = $('confirm');
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      dialog.close();
      $('accept-confirm').onclick = null;
      $('cancel-confirm').onclick = null;
      dialog.removeEventListener('cancel', cancel);
      dialog.removeEventListener('close', close);
      resolve(value);
    };
    const cancel = event => { event.preventDefault(); finish(false); };
    const close = () => finish(false);
    $('accept-confirm').onclick = () => finish(true);
    $('cancel-confirm').onclick = () => finish(false);
    dialog.addEventListener('cancel', cancel);
    dialog.addEventListener('close', close);
    dialog.showModal();
  });
}

// Live real-time Firestore synchronization
function listen() {
  state.unsubDevices?.();
  state.unsubWhitelist?.();
  $('connection').textContent = 'Connecting…';

  state.unsubDevices = onSnapshot(collection(db, 'device_requests'), { includeMetadataChanges: true }, snapshot => {
    state.devices = snapshot.docs.map(d => ({ ...d.data(), deviceId: d.id }));
    $('load-error').hidden = true;
    $('connection').textContent = snapshot.metadata.fromCache ? 'Offline · cached' : 'Live updates';
    $('connection').className = snapshot.metadata.fromCache ? 'connection' : 'connection live';
    render();
    if (state.selected && !state.devices.some(d => d.deviceId === state.selected)) $('details').close();
  }, () => {
    $('connection').textContent = 'Connection unavailable';
    $('load-error').hidden = false;
    $('load-error').textContent = 'Device data could not be loaded. Check your connection or Firestore security rules.';
  });

  state.unsubWhitelist = onSnapshot(collection(db, 'whitelisted_ips'), snapshot => {
    state.whitelistedIps = snapshot.docs.map(d => d.data().ip || d.id.replace(/_/g, '.')).filter(Boolean);
    renderWhitelist();
    renderStats();
  }, () => {});
}

async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch {
    return null;
  }
}

async function api(action, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const token = action === 'login' ? null : await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/admin/${action}`, {
      method: body ? 'POST' : 'GET',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal
    });
    let data;
    if (typeof response.text === 'function') {
      const text = await response.text();
      try { data = JSON.parse(text); }
      catch {
        const clean = text.replace(/<[^>]*>/g, '').trim();
        throw Error(response.ok ? 'Unexpected server response.' : clean ? ('Server error (' + response.status + '): ' + clean.slice(0, 100)) : ('Server request failed with status ' + response.status));
      }
    } else {
      data = await response.json();
    }
    if (!response.ok) throw Error(data.error || 'Console request failed.');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// PIN Login Handling
let pinBusy = false;
function pinDots() {
  const value = $('pin').value;
  $('pin-dots').setAttribute('aria-label', `${value.length} of 4 digits entered`);
  [...$('pin-dots').children].forEach((dot, i) => dot.classList.toggle('filled', i < value.length));
}

function digit(value) {
  if (pinBusy || $('lock').hidden) return;
  $('login-error').textContent = '';
  $('pin').value = ($('pin').value + value).slice(0, 4);
  pinDots();
  if ($('pin').value.length === 4) $('login-form').requestSubmit();
}

$('keypad').addEventListener('click', event => {
  const button = event.target.closest('[data-digit]');
  if (button) digit(button.dataset.digit);
});

$('backspace').onclick = () => {
  if (!pinBusy) {
    $('pin').value = $('pin').value.slice(0, -1);
    $('login-error').textContent = '';
    pinDots();
  }
};

document.addEventListener('keydown', event => {
  if ($('lock').hidden || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    digit(event.key);
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    $('backspace').click();
  } else if (event.key === 'Enter' && $('pin').value.length === 4 && !pinBusy) {
    event.preventDefault();
    $('login-form').requestSubmit();
  }
});

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (pinBusy || $('pin').value.length !== 4) return;
  pinBusy = true;
  $('sign-in').disabled = true;
  $('login-error').textContent = '';
  $('keypad').querySelectorAll('button').forEach(b => b.disabled = true);
  const pinValue = $('pin').value;

  try {
    let loggedIn = false;
    try {
      const { token } = await api('login', { pin: pinValue });
      if (token) {
        await signInWithCustomToken(auth, token);
        loggedIn = true;
      }
    } catch {}

    if (!loggedIn) {
      await ensureAuth().catch(() => {});
      let targetPin = null;
      try {
        const snap = await getDocFromServer(doc(db, 'admin_settings', 'security'));
        if (snap.exists()) {
          const d = snap.data();
          targetPin = String(d.pin !== undefined ? d.pin : (d.password !== undefined ? d.password : '')).trim();
        }
      } catch {}

      if (!targetPin) {
        try {
          const snap2 = await getDocFromServer(doc(db, 'app_config', 'security'));
          if (snap2.exists()) {
            const d2 = snap2.data();
            targetPin = String(d2.pin !== undefined ? d2.pin : (d2.password !== undefined ? d2.password : '')).trim();
          }
        } catch {}
      }

      if (!targetPin) targetPin = '1234';
      if (pinValue !== targetPin) throw Error('Incorrect PIN.');

      state.authorized = true;
      try { sessionStorage.setItem('meflix_admin_auth', 'true'); } catch {}
      $('lock').hidden = true;
      $('workspace').hidden = false;
      listen();
    }
  } catch (error) {
    $('login-error').textContent = error.name === 'AbortError' ? 'Connection timed out. Please retry.' : error.message || 'Unable to unlock console.';
  } finally {
    pinBusy = false;
    $('sign-in').disabled = false;
    $('pin').value = '';
    pinDots();
    $('keypad').querySelectorAll('button').forEach(b => b.disabled = false);
  }
});

// Approve & Save Policy
$('approve').onclick = async () => {
  const id = state.selected;
  const mode = $('access-mode').value;
  const d = state.devices.find(device => device.deviceId === id);
  const days = Number($('access-days').value) || 30;
  const patch = approvalPatch(mode, days);

  await updateDoc(doc(db, 'device_requests', id), patch);
  if (d?.ip) {
    const safeIpKey = d.ip.trim().replace(/[\.\:\/]/g, '_');
    try {
      await setDoc(doc(db, 'whitelisted_ips', safeIpKey), {
        ip: d.ip.trim(),
        addedAt: Date.now(),
        approvedFor: d.name || id,
        expiresAt: patch.expiresAt,
        note: 'Admin Approval'
      }, { merge: true });
    } catch {}
  }
  $('details').close();
  toast(mode === 'permanent' ? 'Access activated: No Limit VIP Pass' : `Access activated: ${days} Days`);
};

$('revoke').onclick = async () => {
  if (state.selected) await revokeAccess(state.selected);
};

$('save-note-btn').onclick = async () => {
  const id = state.selected;
  if (!id) return;
  const note = $('device-note').value.trim();
  await updateDoc(doc(db, 'device_requests', id), { note });
  toast('Note saved.');
};

// Add IP Whitelist
$('add-ip-btn').onclick = async () => {
  const clean = $('manual-ip-input').value.trim();
  if (!clean) return;
  const safeIpKey = clean.replace(/[\.\:\/]/g, '_');
  await setDoc(doc(db, 'whitelisted_ips', safeIpKey), {
    ip: clean,
    addedAt: Date.now(),
    note: 'Admin Manual Whitelist'
  }, { merge: true });
  $('manual-ip-input').value = '';
  toast(`Whitelisted IP: ${clean}`);
};

// Change PIN form
$('pin-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('pin-error').textContent = '';
  if ($('new-pin').value !== $('confirm-pin').value) {
    $('pin-error').textContent = 'New PINs do not match.';
    return;
  }
  const currentPin = $('current-pin').value.trim();
  const newPin = $('new-pin').value.trim();
  $('save-pin').disabled = true;

  try {
    let changed = false;
    try {
      await api('pin', { currentPin, newPin });
      changed = true;
    } catch {}

    if (!changed) {
      let currentTargetPin = '1234';
      let pinVer = 1;
      try {
        const snap = await getDocFromServer(doc(db, 'admin_settings', 'security'));
        if (snap.exists()) {
          const d = snap.data();
          currentTargetPin = String(d.pin !== undefined ? d.pin : (d.password !== undefined ? d.password : '1234')).trim();
          pinVer = (d.pinVersion || 1) + 1;
        }
      } catch {}

      if (currentPin !== currentTargetPin) throw Error('Current PIN is incorrect.');
      if (newPin.length !== 4) throw Error('Use exactly 4 digits.');
      if (newPin === currentPin) throw Error('Choose a different PIN.');

      const updateData = {
        pin: newPin,
        password: newPin,
        pinVersion: pinVer,
        changedAt: Date.now()
      };
      await Promise.allSettled([
        setDoc(doc(db, 'admin_settings', 'security'), updateData, { merge: true }),
        setDoc(doc(db, 'app_config', 'security'), updateData, { merge: true })
      ]);
    }
    await lock('PIN changed. Unlock using your new PIN.');
  } catch (error) {
    $('pin-error').textContent = error.message || 'Unable to change PIN.';
  } finally {
    $('save-pin').disabled = false;
    for (const id of ['current-pin', 'new-pin', 'confirm-pin']) $(id).value = '';
  }
});

// App Releases Form
$('updates-nav').onclick = () => {
  $('release-error').textContent = '';
  $('updates').showModal();
};

$('release-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('release-error').textContent = '';
  const target = $('release-platform').value;
  const code = Number($('release-code').value);
  const url = $('release-url').value.trim();
  $('publish-release').disabled = true;

  try {
    await setDoc(doc(db, 'app_config', `version_${target}`), {
      platform: target,
      versionCode: code,
      versionName: $('release-name').value.trim(),
      apkUrl: url,
      changelog: $('release-notes').value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 40),
      isForceUpdate: $('release-force').checked,
      publishedAt: Date.now()
    }, { merge: true });
    $('updates').close();
    toast('Release settings published to Firebase.');
  } catch {
    $('release-error').textContent = 'Could not publish release settings.';
  } finally {
    $('publish-release').disabled = false;
  }
});

// Export CSV
$('export').onclick = () => {
  if (!state.authorized) return;
  const rows = [
    ['Name', 'Device ID', 'Platform', 'Status', 'Expiry', 'Last active', 'Note'],
    ...filteredDevices(state.devices, state.filter, state.query).map(d => [
      d.name, d.deviceId, d.platform, statusOf(d),
      d.expiresAt ? new Date(d.expiresAt).toISOString() : 'Permanent',
      d.lastActiveAt ? new Date(d.lastActiveAt).toISOString() : '',
      d.note
    ])
  ];
  const url = URL.createObjectURL(new Blob([rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  const a = element('a', { href: url, download: 'meflix-devices.csv' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Tab Clicks
$('tab-all').onclick = () => switchTab('all');
$('tab-watching').onclick = () => switchTab('watching');
$('tab-pending').onclick = () => switchTab('pending');
$('tab-whitelist').onclick = () => switchTab('whitelist');
$('tab-pin').onclick = () => switchTab('pin');

$('devices-nav').onclick = () => switchTab('all');
$('security-nav').onclick = () => switchTab('pin');
$('security-top').onclick = () => switchTab('pin');

$('refresh').onclick = () => { if (state.authorized) listen(); };
$('logout').onclick = () => void lock();

$('search').addEventListener('input', event => {
  state.query = event.target.value;
  renderDeviceList();
});

// Persistence & Auth State
await setPersistence(auth, browserLocalPersistence);
await ensureAuth().catch(() => {});

onAuthStateChanged(auth, async user => {
  const generation = ++state.authGeneration;
  let isAuthed = false;
  try { isAuthed = sessionStorage.getItem('meflix_admin_auth') === 'true'; } catch {}
  if (isAuthed) {
    state.authorized = true;
    state.activity = Date.now();
    $('lock').hidden = true;
    $('workspace').hidden = false;
    listen();
    return;
  }
  if (!user) {
    stop();
    $('workspace').hidden = true;
    $('lock').hidden = false;
    return;
  }
  try {
    if (user.isAnonymous) throw Error('Enter PIN');
    const claims = await user.getIdTokenResult();
    if (user.uid !== 'meflix-admin-console' || claims.claims.admin !== true) throw Error('Enter PIN');
    await api('session');
    if (generation !== state.authGeneration) return;
    state.authorized = true;
    state.activity = Date.now();
    $('lock').hidden = true;
    $('workspace').hidden = false;
    listen();
  } catch {
    if (generation === state.authGeneration) {
      let authed = false;
      try { authed = sessionStorage.getItem('meflix_admin_auth') === 'true'; } catch {}
      if (authed) {
        state.authorized = true;
        $('lock').hidden = true;
        $('workspace').hidden = false;
        listen();
      } else {
        await lock('Console locked. Enter your admin PIN.');
      }
    }
  }
});
