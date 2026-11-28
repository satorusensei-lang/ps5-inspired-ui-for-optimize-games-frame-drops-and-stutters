# MYRAA Bug Report — Approved Implementation Plan

Principle: fix causes, not symptoms. No test suppression, no swallowed errors, no weakened assertions to make checks green. Prefer editing existing files over creating new ones.

## Phase 1 — Silent-breakage and safety-critical

1. **Vite helper scope fix** — `vite.config.js`
   - `normalizePercentValueVite` and `normalizeSteamProgressVite` are already declared at plugin scope (before the launch middleware) and the launch-middleware duplicates have been removed. Steam middlewares already reference plugin-scope helpers. Verification: no middleware inside `pcLauncherPlugin` should re-declare these names; the pause/resume/download middlewares must resolve them from the outer function scope.

2. **Windows Vite spawn quoting fix** — `electron/main.cjs`
   - `ensureDevServer()` currently builds:
     - `quotedShim = "\"\"${localVite}\""` (double-quoted path inside an already-double-quoted string)
     - `args = ['/d', '/s', '/c', "${quotedShim} --port 5173"]`
   - This is the malformed form. Fix it to a single clean `/c` argument that quotes the `.cmd` shim once:
     - `quotedShim = `"\"${localVite}\""`
     - `args = ['/d', '/s', '/c', `"${quotedShim} --port 5173"`]`
   - Keep the `npx vite` fallback only for when the local shim does not exist.
   - Verification: inspect the constructed `command`/`args` in source and confirm a valid `cmd.exe /c ""<quoted vite.cmd>" --port 5173"` shape.

3. **Close-path hardening (Vite + Electron + renderer)** — `vite.config.js`, `electron/main.cjs`, `src/scripts/components/pc-launcher.js`
   - **Vite `/api/pc/close`:** already rewritten to drop title-heuristic kills and unsafe basename-only `taskkill`. It now resolves targets only from a recognized Steam `appId` (manifest-resolved) or from the plugin's own `lastLaunchedApp` record when the request carries no appId/URI. Verification: search the file for `forza`, `title heuristics`, `path.basename(execPath)`, and `taskkill /IM` used in an unsafe context; none should remain in the close handler.
   - **Electron `game:close`:** already rewritten to prefer PID, then manifest-resolved Steam executables for a numeric `appId`, then only a previously-launched `execPath` that still exists on disk. Title heuristics and bare basename-taskkill from arbitrary payloads have been removed. Verification: the handler's close branches should no longer use `title`-based folder scans or unconditional `path.basename(execPath)` for `taskkill /IM`.
   - **Renderer `closePCApp`:** already rewritten to send a validated payload (explicit `appId`/URI/PID, or the app's recorded `execPath`), and to stop feeding title-based heuristic strings into the close endpoint. Verification: `closePCApp` should no longer construct kill targets from window-title guesses.

4. **Steam pause/resume robustness (Vite + Electron)** — `vite.config.js`, `electron/main.cjs`
   - `controlSteamDownloadVite` already ignores the initial `isInitial` snapshot and verifies post-action state from a fresh CDP snapshot when the listener does not confirm in time. `remoteId` is kept explicit rather than assumed.
   - `controlSteamDownload` in the Electron main process should mirror that robustness: ignore the first `isInitial` callback fire when waiting for a pause/resume confirmation, and verify against a fresh snapshot if the listener does not settle.
   - Verification: both control functions should treat the initial registration snapshot as pre-action state, not as confirmation; both should fall back to a post-action verification snapshot before reporting failure.

## Phase 2 — Correctness and UX

5. **Carousel cache-repair separation** — `src/scripts/components/carousel.js`
   - The cached-PC-games cleanup/migration block currently runs inside `initCarousel()` and can re-run `loadTabItems()` before the initial render is stable. Move that purge/repair into a standalone synchronous `repairCachedPcGames()` call that runs once at init, and let the initial `loadTabItems()` read the repaired state. Keep `loadTabItems()` focused on rendering from current state.
   - Verification: `initCarousel()` should delegate cleanup to a named repair function; the initial `loadTabItems()` call should not be wrapped in repair logic.

6. **Carousel update debounce** — `src/scripts/components/carousel.js`
   - `loadTabItems()` currently rebuilds the full track and hero on every Steam download-group signature change. Add a short render debounce so rapid live-progress ticks mutate only the lightweight live-progress UI path (`updateLiveDownloadUI`) while the full rebuild is throttled to a bounded cadence (e.g. coalesce within a small window).
   - Verification: rapid download-status events should not trigger a full `renderCarouselTrack()` on every event; only the live-progress pill/bar updates should remain immediate.

7. **Metadata source alignment** — `src/scripts/data/ps5-games-data.js`, `src/scripts/components/carousel.js`, `index.html`, `electron/main.cjs`
   - Align the Steam metadata source of truth across the data module, the renderer, the HTML, and the Electron metadata dictionary. Confirm official titles/studios/genre/size/asset paths match where they overlap (e.g. Ghost of Tsushima DIRECTOR'S CUT, Forza Horizon 6, Spider-Man titles, God of War titles, Resident Evil titles).
   - Verification: pick a representative set of overlapping apps and compare the title/studio/genre/size/asset fields across the data file, carousel asset resolution, and Electron metadata; flag any mismatches.

8. **Xbox scan restriction** — `electron/main.cjs`, `vite.config.js`
   - Both scanners currently filter only `myraa`/`save` from `XboxGames`, leaving other subfolders as potential false-game entries. Restrict the Xbox scan to known titles/appIds the app intends to launch, or to subfolders that resolve to a launchable entry point, rather than enumerating every non-filtered folder.
   - Verification: the Xbox scan branches should no longer treat every non-`myraa`/`save` subfolder as an installed game without further validation.

9. **Modal focus after sync** — `src/scripts/components/carousel.js`
   - After `syncPCGames()` completes and the library/content is re-rendered, restore a sensible focus target rather than leaving focus ambiguous.
   - Verification: post-sync render paths should set focus to a known interactive element (e.g. sync button or first focusable card) when appropriate.

10. **Compact library row separators** — `src/scripts/components/carousel.js`
   - If the library modal grid uses row separators that are visually heavy or redundant, simplify them to match the compact library-card presentation.
   - Verification: the library grid markup/CSS should use consistent, compact separators.

## Phase 3 — Polish and safety

11. **Developer shortcut scoping** — `electron/main.cjs`
   - F5 and Ctrl+R are currently registered globally and reload the app window. Scope or document these as developer-only shortcuts, and avoid registering them in packaged/user-facing builds unless intended.
   - Verification: global shortcut registrations should be gated or clearly intended for development; production behavior should not expose unintended reload shortcuts.

12. **Actionable failure toasts** — renderer services/components that dispatch `ps5-show-notification`
   - Failure paths that currently emit generic notifications should include actionable detail (what was attempted, why it failed, and what the user can try next) without exposing internal paths or secrets.
   - Verification: representative failure notifications should be specific and actionable rather than generic.

13. **`.cjs` / ESM convention note**
   - `package.json` has `"type": "module"`, yet the Electron main process and preload are `.cjs` and use `require`. Document that this is intentional (CommonJS main process entry under an ESM package) so future edits keep the convention consistent, and avoid mixing `import`/`require` in the same file unintentionally.
   - Verification: Electron `.cjs` files should stay CommonJS; renderer/service ESM files should stay ESM; no file should mix both module systems.

## Verification approach

- No new test harness is introduced for these fixes. Correctness is checked by inspecting the changed code paths and, where feasible, by starting the desktop dev server and exercising launch/close/steam-flow manually.
- After Phase 1, re-read the edited sections of `vite.config.js`, `electron/main.cjs`, and `pc-launcher.js` and confirm the unsafe patterns are gone.
- After each later phase, re-read the affected file sections to confirm the intended shape landed.
