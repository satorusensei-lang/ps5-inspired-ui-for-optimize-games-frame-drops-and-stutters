/* ==========================================================================
   PlayStation 5 Controller & Keyboard Input Dispatcher (Ultra-Low Latency)
   - Zero-Allocation HUD Dirty-Checking (60–120 FPS Optimized)
   - Vertical Navigation: Carousel <-> Game Hub (Activities)
   - DualSense, Xbox & DirectInput Gamepad API Support
   - Seamless Modal Overlay Integration (Overlays, CC, Store, Library)
   ========================================================================== */

import { 
  navigateCarousel, 
  getCurrentTab, 
  switchTab, 
  getCurrentItem, 
  isLibraryOpen, 
  closeLibraryModal, 
  openLibraryModal,
  switchLibraryTab,
  enterGameHub,
  exitGameHub,
  isHubActive,
  triggerActiveActivity,
  handleItemSelect
} from './carousel.js';

import { isRunning, exitGame } from './game-launcher.js';
import { isControlCenterOpen, toggleControlCenter, closeControlCenter } from './control-center.js';
import { hasActiveOverlay, closeActiveOverlay, openOverlay, getActiveOverlayId } from './overlays.js';
import { ps5Audio } from '../audio/ps5-audio.js';
import { isMediaAppOpen, closeMediaApp } from './media-launcher.js';
import { isRestModeActive, exitRestMode, isBootScreenActive, skipBootScreen } from './boot-screen.js';
import { isSettingsSubmenuActive, goBackSettings, getNotificationSettings } from './settings-manager.js';

let gamepadPollInterval = null;
let lastButtonStates = {};
let lastStickTime = 0;
let lastKeyNavTime = 0;
let connectedControllerName = null;

// Cached HUD elements & states
let hudElements = null;
let lastHudStates = {};

export function initControllerInput() {
  // 1. Keyboard Navigation
  window.addEventListener('keydown', handleKeyboard);

  // 2. HTML5 Gamepad API Events
  window.addEventListener('gamepadconnected', (e) => {
    handleGamepadConnected(e.gamepad);
  });

  window.addEventListener('gamepaddisconnected', (e) => {
    handleGamepadDisconnected(e.gamepad);
  });

  // Start continuous polling for low input latency
  startGamepadPolling();

  // 3. Virtual Controller Button Triggers
  setupVirtualGamepadButtons();

  // 4. Custom PS5 Notification Bus
  window.addEventListener('ps5-show-notification', (e) => {
    if (e.detail) {
      showPS5Notification(e.detail.title, e.detail.subtitle);
    }
  });

  // 5. Status Badge Click Guide
  const statusBadge = document.getElementById('controller-status-badge');
  if (statusBadge) {
    statusBadge.addEventListener('click', () => {
      if (connectedControllerName) {
        showPS5Notification(`🎮 ${connectedControllerName}`, "Analog Controls & Rumble Vibration Active • 4K 60FPS");
        triggerHapticRumble(0.4, 0.2, 100);
      } else {
        showPS5Notification("🎮 Controller Ready", "Press any button on your DualSense, Xbox or PC controller to pair, or use Arrow Keys + Enter.");
      }
    });
  }

  // 6. Header Search Button Wire
  document.getElementById('btn-header-search')?.addEventListener('click', () => {
    openLibraryModal('all');
  });
}

function handleGamepadConnected(gp) {
  let name = "Wireless Controller";
  const idLower = gp.id.toLowerCase();

  if (idLower.includes("dualsense") || idLower.includes("054c") || idLower.includes("playstation")) {
    name = "DualSense Wireless Controller";
  } else if (idLower.includes("xbox") || idLower.includes("x-box") || idLower.includes("045e")) {
    name = "Xbox Wireless Controller";
  } else {
    name = gp.id.split("(")[0].trim() || "Gamepad Controller";
  }

  connectedControllerName = name;
  updateControllerStatusUI(name, true);
  showPS5Notification(`🎮 ${name} Connected`, "Analog Controls & Rumble Vibration Ready");
  triggerHapticRumble(0.5, 0.3, 180);
  ps5Audio.playSelectChime();
}

function handleGamepadDisconnected() {
  connectedControllerName = null;
  updateControllerStatusUI("No Controller Connected", false);
  showPS5Notification("⚠️ Controller Disconnected", "Switched to Keyboard & Mouse");
  ps5Audio.playBackCancel();
}

