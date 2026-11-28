/* ==========================================================================
   PlayStation 5 Authentic Live Boot Opening Animations (Multi-Theme Edition)
   - 5 Authentic Official Themes:
     1. Cosmos Gold (Standard PS5 Launch Aurora & Stardust)
     2. PlayStation 30th Anniversary (1994 Retro Multi-Color & Sacred Symbols)
     3. Cosmic Cobalt (DualSense Signature Blue LED & Sapphire Aurora)
     4. Marvel's Spider-Man 2 Limited Edition (Symbiote Crimson & Ember Sparks)
     5. Astro Bot Cosmic Showcase (Playful Neon Cyan, Gold & Sparkling Stars)
   - 60FPS Procedural Canvas Engine with Dynamic Waves & Stardust Particles
   - Web Audio Theme-Specific Harmonic Synthesis
   - Standby Rest Mode Continuous Rendering
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { isSetupCompleted, showSetupScreen, setSetupCompleted } from './profile-manager.js';
import { closeControlCenter } from './control-center.js';

export const PS5_BOOT_THEMES = {
  'cosmos-gold': {
    id: 'cosmos-gold',
    name: 'Cosmos Gold (Standard PS5)',
    subtitle: 'Official launch golden-amber aurora & floating cosmic stardust',
    accentColor: '#f59e0b',
    badgeText: 'Official Standard',
    ribbons: [
      { baseAmp: 42, secAmp: 22, freq: 0.0024, secFreq: 0.0052, speed: 1.1, colorStart: 'rgba(255, 215, 110, 0)', colorMid: 'rgba(255, 225, 150, 0.32)', colorEnd: 'rgba(235, 175, 60, 0)', ribbonWidth: 64, phaseOffset: 0 },
      { baseAmp: 55, secAmp: 28, freq: 0.0021, secFreq: 0.0044, speed: 1.35, colorStart: 'rgba(255, 235, 170, 0)', colorMid: 'rgba(255, 245, 205, 0.48)', colorEnd: 'rgba(240, 190, 80, 0)', ribbonWidth: 48, phaseOffset: 1.8 },
      { baseAmp: 34, secAmp: 18, freq: 0.0031, secFreq: 0.0062, speed: 0.95, colorStart: 'rgba(255, 255, 255, 0)', colorMid: 'rgba(255, 250, 235, 0.62)', colorEnd: 'rgba(255, 220, 130, 0)', ribbonWidth: 28, phaseOffset: 3.4 },
      { baseAmp: 68, secAmp: 36, freq: 0.0018, secFreq: 0.0038, speed: 1.5, colorStart: 'rgba(230, 160, 45, 0)', colorMid: 'rgba(255, 195, 75, 0.22)', colorEnd: 'rgba(200, 130, 30, 0)', ribbonWidth: 80, phaseOffset: 4.8 }
    ],
    bgRadial: [
      { stop: 0, color: 'rgba(38, 28, 12, 0.48)' },
      { stop: 0.35, color: 'rgba(18, 14, 28, 0.32)' },
      { stop: 0.7, color: 'rgba(5, 5, 8, 0.78)' },
      { stop: 1, color: '#000000' }
    ],
    particleColors: ['255, 222, 140', '255, 245, 200', '255, 255, 255'],
    logoShadow: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 42px rgba(255, 215, 120, 0.65)) drop-shadow(0 0 85px rgba(230, 160, 40, 0.35))',
    logoSvgType: 'standard'
  },
  'anniversary-retro': {
    id: 'anniversary-retro',
    name: 'PlayStation 30th Anniversary',
    subtitle: '1994 multi-color spectrum & floating ✕ ○ □ △ sacred symbols',
    accentColor: '#006fcd',
    badgeText: 'Limited Heritage',
    ribbons: [
      { baseAmp: 46, secAmp: 24, freq: 0.0022, secFreq: 0.0048, speed: 1.15, colorStart: 'rgba(0, 111, 205, 0)', colorMid: 'rgba(0, 172, 159, 0.45)', colorEnd: 'rgba(243, 195, 0, 0)', ribbonWidth: 60, phaseOffset: 0 },
      { baseAmp: 58, secAmp: 26, freq: 0.0025, secFreq: 0.0050, speed: 1.3, colorStart: 'rgba(223, 0, 36, 0)', colorMid: 'rgba(243, 195, 0, 0.52)', colorEnd: 'rgba(0, 172, 159, 0)', ribbonWidth: 50, phaseOffset: 1.6 },
      { baseAmp: 38, secAmp: 20, freq: 0.0030, secFreq: 0.0060, speed: 0.9, colorStart: 'rgba(255, 255, 255, 0)', colorMid: 'rgba(0, 111, 205, 0.58)', colorEnd: 'rgba(223, 0, 36, 0)', ribbonWidth: 32, phaseOffset: 3.2 },
      { baseAmp: 64, secAmp: 32, freq: 0.0019, secFreq: 0.0039, speed: 1.45, colorStart: 'rgba(243, 195, 0, 0)', colorMid: 'rgba(223, 0, 36, 0.35)', colorEnd: 'rgba(0, 111, 205, 0)', ribbonWidth: 72, phaseOffset: 4.6 }
    ],
    bgRadial: [
      { stop: 0, color: 'rgba(0, 35, 75, 0.48)' },
      { stop: 0.35, color: 'rgba(30, 10, 45, 0.36)' },
      { stop: 0.7, color: 'rgba(5, 5, 12, 0.82)' },
      { stop: 1, color: '#000000' }
    ],
    particleColors: ['223, 0, 36', '243, 195, 0', '0, 172, 159', '0, 111, 205', '255, 255, 255'],
    logoShadow: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 45px rgba(0, 111, 205, 0.7)) drop-shadow(0 0 80px rgba(223, 0, 36, 0.4))',
    logoSvgType: 'retro-colored',
    drawSymbols: true
  },
  'playstation-blue': {
    id: 'playstation-blue',
    name: 'Cosmic Cobalt (DualSense Blue)',
    subtitle: 'Signature electric sapphire aurora & luminous cyan stardust',
    accentColor: '#3b82f6',
    badgeText: 'DualSense Edition',
    ribbons: [
      { baseAmp: 44, secAmp: 22, freq: 0.0023, secFreq: 0.0049, speed: 1.1, colorStart: 'rgba(37, 99, 235, 0)', colorMid: 'rgba(56, 189, 248, 0.42)', colorEnd: 'rgba(29, 78, 216, 0)', ribbonWidth: 62, phaseOffset: 0 },
      { baseAmp: 56, secAmp: 28, freq: 0.0020, secFreq: 0.0042, speed: 1.35, colorStart: 'rgba(59, 130, 246, 0)', colorMid: 'rgba(147, 197, 253, 0.55)', colorEnd: 'rgba(30, 64, 175, 0)', ribbonWidth: 46, phaseOffset: 1.9 },
      { baseAmp: 36, secAmp: 18, freq: 0.0032, secFreq: 0.0064, speed: 0.95, colorStart: 'rgba(255, 255, 255, 0)', colorMid: 'rgba(96, 165, 250, 0.65)', colorEnd: 'rgba(56, 189, 248, 0)', ribbonWidth: 30, phaseOffset: 3.5 },
      { baseAmp: 66, secAmp: 34, freq: 0.0018, secFreq: 0.0037, speed: 1.5, colorStart: 'rgba(30, 58, 138, 0)', colorMid: 'rgba(59, 130, 246, 0.3)', colorEnd: 'rgba(29, 78, 216, 0)', ribbonWidth: 76, phaseOffset: 4.7 }
    ],
    bgRadial: [
      { stop: 0, color: 'rgba(10, 30, 75, 0.52)' },
      { stop: 0.35, color: 'rgba(8, 18, 45, 0.38)' },
      { stop: 0.7, color: 'rgba(3, 7, 18, 0.82)' },
      { stop: 1, color: '#000000' }
    ],
    particleColors: ['56, 189, 248', '96, 165, 250', '191, 219, 254', '255, 255, 255'],
    logoShadow: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 45px rgba(59, 130, 246, 0.75)) drop-shadow(0 0 90px rgba(37, 99, 235, 0.45))',
    logoSvgType: 'standard'
  },
  'spiderman-symbiote': {
    id: 'spiderman-symbiote',
    name: "Marvel's Spider-Man 2 Limited Edition",
    subtitle: 'Symbiote obsidian & fiery crimson tendril ribbons with ember sparks',
    accentColor: '#ef4444',
    badgeText: 'Limited Console',
    ribbons: [
      { baseAmp: 48, secAmp: 25, freq: 0.0026, secFreq: 0.0055, speed: 1.25, colorStart: 'rgba(239, 68, 68, 0)', colorMid: 'rgba(248, 113, 113, 0.45)', colorEnd: 'rgba(185, 28, 28, 0)', ribbonWidth: 64, phaseOffset: 0 },
      { baseAmp: 60, secAmp: 30, freq: 0.0022, secFreq: 0.0046, speed: 1.45, colorStart: 'rgba(153, 27, 27, 0)', colorMid: 'rgba(252, 165, 165, 0.52)', colorEnd: 'rgba(220, 38, 38, 0)', ribbonWidth: 50, phaseOffset: 1.7 },
      { baseAmp: 36, secAmp: 18, freq: 0.0033, secFreq: 0.0066, speed: 1.05, colorStart: 'rgba(255, 255, 255, 0)', colorMid: 'rgba(239, 68, 68, 0.65)', colorEnd: 'rgba(185, 28, 28, 0)', ribbonWidth: 32, phaseOffset: 3.3 },
      { baseAmp: 70, secAmp: 36, freq: 0.0019, secFreq: 0.0040, speed: 1.6, colorStart: 'rgba(127, 29, 29, 0)', colorMid: 'rgba(239, 68, 68, 0.28)', colorEnd: 'rgba(69, 10, 10, 0)', ribbonWidth: 80, phaseOffset: 4.9 }
    ],
    bgRadial: [
      { stop: 0, color: 'rgba(65, 10, 15, 0.52)' },
      { stop: 0.35, color: 'rgba(32, 5, 8, 0.38)' },
      { stop: 0.7, color: 'rgba(10, 2, 4, 0.82)' },
      { stop: 1, color: '#000000' }
    ],
    particleColors: ['248, 113, 113', '239, 68, 68', '254, 202, 202', '255, 255, 255'],
    logoShadow: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 45px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 90px rgba(185, 28, 28, 0.5))',
    logoSvgType: 'standard'
  },
  'astro-bot': {
    id: 'astro-bot',
    name: 'Astro Bot Cosmic Showcase',
    subtitle: 'Playful neon cyan, golden solar waves & sparkling diamond stardust',
    accentColor: '#06b6d4',
    badgeText: 'GOTY Showcase',
    ribbons: [
      { baseAmp: 44, secAmp: 22, freq: 0.0024, secFreq: 0.0050, speed: 1.2, colorStart: 'rgba(6, 182, 212, 0)', colorMid: 'rgba(103, 232, 249, 0.45)', colorEnd: 'rgba(245, 158, 11, 0)', ribbonWidth: 60, phaseOffset: 0 },
      { baseAmp: 56, secAmp: 28, freq: 0.0021, secFreq: 0.0043, speed: 1.4, colorStart: 'rgba(245, 158, 11, 0)', colorMid: 'rgba(253, 230, 138, 0.52)', colorEnd: 'rgba(236, 72, 153, 0)', ribbonWidth: 48, phaseOffset: 1.8 },
      { baseAmp: 36, secAmp: 18, freq: 0.0031, secFreq: 0.0062, speed: 1.0, colorStart: 'rgba(255, 255, 255, 0)', colorMid: 'rgba(244, 114, 182, 0.62)', colorEnd: 'rgba(6, 182, 212, 0)', ribbonWidth: 30, phaseOffset: 3.4 },
      { baseAmp: 68, secAmp: 34, freq: 0.0018, secFreq: 0.0038, speed: 1.55, colorStart: 'rgba(236, 72, 153, 0)', colorMid: 'rgba(6, 182, 212, 0.3)', colorEnd: 'rgba(245, 158, 11, 0)', ribbonWidth: 76, phaseOffset: 4.8 }
    ],
    bgRadial: [
      { stop: 0, color: 'rgba(10, 35, 55, 0.48)' },
      { stop: 0.35, color: 'rgba(25, 10, 42, 0.32)' },
      { stop: 0.7, color: 'rgba(4, 8, 18, 0.8)' },
      { stop: 1, color: '#000000' }
    ],
    particleColors: ['103, 232, 249', '253, 230, 138', '244, 114, 182', '255, 255, 255'],
    logoShadow: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 45px rgba(6, 182, 212, 0.75)) drop-shadow(0 0 85px rgba(245, 158, 11, 0.45))',
    logoSvgType: 'standard'
  }
};

let currentThemeId = localStorage.getItem('ps5_boot_theme') || 'cosmos-gold';
let isBootFinished = false;
let isRestMode = false;
let isPreviewing = false;
let animationFrameId = null;
let restModeEnterTime = 0;
let bootStartTime = 0;
let triggerBootAudioFn = null;

export function isBootScreenActive() {
  if (typeof document !== 'undefined') {
    const bootScreen = document.getElementById('ps5-boot-screen');
    if (bootScreen && bootScreen.classList.contains('hidden')) {
      if (!isRestMode && !isPreviewing) isBootFinished = true;
      return false;
    }
  }
  return (!isBootFinished && !isRestMode) || isPreviewing;
}

export function skipBootScreen() {
  const bootScreen = document.getElementById('ps5-boot-screen');
  if (!bootScreen) return false;

  if (isPreviewing) {
    isPreviewing = false;
    completeBoot(bootScreen);
    currentThemeId = localStorage.getItem('ps5_boot_theme') || 'cosmos-gold';
    applyThemeToBootElements(currentThemeId);
    return true;
  }

  if (!isBootFinished && !isRestMode) {
    if (Date.now() - bootStartTime >= 120) {
      if (typeof triggerBootAudioFn === 'function') triggerBootAudioFn();
      if (!isSetupCompleted()) {
        finishBootToSetup(bootScreen);
      } else {
        completeBoot(bootScreen);
      }
      return true;
    }
  }
  return false;
}

export function getActiveBootTheme() {
  return currentThemeId;
}

export function setActiveBootTheme(themeId) {
  if (PS5_BOOT_THEMES[themeId]) {
    currentThemeId = themeId;
    localStorage.setItem('ps5_boot_theme', themeId);
    applyThemeToBootElements(themeId);
    renderThemesGrid();
    return true;
  }
  return false;
}

export function previewBootTheme(themeId) {
  const previousTheme = currentThemeId;
  const targetTheme = PS5_BOOT_THEMES[themeId] ? themeId : 'cosmos-gold';
  
  currentThemeId = targetTheme;
  applyThemeToBootElements(targetTheme);

  const bootScreen = document.getElementById('ps5-boot-screen');
  const canvas = document.getElementById('ps5-boot-canvas');
  if (!bootScreen || !canvas) return;

  // Cleanly hide any open modals during preview
  document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));

  isPreviewing = true;
  isBootFinished = false;
  isRestMode = false;
  bootScreen.classList.remove('hidden', 'fade-out', 'rest-mode');

  try {
    ps5Audio.playBootChord(targetTheme);
  } catch (e) {}

  runPS5BootCanvas(canvas, true);

  // Auto dissolve after 3.2s preview duration
  setTimeout(() => {
    if (isPreviewing) {
      isPreviewing = false;
      completeBoot(bootScreen);
      // Restore selected user default theme
      currentThemeId = localStorage.getItem('ps5_boot_theme') || previousTheme;
      applyThemeToBootElements(currentThemeId);
    }
  }, 3200);
}

export function initBootScreen() {
  const bootScreen = document.getElementById('ps5-boot-screen');
  const canvas = document.getElementById('ps5-boot-canvas');

  if (!bootScreen) return;

  bootStartTime = Date.now();

  // Apply saved theme right away
  applyThemeToBootElements(currentThemeId);

  // In Rest Mode / Preview, tap or click anywhere on screen to wake/exit
  const handleRestWake = () => {
    if (isPreviewing) {
      skipBootScreen();
      return;
    }
    if (isRestMode && Date.now() - restModeEnterTime > 300) {
      exitRestMode();
    }
  };

  bootScreen.addEventListener('click', handleRestWake);
  bootScreen.addEventListener('pointerdown', handleRestWake);

  // 2. Play iconic PS5 Boot Chord immediately (or on first interaction if blocked by autoplay)
  let audioTriggered = false;
  const triggerAudio = () => {
    if (!audioTriggered) {
      audioTriggered = true;
      try {
        ps5Audio.playBootChord(currentThemeId);
      } catch (e) {}
    }
  };

  triggerBootAudioFn = triggerAudio;
  triggerAudio();

  const isFirstBoot = !isSetupCompleted();

  // Ensure first click/key unlocks audio context immediately and allows prompt skipping
  const cleanupUserUnlock = () => {
    window.removeEventListener('pointerdown', handleUserUnlock);
    window.removeEventListener('keydown', handleUserUnlock);
  };

  const handleUserUnlock = () => {
    triggerAudio();
    if (skipBootScreen()) {
      cleanupUserUnlock();
    }
  };

  window.addEventListener('pointerdown', handleUserUnlock, { passive: true });
  window.addEventListener('keydown', handleUserUnlock, { passive: true });

  const AUTO_DISSOLVE_MS = isFirstBoot ? 2200 : 2200; // Always 2.2s for cinematic boot feel
 
   // 3. Initialize Live Canvas Animation
   if (canvas) {
     runPS5BootCanvas(canvas);
   }

   // 4. Smooth automatic dissolve into either Setup Screen (First-Boot) or PS5 Dashboard
   setTimeout(() => {
     if (!isBootFinished && !isRestMode && !isPreviewing) {
       if (!isSetupCompleted()) {
         finishBootToSetup(bootScreen);
       } else {
         completeBoot(bootScreen);
       }
     }
   }, AUTO_DISSOLVE_MS);

   // Render Theme Selector Grid in Modal
   renderThemesGrid();
 }

 function finishBootToSetup(bootScreen) {
   if (isBootFinished || !bootScreen || isRestMode) return;
   isBootFinished = true;

   bootScreen.classList.add('fade-out');

   setTimeout(() => {
     bootScreen.classList.add('hidden');
     if (animationFrameId && !isRestMode && !isPreviewing) {
       cancelAnimationFrame(animationFrameId);
       animationFrameId = null;
     }
     showSetupScreen();
   }, 560);
 }

 function completeBoot(bootScreen) {
   if (isBootFinished || !bootScreen || isRestMode) return;
   isBootFinished = true;

   // Dissolve boot screen with smooth cinematic blur & scale fade
   bootScreen.classList.add('fade-out');

   setTimeout(() => {
     bootScreen.classList.add('hidden');
     if (animationFrameId && !isRestMode && !isPreviewing) {
       cancelAnimationFrame(animationFrameId);
       animationFrameId = null;
     }
     // Bug 3.4: Start ambient drone only after boot screen has completely dissolved
     try {
       ps5Audio.startAmbientDrone();
     } catch (e) {}
   }, 560);
 }

export function triggerFirstBootExperience() {
  const bootScreen = document.getElementById('ps5-boot-screen');
  const canvas = document.getElementById('ps5-boot-canvas');
  if (!bootScreen || !canvas) return;

  setSetupCompleted(false);
  isBootFinished = false;
  isRestMode = false;
  isPreviewing = false;

  bootScreen.classList.remove('hidden', 'fade-out', 'rest-mode');
  applyThemeToBootElements(currentThemeId);

  try {
    ps5Audio.playBootChord(currentThemeId);
  } catch (e) {}

  runPS5BootCanvas(canvas, true);

  setTimeout(() => {
    if (!isBootFinished && !isRestMode) {
      finishBootToSetup(bootScreen);
    }
  }, 2900);
}

/* ==========================================================================
   Rest Mode: Continuous Ambient Standby Animation
   ========================================================================== */
