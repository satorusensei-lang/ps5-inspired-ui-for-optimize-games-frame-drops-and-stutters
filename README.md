# MYRAA — PS5-Inspired PC Game Launcher

A PlayStation-inspired desktop interface for browsing and launching PC games. MYRAA is an experimental project built with Electron, Vite, and JavaScript.

> [!WARNING]
> *The current release is experimental and may cause problems on your PC.* The launch flow in the published Vite configuration can automatically request system and process changes when it starts a game. The source repository does not include the module that implements those changes, so their full scope and rollback behavior cannot be verified. Use the release only if you understand this risk, and make a recovery plan before running it.

## Overview

MYRAA presents a console-style game library on Windows. The repository includes a Vite-powered interface, an Electron desktop packaging configuration, and a Windows x64 installer release. The code also contains routes for PC game discovery, launch and close actions, Steam download status and controls, and a game-boost manager.

The project name and interface are inspired by PlayStation 5. MYRAA is an independent project and is not affiliated with or endorsed by Sony Interactive Entertainment.

## Features

Features indicated by the published source include:

- A PlayStation-inspired desktop game-library interface.
- PC game discovery and launch routes, including Steam-related library and download handling.
- Steam download status, pause, and resume controls through the available integration paths.
- A launch-time game-boost request for real-game launches. The configuration names anti-stutter handling, helper-process throttling, RAM trimming, high-performance GPU preference, popup suppression, and process-priority changes.

These are descriptions of code paths and requested actions, not verified performance results. *MYRAA does not guarantee higher frame rates, fewer stutters, or improved stability.* Actual behavior depends on the missing boost implementation, Windows configuration, hardware, drivers, and the game.

## Compatibility

- *Release installer:* Windows x64 (MYRAA-PS5-Setup-1.0.0.exe).
- *Development stack declared by the project:* Electron 44, Vite 8, and Node.js tooling.
- *Other Windows versions, hardware requirements, and store configurations:* not specified or verified in the repository.

The checked-in source tree is incomplete: vite.config.js imports electron/xbox-sync.cjs and electron/game-boost.cjs, but those files are not present in the published main branch. As a result, the repository does not currently provide enough source to reproduce or audit all release behavior, and the documented development commands may not run from this checkout.

## Installation

1. Review the warning and the known limitations below before downloading anything.
2. If you choose to try the release, use the installer linked from the [GitHub Releases page](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/releases).
3. Before launching the app, save open work and create a Windows recovery option you know how to use.
4. If Windows or your security software raises a warning, stop and verify the file and its publisher with the project owner. The repository does not document a code-signing certificate or verification procedure.

There is no source-based installation procedure that can be confirmed until the missing Electron modules are published.

## Usage

The source configuration indicates that MYRAA can request a game boost automatically when launching a real game. The exact system changes are not auditable from the published source at this time.

If you decide to run the current release:

1. Close applications and games you cannot risk interrupting.
2. Start with one game and observe the PC for unexpected behavior.
3. Stop using the app if you notice instability, unexpected process changes, or other problems.

## Safety and recovery

- Create a Windows restore point or another recovery option before testing the release.
- Keep important work saved and avoid testing on a PC you cannot afford to troubleshoot.
- The source names a disable/restore path, but the implementation is absent. The repository does not establish which settings are changed, what is restored, or whether every change is reversed.
- If something goes wrong, close MYRAA, restart Windows, and use the recovery method you prepared if the problem remains. Ask the project owner for exact rollback steps before using the release on a system you depend on.

## Known issues and limitations

- *Potentially disruptive automatic behavior:* a game-boost request is triggered from the published launch route; the underlying implementation is not included in the public source tree.
- *Incomplete source checkout:* the Vite configuration imports two missing Electron modules, preventing a complete audit and likely preventing the declared Vite development server from starting from this branch as-is.
- *Release notes are empty:* the published ps5 release does not describe changes, fixes, or known risks.
- *No verified performance results:* the repository provides no benchmark method or evidence for FPS, frame-time, or stutter improvements.
- *No project license is declared:* the repository has no root LICENSE file. Do not assume the source is open for reuse or redistribution until the owner adds or confirms a license.
- *No screenshots are currently published in the repository.*

The repository also includes a [bug report](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/blob/main/MYRAA_BUG_REPORT.md) and an [approved implementation plan](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/blob/main/PSR_APPROVED_PLAN.md). These documents list unresolved concerns; they should be reviewed alongside this release warning.

## Screenshots

Screenshots are not available in the published repository yet.

## Roadmap

No public roadmap or release plan is documented. See the repository's [approved implementation plan](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/blob/main/PSR_APPROVED_PLAN.md) for listed engineering work; it does not establish a release schedule.

## License

No project license is currently provided. Contact the repository owner before copying, modifying, or redistributing this project.

---

*Project:* [satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters)  
*Current release:* [ps5 — MYRAA-PS5-Setup-1.0.0.exe](https://github.com/satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters/releases/tag/ps5)
