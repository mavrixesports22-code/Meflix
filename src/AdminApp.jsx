import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { adminApi, verifyAdminSession } from "./adminApi.js";
import { LockScreen } from "./components/LockScreen.jsx";
import { TopBar } from "./components/TopBar.jsx";
import { StatsRow } from "./components/StatsRow.jsx";
import { BottomNavBar, StatusFilterChips } from "./components/NavTabs.jsx";
import { SearchIcon } from "./components/Icons.jsx";
import { DeviceCard } from "./components/DeviceCard.jsx";
import { DurationModal } from "./components/DurationModal.jsx";
import { HistoryModal } from "./components/HistoryModal.jsx";
import { SecurityPinTab } from "./components/SecurityPinTab.jsx";
import { ReleaseModal } from "./components/ReleaseModal.jsx";
import { ConfirmModal } from "./components/ConfirmModal.jsx";
import {
  filteredDevices,
  approvalPatch,
  relativeTime,
  csvCell,
  statusOf,
} from "../public/model.js";

export const isStreaming = (d) =>
  Boolean(
    d.status === "approved" &&
      (!d.expiresAt || d.expiresAt > Date.now()) &&
      d.isWatching &&
      d.lastActiveAt &&
      Date.now() - d.lastActiveAt < 300000,
  );

