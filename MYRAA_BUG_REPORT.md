# MYRAA — PlayStation 5 PC Experience — Bug Report
**Date:** October 15, 2026  
**Project Root:** `C:\XboxGames\MYRAA`  
**Stack:** Electron 44 + Vite 8 (custom plugin) + vanilla JS renderer + Node main process (CJS)  
**Scope:** Full project analysis — renderer components, Vite plugin, Electron main/preload, data layers, services  

---

## 1. CRITICAL — Electron main process `vite.cmd` spawn command string is malformed (Windows)

**File:** `electron\main.cjs`  
**Lines:** `ensureDevServer()`  

```js
const args = isWin
  ? ['/d', '/s', '/c', `\"\"${localVite}\" --port 5173\"`]
  : ['--port', '5173'];
```

The args array for Windows is `['/d', '/s', '/c', '"\"C:\...\\vite.cmd\" --port 5173"']`.  
`cmd.exe /c` receives **one** arg after `/c`, but the value contains a doubled-quote prefix `\"\"` and a trailing `\"`.  
This almost certainly resolves to `cmd.exe` trying to run a literal command whose first token is `"\"<path>\vite.cmd" --port 5173"` (with embedded quotes and a trailing quote). The intended command is `""C:\path\vite.cmd" --port 5173"` (empty title, quoted exe, then args).

**Impact:** On Windows, if the local `node_modules/.bin/vite.cmd` shim exists, Electron may fail to launch the Vite dev server and fall through to the `cmd.exe /c npx vite` branch or the `!isDev` production path. In packaged builds this is invisible, but in dev/desktop mode the dashboard may load from `dist/index.html` (production bundle) or fail entirely if `dist/` is stale.

**Evidence:** No other code path corrects the quoting. The `npx vite` fallback exists specifically "else if (isWin)" when the local shim isn't found.

**Suggested fix:** Build a single properly-quoted `/c` argument:
```js
const args = isWin
  ? ['/d', '/s', '/c', `\"\"${localVite}\" --port 5173\"`]  // REVIEW — verify intended quoting
