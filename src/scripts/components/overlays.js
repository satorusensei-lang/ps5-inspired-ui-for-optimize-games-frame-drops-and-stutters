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
import { getCurrentItem, moveGameInOrder } from './carousel.js';
import { downloadOfficialArtworkInBackground } from '../services/artwork-service.js';
import { openArtworkManager } from './artwork-modal.js';
import { closeControlCenter } from './control-center.js';
import { resetSettingsView, getNotificationSettings, setDoNotDisturb } from './settings-manager.js';

let activeOverlayId = null;

export function initOverlays() {
  // Wire Settings button
  document.getElementById('btn-header-settings')?.addEventListener('click', () => openOverlay('ps5-settings-modal'));
  document.getElementById('setting-boot-themes-btn')?.addEventListener('click', () => openOverlay('ps5-boot-themes-modal'));

  // Wire Artwork Customization Studio in Game Options Menu
  document.getElementById('opt-btn-download-art')?.addEventListener('click', () => {
    closeActiveOverlay(false);
    const item = getCurrentItem();
    if (item && !item.isExplore && !item.isStore && !item.isLibrary) {
      openArtworkManager(item);
    }
  });

  // Wire Quick Download Official Artwork
  document.getElementById('opt-btn-quick-download-art')?.addEventListener('click', () => {
    closeActiveOverlay(false);
    const item = getCurrentItem();
    if (item && !item.isExplore && !item.isStore && !item.isLibrary) {
      downloadOfficialArtworkInBackground(item);
    }
  });

  // Wire Move Card Left / Right buttons
  document.getElementById('opt-btn-move-left')?.addEventListener('click', () => {
    const item = getCurrentItem();
    if (item && !item.isExplore && !item.isStore && !item.isLibrary) {
      moveGameInOrder(item.id, 'left');
    }
  });

  document.getElementById('opt-btn-move-right')?.addEventListener('click', () => {
    const item = getCurrentItem();
    if (item && !item.isExplore && !item.isStore && !item.isLibrary) {
      moveGameInOrder(item.id, 'right');
    }
  });

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

  // Allow clicking modal backdrop directly to dismiss
  document.querySelectorAll('.ps5-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeActiveOverlay();
      }
    });
  });

  // Switcher direct launch actions & keyboard navigation
  const switcherItems = document.querySelectorAll('.switcher-item');
  const launchSwitcherGame = (gameId) => {
    if (!gameId) return;
    const game = PS5_GAMES.find(g => g.id === gameId || g.appId === gameId || (gameId === 'spiderman2' && g.id === 'pc_steam_2651280') || (gameId === 'gow-ragnarok' && g.id === 'pc_steam_2322010') || (gameId === 'astro-bot' && (g.id === 'pc_steam_2215430' || g.id === 'pc_steam_2483190')));
    if (game) {
      try { ps5Audio.playSelectChime(); } catch (e) {}
      closeActiveOverlay();
      window.dispatchEvent(new CustomEvent('ps5-launch-game', { detail: game }));
    }
  };

  switcherItems.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-switch-to]');
      const gameId = targetBtn ? targetBtn.getAttribute('data-switch-to') : item.getAttribute('data-switch-to');
      launchSwitcherGame(gameId);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const gameId = item.getAttribute('data-switch-to');
        launchSwitcherGame(gameId);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (idx + 1) % switcherItems.length;
        switcherItems[nextIdx]?.focus();
        try { ps5Audio.playNavTick(); } catch (err) {}
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (idx - 1 + switcherItems.length) % switcherItems.length;
        switcherItems[prevIdx]?.focus();
        try { ps5Audio.playNavTick(); } catch (err) {}
      }
    });

    item.addEventListener('focus', () => {
      switcherItems.forEach(it => it.classList.remove('selected'));
      item.classList.add('selected');
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

  // Do Not Disturb toggle in Notifications Center
  const dndToggle = document.getElementById('notify-dnd-toggle-btn');
  if (dndToggle) {
    let lastDndToggle = 0;
    const doDndToggle = (e) => {
      const now = Date.now();
      if (now - lastDndToggle < 160) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      lastDndToggle = now;

      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const currentDnd = getNotificationSettings().doNotDisturb === true;
      const nextDnd = !currentDnd;
      setDoNotDisturb(nextDnd);

      dndToggle.classList.toggle('active', nextDnd);
      dndToggle.setAttribute('aria-checked', nextDnd ? 'true' : 'false');
      const pill = dndToggle.querySelector('.ps5-toggle-pill');
      if (pill) pill.classList.toggle('active', nextDnd);

      try { ps5Audio.playNavTick(); } catch (err) {}
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: nextDnd ? "🔕 Do Not Disturb On" : "🔔 Do Not Disturb Off",
          subtitle: nextDnd ? "Pop-up notifications will be muted." : "Notifications will appear normally."
        }
      }));
    };

    dndToggle.onclick = doDndToggle;
    dndToggle.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        doDndToggle(e);
      }
    };
  }

  // Clear / Delete notifications action
  document.getElementById('btn-clear-notifications')?.addEventListener('click', () => {
    const list = document.querySelector('.notify-list');
    if (list) {
      list.innerHTML = `
        <div class="notify-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="notify-empty-title">No New Notifications</div>
          <p class="notify-empty-sub">Downloads, updates, and trophies will appear here.</p>
        </div>
      `;
      try { ps5Audio.playBackCancel(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🗑️ Notifications Cleared",
          subtitle: "All system notifications deleted."
        }
      }));
    }
  });

  // Options button in Notifications HUD
  document.getElementById('btn-options-notifications')?.addEventListener('click', () => {
    try { ps5Audio.playSelectChime(); } catch (e) {}
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: "⚙️ Notification Settings",
        subtitle: "Pop-up timing: Standard • Downloads: Enabled • Trophies: All"
      }
    }));
  });

  // Interactive settings items feedback


  // Notification item clicks and focus tracking
  document.querySelectorAll('.notify-item').forEach(item => {
    item.addEventListener('focus', () => {
      document.querySelectorAll('.notify-item').forEach(i => i.classList.remove('active-focus'));
      item.classList.add('active-focus');
    });

    item.addEventListener('click', () => {
      document.querySelectorAll('.notify-item').forEach(i => i.classList.remove('active-focus'));
      item.classList.add('active-focus');
      const title = item.querySelector('.notify-title-line')?.textContent || item.querySelector('.notify-title-text')?.textContent || 'Notification';
      const desc = item.querySelector('.notify-subtitle-line')?.textContent || item.querySelector('.notify-desc-text')?.textContent || '';
      try { ps5Audio.playSelectChime(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: { title, subtitle: desc }
      }));
    });
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

  if (overlayId === 'ps5-settings-modal') {
    resetSettingsView();
    const scroll = modal.querySelector('.ps5-settings-scroll-authentic');
    if (scroll) scroll.scrollTop = 0;
  }

  if (overlayId === 'ps5-notifications-hub') {
    const dndActive = getNotificationSettings().doNotDisturb === true;
    const dndToggle = document.getElementById('notify-dnd-toggle-btn');
    if (dndToggle) {
      dndToggle.classList.toggle('active', dndActive);
      dndToggle.setAttribute('aria-checked', dndActive ? 'true' : 'false');
      const pill = dndToggle.querySelector('.ps5-toggle-pill');
      if (pill) pill.classList.toggle('active', dndActive);
    }
  }

  // Focus primary actionable item inside modal (prioritizing authentic settings rows over close button)
  setTimeout(() => {
    let primaryFocus = null;
    if (overlayId === 'ps5-switcher-modal') {
      primaryFocus = modal.querySelector('.switcher-item.active, .switcher-item');
    }
    if (!primaryFocus) {
      primaryFocus = modal.querySelector(
        '.settings-row-authentic.clickable, ' +
        '.settings-row-authentic, ' +
        '.settings-item.clickable, ' +
        '.power-option-btn, ' +
        '.theme-card, ' +
        '.opt-action-btn, ' +
        '.store-item-card, ' +
        'button:not([data-close-overlay]):not(.modal-close-btn), ' +
        '[tabindex="0"], ' +
        'input:not([disabled])'
      ) || modal.querySelector('button, [tabindex="0"]');
    }

    primaryFocus?.focus();
  }, 50);
}