export function getFullExpirationDetails(d, now = Date.now()) {
  if (d.status === "pending") {
    return {
      badge: "Pending",
      cls: "pending",
      badgeColor: "#FFA726",
      detail: "Awaiting approval",
    };
  }
  if (d.status === "rejected") {
    return {
      badge: "Paused",
      cls: "rejected",
      badgeColor: "#E50914",
      detail: d.revokedAt
        ? `Paused ${new Date(d.revokedAt).toLocaleDateString()}`
        : "Access disabled",
    };
  }
  if (!d.expiresAt) {
    return {
      badge: "Approved",
      cls: "approved",
      badgeColor: "#46D369",
      detail: "No expiry",
    };
  }
  const diff = d.expiresAt - now;
  const formattedEnd = new Date(d.expiresAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (diff <= 0) {
    return {
      badge: "Expired",
      cls: "expired",
      badgeColor: "#E50914",
      detail: `Ended ${formattedEnd}`,
    };
  }
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;
  const remainingText =
    days >= 1
      ? `${days}d ${remainHours}h left`
      : `${totalHours}h ${mins}m left`;
  return {
    badge: "Approved",
    cls: "approved",
    badgeColor: "#46D369",
    detail: `${remainingText} · Until ${formattedEnd}`,
  };
}

export function AdminApp({ firebase: providedFirebase, loadFirebase }) {
  const [client, setClient] = useState(providedFirebase || null);
  const {
    auth,
    db,
    doc,
    getDocFromServer,
    collection,
    onSnapshot,
    updateDoc,
    setDoc,
    deleteDoc,
    onAuthStateChanged,
    signOut,
  } = client || {};
  const ensureClient = useCallback(async () => {
    if (client) return client;
    const ready = await loadFirebase();
    setClient(ready);
    return ready;
  }, [client, loadFirebase]);
  useEffect(() => {
    if (providedFirebase || !loadFirebase) return;
    let active = true;
    void loadFirebase()
      .then((ready) => {
        if (active) setClient(ready);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [providedFirebase, loadFirebase]);
  const [authorized, setAuthorized] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [releasesOpen, setReleasesOpen] = useState(false);
  const toastTimer = useRef();
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    if (!authorized) return;
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [authorized]);
  const [devices, setDevices] = useState([]);
  const [syncState, setSyncState] = useState("loading");
  const [tvSessions, setTVSessions] = useState([]);
  const [tvState, setTVState] = useState("idle");
  const [tvError, setTVError] = useState("");
  const tvGeneration = useRef(0);
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [durationTarget, setDurationTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);

  const closeDuration = useCallback(() => setDurationTarget(null), []);
  const closeHistory = useCallback(() => setHistoryTarget(null), []);
  const closeConfirm = useCallback(() => setConfirmModalData(null), []);
  const handleOpenHistory = useCallback((d) => setHistoryTarget(d), []);
  const handleOpenDetails = useCallback(
    (id) => setDurationTarget(devices.find((d) => d.deviceId === id) || null),
    [devices],
  );
  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleUnlock = useCallback(
    async (token) => {
      const ready = await ensureClient();
      await ready.signInWithCustomToken(ready.auth, token);
      await verifyAdminSession(ready.auth);
      if (ready.auth.currentUser?.uid !== "meflix-admin-console")
        throw new Error("Console session changed. Enter your PIN again.");
      setAuthorized(true);
    },
    [ensureClient],
  );

  const handleLock = useCallback(
    (msg) => {
      if (auth && signOut) void signOut(auth).catch(() => {});
      setAuthorized(false);
      setDevices([]);
      setTVSessions([]);
      tvGeneration.current++;
      setTVError("");
      setDurationTarget(null);
      setHistoryTarget(null);
      setConfirmModalData(null);
      setReleasesOpen(false);
      ["details", "history-modal", "confirm", "updates"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.open = false;
      });
      const ws = document.getElementById("workspace");
      if (ws) ws.hidden = true;
      const lk = document.getElementById("lock");
      if (lk) lk.hidden = false;
      const errEl = document.getElementById("login-error");
      if (errEl && msg) errEl.textContent = msg;
    },
    [auth, signOut],
  );

  useEffect(() => {
    if (!onAuthStateChanged || !auth) return;
    let active = true,
      generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const attempt = ++generation;
      if (!user) {
        if (active) { setAuthorized(false); setDevices([]); setTVSessions([]); tvGeneration.current++; }
        return;
      }
      try {
        await verifyAdminSession(auth);
      } catch {
        if (active && attempt === generation) { setAuthorized(false); setDevices([]); setTVSessions([]); tvGeneration.current++; }
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, onAuthStateChanged]);

  // Lock console whenever the tab/app is hidden or screen is locked
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleLock("Console locked.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleLock]);

  // Auto-lock on 5 minutes of inactivity
  useEffect(() => {
    if (!authorized || typeof window === "undefined") return;
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleLock("Session timed out. Enter your PIN.");
      }, 5 * 60 * 1000);
    };
    const events = ["mousedown", "keydown", "touchstart", "pointerdown"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [authorized, handleLock]);

  // Real-time Firestore sync on mount
  useEffect(() => {
    if (!authorized) return;
    setSyncState("loading");
    let unsubDevices = null;

    try {
      if (
        typeof onSnapshot === "function" &&
        typeof collection === "function" &&
        db
      ) {
        unsubDevices = onSnapshot(
          collection(db, "device_requests"),
          { includeMetadataChanges: true },
          (snapshot) => {
            if (snapshot && snapshot.docs) {
              const list = snapshot.docs.map((d) => ({
                ...(typeof d.data === "function" ? d.data() : d.data),
                deviceId: d.id,
              }));
              setDevices(list);
              setSyncState(snapshot.metadata?.fromCache ? "offline" : "ready");
            }
          },
          (error) => {
            if (
              error.code === "permission-denied" ||
              error.code === "unauthenticated"
            )
              handleLock("Enter your admin PIN again.");
            else setSyncState("offline");
          },
        );
      }
    } catch {
      setSyncState("offline");
    }

    return () => {
      if (typeof unsubDevices === "function") unsubDevices();
    };
  }, [authorized, db, collection, onSnapshot, handleLock, refreshAttempt]);

  // Quick 1-Mo Approve
  const handleQuickApprove = useCallback(
    async (deviceId) => {
      const patch = approvalPatch("scheduled", 30);
      await updateDoc(doc(db, "device_requests", deviceId), patch);
      showToast("Access approved for 30 days.");
    },
    [db, doc, updateDoc, showToast],
  );

  // Approve with Patch
  const handleApproveWithPatch = useCallback(
    async (deviceId, patch) => {
      await updateDoc(doc(db, "device_requests", deviceId), patch);
      setDurationTarget(null);
      showToast("Device access pass applied.");
    },
    [db, doc, updateDoc, showToast],
  );

  // Revoke Access
  const handleRevoke = useCallback(
    (deviceId) => {
      setDurationTarget(null);
      setConfirmModalData({
        title: "Pause Device Access",
        message:
          "Are you sure you want to pause/reject access for this device? It can be reactivated anytime.",
        onConfirm: async () => {
          await updateDoc(doc(db, "device_requests", deviceId), {
            status: "rejected",
            revokedAt: Date.now(),
          });
          setConfirmModalData(null);
          showToast("Device access paused.");
        },
      });
      const confirmEl = document.getElementById("confirm");
      if (confirmEl) confirmEl.open = true;
    },
    [db, doc, updateDoc, showToast],
  );

  // Delete Device Record
  const handleDelete = useCallback(
    (deviceId) => {
      setConfirmModalData({
        title: "Delete Device Record",
        message:
          "Are you sure you want to delete this device registration? If the user opens the app again, a new request will appear.",
        onConfirm: async () => {
          await deleteDoc(doc(db, "device_requests", deviceId));
          setConfirmModalData(null);
          showToast("Device registration deleted.");
        },
      });
      const confirmEl = document.getElementById("confirm");
      if (confirmEl) confirmEl.open = true;
    },
    [db, doc, deleteDoc, showToast],
  );

  // PIN changes are verified by the same server that issued the admin session.
  const handleUpdatePin = async (currentPin, newPin) => {
    await adminApi("pin", { currentPin, newPin }, auth);
    showToast("PIN successfully changed.");
    handleLock("PIN changed. Unlock using your new PIN.");
  };

  const closeReleases = useCallback(() => setReleasesOpen(false), []);
  const loadRelease = useCallback(
    async (platform) => {
      const snap = await getDocFromServer(
        doc(db, "app_config", `version_${platform}`),
      );
      return snap.exists() ? snap.data() : {};
    },
    [db, doc, getDocFromServer],
  );
  const publishRelease = useCallback(
    async (config) => {
      await setDoc(
        doc(db, "app_config", `version_${config.platform}`),
        config,
        { merge: true },
      );
      showToast("Release settings published.");
    },
    [db, doc, setDoc, showToast],
  );

  // Export CSV
  const handleExport = () => {
    const rows = [
      [
        "Name",
        "Device ID",
        "Platform",
        "IP",
        "Status",
        "Expiry",
        "Last Active",
      ],
      ...filteredRows.map((d) => [
        d.name || "",
        d.deviceId,
        d.platform || "",
        d.ip || "",
        statusOf(d, clock),
        d.expiresAt ? new Date(d.expiresAt).toISOString() : "Lifetime VIP",
        d.lastActiveAt ? new Date(d.lastActiveAt).toISOString() : "",
      ]),
    ];
    const csvContent = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meflix-devices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Devices exported to CSV.");
  };

  // Filtered rows for currently active tab
  const filteredRows = useMemo(() => {
    return filteredDevices(devices, currentTab, searchQuery);
  }, [devices, currentTab, searchQuery, clock]);

  const expirationById = useMemo(
    () =>
      new Map(
        devices.map((device) => [
          device.deviceId,
          getFullExpirationDetails(device, clock),
        ]),
      ),
    [devices, clock],
  );

  const streamingCount = useMemo(() => {
    return devices.filter(isStreaming).length;
  }, [devices, clock]);

  const isDeviceView = [
    "all",
    "watching",
    "pending",
    "approved",
    "expired",
    "rejected",
  ].includes(currentTab);

  const { tvCount, mobileCount, otherCount, tvPct, mobilePct, otherPct } =
    useMemo(() => {
      const tv = devices.filter((d) =>
        /tv|aft|fire/i.test(d.platform || ""),
      ).length;
      const mobile = devices.filter((d) =>
        /android|ios|mobile|phone/i.test(d.platform || ""),
      ).length;
      const other = Math.max(0, devices.length - tv - mobile);
      const total = devices.length;
      const tPct = total ? Math.round((tv / total) * 100) : 0;
      const mPct = total ? Math.round((mobile / total) * 100) : 0;
      const oPct = total ? Math.max(0, 100 - tPct - mPct) : 0;
      return {
        tvCount: tv,
        mobileCount: mobile,
        otherCount: other,
        tvPct: tPct,
        mobilePct: mPct,
        otherPct: oPct,
      };
    }, [devices]);

  const refreshTVs = useCallback(async () => {
    if (!authorized) return;
    const generation = ++tvGeneration.current;
    setTVState("loading");
    setTVError("");
    try {
      const result = await adminApi("tv-sessions", null, auth);
      if (generation === tvGeneration.current) {
        setTVSessions(result.sessions || []);
        setTVState("ready");
      }
    } catch (error) {
      if (generation === tvGeneration.current) {
        setTVError(error.message);
        setTVState("error");
      }
    }
  }, [authorized, auth]);
  useEffect(() => {
    if (!authorized) return;
    void refreshTVs();
    const timer = setInterval(() => void refreshTVs(), 30000);
    return () => {
      tvGeneration.current++;
      clearInterval(timer);
    };
  }, [authorized, refreshTVs, refreshAttempt]);
  const handleUnpairTV = (session) =>
    setConfirmModalData({
      title: "Unpair TV",
      message: `Sign out ${session.deviceName}? The phone login and access approval will stay unchanged.`,
      onConfirm: async () => {
        await adminApi(
          "unpair-tv",
          { accountUid: session.accountUid, sessionId: session.sessionId },
          auth,
        );
        await refreshTVs();
        setConfirmModalData(null);
        showToast("TV unpaired.");
      },
    });
  const visibleTVs = tvSessions.filter((session) => {
    const person = devices.find(
      (device) => device.deviceId === session.accountUid,
    );
    return [
      session.deviceName,
      person?.name,
      person?.email,
      session.accountUid,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    );
  });

  return (
    <>
      {/* 1. CINEMATIC LOCK SCREEN */}
      <LockScreen hidden={authorized} onUnlock={handleUnlock} />

      {/* 2. EXECUTIVE WORKSPACE */}
      <div id="workspace" className="workspace concept-layout-root" hidden={!authorized}>
        <div className="concept-mobile-shell">
          {/* Top Bar with Minimal Header */}
          <TopBar syncState={syncState} />

          <main className="concept-main-content">
            {/* 2x2 Metric Cards Grid */}
            <StatsRow
              devices={devices}
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              isStreaming={isStreaming}
            />

            {/* Large Main Concept Card */}
            <section className="concept-main-card">
              <div className="concept-card-header">
                <div className="concept-card-title-group">
                  <h2 className="concept-card-title">
                    {currentTab === "tvs"
                      ? "Connected TVs"
                      : currentTab === "pin"
                        ? "Console Settings"
                        : "Fleet Requests"}
                  </h2>
                  <span className="concept-card-subtitle">
                    {currentTab === "tvs"
                      ? `${visibleTVs.length} paired units`
                      : currentTab === "pin"
                        ? "System utilities & releases"
                        : `${filteredRows.length} requests`}
                  </span>
                </div>

                {/* Secondary Status Filter Chips (All, Approved, Expired, Paused) */}
                {isDeviceView && (
                  <StatusFilterChips
                    currentTab={currentTab}
                    onSelectTab={setCurrentTab}
                    totalCount={devices.length}
                    approvedCount={
                      devices.filter((d) => statusOf(d, clock) === "approved").length
                    }
                    expiredCount={
                      devices.filter((d) => statusOf(d, clock) === "expired").length
                    }
                    rejectedCount={
                      devices.filter((d) => statusOf(d, clock) === "rejected").length
                    }
                  />
                )}
              </div>

              {/* When in Device Views: Integrated Search Bar */}
              {isDeviceView && (
                <div id="search-box" className="concept-search-bar">
                  <SearchIcon size={14} color="#849BB2" />
                  <input
                    id="search"
                    type="search"
                    value={searchQuery || ""}
                    onInput={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search devices, email, or name..."
                    aria-label="Search devices"
                  />
                  {Boolean(searchQuery) && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Device List */}
              <div
                id="view-devices"
                className="device-list-container"
                hidden={!isDeviceView}
              >
                <div id="device-list" className="device-cards-grid">
                  {filteredRows.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        {syncState === "loading" && !devices.length
                          ? "Loading requests…"
                          : devices.length
                            ? searchQuery
                              ? `No matches found for "${searchQuery}"`
                              : "No devices in this category."
                            : "No devices registered yet. Installation requests appear here automatically."}
                      </p>
                    </div>
                  ) : (
                    filteredRows.map((device) => (
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

              {/* Connected TVs Section */}
              {currentTab === "tvs" && (
                <section className="tv-session-list" aria-label="Connected TVs">
                  <div className="list-meta-bar">
                    <span>{visibleTVs.length} connected TVs</span>
                    <span className="sub-policy-hint">One TV per account</span>
                  </div>
                  {tvError && (
                    <p className="inline-error" role="alert">
                      {tvError}{" "}
                      <button type="button" onClick={() => void refreshTVs()}>
                        Retry
                      </button>
                    </p>
                  )}
                  {tvState === "loading" && !tvSessions.length && (
                    <p className="empty-state">Loading connected TVs…</p>
                  )}
                  {tvState === "ready" && !visibleTVs.length && (
                    <p className="empty-state">
                      {searchQuery
                        ? "No matching TVs."
                        : "No TVs are paired yet."}
                    </p>
                  )}
                  {visibleTVs.map((session) => {
                    const person = devices.find(
                      (device) => device.deviceId === session.accountUid,
                    );
                    return (
                      <article
                        key={session.sessionId}
                        className="tv-session-row"
                      >
                        <div>
                          <h3>{session.deviceName}</h3>
                          <p>
                            {person?.name || "Account"}
                            {person?.email ? ` · ${person.email}` : ""}
                          </p>
                        </div>
                        <span className="row-secondary">
                          Paired {relativeTime(session.connectedAt)}
                        </span>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleUnpairTV(session)}
                        >
                          Unpair TV
                        </button>
                      </article>
                    );
                  })}
                  {tvSessions.length >= 500 && (
                    <p className="row-secondary">
                      Showing up to 500 connected TVs.
                    </p>
                  )}
                </section>
              )}

              {/* Console Settings Tab */}
              <SecurityPinTab
                hidden={currentTab !== "pin"}
                onUpdatePin={handleUpdatePin}
                onLock={handleLock}
                onShowReleases={() => setReleasesOpen(true)}
                onExport={handleExport}
                onRefresh={() => {
                  setRefreshAttempt((n) => n + 1);
                  showToast("Syncing with Firebase…");
                }}
              />
            </section>
          </main>

          {/* 5-Destination Fixed Bottom Navigation Bar */}
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            streamingCount={streamingCount}
            pendingCount={
              devices.filter((d) => d.status === "pending").length
            }
            tvCount={tvSessions.length}
          />
        </div>

          {/* MODALS */}
          <DurationModal
            device={durationTarget}
            onClose={closeDuration}
            onApprove={handleApproveWithPatch}
            onRevoke={handleRevoke}
            onSaveNote={async (deviceId, noteText) => {
              await updateDoc(doc(db, "device_requests", deviceId), {
                note: noteText,
              });
              showToast("Note saved.");
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

          <ReleaseModal
            open={releasesOpen}
            onClose={closeReleases}
            onLoad={loadRelease}
            onPublish={publishRelease}
          />

          {/* Toast */}
          {toastMessage && (
            <div id="toast" className="toast" role="status">
              {toastMessage}
            </div>
          )}
      </div>
    </>
  );
}