```
Better: use `cmd.exe /c ""<quoted path>" --port 5173"` as a single string, or avoid `.cmd` shims entirely and spawn `npx vite --port 5173` consistently on Windows when the local shim is present.

---

## 2. HIGH — Vite plugin middleware defines `normalizePercentValueVite` / `normalizeSteamProgressVite` in the wrong lexical scope

**File:** `vite.config.js`  
**Section:** `pcLauncherPlugin()` → `/api/pc/launch` handler body  

Inside the `/api/pc/launch` middleware callback, **after** the `res.end(JSON.stringify({ success: true, launched: cmd }))` branch, the functions `normalizePercentValueVite` and `normalizeSteamProgressVite` are declared:

```js
function normalizePercentValueVite(val) { ... }
function normalizeSteamProgressVite(progress) { ... }
```

Then **later** in the same `configureServer` callback, the `/api/steam/downloads`, `/api/steam/pause`, `/api/steam/resume` middlewares use those two functions.

**Impact:** In a CJS/ESM module evaluated once at config time, function declarations inside a `configureServer` callback are hoisted **within that callback function's scope**, not the outer `configureServer` scope. The later middlewares reference `normalizePercentValueVite` / `normalizeSteamProgressVite` as **free variables** — they must resolve to bindings in an enclosing scope. Those names are declared inside the `/api/pc/launch` callback, which is a *different* function scope. Whether this works depends on whether the JS engine treats the inner declarations as scoped to the launch callback or somehow leaks them.

Practically: if the launch middleware is registered first and the declarations are effectively block/function scoped to that callback, the steam middlewares will throw `ReferenceError: normalizePercentValueVite is not defined` when they execute. If Vite/Node happens to evaluate in an order or scope that leaks them, behavior is accidental and fragile.

**Suggested fix:** Move both helper functions to the top of `pcLauncherPlugin()` (or to module scope) **before** any middleware that uses them.

---

## 3. HIGH — `/api/pc/close` taskkill commands are injectable via `title` heuristics + unfiltered `execPath`

**File:** `vite.config.js`  
**Section:** `/api/pc/close` middleware  

The close endpoint builds a `Set` of target executables from several sources and then runs:
```js
exec(`taskkill /IM "${exe}" /T /F`, { windowsHide: true }, ...)
```

**Problems:**

1. **Title-based heuristics add arbitrary executables.**  
   If `title` contains `forza`, the set gains `forzahorizon6.exe`, `forzaprotocolselector.exe`, `forzahorizon5.exe`, `forza.exe`. If `title` contains `wallpaper`, it adds `wallpaper32.exe`, `wallpaper64.exe`, `launcher.exe`. If `title` contains `counter-strike` / `cs2`, adds `cs2.exe`, `csgo.exe`. If `title` contains `ride 5`, adds `ride5.exe`, `Ride5-Win64-Shipping.exe`.  
   These are added **regardless of whether the actual installed game matches**. A client that can supply `title` can cause taskkill to be run against processes it didn't launch.

2. **`execPath` is used directly as `path.basename(execPath)`.**  
   If an attacker can control `execPath` (e.g. via renderer if the Vite API is reachable), `path.basename` is not a safety boundary — a path like `C:\Windows\System32\cmd.exe` yields basename `cmd.exe`, which then gets killed via `taskkill /IM "cmd.exe" /T /F`.

3. **No validation that any target is actually a game/launcher owned by this app.**  
   The endpoint trusts the client-supplied `title`/`execPath`/`appId` and acts on the resulting set.

**Impact:** A malicious or buggy client that can reach `/api/pc/close` (it's a POST route in the Vite plugin, reachable from the renderer at `localhost:5173` in dev, and via `fetch('/api/pc/close')` in the renderer code) can cause arbitrary process termination on the user's Windows machine for any executable whose basename or title heuristic matches.

**Suggested fix:**
- Tie each close action to the app's own launch record (`lastLaunchedApp`) and validate that the target was previously launched through `/api/pc/launch`.
- Restrict title heuristics to known-good set (or remove them entirely and rely on manifest/execPath resolution).
- Do not use client-supplied `execPath` basename as a kill target unless it matches a previously launched app.
- Prefer resolving targets from Steam manifests / known install directories rather than title substring matching.

---

## 4. HIGH — Renderer `fetch('/api/pc/close', ...)` sends client-controlled payload directly to the vulnerable Vite close endpoint

**File:** `src\scripts\components\pc-launcher.js`  
**Function:** `closePCApp(item)`

```js
const res = await fetch('/api/pc/close', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    execPath: item.execPath,
    uri: item.launchUri,
    appId: item.appId,
    title: item.title
  })
});
```

`item` comes from the carousel game objects (`getCurrentItem()` / `currentGame`), which originate from `scanHostStores()` (Electron main) for Electron mode, **but** in Vite dev/browser mode the games list is also shaped by the renderer's cached `ps5_synced_pc_games` localStorage plus the data files. The renderer routinely dispatches `ps5-game-artwork-updated` and re-syncs via `loadTabItems()`. There is a path where `item.title` / `item.execPath` are not fully controlled by the trusted main-process scanner.

**Impact:** Combined with Bug 3, this is the delivery mechanism. If any game entry's `title` or `execPath` is corrupted/poisoned in the renderer's data, clicking "Close Game" triggers the injectable taskkill.

**Suggested fix:** In `closePCApp`, before sending, validate that `item` has a recognized `appId` or matches a known launch record; do not forward arbitrary `title`/`execPath` to the backend. Better: perform close resolution in the trusted main process (Electron `game:close` IPC) and only use the Vite fallback for items that were themselves launched via the Vite `/api/pc/launch` endpoint.

---

## 5. HIGH — Electron `game:close` IPC handler also uses unfiltered `execPath` basename + title heuristics + `taskkill /IM`

**File:** `electron\main.cjs`  
**Handler:** `ipcMain.handle('game:close', ...)`

```js
if (execPath) {
  const exeName = path.basename(execPath);
  child_process.exec(`taskkill /IM "${exeName}" /F`, (err) => { ... });
  return { success: true, closed: exeName };
}
```

Same pattern as the Vite endpoint: `path.basename(execPath)` is treated as a safe image name, then fed into `taskkill /IM`. The handler also falls into the Steam-resolved branch that calls `resolveSteamExecutables()` and kills every discovered `.exe` in the game folder (filtered only by `crash/report/setup/installer/unins` substrings).

**Impact:** Renderer-side `closePCApp` prefers `window.electronAPI.closeGame` first. If a renderer game object has a poisoned `execPath`, the Electron handler will taskkill the basename. Also, the Steam folder scan kills **all** qualifying executables in the game's install directory, which can include launcher companion processes the user didn't intend to kill (e.g. `forzaprotocolselector.exe` is already added explicitly in the Vite title heuristics; the Electron scan would find it anyway).

**Suggested fix:**
- Only kill by PID when available; fall back to image-name kill only for apps previously launched by this 일렉트론 instance and recorded with their resolved image name.
- For Steam apps, kill by the specific resolved primary executable rather than bulk-scanning and killing every `.exe` in the folder. At minimum, log the full target list and require it to be non-empty and validated.

---

## 6. HIGH — Steam CDP `Runtime.evaluate` injection uses raw template literal with `${numId}` — safe here, but the action-outcome polling relies on a race-prone `RegisterForDownloadItems` listener

**File:** `vite.config.js` + `electron\main.cjs`  
**Functions:** `controlSteamDownloadVite` (Vite) and the equivalent in main process

Both build a CDP `Runtime.evaluate` expression that:
1. Registers a `RegisterForDownloadItems` listener.
2. Calls `PauseAppUpdate` / `ResumeAppUpdate` / `QueueAppUpdate` / `EnableAllDownloads`.
3. Waits for the listener to fire with a matching `appid` to confirm the action.

**Problem:** The confirmation relies on the listener firing **after** the action. If Steam fires an initial `isInitial` snapshot that includes the app but the action's effect hasn't been applied yet, the listener may resolve early with a state that does **not** reflect the requested transition. The code does check conditionals (`item.paused === true || (item.active === false && !item.completed)` for pause, `item.active === true && item.paused === false` for resume), but there's still a window where:
- The listener fires on the initial payload with the pre-action state.
- The action hasn't been applied yet.
- The outcome is mis-reported.

Also, `remoteId = "0"` is hardcoded. Steam's remote download ID for local downloads may differ; using `"0"` may be tolerated but is not obviously correct.

**Impact:** Pause/resume commands may report success when Steam hasn't actually transitioned, or may time out (3500ms in Vite, 2500ms inner timeout) and report failure when Steam did apply the change but the listener didn't fire in time.

**Suggested fix:**
- After issuing the action, ignore the first `isInitial` snapshot (or the first N milliseconds) before accepting a listener resolution.
- Use Steam's actual remote ID if obtainable, rather than hardcoded `"0"`.
- As a belt-and-suspenders follow-up, poll `scanSteamDownloads()` / CDP overview after the action and verify the state actually changed.

---

## 7. MEDIUM — Renderer `initCarousel()` localStorage cache cleanup mutates and re-saves game entries with hardcoded overwrites that can clobber real per-machine state

**File:** `src\scripts\components\carousel.js`  
**Function:** `initCarousel()` — localStorage repair block

The block loads `ps5_synced_pc_games`, filters some known-bad entries, then **unconditionally overwrites** many fields for matched `appId`/`title` matches:

```js
if (g.appId === '2483190' || g.id === 'pc_steam_2483190') {
  g.installed = true;
  g.badge = 'Installed';
  g.title = 'Forza Horizon 6';
  g.installSize = '167 GB';
  g.liveStatus = 'Installed on Laptop • 167 GB Ready to Launch';
  ...
}
```

and for Ghost of Tsushima:
```js
if (g.appId === '2215430' || ...) {
  g.title = "Ghost of Tsushima DIRECTOR'S CUT";
  g.tileIcon = '/assets/games/got/tile.webp';
  ...
}
```

**Impact:** If a user's real install state differs from these hardcoded values (e.g. Forza Horizon 6 is owned-but-not-installed, or installed with a different size), the repair block overwrites the scanned truth with hardcoded "Installed" state. This can make the UI show a game as "Installed • Ready to Launch" when it's not, leading to a failed launch. It also clobbers artwork overrides that may have been set by the artwork service.

The block runs on every init where the cache version is stale (it sets `v13_steam_download_fix`), so it's a one-time purge, but the per-appId overwrites run on **every loaded entry that matches**, not just corrupted ones.

**Suggested fix:**
- Only apply the hardcoded artwork/title normalization when the entry is missing those fields or clearly corrupted; don't overwrite `installed`, `badge`, `installSize`, or `liveStatus` if they already reflect a valid scanned state.
- Separate "normalize metadata/artwork" from "purge bad entries."

---

## 8. MEDIUM — Renderer `loadTabItems()` reorders carousel on every `ps5-steam-download-update` event, with no debounce; can cause rapid re-render + lost selection

**File:** `src\scripts\components\carousel.js`  
**Function:** event handler for `ps5-steam-download-update`

```js
window.addEventListener('ps5-steam-download-update', () => {
  const sig = getDownloadGroupSignature();
  if (sig !== currentDownloadGroupSignature) {
    loadTabItems();
  }
  updateLiveDownloadUI();
});
```

`loadTabItems()` calls `renderCarouselTrack()` (innerHTML rebuild) + `updateActiveTile()` + `updateHeroDisplay()`. The Steam download service polls every 250ms when there's an active/paused download and dispatches `ps5-steam-download-update` on every snapshot. The signature check (`getDownloadGroupSignature`) only changes when the set of active-downloading items changes, but `updateLiveDownloadUI()` runs on every event regardless.

**Impact:** During active downloads, the UI updates frequently. If the signature check is too coarse or too fine, you can get either frequent full re-renders (jank) or missed updates. Selection preservation relies on `selectedItemId` matching — if a game's `id` changes during sync (it shouldn't, but the sync can re-push entries), the active index can jump.

**Suggested fix:**
- Debounce `loadTabItems()` to once per animation frame or a short throttle when signature is unchanged but live UI needs refresh.
- Ensure `updateLiveDownloadUI()` only mutates progress bars/labels and does not trigger a full `renderCarouselTrack`.

---

## 9. MEDIUM — Electron `ensureDevServer()` 35×200ms spin-up loop (7s) may resolve false-positive via `checkDevServer` caching an early incomplete response

**File:** `electron\main.cjs`  
**Functions:** `checkDevServer`, `ensureDevServer`

`checkDevServer` does an HTTP GET and resolves `true` for any `statusCode >= 200 && < 400`. The spin-up loop polls 35 times at 200ms. If Vite's server is in the process of starting and returns a transient redirect/3xx or an early 2xx for a partial response, the check can resolve `true` before Vite is fully ready to serve the API middleware. Also, `checkDevServer` doesn't verify the response body — a 200 with an empty/wrong page would still count.

**Impact:** Electron may `loadURL(devServerUrl)` and render the dashboard before the Vite plugin middlewares are fully registered, causing early API calls to 404 or behave unexpectedly. In practice Vite registers middlewares before listening, but the check is still coarser than ideal.

**Suggested fix:**
- Have `checkDevServer` verify a known endpoint (e.g. `GET /api/steam/downloads` returning 200/503 JSON) rather than any 2xx on the root.
- Or, after the HTTP check passes, do one more lightweight probe against an API route before considering the server ready.

---

## 10. MEDIUM — `getLiveSteamCDPData` (Vite) and main-process equivalent hardcode a 900ms WS timeout and 700ms inner expression timeout; can drop legitimate slow Steam responses

**File:** `vite.config.js` + `electron\main.cjs`  

The CDP flow:
- WS connect → `onopen` → send `Runtime.evaluate`.
- Inside the evaluated JS: 700ms timeout to settle with whatever `overview`/`items` have arrived.
- Outside: 900ms WS timeout to give up.

**Impact:** If Steam's `RegisterForDownloadOverview` or `RegisterForDownloadItems` callbacks are delayed (e.g. Steam busy, large library, slow callback), the inner 700ms timeout resolves with partial/null data, and the outer 900ms can fire too. The result is a `null` snapshot → Vite endpoint returns 503 → renderer falls back to Electron IPC or stale data.

**Suggested fix:**
- Increase timeouts for the initial snapshot (e.g. 1500–2000ms) and/or make them adaptive.
- On timeout, return the partial data that arrived rather than `null`, so the UI can show "syncing" instead of "unavailable."

---

## 11. MEDIUM — Vite `/api/steam/downloads` returns 503 with `success: false` when CDP snapshot is unavailable, but the renderer's `fetchSteamDownloads` treats 503 as "try ElectronIPC / another fetch" — acceptable, but the Vite endpoint also returns 503 when **any** active download's live overview is missing, which can briefly flip an installed game into a "Download" state in the UI

**File:** `vite.config.js` + `src\scripts\services\steam-download-service.js`

The Vite downloads endpoint returns 503 when `getLiveSteamCDPDataVite()` returns null. The renderer's `fetchSteamDownloads` treats that as a fallback case. However, when CDP returns a snapshot that lacks the *overview* for an actively downloading game (Steam may not always include the active app in overview), the endpoint's logic can produce an entry with `syncSource: 'steam-overview-pending'` and `syncStatus: 'syncing'` but with bytes/percent nulled. The renderer then may show a "Download" pill for a game that's actually installing.

**Impact:** UI flicker between "Installing/Complete" and "Download" during Steam operations.

**Suggested fix:**
- When the active overview is missing for a known-downloading app, retain the queue-based progress instead of nulling it out; mark as "syncing" without dropping progress.
- Coordinate with the Electron main-process `scanSteamDownloads()` which reads `content_log.txt` + manifest `StateFlags` and is more reliable for installed-state determination.

---

## 12. MEDIUM — Electron main process `scanHostStores()` Xbox scan includes the project's own `XboxGames\MYRAA` folder as a game candidate if not filtered

**File:** `electron\main.cjs`  
**Section:** Xbox Game Pass scan

```js
if (!folder.toLowerCase().includes('myraa') && !folder.toLowerCase().includes('save') && ...)
```

This filters `myraa`. But the scan iterates `XBoxGames` folders on drives C–G and adds **every** subdirectory as an Xbox Game Pass title with `launchUri: 'xbox://'` and no `execPath`. If a folder name matches a real game pass title it's fine, but many `XboxGames` subfolders are save data, temp, or other non-game folders. The filter only excludes `myraa` and `save`.

**Impact:** The carousel may show spurious "games" from `XboxGames` subfolders that aren't launchable. Clicking them yields a broken `xbox://` launch.