export function enterRestMode() {
  const bootScreen = document.getElementById('ps5-boot-screen');
  const canvas = document.getElementById('ps5-boot-canvas');

  if (!bootScreen) return;

  // Cleanly close any open overlays, modal popups, or control center dock
  document.querySelectorAll('.ps5-modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.getElementById('ps5-control-center')?.classList.remove('active', 'open');
  document.getElementById('ps5-library-modal')?.classList.remove('active');
  try {
    closeControlCenter();
  } catch (e) {}

  isRestMode = true;
  isBootFinished = false;
  isPreviewing = false;
  restModeEnterTime = Date.now();

  try {
    ps5Audio.playBootChord(currentThemeId);
  } catch (e) {}

  // Reveal boot screen in continuous rest mode
  bootScreen.classList.remove('hidden', 'fade-out');
  bootScreen.classList.add('rest-mode');

  // Ensure 60FPS fluid canvas loop is running continuously
  if (canvas) {
    runPS5BootCanvas(canvas, true);
  }
}

export function exitRestMode() {
  if (!isRestMode) return;
  isRestMode = false;
  isBootFinished = true;

  const bootScreen = document.getElementById('ps5-boot-screen');

  try {
    ps5Audio.playBootChord(currentThemeId);
  } catch (e) {}

  if (bootScreen) {
    bootScreen.classList.add('fade-out');

    setTimeout(() => {
      bootScreen.classList.add('hidden');
      bootScreen.classList.remove('rest-mode');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }, 850);
  }

  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: "PlayStation 5 Ready",
      subtitle: "Resumed from Rest Mode • Welcome back!"
    }
  }));
}

