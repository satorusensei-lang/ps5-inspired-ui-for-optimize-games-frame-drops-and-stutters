/* ==========================================================================
   PlayStation 5 Game Launch & Running Mode Experience
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { getCurrentItem, getCurrentTab } from './carousel.js';
import { launchPCApp, closePCApp } from './pc-launcher.js';
import { openMediaApp, isMediaAppOpen, closeMediaApp } from './media-launcher.js';

let isGameRunning = false;
let currentGame = null;

export function initGameLauncher() {
  const playBtn = document.getElementById('ps5-play-btn');
  const modal = document.getElementById('ps5-running-game-modal');
  const exitBtn = document.getElementById('btn-exit-game');
  const resumeBtn = document.getElementById('btn-resume-game');
  const ccCloseBtn = document.getElementById('cc-card-close-btn');
  const optCloseBtn = document.getElementById('opt-btn-close-game');

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

  window.addEventListener('ps5-request-launch', () => {
    const item = getCurrentItem();
    if (item) {
      if (item.isStore) {
        window.ps5OpenStore?.();
        return;
      }
      if (item.isLibrary) {
        window.ps5OpenLibrary?.();
        return;
      }
      // In-App PS5 Media Launch (YouTube, Spotify, YouTube Music, etc.)
      if (getCurrentTab() === 'media' || item.genre?.includes('Streaming') || item.genre?.includes('Music') || item.id === 'youtube' || item.id === 'youtube-music' || item.id === 'spotify' || item.id === 'netflix' || item.id === 'discord') {
        openMediaApp(item);
        return;
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

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      ps5Audio.playSelectChime();
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `🎮 Resumed: ${currentGame?.title}`,
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
  if (isGameRunning || !game) return;
  currentGame = game;
  isGameRunning = true;

  // 1. Play Authentic PS5 Launch Boot Sound
  ps5Audio.playBootChord();

  const modal = document.getElementById('ps5-running-game-modal');
  const gameBg = document.getElementById('game-live-bg');
  const gameTitle = document.getElementById('game-hud-title');
  const gameStatus = document.getElementById('game-hud-status');
  const studioBadge = document.getElementById('game-hud-studio');

  if (gameBg) gameBg.style.backgroundImage = `url('${game.heroBg}')`;
  if (gameTitle) gameTitle.textContent = game.title;
  if (gameStatus) gameStatus.textContent = game.liveStatus || 'Running in 4K 60FPS HDR';
  if (studioBadge) studioBadge.textContent = game.studio;

  // 2. Zoom & Flash Animation
  modal?.classList.add('active');
}

export async function exitGame() {
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

  // Terminate actual Windows game process via backend
  if (gameToClose) {
    console.log(`[Game Launcher] Closing game process on Windows: ${gameToClose.title}`);
    await closePCApp(gameToClose);
  }
}