**Suggested fix:**
- Maintain a whitelist of known Xbox Game Pass app folder names (pulled from the store catalogs data or a known list) and only add recognized titles.
- Or verify each folder contains a recognizable game manifest/EXE before adding.

---

## 13. MEDIUM — `KNOWN_REAL_GAMES_METADATA` in Electron main and `STEAM_LIBRARY_DATABASE` in Vite config are separate, partially overlapping dictionaries that can drift out of sync

**Files:** `electron\main.cjs` (`KNOWN_REAL_GAMES_METADATA`) vs `vite.config.js` (`STEAM_LIBRARY_DATABASE`)

Both map Steam app IDs to title/studio/genre/size. They share many entries but:
- Vite's `STEAM_LIBRARY_DATABASE` has `431960: null` (Wallpaper Engine excluded).
- Electron's `KNOWN_REAL_GAMES_METADATA` does **not** have 431960.
- Some entries differ in title formatting (e.g. "Marvel's Spider-Man 2" vs "Marvel's Spider-Man 2" — same, but other entries may diverge).
- Electron has entries Vite lacks and vice versa.

**Impact:** In dev/desktop mode, the renderer may get metadata from the Vite endpoint for some operations and from Electron IPC for others, and the title/studio/genre/size can differ between the two sources for the same appId. This causes inconsistent hero display, download UI labels, and toast notifications.