export function isRestModeActive() {
  if (typeof document !== 'undefined') {
    const bootScreen = document.getElementById('ps5-boot-screen');
    if (bootScreen && bootScreen.classList.contains('hidden')) {
      isRestMode = false;
      return false;
    }
  }
  return isRestMode;
}

/* ==========================================================================
   Theme Application & Custom Logo Styling
   ========================================================================== */
function applyThemeToBootElements(themeId) {
  const theme = PS5_BOOT_THEMES[themeId] || PS5_BOOT_THEMES['cosmos-gold'];
  const logoBox = document.querySelector('.ps5-boot-logo-box');
  const bootScreen = document.getElementById('ps5-boot-screen');

  if (bootScreen) {
    bootScreen.setAttribute('data-boot-theme', themeId);
  }

  if (logoBox) {
    if (theme.logoSvgType === 'retro-colored') {
      // Authentic 30th Anniversary Retro 4-Color PlayStation Emblem
      logoBox.innerHTML = `
        <svg class="ps5-boot-svg-logo retro" viewBox="0 0 24 24" width="112" height="90">
          <!-- P in Heritage Red -->
          <path fill="#df0024" d="M9.625 8.883v-3.86c0-.453-.083-.87-.508-.988c-.326-.105-.528.198-.528.65v9.664l-2.606-.827V2c1.108.206 2.722.692 3.59.985c2.207.757 2.955 1.7 2.955 3.825c0 2.071-1.278 2.856-2.903 2.072Z"/>
          <!-- Top S in Heritage Yellow -->
          <path fill="#f3c300" d="M15.858 11.451c-.313.395-1.079.676-1.079.676l-5.696 2.046v-1.509l4.192-1.493c.476-.17.549-.412.162-.538c-.386-.127-1.085-.09-1.56.08l-2.794.984v-1.566l.161-.054s.807-.286 1.942-.412c1.135-.125 2.525.017 3.616.43c1.23.39 1.368.962 1.056 1.356"/>
          <!-- Mid S in Heritage Teal-Green -->
          <path fill="#00ac9f" d="M5.876 13.977l-2.69.963c-.474.17-.547.411-.161.538c.386.126 1.085.09 1.56-.08l1.29-.469v1.356l-.257.043a8.45 8.45 0 0 1-4.018-.323C-.061 15.35-.271 14.61.304 14.184c.532-.394 1.436-.69 1.436-.69l3.737-1.33v1.515Z"/>
          <!-- Base S in Heritage Blue -->
          <path fill="#006fcd" d="M8.3 14.4l-2.4.86v1.32l2.4-.86z"/>
        </svg>
      `;
    } else {
      // Modern Pure Vector PlayStation Emblem
      logoBox.innerHTML = `
        <svg class="ps5-boot-svg-logo" viewBox="0 0 24 24" width="112" height="90" fill="#ffffff">
          <path d="M15.858 11.451c-.313.395-1.079.676-1.079.676l-5.696 2.046v-1.509l4.192-1.493c.476-.17.549-.412.162-.538c-.386-.127-1.085-.09-1.56.08l-2.794.984v-1.566l.161-.054s.807-.286 1.942-.412c1.135-.125 2.525.017 3.616.43c1.23.39 1.368.962 1.056 1.356M9.625 8.883v-3.86c0-.453-.083-.87-.508-.988c-.326-.105-.528.198-.528.65v9.664l-2.606-.827V2c1.108.206 2.722.692 3.59.985c2.207.757 2.955 1.7 2.955 3.825c0 2.071-1.278 2.856-2.903 2.072Zm-8.424 3.625C-.061 12.15-.271 11.41.304 10.984c.532-.394 1.436-.69 1.436-.69l3.737-1.33v1.515l-2.69.963c-.474.17-.547.411-.161.538c.386.126 1.085.09 1.56-.08l1.29-.469v1.356l-.257.043a8.45 8.45 0 0 1-4.018-.323Z"/>
        </svg>
      `;
    }

    const svgLogo = logoBox.querySelector('.ps5-boot-svg-logo');
    if (svgLogo) {
      svgLogo.style.filter = theme.logoShadow;
    }
  }

  regenerateParticles(theme);

  // Update Settings Tag if present
  const tagEl = document.getElementById('current-boot-theme-tag');
  if (tagEl) {
    tagEl.textContent = theme.name.split('(')[0].trim();
  }
}

