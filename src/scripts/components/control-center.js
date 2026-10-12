/* ==========================================================================
   PlayStation 5 Control Centre (Authentic DualSense Quick Menu)
   - Persistent Bottom Dock: Home, Switcher, Notifications, Game Base, Music, Mic, Accessories, Power
   - Floating Activity Cards Rack: Active Mission Resume, Voice Party, Spotify Player
   - Real-Time DualSense Mic Mute with Amber LED Indicator
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay, closeActiveOverlay, hasActiveOverlay } from './overlays.js';
import { getCurrentItem } from './carousel.js';
import { isRunning } from './game-launcher.js';

let isOpen = false;
let isMicMuted = false;
let isPlayingMusic = true;

export function initControlCenter() {
  const triggerBtn = document.getElementById('ps5-btn-trigger');
  const ccBar = document.getElementById('ps5-control-center');

  if (triggerBtn) {
    triggerBtn.addEventListener('click', toggleControlCenter);
  }

  // Bottom Dock Actions
  document.getElementById('cc-dock-home')?.addEventListener('click', () => {
    closeControlCenter();
    window.dispatchEvent(new CustomEvent('ps5-return-home'));
  });

  document.getElementById('cc-dock-switcher')?.addEventListener('click', () => {
    openOverlay('ps5-switcher-modal');
  });

  document.getElementById('cc-dock-notifications')?.addEventListener('click', () => {
    openOverlay('ps5-notifications-modal');
  });

  document.getElementById('cc-dock-gamebase')?.addEventListener('click', () => {
    openOverlay('ps5-gamebase-modal');
  });

  document.getElementById('cc-dock-music')?.addEventListener('click', () => {
    toggleMusicPlayState();
  });

  document.getElementById('cc-dock-mic')?.addEventListener('click', toggleMicMute);

  document.getElementById('cc-dock-accessories')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: "🎮 DualSense Wireless Controller",
        subtitle: "Battery 100% • Haptic Feedback: Strong • Adaptive Triggers: Active"
      }
    }));
  });

  document.getElementById('cc-dock-boot-themes')?.addEventListener('click', () => {
    closeControlCenter();
    openOverlay('ps5-boot-themes-modal');
  });

  document.getElementById('cc-dock-power')?.addEventListener('click', () => {
    openOverlay('ps5-power-modal');
  });

  // Top Card Actions in Control Center
  document.getElementById('cc-card-resume-btn')?.addEventListener('click', () => {
    closeControlCenter();
    window.dispatchEvent(new CustomEvent('ps5-request-launch'));
  });

  document.getElementById('cc-card-party-btn')?.addEventListener('click', () => {
    openOverlay('ps5-gamebase-modal');
  });

  document.getElementById('cc-card-music-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusicPlayState();
  });
}

export function isControlCenterOpen() {
  return isOpen;
}

export function openControlCenter() {
  if (isOpen) return;
  isOpen = true;
  ps5Audio.playControlCenterChime();
  const ccBar = document.getElementById('ps5-control-center');
  ccBar?.classList.add('open');
  updateControlCenterCards();

  // Focus home icon by default
  document.getElementById('cc-dock-home')?.focus();
}

export function closeControlCenter() {
  if (!isOpen) return;
  if (hasActiveOverlay()) {
    closeActiveOverlay(false);
  }
  isOpen = false;
  ps5Audio.playBackCancel();
  const ccBar = document.getElementById('ps5-control-center');
  ccBar?.classList.remove('open');
}

export function toggleControlCenter() {
  if (isOpen) {
    closeControlCenter();
  } else {
    openControlCenter();
  }
}

function updateControlCenterCards() {
  const currentItem = getCurrentItem();
  const gameTitleEl = document.getElementById('cc-card-game-title');
  const gameSubEl = document.getElementById('cc-card-game-sub');
  const gameThumbEl = document.getElementById('cc-card-game-thumb');

  if (currentItem && gameTitleEl) {
    gameTitleEl.textContent = currentItem.title;
    if (gameSubEl) {
      gameSubEl.textContent = isRunning()
        ? "Game Suspended in Background • Click to Resume"
        : (currentItem.liveStatus || "Ready to Resume");
    }
    if (gameThumbEl && currentItem.tileIcon) {
      gameThumbEl.style.backgroundImage = `url('${currentItem.tileIcon}')`;
    }
  }
}

function toggleMicMute() {
  isMicMuted = !isMicMuted;
  ps5Audio.playSelectChime();

  const amberLed = document.querySelector('.cc-mic-amber-led');
  const micBtn = document.getElementById('cc-dock-mic');

  if (amberLed) {
    amberLed.style.display = isMicMuted ? 'block' : 'none';
  }

  if (micBtn) {
    micBtn.classList.toggle('muted', isMicMuted);
    micBtn.title = isMicMuted ? 'Microphone Muted (Amber LED On)' : 'Microphone Active';
  }

  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: isMicMuted ? "🎤 Microphone Muted" : "🎤 Microphone Active",
      subtitle: isMicMuted ? "Amber indicator active on DualSense" : "Party members can hear you"
    }
  }));
}

function toggleMusicPlayState() {
  isPlayingMusic = !isPlayingMusic;
  ps5Audio.playSelectChime();

  const label = document.getElementById('cc-music-status-label');
  const icon = document.getElementById('cc-music-play-icon');

  if (label) {
    label.textContent = isPlayingMusic ? "Playing • Marvel's Spider-Man 2 OST" : "Paused • Marvel's Spider-Man 2 OST";
  }

  if (icon) {
    icon.innerHTML = isPlayingMusic
      ? `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`
      : `<polygon points="5 3 19 12 5 21 5 3"/>`;
  }
}