**Suggested fix:**
- Derive both from a single shared source (e.g. a JSON data file imported/columnized for both main process and Vite plugin), or at minimum keep a documented sync contract and add a test that asserts parity on overlapping appIds.

---

## 14. LOW — Vite `/api/pc/launch` stores `lastLaunchedApp` in a plugin closure, but the `/api/pc/close` handler reads `lastLaunchedApp?.execPath` without validating it's still a known-good launch; also `lastLaunchedApp` is never cleared on process exit or on successful shell-protocol launches

**File:** `vite.config.js`  
**Section:** `pcLauncherPlugin()`

`lastLaunchedApp` is set in `/api/pc/launch` and cleared in `/api/pc/close` only after `Promise.all(killPromises)`. It is set for all launch methods (Steam URI, exe, protocol). But:
- Shell-protocol launches (`steam://rungameid/...`) don't actually launch via `exec(cmd, ...)` in a way that the close handler can reliably reverse; the stored `lastLaunchedApp` still points to the previous launch record.
- There's no expiry or validation that the recorded app is still the one the user wants to close.

**Impact:** If a user launches game A (via Steam URI), then game B (via exe), then clicks "Close" on game A's tile, the close endpoint may use `lastLaunchedApp` (game B's record) if game A's close payload doesn't include execPath/uri/appId/title, potentially closing the wrong app.