function regenerateParticles(theme) {
  if (!canvasWidth || !canvasHeight) return;
  const PARTICLE_COUNT = 150;
  const colors = theme.particleColors || ['255, 222, 140', '255, 255, 255'];
  const symbols = theme.drawSymbols ? ['✕', '○', '□', '△', '•', '•'] : null;

  stardustParticles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    stardustParticles.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: Math.random() * 2.2 + 0.6,
      vx: Math.random() * 0.9 + 0.35,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.75 + 0.25,
      pulseSpeed: Math.random() * 0.035 + 0.015,
      pulsePhase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      symbol: symbols ? symbols[Math.floor(Math.random() * symbols.length)] : null
    });
  }
}

/* ==========================================================================
   PS5 Dynamic Wave Ribbons & Particle Canvas Engine
   ========================================================================== */
let canvasInitialized = false;
let canvasCtx = null;
let canvasWidth = 0;
let canvasHeight = 0;
let stardustParticles = [];
let animTime = 0;

function runPS5BootCanvas(canvas, forceRestart = false) {
  if (!canvas) return;

  if (!canvasInitialized) {
    canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    canvasWidth = canvas.width = window.innerWidth;
    canvasHeight = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      if (canvas) {
        canvasWidth = canvas.width = window.innerWidth;
        canvasHeight = canvas.height = window.innerHeight;
        regenerateParticles(PS5_BOOT_THEMES[currentThemeId] || PS5_BOOT_THEMES['cosmos-gold']);
      }
    });

    canvasInitialized = true;
  }

  const theme = PS5_BOOT_THEMES[currentThemeId] || PS5_BOOT_THEMES['cosmos-gold'];
  regenerateParticles(theme);

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function render() {
    if (isBootFinished && !isRestMode && !isPreviewing) {
      animationFrameId = null;
      return;
    }

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    animTime += prefersReducedMotion ? 0.003 : 0.016;
    const time = animTime;
    const ctx = canvasCtx;
    const width = canvasWidth;
    const height = canvasHeight;
    const particles = stardustParticles;
    const activeTheme = PS5_BOOT_THEMES[currentThemeId] || PS5_BOOT_THEMES['cosmos-gold'];

    ctx.clearRect(0, 0, width, height);

    // 1. Deep Radial Ambient Glow
    const bgRadial = ctx.createRadialGradient(
      width * 0.5, height * 0.52, 20,
      width * 0.5, height * 0.52, Math.max(width, height) * 0.65
    );
    (activeTheme.bgRadial || []).forEach(stop => {
      bgRadial.addColorStop(stop.stop, stop.color);
    });

    ctx.fillStyle = bgRadial;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 2. Multi-Harmonic Wave Ribbons
    const centerY = height * 0.51;
    const ribbonConfigs = activeTheme.ribbons || [];

    ribbonConfigs.forEach(cfg => {
      ctx.beginPath();

      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, cfg.colorStart);
      grad.addColorStop(0.2, cfg.colorStart);
      grad.addColorStop(0.48, cfg.colorMid);
      grad.addColorStop(0.72, cfg.colorMid);
      grad.addColorStop(1, cfg.colorEnd);

      // Top edge of ribbon
      const step = 8;
      for (let x = 0; x <= width; x += step) {
        const wave = 
          Math.sin(x * cfg.freq + time * cfg.speed + cfg.phaseOffset) * cfg.baseAmp +
          Math.cos(x * cfg.secFreq - time * (cfg.speed * 0.7) + cfg.phaseOffset) * cfg.secAmp;
        const y = centerY + wave - cfg.ribbonWidth * 0.5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Bottom edge of ribbon (reverse direction)
      for (let x = width; x >= 0; x -= step) {
        const wave = 
          Math.sin(x * cfg.freq + time * cfg.speed + cfg.phaseOffset) * cfg.baseAmp +
          Math.cos(x * cfg.secFreq - time * (cfg.speed * 0.7) + cfg.phaseOffset) * cfg.secAmp;
        const y = centerY + wave + cfg.ribbonWidth * 0.5;
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // 3. Stardust Glitter Particles & Floating Symbols
    particles.forEach(p => {
      p.x += prefersReducedMotion ? p.vx * 0.2 : p.vx;
      p.y += (prefersReducedMotion ? 0 : p.vy) + Math.sin(time * 2 + p.pulsePhase) * (prefersReducedMotion ? 0.05 : 0.25);

      // Wrap around edges
      if (p.x > width + 10) p.x = -10;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const currentAlpha = Math.max(0.08, p.alpha * (0.65 + 0.35 * Math.sin(time * 3 + p.pulsePhase)));

      if (p.symbol && p.symbol !== '•') {
        ctx.font = `bold ${Math.round(p.radius * 5.5 + 8)}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fillText(p.symbol, p.x, p.y);
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    ctx.restore();

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);
}

/* ==========================================================================
   Interactive Themes Selection UI Renderer
   ========================================================================== */
export function renderThemesGrid() {
  const container = document.getElementById('boot-themes-grid');
  if (!container) return;

  const currentActive = getActiveBootTheme();

  container.innerHTML = Object.values(PS5_BOOT_THEMES).map(t => {
    const isSelected = t.id === currentActive;
    return `
      <div class="boot-theme-card ${isSelected ? 'active' : ''}" data-theme-id="${t.id}">
        <div class="boot-theme-header">
          <div class="boot-theme-color-dot" style="background: ${t.accentColor}; box-shadow: 0 0 12px ${t.accentColor};"></div>
          <div class="boot-theme-badge">${t.badgeText}</div>
          ${isSelected ? '<span class="boot-theme-active-tag">Active Default</span>' : ''}
        </div>
        <h3 class="boot-theme-title">${t.name}</h3>
        <p class="boot-theme-desc">${t.subtitle}</p>
        <div class="boot-theme-actions">
          <button class="boot-theme-btn-preview" data-preview-theme="${t.id}" title="Watch live full screen">
            <span>▶ Preview Live</span>
          </button>
          <button class="boot-theme-btn-apply" data-set-theme="${t.id}">
            <span>${isSelected ? '✓ Selected' : 'Set as Default'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire buttons
  container.querySelectorAll('[data-preview-theme]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const themeId = btn.getAttribute('data-preview-theme');
      previewBootTheme(themeId);
    });
  });

  container.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const themeId = btn.getAttribute('data-set-theme');
      setActiveBootTheme(themeId);
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "Boot Animation Updated",
          subtitle: `${PS5_BOOT_THEMES[themeId].name} is now your default startup theme.`
        }
      }));
    });
  });
}
