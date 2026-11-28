/* ==========================================================================
   PlayStation 5 Game Launch & Running Mode Experience
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { getCurrentItem, getCurrentTab, resolveAssetUrl } from './carousel.js';
import { launchPCApp, closePCApp, cancelPendingBoostMinimize, ensureAutoGameBoost } from './pc-launcher.js';
import { openMediaApp, isMediaAppOpen, closeMediaApp } from './media-launcher.js';
import { getSteamDownload, resumeSteamDownload, pauseSteamDownload } from '../services/steam-download-service.js';
import { getGameBoostSettings } from './settings-manager.js';

let isGameRunning = false;
let currentGame = null;
let launchTransitionTimer = null;

export function initGameLauncher() {
  const playBtn = document.getElementById('ps5-play-btn');
  const modal = document.getElementById('ps5-running-game-modal');
  const exitBtn = document.getElementById('btn-exit-game');
  const resumeBtn = document.getElementById('btn-resume-game');
  const ccCloseBtn = document.getElementById('cc-card-close-btn');
  const optCloseBtn = document.getElementById('opt-btn-close-game');

  // Pause MYRAA animations/particles & release GPU compositor surfaces when minimized/hidden behind a game
  let isNativeWindowIdle = false;
  const syncIdleClass = (forceIdle = false) => {
    const shouldIdle = Boolean(forceIdle || document.hidden || isGameRunning);
    document.body.classList.toggle('game-boost-idle', shouldIdle);
    document.body.classList.toggle('window-hidden-vram-save', Boolean(shouldIdle && (isNativeWindowIdle || document.hidden)));
  };
  document.addEventListener('visibilitychange', () => syncIdleClass(false));
  if (window.electronAPI?.onWindowIdleState) {
    window.electronAPI.onWindowIdleState((isIdle) => {
      isNativeWindowIdle = Boolean(isIdle);
      syncIdleClass(isIdle);
    });
  }
  if (window.electronAPI?.onBoostStateChanged) {
    window.electronAPI.onBoostStateChanged((st) => {
      syncIdleClass(Boolean(st?.active));
      window.dispatchEvent(new CustomEvent('ps5-boost-state-changed', { detail: st }));
    });
  }

  // Listen for native OS process termination to reset running state and restore Game Boost
  if (window.electronAPI?.onGameProcessExited) {
    window.electronAPI.onGameProcessExited((data) => {
      console.log('[Game Launcher] Game process exited event received from Electron:', data);
      cancelPendingBoostMinimize();
      if (launchTransitionTimer) clearTimeout(launchTransitionTimer);
      modal?.classList.remove('active');
      isGameRunning = false;
      syncIdleClass(false);
      ps5Audio.resumeFromGameplay?.();
      const closedTitle = currentGame?.title || data?.title || 'Game';
      currentGame = null;
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: data?.launchTimedOut
          ? {
              title: `Launch Cancelled or Timed Out`,
              subtitle: `${closedTitle} did not finish launching • Returned to PS5 Home.`
            }
          : {
              title: `Game Session Ended`,
              subtitle: `${closedTitle} closed • System Performance restored.`
            }
      }));
    });
  }

  // Update launching HUD status once Electron detects the game window has properly loaded
  if (window.electronAPI?.onGameLaunchReady) {
    window.electronAPI.onGameLaunchReady(() => {
      const gameStatus = document.getElementById('game-hud-status');
      if (gameStatus && isGameRunning) {
        gameStatus.textContent = currentGame?.liveStatus || 'Running in 4K 60FPS HDR';
      }
    });
  }

  // Trigger from Play Button
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ps5-request-launch'));
    });
  }

  // Listen for launch events
  window.addEventListener('ps5-launch-game', (e) => {
    launchGame(e.detail);
  });

  window.addEventListener('ps5-request-launch', async () => {
    const item = getCurrentItem();
    if (item) {
      if (item.isExplore) {
        window.ps5OpenExploreHub?.();
        return;
      }
      if (item.isStore) {
        window.ps5OpenStore?.();
        return;
      }
      if (item.isLibrary) {
        window.ps5OpenLibrary?.();
        return;
      }
      // In-App PS5 Media Launch (YouTube, Spotify, YouTube Music, Netflix, Discord, etc.)
      if (getCurrentTab() === 'media' || item.genre?.includes('Streaming') || item.genre?.includes('Music') || item.id === 'youtube' || item.id === 'youtube-music' || item.id === 'spotify' || item.id === 'netflix' || item.id === 'discord' || item.id === 'twitch' || item.id === 'appletv' || item.id === 'crunchyroll') {
        if (!item.installed) {
          try { ps5Audio.playSelectChime(); } catch (e) {}
          window.dispatchEvent(new CustomEvent('ps5-show-notification', {
            detail: {
              title: `📥 Downloading ${item.title}...`,
              subtitle: `Adding ${item.title} to your PS5 Media Library (${item.installSize || '2.1 GB'})`
            }
          }));
          setTimeout(() => {
            item.installed = true;
            item.badge = 'Installed';
            item.liveStatus = 'Installed • Ready to Launch';
            window.dispatchEvent(new CustomEvent('ps5-show-notification', {
              detail: {
                title: `✅ ${item.title} Installed`,
                subtitle: 'Ready to stream in 4K on PlayStation 5.'
              }
            }));
            window.dispatchEvent(new CustomEvent('ps5-media-installed', { detail: item }));
          }, 1400);
          return;
        }
        openMediaApp(item);
        return;
      }
      const dlState = item.appId ? getSteamDownload(item.appId) : null;
      if (dlState) {
        if (dlState.status === 'Paused') {
          try { ps5Audio.play?.('select'); } catch (err) {}
          const playBtnEl = document.getElementById('ps5-play-btn');
          const statusEl = playBtnEl?.querySelector('.ps5-dl-pill-status');
          const prevStatusText = statusEl ? statusEl.textContent : '';
          if (statusEl) statusEl.textContent = 'Resuming...';
          const res = await resumeSteamDownload(item.appId);
          if (res?.success) {
            playBtnEl?.classList.remove('ps5-pill-paused');
            const fillEl = playBtnEl?.querySelector('.ps5-dl-pill-bar-fill');
            if (fillEl) fillEl.classList.remove('paused');
            window.dispatchEvent(new CustomEvent('ps5-show-notification', {
              detail: {
                title: `📥 Download Resumed: ${item.title}`,
                subtitle: 'Steam confirmed download resumed.'
              }
            }));
          } else {
            if (statusEl && prevStatusText) statusEl.textContent = prevStatusText;
            window.dispatchEvent(new CustomEvent('ps5-show-notification', {
              detail: {
                title: `Could not resume download`,
                subtitle: res?.error || 'Steam did not accept the resume command.'
              }
            }));
          }
          return;
        } else {
          try { ps5Audio.play?.('select'); } catch (err) {}
          const playBtnEl = document.getElementById('ps5-play-btn');
          const statusEl = playBtnEl?.querySelector('.ps5-dl-pill-status');
          const prevStatusText = statusEl ? statusEl.textContent : '';
          if (statusEl) statusEl.textContent = 'Pausing...';
          const res = await pauseSteamDownload(item.appId);
          if (res?.success) {
            playBtnEl?.classList.add('ps5-pill-paused');
            const fillEl = playBtnEl?.querySelector('.ps5-dl-pill-bar-fill');
            if (fillEl) fillEl.classList.add('paused');
            window.dispatchEvent(new CustomEvent('ps5-show-notification', {
              detail: {
                title: `⏸ Download Paused: ${item.title}`,
                subtitle: 'Steam confirmed download paused.'
              }
            }));
          } else {
            if (statusEl && prevStatusText) statusEl.textContent = prevStatusText;
            window.dispatchEvent(new CustomEvent('ps5-show-notification', {
              detail: {
                title: `Could not pause download`,
                subtitle: res?.error || 'Steam did not accept the pause command.'
              }
            }));
          }
          return;
        }
      }
      if (!item.installed && item.appId) {
        if (window.electronAPI?.launchGame) {
          window.electronAPI.launchGame({ uri: `steam://install/${item.appId}`, title: item.title });
        } else {
          try {
            window.location.href = `steam://install/${item.appId}`;
          } catch (e) {}
        }
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: `📥 Download Started: ${item.title}`,
            subtitle: "Opening Steam to begin downloading on your PC."
          }
        }));
        return;
      }
      if (item.execPath || item.launchUri) {
        launchPCApp(item);
      } else {
        launchGame(item);
      }
    }
  });

  // Listen for external close requests
  window.addEventListener('ps5-request-close', () => {
    exitGame();
  });

  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      exitGame();
    });
  }

  if (ccCloseBtn) {
    ccCloseBtn.addEventListener('click', () => {
      exitGame();
    });
  }

  if (optCloseBtn) {
    optCloseBtn.addEventListener('click', () => {
      const menu = document.getElementById('ps5-options-menu');
      menu?.classList.remove('active');
      exitGame();
    });
  }

  // Resume Gameplay: Dismiss the overlay and yield focus to the running game window
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      ps5Audio.playSelectChime();
      if (launchTransitionTimer) clearTimeout(launchTransitionTimer);
      modal?.classList.remove('active');
      // In desktop Electron mode, minimize the launcher so Windows immediately gives focus to the game & overlays
      if (window.electronAPI?.minimizeWindow) {
        window.electronAPI.minimizeWindow();
      }
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `🎮 Resumed: ${currentGame?.title || 'Game'}`,
          subtitle: "Direct gameplay active • Press PS Button (P) for Control Centre"
        }
      }));
    });
  }
}

export function isRunning() {
  return isGameRunning;
}

export function getCurrentRunningGame() {
  return currentGame;
}

export function launchGame(game) {
  if (!game) return;
  currentGame = game;
  isGameRunning = true;

  // Always auto-enable Game Boost on any direct game launch path too (deduplicated within 1.5s)
  ensureAutoGameBoost(game).catch(() => {});

  if (launchTransitionTimer) clearTimeout(launchTransitionTimer);

  // 1. Play Authentic PS5 Launch Boot Sound, then suspend Web Audio engine while gaming
  ps5Audio.playBootChord();
  setTimeout(() => {
    if (isGameRunning || document.body.classList.contains('game-boost-idle')) {
      ps5Audio.suspendForGameplay?.();
    }
  }, 850);

  const modal = document.getElementById('ps5-running-game-modal');
  const gameBg = document.getElementById('game-live-bg');
  const gameLogo = document.getElementById('game-hud-logo');
  const gameTitle = document.getElementById('game-hud-title');
  const gameStatus = document.getElementById('game-hud-status');
  const studioBadge = document.getElementById('game-hud-studio');

  // Fix: Resolve 4K background artwork URL so it NEVER shows an empty black screen
  const resolvedHero = resolveAssetUrl(game.heroBg, game.appId, 'hero');
  const activeBg = document.getElementById('ps5-bg-layer-a')?.style.backgroundImage ||
                   document.getElementById('ps5-bg-layer-b')?.style.backgroundImage;

  if (gameBg) {
    if (resolvedHero) {
      gameBg.style.backgroundImage = `url('${resolvedHero}')`;
    } else if (activeBg && activeBg !== 'none') {
      gameBg.style.backgroundImage = activeBg;
    } else if (game.heroBg) {
      gameBg.style.backgroundImage = `url('${game.heroBg}')`;
    }
    gameBg.style.backgroundSize = game.heroBgSize || 'cover';
    gameBg.style.backgroundPosition = game.heroBgPos || 'center center';
  }

  // Show official game logo if available, or crisp title
  const resolvedLogo = resolveAssetUrl(game.logoImg, game.appId, 'logo');
  if (gameLogo && resolvedLogo) {
    gameLogo.src = resolvedLogo;
    gameLogo.alt = game.title || 'Game Logo';
    gameLogo.style.display = 'block';
    if (gameTitle) gameTitle.style.display = 'none';
  } else {
    if (gameLogo) gameLogo.style.display = 'none';
    if (gameTitle) {
      gameTitle.style.display = 'block';
      gameTitle.textContent = game.title;
    }
  }

  if (gameStatus) {
    gameStatus.textContent = window.electronAPI?.launchGame
      ? `Launching ${game.title || 'game'} • Waiting for game window to load...`
      : (game.liveStatus || 'Running in 4K 60FPS HDR');
  }
  if (studioBadge) studioBadge.textContent = game.studio || 'PlayStation Studios';

  // 2. Zoom & Flash Animation — Keep running game screen active
  modal?.classList.add('active');

  // Focus primary action button for immediate controller/keyboard navigation
  setTimeout(() => {
    const resumeBtn = document.getElementById('btn-resume-game');
    resumeBtn?.focus();
  }, 80);
}

export async function exitGame() {
  cancelPendingBoostMinimize();
  if (launchTransitionTimer) clearTimeout(launchTransitionTimer);
  if (isMediaAppOpen()) {
    closeMediaApp();
    return;
  }

  const gameToClose = currentGame || getCurrentItem();
  ps5Audio.playBackCancel();

  const modal = document.getElementById('ps5-running-game-modal');
  modal?.classList.remove('active');
  isGameRunning = false;
  currentGame = null;
  document.body.classList.remove('game-boost-idle');
  ps5Audio.resumeFromGameplay?.();

  // Terminate actual Windows game process via backend
  if (gameToClose) {
    console.log(`[Game Launcher] Closing game process on Windows: ${gameToClose.title}`);
    await closePCApp(gameToClose);
  }

  if (window.electronAPI?.disableGameBoost) {
    const boostCfg = typeof getGameBoostSettings === 'function' ? getGameBoostSettings() : {};
    await window.electronAPI.disableGameBoost({ restoreClosedApps: Boolean(boostCfg?.boostRestoreClosedApps) }).catch(() => {});
  }
}