**Suggested fix:**
- Make each close request fully specify the target (appId + title + execPath/uri) and resolve the target from that, not from a singleton `lastLaunchedApp`.
- Or maintain a small map of recent launches keyed by appId/title rather than a single slot.

---

## 15. LOW — Renderer `closePCApp` and `launchPCApp` both catch errors and `console.warn`, but the UI toast on failure uses generic messages; the user sees "⚠️ Launch Failed: <title>" without the real reason

**File:** `src\scripts\components\pc-launcher.js`

```js
} else if (!launched && window.electronAPI) {
  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: `⚠️ Launch Failed: ${item.title}`,
      subtitle: "Could not launch application on desktop."
    }
  }));
}
```

The actual error (`err.message` from the fetch or IPC) is available but not surfaced.

**Impact:** Poor debuggability for users; "Launch Failed" with no reason.

**Suggested fix:** Include the actionable error subtitle when available (e.g. "Steam is not running", "Executable not found", etc.), but sanitize to avoid leaking full paths in the toast if that's a concern.

---

## 16. LOW — Electron `createWindow` registers global shortcuts F11, F5, Ctrl+R unconditionally; F5/Ctrl+R reload the window even while a game is running fullscreen, which can disrupt gameplay

**File:** `electron\main.cjs`  
**Section:** `createWindow()`

