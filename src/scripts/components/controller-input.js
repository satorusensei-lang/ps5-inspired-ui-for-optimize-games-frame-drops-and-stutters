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
  enterGameHub,
  exitGameHub,
  isHubActive,
  triggerActiveActivity,
  handleItemSelect
} from './carousel.js';

import { isRunning, exitGame } from './game-launcher.js';
import { isControlCenterOpen, toggleControlCenter, closeControlCenter } from './control-center.js';
import { hasActiveOverlay, closeActiveOverlay, openOverlay } from './overlays.js';
import { ps5Audio } from '../audio/ps5-audio.js';
import { isMediaAppOpen, closeMediaApp } from './media-launcher.js';
import { isRestModeActive, exitRestMode } from './boot-screen.js';

let gamepadPollInterval = null;
let lastButtonStates = {};
let lastStickTime = 0;
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
        showPS5Notification(`🎮 ${connectedControllerName}`, "DualSense Haptics & Analog Sticks Active • 4K 60FPS");
        triggerHapticRumble(0.4, 0.2, 100);
      } else {
        showPS5Notification("🎮 Controller Connected", "Press any button on your DualSense, Xbox or PC controller to pair, or use Arrow Keys + Enter.");
      }
    });
  }
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
  showPS5Notification(`🎮 ${name} connected`, "Battery: 100% • Haptic Feedback Ready");
  triggerHapticRumble(0.6, 0.4, 250);
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
    if (now - lastStickTime > 130) {
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

  // Button 3: Triangle △ (Search)
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
  if (isControlCenterOpen()) {
    navigateControlCenter('left');
  } else {
    navigateCarousel('left');
  }
}

function handleNavRight() {
  if (isControlCenterOpen()) {
    navigateControlCenter('right');
  } else {
    navigateCarousel('right');
  }
}

function handleNavDown() {
  if (isRunning() || isControlCenterOpen() || isLibraryOpen() || hasActiveOverlay()) return;

  if (!isHubActive()) {
    enterGameHub();
  }
}

function handleNavUp() {
  if (isRunning() || isControlCenterOpen() || isLibraryOpen() || hasActiveOverlay()) return;

  if (isHubActive()) {
    exitGameHub();
  }
}

function handleButtonCross() {
  if (hasActiveOverlay()) {
    const focused = document.querySelector('.ps5-modal-overlay.active button:focus, .ps5-options-menu.active button:focus');
    if (focused) focused.click();
    return;
  }

  if (isLibraryOpen()) {
    const focused = document.querySelector('#ps5-library-modal button:focus');
    if (focused) focused.click();
    return;
  }

  if (isRunning()) {
    document.getElementById('btn-resume-game')?.click();
    return;
  }

  if (isControlCenterOpen()) {
    const activeCC = document.querySelector('.cc-dock-icon:focus, .cc-card:focus, .cc-btn-primary:focus');
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
  if (isLibraryOpen() || hasActiveOverlay() || isMediaAppOpen()) return;
  showPS5Notification("🔍 PlayStation Search", "Search Games, Media, Add-ons & Friends");
}

function navigateControlCenter(dir) {
  const btns = Array.from(document.querySelectorAll('#ps5-control-center button'));
  let focusedIdx = btns.findIndex(b => document.activeElement === b);
  if (focusedIdx === -1) focusedIdx = 0;

  if (dir === 'left') {
    focusedIdx = (focusedIdx - 1 + btns.length) % btns.length;
  } else {
    focusedIdx = (focusedIdx + 1) % btns.length;
  }

  btns[focusedIdx]?.focus();
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

  // If typing in search or input fields, do not intercept navigation keys
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    if (e.code === 'Escape') {
      document.activeElement.blur();
    }
    return;
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    e.preventDefault();
  }

  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      handleNavLeft();
      break;

    case 'ArrowRight':
    case 'KeyD':
      handleNavRight();
      break;

    case 'ArrowUp':
    case 'KeyW':
      handleNavUp();
      break;

    case 'ArrowDown':
    case 'KeyS':
      handleNavDown();
      break;

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

    case 'KeyL':
      if (isLibraryOpen()) closeLibraryModal();
      else openLibraryModal();
      break;

    case 'KeyM':
      const isMuted = ps5Audio.toggleMute();
      showPS5Notification(isMuted ? "🔇 UI Audio Muted" : "🔊 UI Audio Unmuted", "Press M to toggle");
      break;

    case 'Digit1':
      switchTab('games');
      break;

    case 'Digit2':
      switchTab('media');
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
    badge.title = isConnected ? `${name} Active • DualSense Haptics Ready` : 'Connect a USB / Bluetooth Gamepad';
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

function showPS5Notification(title, subtitle) {
  let toast = document.getElementById('ps5-notification-banner');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ps5-notification-banner';
    toast.className = 'ps5-notification-banner';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="font-size: 1.4rem;">🎮</div>
      <div>
        <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">${title}</div>
        <div style="font-size: 0.8rem; color: #94a3b8;">${subtitle}</div>
      </div>
    </div>
  `;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
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
