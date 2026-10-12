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
import { ps5Audio } from './audio/ps5-audio.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize services
  initClock();
  initCarousel();
  initGameLauncher();
  initMediaLauncher();
  initControlCenter();
  initControllerInput();
  initOverlays();
  initBootScreen();
  initProfileManager();
  initDesktopControls();

  // First user interaction initializes Web Audio API context and begins ambient soundscape
  const unlockAudio = () => {
    ps5Audio.init();
    ps5Audio.startAmbientDrone();
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

    const fsBtn = document.getElementById('btn-header-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.electronAPI.toggleFullscreen?.();
      });
    }

    window.electronAPI.onFullscreenChange?.((isFullscreen) => {
      document.body.classList.toggle('is-fullscreen', isFullscreen);
    });
  }
}