```js
globalShortcut.register('F5', () => { mainWindow.reload(); });
globalShortcut.register('CommandOrControl+R', () => { mainWindow.reload(); });
```

**Impact:** During fullscreen gameplay, Ctrl+R or F5 reloads the 일렉트론 window, which may kill the running game's window focus or reload the dashboard over the game HUD.

**Suggested fix:** Either disable these developer shortcuts when a game is running (communicate state from renderer via IPC), or scope them to development builds only (`!app.isPackaged`).

---

## 17. LOW — `index.html` ships several hardcoded Unsplash image URLs as tile/hero/logo backgrounds for store/switcher/notifications modals; if offline or on a restricted network, those assets fail and the modals show broken images

**File:** `index.html`

Multiple `background-image: url('https://images.unsplash.com/...')` and `<img src="https://images.unsplash.com/...">` references in modals (profile, store, switcher, explore, notifications).

**Impact:** Offline or firewall-restricted use shows broken images in modals. Not a crash, but degrades the "authentic PS5" presentation.

**Suggested fix:** Provide local fallback assets in `public/assets/` for these modal placeholders and use relative URLs, or CSS fallback backgrounds.

---

## 18. LOW — `package.json` `type: "module"` but `electron/main.cjs` and `electron/preload.cjs` use CJS `require`; the `.cjs` extension makes this work, but the `src/scripts/*.js` and `vite.config.js` are ESM. The `detect-pc-games.cjs` is CJS. This mixed arrangement is workable but fragile if any file extension is changed.

