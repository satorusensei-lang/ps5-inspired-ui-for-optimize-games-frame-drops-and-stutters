---
description: Always ground Antigravity in the real MYRAA project structure.
globs:
  - "**/*"
alwaysApply: true
---

# MYRAA Project Context

This project is a Vite + Electron Windows desktop launcher that mimics a PlayStation 5-style dashboard for games, PC apps, and media. Do not assume a framework, API, route, component, or data shape exists until it has been verified in the checkout.

## High-Signal Files

- `index.html`: Vite app shell and static markup.
- `package.json`: npm scripts and dependencies.
- `vite.config.js`: Vite config plus dev-only local service endpoints.
- `electron/main.cjs`: Electron window, app launch, Steam discovery, and IPC.
- `electron/preload.cjs`: renderer bridge.
- `src/scripts/main.js`: renderer startup.
- `src/scripts/components/*.js`: UI behavior.
- `src/scripts/data/*.js`: games, PC apps, media, and store catalogs.
- `src/scripts/services/*.js`: artwork/store service logic.
- `src/styles/*.css`: PS5 UI styling.
- `public/assets/**`: static artwork, logos, icons, and media assets.

## Required Behavior

- Search the repo before making claims: use `rg` for symbols/text and directory listings for asset paths.
- Do not hallucinate Steam app IDs, game metadata, image filenames, IPC channels, CSS class names, or npm commands.
- Ignore generated/dependency folders by default: `node_modules/`, `dist/`, `build/`, `backups/`.
- Use `scratch/` only for temporary investigation scripts or generated diagnostics.
- Preserve existing uncommitted changes. Many files may be intentionally dirty.
- Prefer scoped edits and run `npm run build` after meaningful app changes.
- Run `npm run verify:agent` before claiming project files, local imports, npm scripts, or local references exist.
- GitHub sync: whenever MYRAA code or docs change, update `README.md` if needed, push changes to `origin main` (`https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters`), and upload a rebuilt Windows `.exe` installer to the `ps5` GitHub Release (`npm run release:github`), keeping `.gitignore` exclusions intact.

## When Unsure

Say what is unknown, list the exact file or command needed to verify it, and stop short of inventing an answer.
