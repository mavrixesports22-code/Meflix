import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adminApi, verifyAdminSession } from './adminApi.js';
import { LockScreen } from './components/LockScreen.jsx';
import { TopBar } from './components/TopBar.jsx';
import { StatsRow } from './components/StatsRow.jsx';
import { NavTabs } from './components/NavTabs.jsx';
import { DeviceCard } from './components/DeviceCard.jsx';
import { DurationModal } from './components/DurationModal.jsx';
import { HistoryModal } from './components/HistoryModal.jsx';
import { SecurityPinTab } from './components/SecurityPinTab.jsx';
import { ReleaseModal } from './components/ReleaseModal.jsx';
import { ConfirmModal } from './components/ConfirmModal.jsx';
import { filteredDevices, approvalPatch, relativeTime, csvCell } from '../public/model.js';

export const isStreaming = (d) => Boolean(d.status==='approved' && (!d.expiresAt||d.expiresAt>Date.now()) && d.isWatching && d.lastActiveAt && (Date.now() - d.lastActiveAt < 300000));

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

export function AdminApp({firebase: providedFirebase, loadFirebase}) {
  const [client,setClient]=useState(providedFirebase || null);
  const {auth,db,doc,getDocFromServer,collection,onSnapshot,updateDoc,setDoc,deleteDoc,onAuthStateChanged,signOut}=client || {};
  const ensureClient=useCallback(async()=>{
    if(client)return client;
    const ready=await loadFirebase();setClient(ready);return ready;
  },[client,loadFirebase]);
  useEffect(()=>{
    if(providedFirebase || !loadFirebase)return;
    let active=true;
    void loadFirebase().then(ready=>{if(active)setClient(ready);}).catch(()=>{});
    return()=>{active=false;};
  },[providedFirebase,loadFirebase]);
  const [authorized, setAuthorized] = useState(false);
  const [clock,setClock]=useState(Date.now());
  const [refreshAttempt,setRefreshAttempt]=useState(0);
  const [releasesOpen,setReleasesOpen]=useState(false);
  const toastTimer=useRef();
  useEffect(()=>()=>clearTimeout(toastTimer.current),[]);
  useEffect(()=>{if(!authorized)return;const timer=setInterval(()=>setClock(Date.now()),60000);return()=>clearInterval(timer);},[authorized]);
  const [devices, setDevices] = useState([]);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [durationTarget, setDurationTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);

  const closeDuration = useCallback(() => setDurationTarget(null), []);
  const closeHistory = useCallback(() => setHistoryTarget(null), []);
  const closeConfirm = useCallback(() => setConfirmModalData(null), []);
  const handleOpenHistory = useCallback(d => setHistoryTarget(d), []);
  const handleOpenDetails = useCallback(id => setDurationTarget(devices.find(d => d.deviceId === id) || null), [devices]);
  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current=setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleUnlock = useCallback(async token => {
    const ready=await ensureClient();
    await ready.signInWithCustomToken(ready.auth,token);
    await verifyAdminSession(ready.auth);
    if(ready.auth.currentUser?.uid !== 'meflix-admin-console')throw new Error('Console session changed. Enter your PIN again.');
    setAuthorized(true);
  }, [ensureClient]);

  const handleLock = useCallback((msg) => {
    if (auth && signOut) void signOut(auth).catch(() => {});
    setAuthorized(false);
    setDevices([]);
    setDurationTarget(null);
    setHistoryTarget(null);
    setConfirmModalData(null);
    setReleasesOpen(false);
    ['details', 'history-modal', 'confirm', 'updates'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.open = false;
    });
    const ws = document.getElementById('workspace');
    if (ws) ws.hidden = true;
    const lk = document.getElementById('lock');
    if (lk) lk.hidden = false;
    const errEl = document.getElementById('login-error');
    if (errEl && msg) errEl.textContent = msg;
  }, [auth,signOut]);

  useEffect(() => {
    if (!onAuthStateChanged || !auth) return;
    let active=true, generation=0;
    const unsubscribe=onAuthStateChanged(auth, async user => {
      const attempt=++generation;
      if (!user) { if(active)setAuthorized(false); return; }
      try { await verifyAdminSession(auth); if(active&&attempt===generation&&auth.currentUser===user)setAuthorized(true); }
      catch { if(active&&attempt===generation)setAuthorized(false); }
    });
    return () => { active=false; unsubscribe(); };
  }, [auth,onAuthStateChanged]);

  // Real-time Firestore sync on mount
  useEffect(() => {
    if (!authorized) return;
    let unsubDevices = null;

    try {
      if (typeof onSnapshot === 'function' && typeof collection === 'function' && db) {
        unsubDevices = onSnapshot(collection(db, 'device_requests'), { includeMetadataChanges: true }, (snapshot) => {
          if (snapshot && snapshot.docs) {
            const list = snapshot.docs.map(d => ({ ...(typeof d.data === 'function' ? d.data() : d.data), deviceId: d.id }));
            setDevices(list);
          }
        }, error => { if(error.code === 'permission-denied' || error.code === 'unauthenticated') handleLock('Enter your admin PIN again.'); });


      }
    } catch {}

    return () => {
      if (typeof unsubDevices === 'function') unsubDevices();
    };
  }, [authorized, db, collection, onSnapshot, handleLock, refreshAttempt]);

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
    if (confirmEl) confirmEl.open = true;
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
    if (confirmEl) confirmEl.open = true;
  }, [db, doc, deleteDoc, showToast]);

  // PIN changes are verified by the same server that issued the admin session.
  const handleUpdatePin = async (currentPin, newPin) => {
    await adminApi('pin', {currentPin,newPin}, auth);
    showToast('PIN successfully changed.');
    handleLock('PIN changed. Unlock using your new PIN.');
  };

  const closeReleases=useCallback(()=>setReleasesOpen(false),[]);
  const loadRelease=useCallback(async platform=>{const snap=await getDocFromServer(doc(db,'app_config',`version_${platform}`));return snap.exists()?snap.data():{};},[db,doc,getDocFromServer]);
  const publishRelease=useCallback(async config=>{await setDoc(doc(db,'app_config',`version_${config.platform}`),config,{merge:true});showToast('Release settings published.');},[db,doc,setDoc,showToast]);

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

  const expirationById = useMemo(() => new Map(devices.map(device => [device.deviceId, getFullExpirationDetails(device,clock)])), [devices,clock]);

  const streamingCount = useMemo(() => {
    return devices.filter(isStreaming).length;
  }, [devices,clock]);

  const isDeviceView = currentTab === 'all' || currentTab === 'watching' || currentTab === 'pending' || currentTab === 'approved';

  return (
    <>
      {/* 1. CINEMATIC LOCK SCREEN */}
      <LockScreen
        hidden={authorized}
        onUnlock={handleUnlock}
      />

      {/* 2. EXECUTIVE WORKSPACE */}
      <div id="workspace" className="workspace" hidden={!authorized}>
        <div className="modal-card">
          {/* Top Bar */}
          <TopBar
            streamingCount={streamingCount}
            onRefresh={() => {setRefreshAttempt(n=>n+1);showToast('Syncing with Firebase…');}}
            onShowReleases={() => setReleasesOpen(true)}
            onLock={() => handleLock()}
            onExport={handleExport}
          />

          <main className="main-content">
            {/* KPI Metric Cards */}
            <StatsRow
              devices={devices}
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
              approvedCount={devices.filter(d => d.status === 'approved').length}
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
                        expirationDetails={expirationById.get(device.deviceId)}
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
            onClose={closeDuration}
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
            onClose={closeHistory}
            relativeTime={relativeTime}
          />

          <ConfirmModal
            title={confirmModalData?.title}
            message={confirmModalData?.message}
            onCancel={closeConfirm}
            onConfirm={confirmModalData?.onConfirm}
          />

          <ReleaseModal open={releasesOpen} onClose={closeReleases} onLoad={loadRelease} onPublish={publishRelease}/>

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