function startGamepadPolling() {
  if (gamepadPollInterval) return;

  gamepadPollInterval = setInterval(() => {
    // Pause Chromium HID gamepad polling while minimized or running a launched game so controller input never contends with the game
    if (isRunning() || document.hidden || document.body.classList.contains('game-boost-idle')) {
      return;
    }
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activeGp = null;
    for (const gp of gamepads) {
      if (gp) {
        activeGp = gp;
        break;
      }
    }

    if (activeGp) {
      if (!connectedControllerName) {
        handleGamepadConnected(activeGp);
      }
      pollGamepad(activeGp);
    } else if (connectedControllerName) {
      handleGamepadDisconnected();
    }
  }, 40);
}

function pollGamepad(gp) {
  if (isRestModeActive()) {
    const anyPressed = gp.buttons.some(b => b?.pressed);
    if (anyPressed) {
      exitRestMode();
      triggerHapticRumble(0.5, 0.3, 140);
    }
    return;
  }

  if (isBootScreenActive()) {
    const anyPressed = gp.buttons.some(b => b?.pressed) ||
      Math.abs(gp.axes[0] || 0) > 0.45 || Math.abs(gp.axes[1] || 0) > 0.45;
    if (anyPressed) {
      if (skipBootScreen()) {
        triggerHapticRumble(0.3, 0.15, 60);
      }
    }
    return;
  }

  const now = Date.now();

  const leftStickX = gp.axes[0] || 0;
  const leftStickY = gp.axes[1] || 0;
  const dpadUp = gp.buttons[12]?.pressed;
  const dpadDown = gp.buttons[13]?.pressed;
  const dpadLeft = gp.buttons[14]?.pressed;
  const dpadRight = gp.buttons[15]?.pressed;

  highlightGamepadHUD({
    cross: gp.buttons[0]?.pressed,
    circle: gp.buttons[1]?.pressed,
    square: gp.buttons[2]?.pressed,
    triangle: gp.buttons[3]?.pressed
  });

  const stickActive = Math.abs(leftStickX) > 0.38 || Math.abs(leftStickY) > 0.38 || dpadLeft || dpadRight || dpadUp || dpadDown;

  if (stickActive) {
    if (now - lastStickTime > 110) {
      if (leftStickX < -0.38 || dpadLeft) {
        handleNavLeft();
        lastStickTime = now;
        triggerHapticRumble(0.2, 0.1, 30);
      } else if (leftStickX > 0.38 || dpadRight) {
        handleNavRight();
        lastStickTime = now;
        triggerHapticRumble(0.2, 0.1, 30);
      } else if (leftStickY < -0.38 || dpadUp) {
        handleNavUp();
        lastStickTime = now;
        triggerHapticRumble(0.2, 0.1, 30);
      } else if (leftStickY > 0.38 || dpadDown) {
        handleNavDown();
        lastStickTime = now;
        triggerHapticRumble(0.2, 0.1, 30);
      }
    }
  } else {
    lastStickTime = 0;
  }

  // Face Buttons
  // Button 0: Cross ✕ (Enter / Action)
  const btnCross = gp.buttons[0]?.pressed;
  if (btnCross && !lastButtonStates[0]) {
    handleButtonCross();
    triggerHapticRumble(0.4, 0.2, 100);
  }
  lastButtonStates[0] = btnCross;

  // Button 1: Circle ○ (Back / Cancel)
  const btnCircle = gp.buttons[1]?.pressed;
  if (btnCircle && !lastButtonStates[1]) {
    handleButtonCircle();
    triggerHapticRumble(0.3, 0.15, 80);
  }
  lastButtonStates[1] = btnCircle;

  // Button 2: Square □ (Options)
  const btnSquare = gp.buttons[2]?.pressed;
  if (btnSquare && !lastButtonStates[2]) {
    handleButtonSquare();
  }
  lastButtonStates[2] = btnSquare;

  // Button 3: Triangle △ (Search / Library)
  const btnTriangle = gp.buttons[3]?.pressed;
  if (btnTriangle && !lastButtonStates[3]) {
    handleButtonTriangle();
  }
  lastButtonStates[3] = btnTriangle;

  // Bumpers: L1 / R1 — Toggle between Games and Media
  const btnL1 = gp.buttons[4]?.pressed;
  if (btnL1 && !lastButtonStates[4]) {
    switchTab('games');
    triggerHapticRumble(0.3, 0.2, 50);
  }
  lastButtonStates[4] = btnL1;

  const btnR1 = gp.buttons[5]?.pressed;
  if (btnR1 && !lastButtonStates[5]) {
    switchTab('media');
    triggerHapticRumble(0.3, 0.2, 50);
  }
  lastButtonStates[5] = btnR1;

  // Button 16 or 8/9: PS Button (Control Center)
  const btnPS = gp.buttons[16]?.pressed || gp.buttons[8]?.pressed;
  if (btnPS && !lastButtonStates[16]) {
    toggleControlCenter();
    triggerHapticRumble(0.5, 0.3, 140);
  }
  lastButtonStates[16] = btnPS;
}

