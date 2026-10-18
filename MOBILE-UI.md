# Meflix mobile UI

Open `http://localhost:5173/netflix/` after running `node server.js` in the project root. Refresh with Ctrl+Shift+R to load the updated assets. The phone layout applies at viewport widths up to 700 CSS pixels; the desktop layout is retained above that width.

The phone shell includes portrait feature artwork, compact TV/Movie category chips, bottom Home / New & Popular / My Meflix navigation, portrait touch rows and search grids, a full-width title sheet, and safe-area spacing. My Meflix opens the existing saved-title collection. The feature card's My List button saves or removes its title. Hidden desktop cards do not provide hover previews on touch devices. Small screens avoid automatically loading billboard trailer previews.

Opening search, title details and playback records mobile browser history. Back restores the prior screen and scroll position. Closing the player returns to the preceding browse/search state. A touch on the video reveals its controls; Play/Pause remains available as an explicit button. Aspect fit, captions and source recovery use the existing player.

The supplied Netflix Android APK reports version `9.88.0 build 7 74729`, package `com.netflix.mediaclient`, SHA-256 `f9a3f797ab98c962fb2f605276442e13de17737494e98896e4ec3d2cc3618cc6`. REA/JADX static inspection found distinct portrait artwork formats and conditional bottom tabs. Meflix selects its own working tabs and spacing; these choices do not establish a pixel-identical Netflix screen. The reference APK launched in a temporary read-only Android emulator, showed its launch/signup UI, and subsequently terminated before an authenticated browsing screen could be observed. No signed-in Netflix screen or private backend was recovered.

The original workspace retains complete extraction and evidence in `outputs/netflix-mobile-apk/`, including a filename/hash manifest that records Windows case-collision renames. Those reference binaries, analysis engines and logs are excluded from the runnable source ZIP. The app remains the existing browser/PWA implementation; this UI update does not produce a new native Android APK.
