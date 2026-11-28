# MYRAA — PS5-Inspired PC Game Launcher & Performance Optimizer

A PlayStation 5-inspired Windows desktop launcher built with **Electron 44**, **Vite 8**, and vanilla ES modules/CSS. MYRAA combines a console-style home carousel, game hub, media launcher, and audio/visual shell with multi-store game discovery and launch-time Windows optimization designed to reduce background contention and frame-time stutters.

> [!NOTE]
> MYRAA is an independent PC project inspired by the PlayStation 5 interface and is not affiliated with or endorsed by Sony Interactive Entertainment.

## Features

- **PS5 Home Carousel, Game Hub & Media Shelf**
  - Smooth GPU-composited tile carousel with custom/curated 4K hero backgrounds, logos, activity cards, trophies & friends widgets, profile switcher, control center, and synthesized UI sound effects (`src/scripts/`).
  - Full keyboard (`A`/`D` or Left/Right Arrow, `W`/`S` or Up/Down Arrow, `Home`/`End`, `Enter`/`Esc`, `P` Control Center, `O` Options, `L` Library, `M` Mute) and controller (DualSense / Xbox via HTML5 Gamepad API) navigation.
  - Built-in Media App Launcher (`YouTube`, `YouTube Music`, `Spotify`, `Netflix`, `Discord`, `Twitch`, `Apple TV`, `Crunchyroll`) launching in frameless app windows.
- **Strict, Verified Multi-Store Discovery**
  - **Steam**: Syncs **only your Steam Favorites** using live Steam client CDP data plus local Steam `userdata` collections (`cloudstorage`, `localconfig.vdf`, `sharedconfig.vdf`), with live download progress, pause/resume controls, and real-time watcher updates.
  - **Xbox / Microsoft Store**: Verifies genuinely owned PC game entitlements from Windows Store `PersistentEntitlementsCache.json` enriched with Xbox App `AsyncCache.db` artwork/metadata (`electron/xbox-sync.cjs`), filtering out unowned Game Pass catalog suggestions, DLC/add-ons, trials, mobile/console-only SKUs, and `Minecraft Launcher`, and deduplicating local Xbox folders cleanly.
  - **Epic Games, Ubisoft Connect, GOG Galaxy, EA App & Riot Games**: Discovers locally installed PC games across Windows drives.
- **Launch Readiness Guard (`electron/main.cjs`)**
  - Holds MYRAA cleanly until the launched game window or pre-game launcher dialog (including compact launcher windows such as *Marvel's Spider-Man Remastered* and *Ghost of Tsushima*) appears, transfers foreground focus, tracks multi-stage process handoffs, and restores MYRAA when the game closes.
- **Game Boost & Anti-Stutter Engine (`electron/game-boost.cjs`)**
  - Suspends MYRAA UI background throttling, Chromium GPU animations, and gamepad polling while in-game (`setBackgroundThrottling`, `window:idle-state`).
  - Optionally switches Windows Power Plan (`High Performance` / `Ultimate Performance` or `Best Performance` overlay), unparks CPU cores (`CPMINCORES`), enables Windows Game Mode (`AllowAutoGameMode`), sets Windows High-Performance GPU preference per executable, sets `ABOVE_NORMAL` priority on game processes, suppresses Windows notification toasts, throttles background OS indexers, and closes user-configured background browsers/chat apps/unused launchers with exclusion controls.
  - Automatically records applied state to `game_boost_journal.json` in Electron `userData` and restores prior Windows power/toast settings on game exit (and recovers leftover journal state on next startup).

## Repository Structure

```text
.
├── .github/workflows/release.yml   # Auto-builds & uploads Windows .exe on pushes to main
├── .agents/rules/                  # Grounded project context rules
├── electron/
│   ├── main.cjs                    # Electron main process, store scanners, Launch Guard & IPC
│   ├── preload.cjs                 # Context-isolated renderer IPC bridge
│   ├── game-boost.cjs              # Reversible Windows Game Boost & journal recovery
│   └── xbox-sync.cjs               # Store entitlement verification & Xbox record merge helpers
├── public/assets/                  # Bundled icons, fonts, game art, and media assets
├── scripts/
│   ├── publish-github.mjs          # One-command build + git push + GitHub Release uploader
│   ├── verify-agent-grounding.mjs  # Verifies required files, local imports, and static assets
│   └── verify-steam-download-snapshot.mjs
├── src/
│   ├── scripts/
│   │   ├── main.js                 # App initialization & Steam watcher wiring
│   │   ├── components/             # Carousel, input, launcher, overlays, settings, boot screen
│   │   ├── data/                   # Preloaded metadata, catalogs, media & PC app definitions
│   │   └── services/               # Artwork caching, store sync, and Steam downloads
│   └── styles/                     # PS5 CSS tokens, main layout, and components
├── index.html                      # Vite entry HTML shell
├── package.json                    # Scripts & electron-builder NSIS configuration
└── vite.config.js                  # Vite dev server & local multi-store middleware
```

## Installation

### Option 1: Windows Installer (Recommended)
1. Download the latest `MYRAA-PS5-Setup-<version>.exe` from the [GitHub Releases page](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/releases/tag/ps5).
2. Run the NSIS installer (`x64`). If Windows SmartScreen prompts because the installer is self-published without a paid EV code-signing certificate, verify you downloaded it directly from this repository's official Releases page before proceeding.
3. Launch **PlayStation 5** from your Desktop or Start Menu shortcut.

### Option 2: Run or Build from Source
Requirements: Windows 10/11 (x64) and Node.js 20+.

```powershell
# 1. Install dependencies
npm install

# 2. Run Vite + Electron desktop app in development mode
npm run desktop

# 3. Verify imports, scripts & assets
npm run verify:agent

# 4. Build Vite production bundle (dist/)
npm run build

# 5. Preview built Electron desktop app
npm run build:desktop

# 6. Build standalone Windows NSIS installer (release/MYRAA-PS5-Setup-<version>.exe)
npm run dist:win
```

## Automatic GitHub Sync & Releases

- **CI Automation (`.github/workflows/release.yml`)**: Every push to `main` touching app or build files automatically runs `npm ci`, `npm run verify:agent`, `npm run dist:win` on `windows-latest`, and replaces the `.exe` asset on the [`ps5` GitHub Release](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/releases/tag/ps5).
- **Local One-Command Publish (`npm run release:github`)**: Runs verification checks, builds the fresh NSIS `.exe` via `npm run dist:win`, pushes local source commits to `origin main`, and uploads the new `.exe` directly to GitHub Releases.

## Safety, Recovery & Disclaimers

- **Reversible System Changes**: Power plan, core parking (`CPMINCORES`), Windows Game Mode, toast suppression, and closed background apps are tracked in `game_boost_journal.json` inside `%APPDATA%\myraa` and restored on game exit or next app startup (`recoverLeftoverBoostOnStartup`).
- **Configurable Boost Toggles**: You can disable individual boost actions or add excluded apps in Settings (`ps5-settings-modal`), and always create a Windows Restore Point if testing system-level tuning on a primary workstation.
- **No Universal FPS Guarantee**: Stutter and frame-time improvements come from reducing MYRAA's own GPU/CPU footprint and stopping background app contention during gameplay; actual results vary by hardware, drivers, Windows settings, and the specific game.

---

- **Repository**: [satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters)
- **Latest Release**: [GitHub Releases (`ps5`)](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/releases/tag/ps5)
