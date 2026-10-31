# Production verification — 2026-10-31

Code is prepared for a coordinated rollout; live production clearance is pending.

## Completed

- Admin build succeeds with Node 24 pinned and all public build inputs retained.
- All 25 admin tests pass with local Authentication and Firestore emulators, including ownership, self-approval denial and PIN-version authorization rules.
- PIN keypad renders before the Firebase SDK finishes downloading. Dashboard subscriptions require a server-verified admin session. Browser flags, preview parameters and IP whitelists do not grant access.
- PIN changes remove legacy plaintext aliases, store a salted hash and invalidate previous console sessions. The requested four-digit interface has no attempt cooldown or idle auto-lock.
- Release settings use a visible validated form. Duplicate imperative listeners, unsafe history HTML, hidden test controls and unused React runtime packages were removed.
- JavaScript decreased from 119,564 to 70,076 bytes (41%); production CSS decreased from 31,544 to 23,469 bytes (26%). These are transfer-size improvements, not measured device latency.
- Native companion passes TypeScript, all 174 Node regression tests and formatting. Both standalone debug and release Fire TV builds compile. The unused in-app admin and unreachable Sony/ZEE5 entry imports are removed.

## Remaining release gates

- Configure and verify server-only Firebase credentials on the actual hosting environment. No production deployment or production rule update was performed during this cleanup.
- Roll out the updated console, ownership rules and native app together. Match the retained legacy device ID and approve its new Firebase installation identity once. Do not publish ownership rules while users still depend on the old unauthenticated app.
- Check the hosted console, PIN change, actual device approval/revocation, remote focus, search and playback on the target TV. Browser visual verification was unavailable in this environment; DOM tests do not verify pixels or frame rate.
- Native React Doctor still reports 46 warnings (28 in its Bugs category, 16 maintainability, 2 performance). The strict check therefore fails. Many concern experimental Sony code or complex components; active player/search/effect findings still need individual review. Warnings have not been hidden through rule exclusions.
- The admin production dependency audit reports six moderate transitive findings, with no high or critical findings. Review compatible upstream fixes before production sign-off; do not assume minification fixes dependency advisories.

Keep server credentials, initial PIN and signing passwords outside source control. The existing signed rollback APK in workspace outputs is preserved.