**File:** `package.json` + various

**Impact:** If someone renames `main.cjs` → `main.js`, Node would attempt to parse CJS `require` as ESM and fail. Not a runtime bug today, but a maintenance hazard.

**Suggested fix:** Add a brief note in `AGENTS.md`/`README` about the `.cjs` convention for Electron main/preload, or unify on one module system with clear boundaries.

---

## Summary table

| # | Severity | Component | One-line |
|---|----------|-----------|----------|
| 1 | CRITICAL | `electron\main.cjs` | `vite.cmd` spawn args quoting likely broken on Windows |
| 2 | HIGH | `vite.config.js` | Helpers declared inside launch middleware, used by steam middlewares (scope/ReferenceError risk) |
| 3 | HIGH | `vite.config.js` `/api/pc/close` | taskkill targets built from unfiltered title heuristics + basename(execPath) |
| 4 | HIGH | `pc-launcher.js` | Renderer forwards client-controlled payload to the vulnerable `/api/pc/close` |
| 5 | HIGH | `electron\main.cjs` `game:close` | Same taskkill-on-basename + bulk folder exe kill pattern in the Electron IPC handler |
| 6 | HIGH | `vite.config.js` + main | Steam pause/resume confirmation race on `RegisterForDownloadItems` initial snapshot |
| 7 | MEDIUM | `carousel.js` | localStorage repair block overwrites real install state with hardcoded values |
| 8 | MEDIUM | `carousel.js` | Full carousel re-render on every steam update event; potential jank/selection drift |
| 9 | MEDIUM | `electron\main.cjs` | `ensureDevServer` readiness check too permissive (any 2xx) |
| 10 | MEDIUM | `vite.config.js` + main | Hardcoded CDP timeouts can drop legitimate slow Steam responses |
| 11 | MEDIUM | `vite.config.js` + service | Missing active overview can flip installed games to "Download" in UI |
| 12 | MEDIUM | `electron\main.cjs` | Xbox scan adds unrecognized `XboxGames` subfolders as launchable titles |
| 13 | MEDIUM | `vite.config.js` vs `main.cjs` | Two parallel game metadata dicts can drift and show inconsistent info |
| 14 | LOW | `vite.config.js` | Singlet `lastLaunchedApp` close target can close the wrong app |
| 15 | LOW | `pc-launcher.js` | Launch/close failure toasts hide the real error |
| 16 | LOW | `electron\main.cjs` | F5/Ctrl+R reload shortcuts active during fullscreen gameplay |
| 17 | LOW | `index.html` | Modal images are hardcoded Unsplash URLs with no offline fallback |
| 18 | LOW | `package.json` + extensions | Mixed CJS/ESM with `.cjs` convention is a maintenance hazard |

---

## Recommended order of attack

1. **Fix #2 first** (scope/ReferenceError) — it can silently break the entire Steam download pipeline in the Vite dev server and is a simple move of two functions.
2. **Fix #1** (Windows vite.cmd quoting) — confirms the desktop dev server actually starts from Electron.
3. **Fix #3 + #4 + #5** together — the taskkill injection surface spans Vite + Electron + renderer; address the backend validation and the renderer forwarding in one pass.
4. **Fix #6** — make Steam pause/resume robust before relying on it in the UI.
5. Then the medium/low items in any order; #7 and #8 are the most visible to daily use.

---

*Report generated from a full-project read of MYRAA (renderer components, Vite plugin, Electron main/preload, data, and service layers).*
