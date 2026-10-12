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