/* --------------------------------------------------------------------------
   Directional & Button Handlers
   -------------------------------------------------------------------------- */
function handleNavLeft() {
  const runningModal = document.getElementById('ps5-running-game-modal');
  if (runningModal && runningModal.classList.contains('active')) {
    const resumeBtn = document.getElementById('btn-resume-game');
    if (resumeBtn) {
      resumeBtn.focus();
      try { ps5Audio.playCursorTick(); } catch (e) {}
    }
    return;
  }

  if (isControlCenterOpen()) {
    navigateControlCenter('left');
  } else if (hasActiveOverlay()) {
    navigateActiveOverlay('left');
  } else if (isLibraryOpen()) {
    navigateLibraryModal('left');
  } else {
    navigateCarousel('left');
  }
}

function handleNavRight() {
  const runningModal = document.getElementById('ps5-running-game-modal');
  if (runningModal && runningModal.classList.contains('active')) {
    const exitBtn = document.getElementById('btn-exit-game');
    if (exitBtn) {
      exitBtn.focus();
      try { ps5Audio.playCursorTick(); } catch (e) {}
    }
    return;
  }

  if (isControlCenterOpen()) {
    navigateControlCenter('right');
  } else if (hasActiveOverlay()) {
    navigateActiveOverlay('right');
  } else if (isLibraryOpen()) {
    navigateLibraryModal('right');
  } else {
    navigateCarousel('right');
  }
}

function handleNavDown() {
  if (isRunning()) return;

  if (isControlCenterOpen()) {
    navigateControlCenter('down');
  } else if (hasActiveOverlay()) {
    navigateActiveOverlay('down');
  } else if (isLibraryOpen()) {
    navigateLibraryModal('down');
  } else if (document.activeElement?.classList.contains('ps5-tab') || document.activeElement?.closest('.ps5-header')) {
    ps5Audio.playNavTick();
    const activeTile = document.querySelector('.ps5-tile.active') || document.querySelector('.ps5-tile');
    activeTile?.focus();
  } else if (!isHubActive()) {
    const cards = document.querySelectorAll('.ps5-activity-card');
    if (cards.length > 0) {
      enterGameHub();
    }
  }
}

function handleNavUp() {
  if (isRunning()) return;

  if (isControlCenterOpen()) {
    navigateControlCenter('up');
  } else if (hasActiveOverlay()) {
    navigateActiveOverlay('up');
  } else if (isLibraryOpen()) {
    navigateLibraryModal('up');
  } else if (isHubActive()) {
    exitGameHub();
    const activeTile = document.querySelector('.ps5-tile.active') || document.querySelector('.ps5-tile');
    activeTile?.focus();
  } else {
    ps5Audio.playNavTick();
    const activeTab = document.querySelector('.ps5-nav-tabs .ps5-tab.active') || document.getElementById('tab-games');
    activeTab?.focus();
  }
}

function handleButtonCross() {
  if (hasActiveOverlay()) {
    const modal = getActiveModalElement();
    const active = document.activeElement;
    if (active && modal && modal.contains(active)) {
      if (typeof active.click === 'function') {
        active.click();
        return;
      }
    }
    const focused = modal?.querySelector('button:focus, [tabindex="0"]:focus, input:focus, .clickable:focus');
    if (focused) focused.click();
    return;
  }

  if (isLibraryOpen()) {
    const modal = document.getElementById('ps5-library-modal');
    const active = document.activeElement;
    if (active && modal && modal.contains(active)) {
      const card = active.closest('.lib-card');
      if (card) {
        const playBtn = card.querySelector('.lib-btn-play');
        const dlBtn = card.querySelector('.lib-btn-download');
        if (playBtn) {
          playBtn.click();
          return;
        }
        if (dlBtn) {
          dlBtn.click();
          return;
        }
        const gameId = card.getAttribute('data-game-id');
        if (gameId && window.ps5LaunchFromLib) {
          window.ps5LaunchFromLib(gameId);
          return;
        }
      }
      if (typeof active.click === 'function') {
        active.click();
        return;
      }
    }
    const focused = modal?.querySelector('button:focus, .lib-card:focus');
    if (focused) focused.click();
    return;
  }

  if (isRunning()) {
    const runningModal = document.getElementById('ps5-running-game-modal');
    if (runningModal && runningModal.classList.contains('active')) {
      const active = document.activeElement;
      if (active && (active.id === 'btn-exit-game' || active.id === 'btn-resume-game')) {
        active.click();
        return;
      }
    }
    document.getElementById('btn-resume-game')?.click();
    return;
  }

  if (isControlCenterOpen()) {
    const active = document.activeElement;
    if (active && typeof active.click === 'function') {
      active.click();
      return;
    }
    const activeCC = document.querySelector('.cc-dock-icon:focus, .cc-card:focus, .cc-btn-primary:focus, .cc-btn-secondary:focus');
    if (activeCC) activeCC.click();
    return;
  }

  if (isHubActive()) {
    triggerActiveActivity();
    return;
  }

  handleItemSelect(getCurrentItem());
}

