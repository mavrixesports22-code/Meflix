# NetMirror playback

Run `node server.js` from `E:\ria`, then open `http://localhost:5173/netflix/`.

Select Play on an existing title. Enter the current code displayed in the NetMirror login image and select **Connect & play**. The player looks up the title on NetMirror, loads real seasons and episodes, and streams its authenticated HLS response. If several titles match, choose the correct result. Missing or unavailable titles show an error instead of substituting a trailer.

Controls: Play/Pause, seek, skip 10 seconds, volume, playback speed, fullscreen, season and episode. Keyboard: Space, Left/Right, M, F, Escape. Playback position is saved in this browser per NetMirror episode ID.

Open **Playback settings** in the bottom controls to choose an audio language or playback speed. The player switches HLS or supported native audio tracks without restarting the episode and remembers the selected language in this browser, including after source recovery. Single-track videos show their available audio with the selector disabled; languages absent from a stream are not offered. Escape dismisses the settings panel first. The player uses icon controls, a thin played/buffered timeline, and hours/minutes/seconds for long films. Volume appears when hovering or focusing its icon on desktop.

Use **CC** or **C** to toggle subtitles, or choose **Off** / an available caption language in Playback settings. Subtitles default to Off and remember your chosen language and enabled state across source recovery. The browser renders the stream's WebVTT captions; metadata tracks are excluded from the language menu. Videos without captions show an unavailable state. **Video fit** defaults to **Fit to screen**, which preserves the full picture's aspect ratio without stretching. **Fill screen (crop)** fills the viewport by cropping picture edges. Fullscreen and phone layouts use the same aspect-preserving video surface.

The current installed Netflix package was rechecked through REA on 18 October 2026. Fresh evidence and exact source-file hashes are in `outputs/netflix-rea-recheck/README.md`. The working REA connection was used directly; no configuration reinstall was needed.

Authentication stays in server memory behind an HttpOnly session cookie and is lost when the server restarts. Login is verified through the APK's normal `Otp` header. Player requests honor the service's OTP response. The server discovers the current API host, forwards the necessary media referer, and rewrites HLS playlists to session-bound local media URLs. No upstream token is returned to browser JavaScript or stored on disk.

The existing layout now uses NetMirror's live home rows, title search, artwork, metadata, seasons, and “More Like This” suggestions. Rows hydrate metadata as they come into view. Search supports Enter, cancelled stale requests, loading and error states, popular suggestions, and recent queries. Home and detail previews use trailers only when a title already has one; Play uses NetMirror. Availability and codec support depend on NetMirror and the browser.

The installed Netflix Windows package, version 7.0.8.0, is an Edge PWA launcher. Its verified `AppxManifest.xml` points to `https://www.netflix.com/pwa?enablePWA=true`; its 84-file inventory contains no EXE, DLL, JavaScript bundle, or local recommendation database. Existing extraction evidence is in `outputs/netflix-rea/rea-evidence.json` (artifact inspection `ev_9a1f41b5f972c46c233a5283caf3f56c300c8a53ec839630bc062447f1643b2a`). The live rows and title suggestions used here come from NetMirror's service; Netflix's private recommendation model was not extracted.

`node tools/check-netmirror.cjs` checks resource rewriting and player markup. To additionally exercise live OTP, search, real episode selection, HLS playlists, a media segment, session isolation, and logout, supply the current service code as `NETMIRROR_TEST_OTP`. The test does not print authentication tokens or signed media URLs.

Browser HLS support uses the vendored hls.js distribution. See `js/vendor/hls-version.txt` and `js/vendor/hls-LICENSE.txt`.

The player prefers hls.js/Media Source Extensions, including in Chromium browsers that advertise native HLS but reject these MPEG-TS streams. Native HLS is the fallback when MSE is unavailable. Only an autoplay permission rejection shows “Press Play”; stream-format and decoder errors retain their own retry messages.

Upstream reads have deadlines and bounded retries, including interrupted JSON, playlists and the first media chunk. Once a segment starts streaming, its bytes are never replayed by the server. Media resources retain their resolved API origin, so continuing playback does not need another discovery request. The player detects stalled progress and refreshes an expired source at most twice while preserving the exact episode and position. Closing the player or changing episodes cancels old operations and ignores their callbacks. CDN expiry does not clear login; only an explicit service authentication response requests another code.

Media links contain authenticated, encrypted session-bound routing data. The server keeps a bounded 2,048-entry lookup cache; evicted links can still be decoded for seeking and audio switching, so long playlists do not fill a session. Logout or reconnect clears the cache and rotates its encryption key. `node tools/check-media-resources.cjs` verifies 24,000 segment links, eviction recovery, tamper rejection and login isolation.

Public home rows and title metadata are saved under `.runtime/` and can be reused during temporary catalogue outages. Videos and credentials are not saved. Anonymous requests never create session cookies, which prevents slower catalogue responses from overwriting a successful login. `/api/netmirror/health` exposes sanitized recent failure codes and request IDs; logs omit tokens and signed media URLs.

Run the `tools/check-*.cjs` scripts to check the player, transport, catalogue and proxy. The catalogue parser ignores null movie episode placeholders and preserves real series episodes and season selections. `tools/playback-browser-scenario.json` describes the controlled Chrome startup, sustained playback, seek and pause check; it requires an authenticated test session supplied as the declared environment secret.

`powershell -NoProfile -File .\tools\package-netflix.ps1` creates `sources/netflix-clone/` and `outputs/netflix-clone-source.zip`, including a launcher and file hashes. Original compiled client references are preserved separately under `sources/reference/`. The clone's local implementation and HLS library are included; NetMirror's private backend and video library still require the external service. Copying the client cannot make remote videos available offline or guarantee the provider's availability.