export function closeActiveOverlay(playSound = true) {
  if (!activeOverlayId) {
    document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));
    return false;
  }

  const closingId = activeOverlayId;
  const modal = document.getElementById(activeOverlayId);
  if (modal) {
    modal.classList.remove('active');
  }

  activeOverlayId = null;

  try {
    if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  } catch (e) {}

  if (closingId === 'ps5-settings-modal') {
    resetSettingsView();
  }

  if (playSound) {
    ps5Audio.playBackCancel();
  }

  // Restore focus to active carousel tile
  setTimeout(() => {
    document.querySelector('.ps5-tile.active')?.focus({ preventScroll: true });
  }, 50);

  return true;
}

export function hasActiveOverlay() {
  if (!activeOverlayId) return false;
  const modal = document.getElementById(activeOverlayId);
  if (!modal || !modal.classList.contains('active')) {
    activeOverlayId = null;
    return false;
  }
  return true;
}

export function getActiveOverlayId() {
  return activeOverlayId;
}

export function restartPS5() {
  closeActiveOverlay(false);

  // Cleanly close any open overlays, modals, and control center dock
  document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.getElementById('ps5-control-center')?.classList.remove('active', 'open');
  document.getElementById('ps5-library-modal')?.classList.remove('active');
  try {
    closeControlCenter();
  } catch (e) {}

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

  // Authentic PS5 system reboot interval before browser page reload / Electron app reboot
  setTimeout(() => {
    if (window.electronAPI?.rebootApp) {
      window.electronAPI.rebootApp();
    } else if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }, 2200);
}

export function turnOffPS5() {
  closeActiveOverlay(false);

  document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.getElementById('ps5-control-center')?.classList.remove('active', 'open');
  document.getElementById('ps5-library-modal')?.classList.remove('active');
  try {
    closeControlCenter();
  } catch (e) {}

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
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
      return;
    }

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