function handleButtonCircle() {
  if (isMediaAppOpen()) {
    closeMediaApp();
    return;
  }

  if (hasActiveOverlay()) {
    if (getActiveOverlayId() === 'ps5-settings-modal' && typeof isSettingsSubmenuActive === 'function' && isSettingsSubmenuActive()) {
      goBackSettings();
      return;
    }
    closeActiveOverlay();
    return;
  }

  if (isLibraryOpen()) {
    closeLibraryModal();
    return;
  }

  if (isRunning()) {
    exitGame();
    return;
  }

  if (isControlCenterOpen()) {
    closeControlCenter();
    return;
  }

  if (isHubActive()) {
    exitGameHub();
    return;
  }

  ps5Audio.playBackCancel();
}

function handleButtonSquare() {
  if (isLibraryOpen() || hasActiveOverlay() || isMediaAppOpen()) return;
  openOverlay('ps5-options-menu');
}

function handleButtonTriangle() {
  if (isLibraryOpen()) {
    closeLibraryModal();
    return;
  }
  if (hasActiveOverlay() || isMediaAppOpen()) return;
  openLibraryModal('all');
}

/* --------------------------------------------------------------------------
   Modal & Control Center Spatial Navigation
   -------------------------------------------------------------------------- */
function navigateControlCenter(dir) {
  const dockBtns = Array.from(document.querySelectorAll('#ps5-control-center .cc-dock-icon'));
  const cardBtns = Array.from(document.querySelectorAll('#ps5-control-center .cc-floating-cards button:not([disabled])'));

  const activeEl = document.activeElement;
  const isCardFocused = cardBtns.some(b => b === activeEl || b.contains(activeEl));
  const isDockFocused = dockBtns.some(b => b === activeEl || b.contains(activeEl));

  if (isCardFocused) {
    let idx = cardBtns.findIndex(b => b === activeEl || b.contains(activeEl));
    if (idx === -1) idx = 0;

    if (dir === 'down') {
      dockBtns[0]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    if (dir === 'left') {
      const nextIdx = (idx - 1 + cardBtns.length) % cardBtns.length;
      cardBtns[nextIdx]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    if (dir === 'right') {
      const nextIdx = (idx + 1) % cardBtns.length;
      cardBtns[nextIdx]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    return;
  }

  if (isDockFocused) {
    let idx = dockBtns.findIndex(b => b === activeEl || b.contains(activeEl));
    if (idx === -1) idx = 0;

    if (dir === 'up') {
      if (cardBtns.length > 0) {
        cardBtns[0]?.focus();
        ps5Audio.playNavTick();
      }
      return;
    }
    if (dir === 'left') {
      const nextIdx = (idx - 1 + dockBtns.length) % dockBtns.length;
      dockBtns[nextIdx]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    if (dir === 'right') {
      const nextIdx = (idx + 1) % dockBtns.length;
      dockBtns[nextIdx]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    return;
  }

  dockBtns[0]?.focus();
  ps5Audio.playNavTick();
}

function getActiveModalElement() {
  const overlayId = getActiveOverlayId();
  if (overlayId) {
    const el = document.getElementById(overlayId);
    if (el && el.classList.contains('active')) return el;
  }
  return document.querySelector('.ps5-modal-overlay.active');
}

function getModalFocusables(modal) {
  if (!modal) return [];
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex="0"]',
    '.settings-item.clickable',
    '.power-option-btn',
    '.btn-switcher-action',
    '.theme-card',
    '.opt-action-btn',
    '.store-item-card',
    '.explore-news-card'
  ].join(',');

  const all = Array.from(modal.querySelectorAll(selector));
  return all.filter(el => {
    return el.offsetParent !== null &&
           window.getComputedStyle(el).display !== 'none' &&
           window.getComputedStyle(el).visibility !== 'hidden';
  });
}

function navigateActiveOverlay(dir) {
  const modal = getActiveModalElement();
  if (!modal) return;

  const focusables = getModalFocusables(modal);
  if (!focusables.length) return;

  const currentIdx = focusables.findIndex(el => el === document.activeElement || el.contains(document.activeElement));

  if (currentIdx === -1) {
    focusables[0]?.focus();
    ps5Audio.playNavTick();
    return;
  }

  const currentRect = focusables[currentIdx].getBoundingClientRect();
  let bestIdx = -1;
  let bestDist = Infinity;

  for (let i = 0; i < focusables.length; i++) {
    if (i === currentIdx) continue;
    const r = focusables[i].getBoundingClientRect();
    const dx = (r.left + r.width / 2) - (currentRect.left + currentRect.width / 2);
    const dy = (r.top + r.height / 2) - (currentRect.top + currentRect.height / 2);

    let isValid = false;
    if (dir === 'down' && dy > 12) isValid = true;
    else if (dir === 'up' && dy < -12) isValid = true;
    else if (dir === 'right' && dx > 12) isValid = true;
    else if (dir === 'left' && dx < -12) isValid = true;

    if (isValid) {
      const dist = (dir === 'up' || dir === 'down')
        ? Math.abs(dy) + Math.abs(dx) * 1.4
        : Math.abs(dx) + Math.abs(dy) * 1.4;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
  }

  let nextIdx = bestIdx;
  if (nextIdx === -1) {
    if (dir === 'down' || dir === 'right') {
      nextIdx = (currentIdx + 1) % focusables.length;
    } else {
      nextIdx = (currentIdx - 1 + focusables.length) % focusables.length;
    }
  }

  const target = focusables[nextIdx];
  if (target) {
    target.focus();
    ps5Audio.playNavTick();
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function navigateLibraryModal(dir) {
  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  const tabs = Array.from(modal.querySelectorAll('.lib-tab'));
  const headerActions = Array.from(modal.querySelectorAll('#btn-sync-pc-games, #library-btn-close'));
  const cards = Array.from(modal.querySelectorAll('.lib-card'));

  const activeEl = document.activeElement;
  const isHeaderFocused = headerActions.some(h => h === activeEl || h.contains(activeEl));
  const isTabFocused = tabs.some(t => t === activeEl || t.contains(activeEl));
  const currentCard = activeEl ? activeEl.closest('.lib-card') : null;

  if (isHeaderFocused) {
    let idx = headerActions.indexOf(activeEl);
    if (idx === -1) idx = 0;
    if (dir === 'left' || dir === 'right') {
      const nextIdx = (idx + 1) % headerActions.length;
      headerActions[nextIdx]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    if (dir === 'down') {
      const activeTab = modal.querySelector('.lib-tab.active') || tabs[0];
      activeTab?.focus();
      ps5Audio.playNavTick();
      return;
    }
    return;
  }

  if (isTabFocused) {
    let idx = tabs.findIndex(t => t === activeEl || t.contains(activeEl));
    if (idx === -1) idx = 0;

    if (dir === 'left') {
      if (idx > 0) {
        tabs[idx - 1]?.click();
        tabs[idx - 1]?.focus();
        ps5Audio.playNavTick();
      }
      return;
    }
    if (dir === 'right') {
      if (idx < tabs.length - 1) {
        tabs[idx + 1]?.click();
        tabs[idx + 1]?.focus();
        ps5Audio.playNavTick();
      }
      return;
    }
    if (dir === 'up') {
      headerActions[0]?.focus();
      ps5Audio.playNavTick();
      return;
    }
    if (dir === 'down') {
      if (cards.length > 0) {
        cards[0]?.focus();
        ps5Audio.playNavTick();
        cards[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }
    return;
  }

  if (currentCard && cards.length > 0) {
    let idx = cards.indexOf(currentCard);
    if (idx === -1) idx = 0;

    const currentRect = currentCard.getBoundingClientRect();
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < cards.length; i++) {
      if (i === idx) continue;
      const r = cards[i].getBoundingClientRect();
      const dx = (r.left + r.width / 2) - (currentRect.left + currentRect.width / 2);
      const dy = (r.top + r.height / 2) - (currentRect.top + currentRect.height / 2);

      let isValid = false;
      if (dir === 'down' && dy > 20) isValid = true;
      else if (dir === 'up' && dy < -20) isValid = true;
      else if (dir === 'right' && dx > 20 && Math.abs(dy) < 50) isValid = true;
      else if (dir === 'left' && dx < -20 && Math.abs(dy) < 50) isValid = true;

      if (isValid) {
        const dist = (dir === 'up' || dir === 'down')
          ? Math.abs(dy) + Math.abs(dx) * 1.5
          : Math.abs(dx) + Math.abs(dy) * 1.5;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
    }

    if (bestIdx !== -1) {
      cards[bestIdx]?.focus();
      ps5Audio.playNavTick();
      cards[bestIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    if (dir === 'up') {
      const activeTab = modal.querySelector('.lib-tab.active') || tabs[0];
      activeTab?.focus();
      ps5Audio.playNavTick();
      return;
    }
    if (dir === 'left' && idx > 0) {
      cards[idx - 1]?.focus();
      ps5Audio.playNavTick();
      cards[idx - 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (dir === 'right' && idx < cards.length - 1) {
      cards[idx + 1]?.focus();
      ps5Audio.playNavTick();
      cards[idx + 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    return;
  }

  const activeTab = modal.querySelector('.lib-tab.active') || tabs[0];
  activeTab?.focus();
  ps5Audio.playNavTick();
}

/* --------------------------------------------------------------------------
   Keyboard Fallback
   -------------------------------------------------------------------------- */
function handleKeyboard(e) {
  if (isRestModeActive()) {
    e.preventDefault();
    exitRestMode();
    return;
  }

  if (isBootScreenActive()) {
    if (!['F11', 'F12', 'Escape'].includes(e.code)) {
      if (skipBootScreen()) {
        e.preventDefault();
        ps5Audio.playNavTick();
        return;
      }
    }
  }

  // If typing in search or input fields, do not intercept navigation keys
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    if (e.code === 'Escape') {
      document.activeElement.blur();
    }
    return;
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Home', 'End'].includes(e.code)) {
    e.preventDefault();
  }

  // Ctrl/Alt + Left/Right to quickly rearrange game cards
  if (e.ctrlKey || e.altKey) {
    if (e.code === 'ArrowLeft') {
      const item = getCurrentItem();
      if (item && !item.isExplore && !item.isStore && !item.isLibrary) {
        window.moveGameInOrder?.(item.id, 'left');
        return;
      }
    } else if (e.code === 'ArrowRight') {
      const item = getCurrentItem();
      if (item && !item.isExplore && !item.isStore && !item.isLibrary) {
        window.moveGameInOrder?.(item.id, 'right');
        return;
      }
    }
  }

  const keyLower = typeof e.key === 'string' ? e.key.toLowerCase() : '';
  let normalizedNav = '';
  if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft' || e.code === 'KeyA' || keyLower === 'a') {
    normalizedNav = 'left';
  } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight' || e.code === 'KeyD' || keyLower === 'd') {
    normalizedNav = 'right';
  } else if (e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.code === 'KeyW' || keyLower === 'w') {
    normalizedNav = 'up';
  } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown' || e.code === 'KeyS' || keyLower === 's') {
    normalizedNav = 'down';
  }

  // Smooth console navigation throttle: prevent rapid event queuing when keys are held down
  if (normalizedNav && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const now = Date.now();
    if (e.repeat && (now - lastKeyNavTime < 95)) {
      return;
    }
    lastKeyNavTime = now;

    if (normalizedNav === 'left') handleNavLeft();
    else if (normalizedNav === 'right') handleNavRight();
    else if (normalizedNav === 'up') handleNavUp();
    else if (normalizedNav === 'down') handleNavDown();

    if ((normalizedNav === 'left' || normalizedNav === 'right') &&
        !isControlCenterOpen() && !hasActiveOverlay() && !isLibraryOpen() && !isMediaAppOpen() && !isHubActive()) {
      document.querySelector('.ps5-tile.active')?.focus({ preventScroll: true });
    }
    return;
  }

  if (e.code === 'Home' && !hasActiveOverlay() && !isControlCenterOpen() && !isLibraryOpen() && !isMediaAppOpen()) {
    if (isHubActive()) exitGameHub();
    selectIndex(0);
    document.querySelector('.ps5-tile.active')?.focus({ preventScroll: true });
    return;
  }

  if (e.code === 'End' && !hasActiveOverlay() && !isControlCenterOpen() && !isLibraryOpen() && !isMediaAppOpen()) {
    if (isHubActive()) exitGameHub();
    const tiles = document.querySelectorAll('.ps5-tile');
    if (tiles.length > 0) selectIndex(tiles.length - 1);
    document.querySelector('.ps5-tile.active')?.focus({ preventScroll: true });
    return;
  }

  switch (e.code) {

    case 'Enter':
    case 'Space':
      handleButtonCross();
      break;

    case 'Escape':
    case 'Backspace':
      handleButtonCircle();
      break;

    case 'KeyP':
      toggleControlCenter();
      break;

    case 'KeyO':
      openOverlay('ps5-options-menu');
      break;

    case 'KeyF':
      handleButtonTriangle();
      break;

    case 'KeyL':
      if (isLibraryOpen()) closeLibraryModal();
      else openLibraryModal();
      break;

    case 'KeyM':
      const isMuted = ps5Audio.toggleMute();
      showPS5Notification(isMuted ? "🔇 UI Audio Muted" : "🔊 UI Audio Unmuted", "Press M to toggle");
      break;

    case 'Digit1':
    case 'KeyQ':
    case 'PageUp':
    case 'BracketLeft':
      if (isHubActive()) exitGameHub();
      switchTab('games');
      const activeGameTile = document.querySelector('.ps5-tile.active') || document.querySelector('.ps5-tile');
      activeGameTile?.focus();
      break;

    case 'Digit2':
    case 'KeyE':
    case 'PageDown':
    case 'BracketRight':
      if (isHubActive()) exitGameHub();
      switchTab('media');
      const activeMediaTile = document.querySelector('.ps5-tile.active') || document.querySelector('.ps5-tile');
      activeMediaTile?.focus();
      break;
  }
}

/* --------------------------------------------------------------------------
   Haptic Rumble & HUD UI
   -------------------------------------------------------------------------- */
function triggerHapticRumble(strongMag, weakMag, duration) {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of gamepads) {
    if (gp?.vibrationActuator) {
      try {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: duration,
          weakMagnitude: weakMag,
          strongMagnitude: strongMag
        });
      } catch (err) {}
    }
  }

  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(duration / 2);
    } catch (e) {}
  }
}

function updateControllerStatusUI(name, isConnected) {
  const badge = document.getElementById('controller-status-badge');
  const label = document.getElementById('controller-status-label');
  const dot = document.getElementById('controller-status-dot');

  if (badge && label && dot) {
    label.textContent = name;
    dot.style.background = isConnected ? '#10b981' : '#64748b';
    badge.title = isConnected ? `${name} Active • Analog Controls & Vibration Ready` : 'Connect a USB / Bluetooth Gamepad';
  }
}

function highlightGamepadHUD(buttons) {
  if (!hudElements) {
    hudElements = {
      cross: document.getElementById('hud-btn-cross'),
      circle: document.getElementById('hud-btn-circle'),
      square: document.getElementById('hud-btn-square'),
      triangle: document.getElementById('hud-btn-triangle')
    };
  }

  for (const key of ['cross', 'circle', 'square', 'triangle']) {
    const isDown = !!buttons[key];
    if (isDown !== lastHudStates[key]) {
      lastHudStates[key] = isDown;
      const el = hudElements[key];
      if (el) {
        if (isDown) el.classList.add('pressed');
        else el.classList.remove('pressed');
      }
    }
  }
}

function getNotificationIconSvg(title = '', subtitle = '') {
  const combined = (title + ' ' + subtitle).toLowerCase();
  if (combined.includes('trophy') || combined.includes('platinum') || combined.includes('gold')) {
    return `
      <div class="ps5-toast-icon-wrap toast-icon-gold">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 4h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v2a5 5 0 0 0 4.54 4.97A6 6 0 0 0 11 17.91V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.09a6 6 0 0 0 4.46-3.94A5 5 0 0 0 22 9V7a3 3 0 0 0-3-3zM4 9V7a1 1 0 0 1 1-1h2v4.82A3 3 0 0 1 4 9zm16 0a3 3 0 0 1-3 1.82V6h2a1 1 0 0 1 1 1z"/>
        </svg>
      </div>`;
  }
  if (combined.includes('download') || combined.includes('update') || combined.includes('install')) {
    return `
      <div class="ps5-toast-icon-wrap toast-icon-cyan">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>`;
  }
  if (combined.includes('audio') || combined.includes('mute') || combined.includes('sound')) {
    return `
      <div class="ps5-toast-icon-wrap toast-icon-purple">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </div>`;
  }
  if (combined.includes('party') || combined.includes('friend') || combined.includes('voice') || combined.includes('game base')) {
    return `
      <div class="ps5-toast-icon-wrap toast-icon-purple">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>`;
  }
  return `
    <div class="ps5-toast-icon-wrap toast-icon-blue">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="3"/>
        <line x1="6" y1="12" x2="10" y2="12"/>
        <line x1="8" y1="10" x2="8" y2="14"/>
        <circle cx="15" cy="11" r="1"/>
        <circle cx="17" cy="13" r="1"/>
      </svg>
    </div>`;
}

function showPS5Notification(title, subtitle) {
  let settings = { allowPopups: true, showPreview: true, playSound: true, displayTime: 'Standard (5s)' };
  try {
    if (typeof getNotificationSettings === 'function') {
      settings = getNotificationSettings();
    }
  } catch (e) {}

  if (settings.allowPopups === false) {
    return; // User disabled pop-up notifications
  }

  const lowerTitle = (title || '').toLowerCase();
  const lowerSub = (subtitle || '').toLowerCase();

  if (settings.doNotDisturb && !lowerTitle.includes('do not disturb')) {
    return; // Do Not Disturb is active
  }

  if ((lowerTitle.includes('trophy') || (title && title.includes('🏆'))) && settings.trophiesNotify === false) {
    return;
  }
  if (lowerTitle.includes('download') && settings.downloadsNotify === false) {
    return;
  }
  if ((lowerTitle.includes('friend') || lowerSub.includes('online')) && settings.whenFriendsOnline === false) {
    return;
  }
  if ((lowerTitle.includes('message') || lowerTitle.includes('party')) && settings.messagesNotify === false) {
    return;
  }
  if (lowerTitle.includes('invite') && settings.gameInvitesNotify === false) {
    return;
  }

  let toast = document.getElementById('ps5-notification-banner');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ps5-notification-banner';
    toast.className = 'ps5-notification-banner';
    document.body.appendChild(toast);
  }

  const cleanTitle = (title || '').replace(/^[\p{Emoji}\s]+/u, '').trim() || title;
  const iconMarkup = getNotificationIconSvg(title, subtitle);

  const displaySubtitle = settings.showPreview === false 
    ? 'Notification details hidden' 
    : (subtitle || '');

  toast.innerHTML = `
    <div class="ps5-toast-inner">
      ${iconMarkup}
      <div class="ps5-toast-text">
        <div class="ps5-toast-title">${cleanTitle}</div>
        <div class="ps5-toast-subtitle">${displaySubtitle}</div>
      </div>
      <div class="ps5-toast-prompt">
        <span class="ps5-glyph glyph-ps">PS</span>
      </div>
    </div>
  `;

  if (settings.playSound) {
    try {
      if (title && (title.includes('🏆') || title.toLowerCase().includes('trophy'))) {
        ps5Audio.playTrophyChime?.() || ps5Audio.playSelectChime();
      } else {
        ps5Audio.playNotificationChime?.() || ps5Audio.playSelectChime();
      }
    } catch (e) {}
  }

  // Calculate banner duration from displayTime setting
  let durationMs = 5000;
  if (settings.displayTime) {
    if (settings.displayTime.includes('3s') || settings.displayTime.toLowerCase().includes('short')) {
      durationMs = 3000;
    } else if (settings.displayTime.includes('8s') || settings.displayTime.toLowerCase().includes('long')) {
      durationMs = 8000;
    }
  }

  toast.classList.add('show');
  if (window._ps5ToastTimeout) clearTimeout(window._ps5ToastTimeout);
  window._ps5ToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, durationMs);
}

function setupVirtualGamepadButtons() {
  document.querySelectorAll('[data-virtual-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRestModeActive()) {
        exitRestMode();
        return;
      }
      const action = btn.getAttribute('data-virtual-btn');
      switch (action) {
        case 'cross': handleButtonCross(); break;
        case 'circle': handleButtonCircle(); break;
        case 'square': handleButtonSquare(); break;
        case 'triangle': handleButtonTriangle(); break;
        case 'left': handleNavLeft(); break;
        case 'right': handleNavRight(); break;
        case 'up': handleNavUp(); break;
        case 'down': handleNavDown(); break;
        case 'ps': toggleControlCenter(); break;
      }
    });
  });
}
