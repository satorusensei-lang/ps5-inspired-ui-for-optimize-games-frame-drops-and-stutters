/* ==========================================================================
   PlayStation 5 Native System Overlays (Replacing all non-PS5 alert popups)
   - System Settings (Display 4K 120Hz, 3D Tempest Audio, Storage, Controllers)
   - Profile Card (PSN Lv.420, Platinum Trophies, PS Plus Premium)
   - Switcher (Fast-Switch between Suspended Games)
   - Game Base (Voice Parties & Friends Online)
   - Notifications Hub (Trophies & Downloads)
   - Power Menu (Rest Mode, Turn Off, Restart)
   - Game Options Menu (Square □ Context Flyout)
   - PlayStation Store Hub (Integrated 4K Catalog)
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { launchGame, isRunning, exitGame } from './game-launcher.js';
import { PS5_GAMES } from '../data/ps5-games-data.js';
import { enterRestMode } from './boot-screen.js';

let activeOverlayId = null;

export function initOverlays() {
  // Wire Settings button
  document.getElementById('btn-header-settings')?.addEventListener('click', () => openOverlay('ps5-settings-modal'));
  document.getElementById('setting-boot-themes-btn')?.addEventListener('click', () => openOverlay('ps5-boot-themes-modal'));

  // Wire Audio Mute/Unmute button
  const audioBtn = document.getElementById('btn-header-audio');
  const audioIconOn = document.getElementById('header-audio-icon-on');
  const audioIconMuted = document.getElementById('header-audio-icon-muted');
  audioBtn?.addEventListener('click', () => {
    const isMuted = ps5Audio.toggleMute();
    if (audioIconOn && audioIconMuted) {
      audioIconOn.style.display = isMuted ? 'none' : 'block';
      audioIconMuted.style.display = isMuted ? 'block' : 'none';
    }
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: isMuted ? '🔇 Audio Muted' : '🔊 Ambient Audio Enabled',
        subtitle: isMuted ? 'Dashboard music and game theme previews muted.' : 'Ambient synth drone & dynamic soundtrack previews active.'
      }
    }));
  });

  // Wire Profile button
  document.getElementById('btn-header-profile')?.addEventListener('click', () => openOverlay('ps5-profile-modal'));

  // Wire Options button on hero
  document.getElementById('ps5-options-btn')?.addEventListener('click', () => openOverlay('ps5-options-menu'));

  // Wire Close buttons for all modals
  document.querySelectorAll('[data-close-overlay]').forEach(btn => {
    btn.addEventListener('click', closeActiveOverlay);
  });

  // Switcher direct launch actions
  document.querySelectorAll('[data-switch-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameId = btn.getAttribute('data-switch-to');
      const game = PS5_GAMES.find(g => g.id === gameId);
      if (game) {
        closeActiveOverlay();
        window.dispatchEvent(new CustomEvent('ps5-launch-game', { detail: game }));
      }
    });
  });

  // Power action buttons
  document.getElementById('btn-power-rest')?.addEventListener('click', () => {
    closeActiveOverlay(false);
    enterRestMode();
  });

  document.getElementById('btn-power-restart')?.addEventListener('click', () => {
    restartPS5();
  });

  document.getElementById('btn-power-off')?.addEventListener('click', () => {
    turnOffPS5();
  });
}

export function openOverlay(overlayId) {
  if (activeOverlayId) {
    closeActiveOverlay(false);
  }

  const modal = document.getElementById(overlayId);
  if (!modal) return;

  activeOverlayId = overlayId;
  ps5Audio.playSelectChime();
  modal.classList.add('active');

  // Focus first actionable button inside modal
  const firstFocus = modal.querySelector('button, [tabindex="0"]');
  firstFocus?.focus();
}

export function closeActiveOverlay(playSound = true) {
  if (!activeOverlayId) return false;

  const modal = document.getElementById(activeOverlayId);
  if (modal) {
    modal.classList.remove('active');
  }

  activeOverlayId = null;
  if (playSound) {
    ps5Audio.playBackCancel();
  }
  return true;
}

export function hasActiveOverlay() {
  return activeOverlayId !== null;
}

export function getActiveOverlayId() {
  return activeOverlayId;
}

export function restartPS5() {
  closeActiveOverlay(false);

  // Cleanly close any open overlays, modals, and control center dock
  document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.getElementById('ps5-control-center')?.classList.remove('active');
  document.getElementById('ps5-library-modal')?.classList.remove('active');

  try {
    ps5Audio.playBackCancel();
  } catch (e) {}

  const blackout = document.getElementById('ps5-power-blackout');
  const labelEl = document.getElementById('ps5-power-label');
  const sublabelEl = document.getElementById('ps5-power-sublabel');
  const spinner = blackout?.querySelector('.blackout-spinner');

  if (spinner) spinner.style.display = 'block';
  if (labelEl) {
    labelEl.textContent = "Restarting your PS5...";
  }
  if (sublabelEl) {
    sublabelEl.style.display = 'block';
    sublabelEl.textContent = "Don't unplug the AC power cord when the power indicator on your PS5 is lit or blinking.";
  }

  if (blackout) {
    blackout.classList.add('active');
  }

  // Authentic PS5 system reboot interval before browser page reload
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }, 2200);
}

export function turnOffPS5() {
  closeActiveOverlay(false);

  document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.getElementById('ps5-control-center')?.classList.remove('active');
  document.getElementById('ps5-library-modal')?.classList.remove('active');

  try {
    ps5Audio.playBackCancel();
  } catch (e) {}

  const blackout = document.getElementById('ps5-power-blackout');
  const labelEl = document.getElementById('ps5-power-label');
  const sublabelEl = document.getElementById('ps5-power-sublabel');
  const spinner = blackout?.querySelector('.blackout-spinner');

  if (spinner) spinner.style.display = 'block';
  if (labelEl) {
    labelEl.textContent = "Turning off your PS5...";
  }
  if (sublabelEl) {
    sublabelEl.style.display = 'block';
    sublabelEl.textContent = "Don't unplug the AC power cord when the power indicator on your PS5 is lit or blinking.";
  }

  if (blackout) {
    blackout.classList.add('active');
  }

  setTimeout(() => {
    if (spinner) spinner.style.display = 'none';
    if (sublabelEl) sublabelEl.style.display = 'none';
    if (labelEl) {
      labelEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <button id="ps5-turn-on-btn" style="padding: 14px 40px; border-radius: 999px; background: #ffffff; color: #000000; font-family: var(--ps-font); font-weight: 800; font-size: 1.05rem; border: none; cursor: pointer; box-shadow: 0 0 35px rgba(255,255,255,0.45); transition: transform 0.2s ease;">
            ⏻ Turn On PlayStation 5
          </button>
          <span style="font-size: 0.82rem; color: rgba(255,255,255,0.45); letter-spacing: 0.04em;">Press button or tap screen to power on</span>
        </div>
      `;
    }

    const turnOn = () => {
      window.location.reload();
    };

    document.getElementById('ps5-turn-on-btn')?.addEventListener('click', turnOn);
    blackout?.addEventListener('click', turnOn, { once: true });
    window.addEventListener('keydown', turnOn, { once: true });
  }, 2200);
}
