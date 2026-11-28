/* ==========================================================================
   PlayStation 5 PC Experience — Main Application Entry Point
   ========================================================================== */

import { initClock } from './components/clock.js';
import { initCarousel } from './components/carousel.js';
import { initGameLauncher } from './components/game-launcher.js';
import { initControlCenter } from './components/control-center.js';
import { initControllerInput } from './components/controller-input.js';
import { initOverlays } from './components/overlays.js';
import { initMediaLauncher } from './components/media-launcher.js';
import { initBootScreen } from './components/boot-screen.js';
import { initProfileManager } from './components/profile-manager.js';
import { initSettingsManager } from './components/settings-manager.js';
import { initArtworkModal } from './components/artwork-modal.js';
import { initSteamDownloadService } from './services/steam-download-service.js';
import { syncPCGames } from './components/carousel.js';
import { ps5Audio } from './audio/ps5-audio.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Boot Screen first so the console opening experience starts immediately
  try {
    initBootScreen();
  } catch (err) {
    console.error('[PS5] Failed to init boot screen:', err);
  }

  // 2. Initialize UI services with individual safety isolation
  const inits = [
    ['Clock', initClock],
    ['Steam Download Service', initSteamDownloadService],
    ['Carousel', initCarousel],
    ['Game Launcher', initGameLauncher],
    ['Media Launcher', initMediaLauncher],
    ['Control Center', initControlCenter],
    ['Controller Input', initControllerInput],
    ['Overlays', initOverlays],
    ['Profile Manager', initProfileManager],
    ['Settings Manager', initSettingsManager],
    ['Artwork Modal', initArtworkModal],
    ['Desktop Controls', initDesktopControls]
  ];

  for (const [name, fn] of inits) {
    try {
      fn();
    } catch (err) {
      console.error(`[PS5] Failed to initialize ${name}:`, err);
    }
  }

  // Single silent Steam/Multi-Store synchronization after initial boot frame
  setTimeout(() => {
    syncPCGames(true);
  }, 150);

  // Real-time Steam library watcher event from Electron desktop app
  const hasRealtimeWatcher = Boolean(typeof window !== 'undefined' && window.electronAPI?.onSteamLibraryChanged);
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.onSteamLibraryChanged?.((data) => {
      console.log('🔄 [Real-Time Steam Sync] Live Steam Favorites/Library change detected. Updating dashboard...');
      syncPCGames(true, data);
    });

    window.electronAPI.onSteamArtworkUpdated?.((data) => {
      if (data && data.gameId) {
        window.dispatchEvent(new CustomEvent('ps5-game-artwork-updated', { detail: data }));
        window.dispatchEvent(new CustomEvent('ps5-refresh-hero-display', { detail: { gameId: data.gameId } }));
      }
    });
  }

  // Auto-sync when user returns to PS5 from Steam or another app (throttled heavily when live watcher is active)
  let lastFocusSync = Date.now();
  const focusSyncCooldownMs = hasRealtimeWatcher ? 20000 : 8000;
  window.addEventListener('focus', () => {
    if (document.body.classList.contains('game-boost-idle')) return;
    const now = Date.now();
    if (now - lastFocusSync > focusSyncCooldownMs) {
      lastFocusSync = now;
      syncPCGames(true);
    }
  });

  // Fallback periodic background poll only when Electron's real-time push watcher isn't available
  if (!hasRealtimeWatcher) {
    setInterval(() => {
      if (!document.hidden) {
        syncPCGames(true);
      }
    }, 30000);
  }

  // First user interaction initializes Web Audio API context
  const unlockAudio = () => {
    ps5Audio.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  console.log("🎮 PlayStation 5 PC Dashboard Loaded Successfully!");
});

function initDesktopControls() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    document.body.classList.add('is-desktop-app');
    const controls = document.getElementById('ps5-desktop-controls');
    if (controls) controls.style.display = 'inline-flex';

    document.getElementById('win-btn-minimize')?.addEventListener('click', () => {
      window.electronAPI.minimizeWindow?.();
    });
    document.getElementById('win-btn-maximize')?.addEventListener('click', () => {
      window.electronAPI.maximizeWindow?.();
    });
    document.getElementById('win-btn-close')?.addEventListener('click', () => {
      window.electronAPI.closeWindow?.();
    });

    window.electronAPI.onFullscreenChange?.((isFullscreen) => {
      document.body.classList.toggle('is-fullscreen', isFullscreen);
    });
  }
}
