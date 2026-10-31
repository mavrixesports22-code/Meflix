import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LockScreen } from './components/LockScreen.jsx';
import { TopBar } from './components/TopBar.jsx';
import { StatsRow } from './components/StatsRow.jsx';
import { NavTabs } from './components/NavTabs.jsx';
import { DeviceCard } from './components/DeviceCard.jsx';
import { DurationModal } from './components/DurationModal.jsx';
import { HistoryModal } from './components/HistoryModal.jsx';
import { WhitelistTab } from './components/WhitelistTab.jsx';
import { SecurityPinTab } from './components/SecurityPinTab.jsx';
import { ConfirmModal } from './components/ConfirmModal.jsx';
import { statusOf, filteredDevices, approvalPatch, relativeTime, csvCell } from '../public/model.js';

export const isStreaming = (d) => Boolean(d.isWatching && d.lastActiveAt && (Date.now() - d.lastActiveAt < 300000));

export function getFullExpirationDetails(d, now = Date.now()) {
  if (d.status === 'pending') {
    return { badge: 'Pending Approval', cls: 'pending', badgeColor: '#FFA726', detail: 'Awaiting activation' };
  }
  if (d.status === 'rejected') {
    return { badge: 'Access Revoked', cls: 'rejected', badgeColor: '#E50914', detail: d.revokedAt ? `Revoked: ${new Date(d.revokedAt).toLocaleDateString()}` : 'Access disabled' };
  }
  if (!d.expiresAt) {
    return { badge: 'Lifetime VIP', cls: 'approved', badgeColor: '#46D369', detail: 'Permanent unlimited streaming pass' };
  }
  const diff = d.expiresAt - now;
  const formattedEnd = new Date(d.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  if (diff <= 0) {
    return { badge: 'Plan Expired', cls: 'rejected', badgeColor: '#E50914', detail: `Expired on ${formattedEnd}` };
  }
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;
  const remainingText = days >= 1 ? `${days}d ${remainHours}h left` : `${totalHours}h ${mins}m left`;
  return { badge: `Active (${remainingText})`, cls: 'approved', badgeColor: '#46D369', detail: `Valid until ${formattedEnd}` };
}

export function AdminApp({
  firebase: { app, auth, db, doc, getDocFromServer, collection, onSnapshot, updateDoc, setDoc, deleteDoc, signInWithCustomToken }
}) {
  const [authorized, setAuthorized] = useState(() => {
    try { return sessionStorage.getItem('meflix_admin_auth') === 'true'; } catch { return false; }
  });
  const [devices, setDevices] = useState([]);
  const [whitelistedIps, setWhitelistedIps] = useState([]);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [durationTarget, setDurationTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);

  const handleOpenHistory = useCallback((d) => {
    setHistoryTarget(d);
    const modal = document.getElementById('history-modal');
    if (modal) {
      if (typeof modal.showModal === 'function') modal.showModal();
      modal.open = true;
    }
    const nameEl = document.getElementById('history-device-name');
    if (nameEl) nameEl.textContent = d.name || d.deviceId;
    const countEl = document.getElementById('history-count-text');
    const history = Array.isArray(d.watchHistory) ? d.watchHistory : [];
    if (countEl) countEl.textContent = `${history.length} title${history.length === 1 ? '' : 's'} recorded`;
    const listEl = document.getElementById('history-list');
    if (listEl && history.length > 0) {
      listEl.innerHTML = history.map(item => `
        <div class="history-row">
          ${item.poster ? `<img src="${item.poster}" alt="${item.title}" class="history-thumb" />` : '<div class="history-thumb-placeholder"></div>'}
          <div class="history-info">
            <span class="history-title">${item.title || 'Untitled'}</span>
            ${item.episode ? `<span class="history-ep">${item.episode}</span>` : ''}
            <div class="history-progress-meta">
              <span class="history-progress-pct">Progress: ${item.progress || 0}%</span>
              <span class="history-date">${item.updatedAt ? relativeTime(item.updatedAt) : ''}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width: ${item.progress || 0}%"></div></div>
          </div>
        </div>
      `).join('');
    }
  }, []);

  const handleOpenDetails = useCallback((deviceId) => {
    const d = devices.find(device => device.deviceId === deviceId);
    setDurationTarget(d);
    window._activeDevice = d;
    const modal = document.getElementById('details');
    if (modal) {
      if (typeof modal.showModal === 'function') modal.showModal();
      modal.open = true;
    }
    const nameEl = document.getElementById('detail-name');
    if (nameEl && d) nameEl.textContent = d.name || d.deviceId;
    const noteEl = document.getElementById('device-note');
    if (noteEl && d) noteEl.value = d.note || '';
    const modeEl = document.getElementById('access-mode');
    if (modeEl && d) modeEl.value = (!d.expiresAt && d.status === 'approved') ? 'permanent' : 'permanent';
  }, [devices]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleUnlock = useCallback(() => {
    setAuthorized(true);
    const ws = document.getElementById('workspace');
    if (ws) ws.hidden = false;
    const lk = document.getElementById('lock');
    if (lk) lk.hidden = true;
  }, []);

  const handleLock = useCallback((msg) => {
    try { sessionStorage.removeItem('meflix_admin_auth'); } catch {}
    setAuthorized(false);
    setDevices([]);
    setWhitelistedIps([]);
    setDurationTarget(null);
    setHistoryTarget(null);
    setConfirmModalData(null);
    const ws = document.getElementById('workspace');
    if (ws) ws.hidden = true;
    const lk = document.getElementById('lock');
    if (lk) lk.hidden = false;
    const errEl = document.getElementById('login-error');
    if (errEl && msg) errEl.textContent = msg;
  }, []);

  // Real-time Firestore sync on mount
  useEffect(() => {
    let unsubDevices = null;
    let unsubWhitelist = null;

    try {
      if (typeof onSnapshot === 'function' && typeof collection === 'function') {
        unsubDevices = onSnapshot(collection(db, 'device_requests'), { includeMetadataChanges: true }, (snapshot) => {
          if (snapshot && snapshot.docs) {
            const list = snapshot.docs.map(d => ({ ...(typeof d.data === 'function' ? d.data() : d.data), deviceId: d.id }));
            setDevices(list);
          }
        }, (err) => {
          console.warn('device_requests onSnapshot notice:', err);
        });

        unsubWhitelist = onSnapshot(collection(db, 'whitelisted_ips'), { includeMetadataChanges: true }, (snapshot) => {
          if (snapshot && snapshot.docs) {
            const list = snapshot.docs.map(d => {
              const data = typeof d.data === 'function' ? d.data() : d.data;
              return data?.ip || d.id.replace(/_/g, '.');
            });
            setWhitelistedIps(list);
          }
        }, (err) => {
          console.warn('whitelisted_ips onSnapshot notice:', err);
        });
      }
    } catch (e) {
      console.warn('Firestore sync initialization notice:', e);
    }

    return () => {
      if (typeof unsubDevices === 'function') unsubDevices();
      if (typeof unsubWhitelist === 'function') unsubWhitelist();
    };
  }, [db, collection, onSnapshot]);

  // Quick 1-Mo Approve
  const handleQuickApprove = useCallback(async (deviceId) => {
    const patch = approvalPatch('scheduled', 30);
    await updateDoc(doc(db, 'device_requests', deviceId), patch);
    showToast('Activated 1 Month Subscription Pass');
  }, [db, doc, updateDoc, showToast]);

  // Approve with Patch
  const handleApproveWithPatch = useCallback(async (deviceId, patch) => {
    await updateDoc(doc(db, 'device_requests', deviceId), patch);
    setDurationTarget(null);
    showToast('Device access pass applied.');
  }, [db, doc, updateDoc, showToast]);

  // Revoke Access
  const handleRevoke = useCallback((deviceId) => {
    setConfirmModalData({
      title: 'Pause Device Access',
      message: 'Are you sure you want to pause/reject access for this device? It can be reactivated anytime.',
      onConfirm: async () => {
        await updateDoc(doc(db, 'device_requests', deviceId), { status: 'rejected', revokedAt: Date.now() });
        setConfirmModalData(null);
        showToast('Device access paused.');
      }
    });
    const confirmEl = document.getElementById('confirm');
    if (confirmEl) {
      if (typeof confirmEl.showModal === 'function') confirmEl.showModal();
      confirmEl.open = true;
    }
  }, [db, doc, updateDoc, showToast]);

  // Delete Device Record
  const handleDelete = useCallback((deviceId) => {
    setConfirmModalData({
      title: 'Delete Device Record',
      message: 'Are you sure you want to delete this device registration? If the user opens the app again, a new request will appear.',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'device_requests', deviceId));
        setConfirmModalData(null);
        showToast('Device registration deleted.');
      }
    });
    const confirmEl = document.getElementById('confirm');
    if (confirmEl) {
      if (typeof confirmEl.showModal === 'function') confirmEl.showModal();
      confirmEl.open = true;
    }
  }, [db, doc, deleteDoc, showToast]);

  // Add IP to Whitelist
  const handleAddWhitelistIp = async (ip) => {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    const ipDocId = cleanIp.replace(/[\.\:]/g, '_');
    await setDoc(doc(db, 'whitelisted_ips', ipDocId), {
      ip: cleanIp,
      addedAt: Date.now(),
      note: 'Admin Whitelist'
    }, { merge: true });
    showToast(`Added ${cleanIp} to whitelist.`);
  };

  // Remove IP from Whitelist
  const handleRemoveWhitelistIp = async (ip) => {
    const ipDocId = ip.replace(/[\.\:]/g, '_');
    await deleteDoc(doc(db, 'whitelisted_ips', ipDocId));
    showToast(`Removed ${ip} from whitelist.`);
  };

  // Update Security PIN
  const handleUpdatePin = async (currentPin, newPin, serverChanged = false) => {
    if (!serverChanged) {
      let currentTargetPin = '1234';
      let pinVer = 1;

      try {
        const snap1 = await getDocFromServer(doc(db, 'app_config', 'security'));
        if (snap1 && (typeof snap1.exists === 'function' ? snap1.exists() : snap1.exists)) {
          const d1 = typeof snap1.data === 'function' ? snap1.data() : snap1.data;
          currentTargetPin = String(d1.pin !== undefined ? d1.pin : (d1.password !== undefined ? d1.password : '1234')).trim();
          pinVer = (d1.pinVersion || 1) + 1;
        }
      } catch {}

      if (currentTargetPin === '1234') {
        try {
          const snap2 = await getDocFromServer(doc(db, 'admin_settings', 'security'));
          if (snap2 && (typeof snap2.exists === 'function' ? snap2.exists() : snap2.exists)) {
            const d2 = typeof snap2.data === 'function' ? snap2.data() : snap2.data;
            currentTargetPin = String(d2.pin !== undefined ? d2.pin : (d2.password !== undefined ? d2.password : '1234')).trim();
            pinVer = (d2.pinVersion || 1) + 1;
          }
        } catch {}
      }

      if (currentPin && currentPin !== currentTargetPin) {
        throw new Error('Current PIN is incorrect.');
      }
      if (newPin.length !== 4) {
        throw new Error('Use exactly 4 digits.');
      }

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

    showToast('PIN successfully changed.');
    handleLock('PIN changed. Unlock using your new PIN.');
  };

  // Export CSV
  const handleExport = () => {
    const rows = [
      ['Name', 'Device ID', 'Platform', 'IP', 'Status', 'Expiry', 'Last Active'],
      ...filteredRows.map(d => [
        d.name || '',
        d.deviceId,
        d.platform || '',
        d.ip || '',
        d.status || '',
        d.expiresAt ? new Date(d.expiresAt).toISOString() : 'Lifetime VIP',
        d.lastActiveAt ? new Date(d.lastActiveAt).toISOString() : ''
      ])
    ];
    const csvContent = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meflix-devices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Devices exported to CSV.');
  };

  // Filtered rows for currently active tab
  const filteredRows = useMemo(() => {
    return filteredDevices(devices, currentTab, searchQuery);
  }, [devices, currentTab, searchQuery]);

  const streamingCount = useMemo(() => {
    return devices.filter(isStreaming).length;
  }, [devices]);

  const isDeviceView = currentTab === 'all' || currentTab === 'watching' || currentTab === 'pending';

  return (
    <>
      {/* 1. CINEMATIC LOCK SCREEN */}
      <LockScreen
        hidden={authorized}
        onUnlock={handleUnlock}
        db={db}
        doc={doc}
        getDocFromServer={getDocFromServer}
        auth={auth}
        signInWithCustomToken={signInWithCustomToken}
      />

      {/* 2. EXECUTIVE WORKSPACE */}
      <div id="workspace" className="workspace" hidden={!authorized}>
        <div className="modal-card">
          {/* Top Bar */}
          <TopBar
            streamingCount={streamingCount}
            onRefresh={() => showToast('Syncing with Firebase...')}
            onLock={() => handleLock()}
            onExport={handleExport}
          />

          <main className="main-content">
            {/* KPI Metric Cards */}
            <StatsRow
              devices={devices}
              whitelistedIps={whitelistedIps}
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              isStreaming={isStreaming}
            />

            {/* Navigation Tabs & Search Toolbar */}
            <NavTabs
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              totalCount={devices.length}
              streamingCount={streamingCount}
              pendingCount={devices.filter(d => d.status === 'pending').length}
              whitelistCount={whitelistedIps.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isDeviceView={isDeviceView}
            />

            {/* Content Area */}
            <div className="content-body">
              {/* DEVICE LIST (All, Watching, Pending) */}
              <div id="view-devices" className="device-list-container" hidden={!isDeviceView}>
                <div className="list-meta-bar">
                  <span id="result-count" className="result-count-label">
                    {filteredRows.length} {filteredRows.length === 1 ? 'device' : 'devices'}
                  </span>
                  <span className="sub-policy-hint">
                    {currentTab === 'watching' ? 'Active streaming sessions in real-time' : 'Device-bound permanent access'}
                  </span>
                </div>

                <div id="device-list" className="device-cards-grid">
                  {filteredRows.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        {devices.length
                          ? (searchQuery ? `No matches found for "${searchQuery}"` : 'No devices in this category.')
                          : 'No devices registered yet. Installation requests appear here automatically.'}
                      </p>
                    </div>
                  ) : (
                    filteredRows.map(device => (
                      <DeviceCard
                        key={device.deviceId}
                        device={device}
                        isStreaming={isStreaming}
                        expirationDetails={getFullExpirationDetails(device)}
                        relativeTime={relativeTime}
                        onOpenDetails={handleOpenDetails}
                        onOpenHistory={handleOpenHistory}
                        onQuickApprove={handleQuickApprove}
                        onRevoke={handleRevoke}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* WHITELIST TAB */}
              <WhitelistTab
                hidden={currentTab !== 'whitelist'}
                whitelistedIps={whitelistedIps}
                onAddIp={handleAddWhitelistIp}
                onRemoveIp={handleRemoveWhitelistIp}
              />

              {/* SECURITY PIN TAB */}
              <SecurityPinTab
                hidden={currentTab !== 'pin'}
                onUpdatePin={handleUpdatePin}
                onLock={handleLock}
              />
            </div>
          </main>

          {/* MODALS */}
          <DurationModal
            device={durationTarget}
            onClose={() => setDurationTarget(null)}
            onApprove={handleApproveWithPatch}
            onRevoke={handleRevoke}
            onSaveNote={async (deviceId, noteText) => {
              await updateDoc(doc(db, 'device_requests', deviceId), { note: noteText });
              showToast('Note saved.');
            }}
            approvalPatch={approvalPatch}
          />

          <HistoryModal
            device={historyTarget}
            onClose={() => setHistoryTarget(null)}
            relativeTime={relativeTime}
          />

          <ConfirmModal
            title={confirmModalData?.title}
            message={confirmModalData?.message}
            onCancel={() => setConfirmModalData(null)}
            onConfirm={confirmModalData?.onConfirm}
          />

          {/* APP RELEASES MODAL */}
          <dialog id="updates" className="sub-modal" style={{ display: 'none' }}>
            <form
              id="release-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const target = document.getElementById('release-platform')?.value || 'tv';
                const code = Number(document.getElementById('release-code')?.value) || 1;
                const url = document.getElementById('release-url')?.value || '';
                const notes = document.getElementById('release-notes')?.value || '';
                const force = document.getElementById('release-force')?.checked || false;
                await setDoc(doc(db, 'app_config', `version_${target}`), {
                  platform: target,
                  versionCode: code,
                  apkUrl: url,
                  changelog: notes.split('\n').map(s => s.trim()).filter(Boolean),
                  isForceUpdate: force
                }, { merge: true });
              }}
            >
              <select id="release-platform"><option value="tv">Fire TV</option></select>
              <input id="release-name" />
              <input id="release-code" type="number" />
              <input id="release-url" type="url" />
              <textarea id="release-notes" />
              <input id="release-force" type="checkbox" />
              <p id="release-error"></p>
            </form>
          </dialog>

          {/* Toast */}
          {toastMessage && (
            <div id="toast" className="toast" role="status">
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
