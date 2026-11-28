# MYRAA Agent Instructions

This repository is a Windows desktop PlayStation-style game/media launcher built with Vite and Electron. Keep work grounded in the files that actually exist in this checkout.

## Project Map

- `index.html` is the Vite app shell.
- `src/scripts/main.js` wires the UI modules together.
- `src/scripts/components/` contains interactive UI modules such as carousel, boot screen, profile manager, media launcher, PC launcher, and overlays.
- `src/scripts/data/ps5-games-data.js` is the main game catalog.
- `src/scripts/data/pc-apps-data.js`, `ps5-media-data.js`, and `store-catalogs-data.js` hold app/media/store data.
- `src/scripts/services/` contains artwork and store-sync helpers.
- `src/styles/ps5-components.css`, `ps5-main.css`, and `ps5-variables.css` define the UI.
- `electron/main.cjs` owns the Electron shell, local Vite startup, Steam/game discovery, and IPC handlers.
- `electron/preload.cjs` exposes the safe renderer bridge.
- `public/assets/` stores icons, logos, cover art, hero art, and other static media.
- `scratch/` is for one-off scripts and investigation artifacts.

## Commands

- Install dependencies: `npm install`
- Web dev server: `npm run dev`
- Desktop app in development: `npm run desktop`
- Production build: `npm run build`
- Desktop production preview: `npm run build:desktop`
- Agent grounding check: `npm run verify:agent`
- Build Windows NSIS installer: `npm run dist:win`
- Sync repo, update installer `.exe`, and publish GitHub Release: `npm run release:github`

## GitHub Sync & Automated Releases

- Primary GitHub repository: `https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters` (`origin`, branch `main`, release tag `ps5`).
- Whenever changes are made to MYRAA on this PC:
  1. Keep `.gitignore` clean (never commit `node_modules/`, `dist/`, `release/`, `scratch/`, `backups/`, `.lnk` files, or `public/assets/cache/`).
  2. Update `README.md` if user-facing features, commands, compatibility, or safety behavior changed.
  3. Commit and push to `origin main`, and run `npm run release:github` (or push changes so `.github/workflows/release.yml` runs) to rebuild and upload the new `MYRAA-PS5-Setup-<version>.exe` to GitHub Releases.

## Anti-Hallucination Rules

- Inspect real files before answering or editing. Use `rg`, `Get-ChildItem`, and targeted file reads.
- Do not invent files, functions, routes, npm scripts, IPC channels, game IDs, Steam app IDs, or asset paths.
- Before changing a module, trace its imports, callers, DOM selectors, and data dependencies.
- Before adding a game or artwork entry, verify the exact target paths exist under `public/assets/`.
- Treat `node_modules/`, `dist/`, `build/`, `backups/`, and large generated files as noise unless the user explicitly asks about them.
- Do not rewrite large files wholesale. Make focused edits that preserve current style and user changes.
- This repo often has many uncommitted local changes. Never revert or discard them unless the user explicitly asks.
- If a fact cannot be verified from the repo or an explicit source, say it is unknown and explain what to check next.

## Verification

- For code changes, run the narrowest useful check first.
- For renderer/app changes, prefer `npm run build` after edits.
- Run `npm run verify:agent` before final responses that make claims about project structure, imports, commands, or local assets.
- For Electron launch behavior, inspect both `electron/main.cjs` and `electron/preload.cjs`; verify IPC names match the renderer.
- Report any commands that could not be run and why.
