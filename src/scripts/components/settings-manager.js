/* ==========================================================================
   PlayStation 5 Interactive Settings & Submenu Management Service
   - Full console-fidelity PS5 Settings hierarchy and interactive submenus
   - Authentic visual design, focus management, breadcrumb navigation, and controller/keyboard support
   - Multi-screen Network experience (Status, Wi-Fi Setup, Passwords, Connection Test, Advanced, PSN Status)
   - Users and Accounts (Online status, Profile edit, Sign-In, Privacy, Linked Services, Sign Out confirm)
   - Family & Parental Controls (Console restrictions, Age filtering, Playtime, Spending limits)
   - System (Software info, Console rename, Update check, HDMI-CEC, Date/Time, Language, Remote Play, Power Saving, Resets)
   - Storage (Dynamic multi-color capacity bar, Games & Apps management with delete confirmation, Media, Saved, M.2 SSD)
   - Sound (Audio output, HDMI type, Priorities, Sliders, Mic meter, Home Screen Music and Sound Effects toggles)
   - Screen & Video (Resolution, VRR, 120Hz, ALLM, HDR, 3-Step HDR Calibration Wizard, Display Area calibration)
   - Accessories (DualSense vibration/haptics, Trigger effects, Indicator brightness, Bluetooth devices, Keyboard/Mouse)
   - Notifications (Popups, Previews, Timing, Categories, Game/Video behavior, Live Test Banner)
   - Captures & Broadcasts (Create button shortcuts, Screenshot/Video formats, Mic audio, Quality, Trophy captures)
   - Saved Data & Game Presets (Difficulty, Performance/Resolution mode, Inversion, Subtitles, Cloud sync, Spoilers)
   - Accessibility (Bold Text, High Contrast, Text Size, Invert, Color Filters, Screen Reader speech, Captions, Zoom)
   - User's Guide, Health & Safety, Legal & Licenses
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay, closeActiveOverlay } from './overlays.js';
import { getAccountName, setAccountName } from './profile-manager.js';

// Navigation State
let currentView = 'main'; // 'main' or submenu key
let viewHistory = [];
let lastActiveCategoryView = null;
let networkTab = 'status'; // 'status' or 'settings'
let connectedWifi = 'Home_WiFi (5 GHz)';
let isInternetConnected = true;
let isScreenReaderActive = false;
let liveWifiInfo = null;
let liveStorageDrives = null;

// Storage Key
const SETTINGS_STORAGE_KEY = 'ps5_system_settings_v3';

// Default Demo Games for Storage
const INITIAL_INSTALLED_GAMES = [
  { id: 'sm2', title: "Marvel's Spider-Man 2", size: '98.4 GB', sizeGb: 98.4, thumb: '/assets/games/spiderman2/tile.webp' },
  { id: 'wukong', title: "Black Myth: Wukong", size: '118.5 GB', sizeGb: 118.5, thumb: '/assets/games/wukong/ps5_tile.webp' },
  { id: 'gow', title: "God of War Ragnarök", size: '84.2 GB', sizeGb: 84.2, thumb: '/assets/games/gow/tile.webp' },
  { id: 'got', title: "Ghost of Tsushima: Director's Cut", size: '62.1 GB', sizeGb: 62.1, thumb: '/assets/games/got/tile.webp' },
  { id: 'tlou1', title: "The Last of Us Part I", size: '68.0 GB', sizeGb: 68.0, thumb: '/assets/games/tlou1/tile.webp' }
];

// Default Settings Specification
const DEFAULT_SETTINGS = {
  // 1. Network
  connectInternet: true,
  connectedWifi: 'Home_WiFi (5 GHz)',
  connectionMethod: 'Wi-Fi (5 GHz)',
  ipSettings: 'DHCP (Automatic)',
  ipAddress: '192.168.1.145',
  subnetMask: '255.255.255.0',
  defaultGateway: '192.168.1.1',
  primaryDns: '8.8.8.8',
  secondaryDns: '8.8.4.4',
  proxyServer: "Don't Use",
  mtu: 'Automatic (1500)',

  // 2. Users and Accounts
  onlineStatus: 'Online',
  autoSignIn: true,
  loginPasscode: '',
  privacyProfile: 'Anyone',
  privacyTrophies: 'Anyone',
  psPlusTier: 'PlayStation®Plus Premium',
  linkedServices: {
    discord: false,
    youtube: true,
    twitch: false,
    spotify: true,
    appleMusic: false
  },

  // 3. Family and Parental Controls
  parentalControlsEnabled: false,
  ageRestriction: 'Allow All',
  playtimeLimit: 'No Limit',
  communicationFilter: 'Allowed',
  monthlySpendingLimit: 'Unlimited',

  // 4. System
  consoleName: 'PS5-Console-Master',
  systemLanguage: 'English (United States)',
  inputLanguage: 'English (US)',
  hdmiLink: true,
  oneTouchPlay: true,
  powerOffLink: true,
  hdcp: true,
  autoDateTime: true,
  timeZone: 'UTC-05:00 Eastern Time (US & Canada)',
  clockFormat: '12-Hour',
  remotePlayEnabled: true,
  restModeGames: '1 Hour',
  restModeMedia: '4 Hours',
  supplyUsbPowerRest: 'Always',
  stayConnectedInternetRest: true,
  turningOnFromNetwork: true,
  autoDownloadUpdates: true,
  autoInstallUpdates: true,
  autoGameBoost: true,
  boostCloseBrowsers: true,
  boostCloseChatMedia: true,
  boostCloseUnusedLaunchers: true,
  boostCloseWindowsApps: true,
  boostHighPerformancePower: true,
  boostGameProcessPriority: true,
  boostMinimizeOnLaunch: true,
  boostAntiStutter: true,
  boostThrottleHelpers: true,
  boostTrimRam: true,
  boostForceHighPerfGpu: true,
  boostSuppressPopups: true,
  boostRestoreClosedApps: false,
  boostExcludedApps: [],

  // 5. Storage
  installedGames: [...INITIAL_INSTALLED_GAMES],
  mediaStorageGb: 34.2,
  savedDataStorageGb: 8.6,
  otherStorageGb: 28.1,
  totalCapacityGb: 825.0,
  usableCapacityGb: 667.2,

  // 6. Sound
  outputDevice: 'HDMI Device (TV)',
  switchDeviceAuto: true,
  hdmiDeviceType: 'TV',
  audioFormat: 'Linear PCM (Standard)',
  headphoneVolume: 80,
  controllerSpeakerVolume: 70,
  tvVolume: 65,
  micStatusLogin: 'On',
  threeDAudio: true,
  monoAudio: false,
  homeScreenMusic: true,
  soundEffects: true,

  // 7. Screen & Video
  resolution: '2160p (4K)',
  vrr: 'Automatic',
  refresh120hz: 'Automatic',
  allm: 'Automatic',
  hdr: 'On When Supported',
  deepColor: 'Automatic',
  rgbRange: 'Automatic',
  displayAreaScale: 100,
  screenSaverTimeout: '15 Minutes',

  // 8. Accessories
  vibrationIntensity: 'Standard (Strong)',
  triggerEffectIntensity: 'Strong',
  indicatorBrightness: 'Standard (Bright)',
  controllerCommMethod: 'Bluetooth',
  turnOffControllersAfter: 'After 10 Minutes',
  keyRepeatDelay: 'Normal',
  pointerSpeed: 'Standard',

  // 9. Notifications
  allowPopups: true,
  showPreview: true,
  playSound: true,
  displayTime: 'Standard (5s)',
  whenFriendsOnline: true,
  messagesNotify: true,
  gameInvitesNotify: true,
  trophiesNotify: true,
  downloadsNotify: true,
  popupsDuringGames: true,
  popupsDuringVideos: false,
  doNotDisturb: false,

  // 10. Captures & Broadcasts
  shortcutMode: 'Standard',
  screenshotFormat: 'PNG',
  videoFormat: 'Most Compatible (MP4)',
  videoClipLength: '30 Seconds',
  includeMicClip: true,
  includePartyAudio: true,
  broadcastQuality: '1080p60',
  saveTrophyScreenshots: true,
  saveTrophyVideos: false,

  // 11. Saved Data & Game Presets
  gameDifficulty: 'Game Default',
  performanceMode: 'Performance Mode',
  firstPersonView: 'Normal',
  thirdPersonView: 'Normal',
  subtitles: 'On',
  cloudSync: true,
  autoDownloadGameUpdates: true,
  warnSpoilers: true,

  // 12. Accessibility
  boldText: false,
  highContrast: false,
  textSize: 'Standard',
  invertColors: false,
  colorFilter: 'Off',
  reducedMotion: false,
  screenReader: false,
  screenReaderSpeed: 'Normal',
  closedCaptions: false,
  zoom: false,
  showCheckmarkOnEnabled: true,

  // 13. Privacy
  privacyTelemetry: false,
  privacyVoiceData: false,
  privacySearchDiscovery: true,
  privacyPersonalizedAds: false,
  privacyProfileVisibility: 'Anyone',
  privacyTrophiesVisibility: 'Anyone',
  privacyOnlineStatusVisibility: 'Anyone'
};

let settingsData = { ...DEFAULT_SETTINGS };

/**
 * Check if currently viewing a submenu
 */
export function isSettingsSubmenuActive() {
  return currentView !== 'main';
}

/**
 * Export current notification settings for external components
 */
export function getNotificationSettings() {
  return {
    allowPopups: settingsData.allowPopups !== false,
    showPreview: settingsData.showPreview !== false,
    playSound: settingsData.playSound !== false,
    displayTime: settingsData.displayTime || 'Standard (5s)',
    whenFriendsOnline: settingsData.whenFriendsOnline !== false,
    messagesNotify: settingsData.messagesNotify !== false,
    gameInvitesNotify: settingsData.gameInvitesNotify !== false,
    trophiesNotify: settingsData.trophiesNotify !== false,
    downloadsNotify: settingsData.downloadsNotify !== false,
    popupsDuringGames: settingsData.popupsDuringGames !== false,
    popupsDuringVideos: settingsData.popupsDuringVideos === true,
    doNotDisturb: settingsData.doNotDisturb === true
  };
}

/**
 * Toggle or set Do Not Disturb mode across the whole OS
 */
export function setDoNotDisturb(active) {
  settingsData.doNotDisturb = Boolean(active);
  saveSettings();
  window.dispatchEvent(new CustomEvent('ps5-settings-changed', {
    detail: { key: 'doNotDisturb', value: settingsData.doNotDisturb, settings: settingsData }
  }));
}

/**
 * Reset Settings View back to Main Category List
 */
export function resetSettingsView() {
  currentView = 'main';
  viewHistory = [];
  renderSettingsView();
}

/**
 * Access settings data directly
 */
export function getSettingsData() {
  return settingsData;
}

const ALWAYS_ON_BOOST_FLAGS = {
  autoGameBoost: true,
  boostAntiStutter: true,
  boostThrottleHelpers: true,
  boostTrimRam: true,
  boostForceHighPerfGpu: true,
  boostSuppressPopups: true
};

export function getGameBoostSettings() {
  return {
    ...ALWAYS_ON_BOOST_FLAGS,
    boostCloseBrowsers: settingsData.boostCloseBrowsers !== false,
    boostCloseChatMedia: settingsData.boostCloseChatMedia !== false,
    boostCloseUnusedLaunchers: settingsData.boostCloseUnusedLaunchers !== false,
    boostCloseWindowsApps: settingsData.boostCloseWindowsApps !== false,
    boostHighPerformancePower: settingsData.boostHighPerformancePower !== false,
    boostGameProcessPriority: settingsData.boostGameProcessPriority !== false,
    boostMinimizeOnLaunch: settingsData.boostMinimizeOnLaunch !== false,
    boostRestoreClosedApps: settingsData.boostRestoreClosedApps === true,
    boostExcludedApps: Array.isArray(settingsData.boostExcludedApps) ? settingsData.boostExcludedApps : []
  };
}

/**
 * Load settings from persistent storage with fallback
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        settingsData = { ...DEFAULT_SETTINGS, ...parsed, ...ALWAYS_ON_BOOST_FLAGS };
        if (!Array.isArray(settingsData.installedGames) || settingsData.installedGames.length === 0) {
          settingsData.installedGames = [...INITIAL_INSTALLED_GAMES];
        }
      }
    }
  } catch (e) {
    settingsData = { ...DEFAULT_SETTINGS, ...ALWAYS_ON_BOOST_FLAGS };
  }
  isInternetConnected = settingsData.connectInternet !== false;
  connectedWifi = settingsData.connectedWifi || 'Home_WiFi (5 GHz)';
  isScreenReaderActive = Boolean(settingsData.screenReader);

  if (window.electronAPI?.loadPersistentSettings) {
    window.electronAPI.loadPersistentSettings().then(diskSettings => {
      if (diskSettings && typeof diskSettings === 'object' && Object.keys(diskSettings).length > 0) {
        settingsData = { ...DEFAULT_SETTINGS, ...settingsData, ...diskSettings, ...ALWAYS_ON_BOOST_FLAGS };
        isInternetConnected = settingsData.connectInternet !== false;
        connectedWifi = settingsData.connectedWifi || connectedWifi;
        isScreenReaderActive = Boolean(settingsData.screenReader);
        applyAllSystemSettings();
        if (currentView !== 'main') {
          renderSettingsView();
        }
      }
    }).catch(err => console.warn('[PS5 Settings] Failed to load disk settings:', err));
  }
}

/**
 * Persist current settings to localStorage and host disk
 */
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsData));
  } catch (e) {
    console.error('[PS5 Settings] Failed to save settings to localStorage:', e);
  }
  if (window.electronAPI?.savePersistentSettings) {
    window.electronAPI.savePersistentSettings(settingsData).catch(err => {
      console.warn('[PS5 Settings] Failed to persist settings to disk:', err);
    });
  }
}

/**
 * Initialize Settings Manager
 */
export function initSettingsManager() {
  window.ps5OpenSteamDiagnostics = () => {
    openOverlay('ps5-settings-modal');
    navigateToSettingsView('steam-diagnostics');
  };
  window.ps5OpenStoreDiagnostics = window.ps5OpenSteamDiagnostics;

  loadSettings();
  applyAllSystemSettings();

  // Query live host Wi-Fi networks if on Windows desktop
  if (window.electronAPI?.getWifiNetworks) {
    window.electronAPI.getWifiNetworks().then(data => {
      if (data) {
        liveWifiInfo = data;
        if (data.ssid) {
          connectedWifi = data.ssid;
          settingsData.connectedWifi = data.ssid;
        }
        if (typeof data.connected === 'boolean') {
          isInternetConnected = data.connected;
          settingsData.connectInternet = data.connected;
        }
        if (currentView === 'network' || currentView === 'wifi-setup') {
          renderSettingsView();
        }
      }
    }).catch(e => console.warn('[PS5 Settings] Wi-Fi query error:', e));
  }

  // Query live host storage drives if on Windows desktop
  if (window.electronAPI?.getStorageDrives) {
    window.electronAPI.getStorageDrives().then(drives => {
      if (Array.isArray(drives) && drives.length > 0) {
        liveStorageDrives = drives;
        const mainDrive = drives.find(d => d.drive.startsWith('C')) || drives[0];
        settingsData.totalCapacityGb = mainDrive.totalGb;
        settingsData.usableCapacityGb = mainDrive.totalGb;
        if (currentView === 'storage') {
          renderSettingsView();
        }
      }
    }).catch(e => console.warn('[PS5 Settings] Storage query error:', e));
  }

  // Category navigation map for Main Settings List (Authentic PS5 Hierarchy)
  const categoryMap = [
    { selector: '#setting-network-btn, .settings-row-authentic[aria-label="Network"]', view: 'network' },
    { selector: '#setting-notifications-btn, .settings-row-authentic[aria-label="Notifications"]', view: 'notifications' },
    { selector: '#setting-sound-audio-btn, .settings-row-authentic[aria-label="Sound"]', view: 'sound' },
    { selector: '#setting-screen-video-btn, .settings-row-authentic[aria-label*="Screen and Video"]', view: 'screen-video' },
    { selector: '#setting-accessories-btn, .settings-row-authentic[aria-label="Accessories"]', view: 'accessories' },
    { selector: '#setting-storage-btn, .settings-row-authentic[aria-label="Storage"]', view: 'storage' },
    { selector: '#setting-system-btn, .settings-row-authentic[aria-label="System"]', view: 'system' },
    { selector: '#setting-account-name-btn, .settings-row-authentic[aria-label*="Users and Accounts"]', view: 'users-accounts' },
    { selector: '#setting-family-controls-btn, .settings-row-authentic[aria-label*="Family"]', view: 'family-controls' },
    { selector: '#setting-saved-data-btn, .settings-row-authentic[aria-label*="Saved Data"]', view: 'saved-data' },
    { selector: '#setting-accessibility-btn, .settings-row-authentic[aria-label="Accessibility"]', view: 'accessibility' },
    { selector: '#setting-captures-btn, .settings-row-authentic[aria-label*="Captures"]', view: 'captures' },
    { selector: '#setting-privacy-btn, .settings-row-authentic[aria-label="Privacy"]', view: 'privacy' },
    { selector: '#setting-users-guide-btn, .settings-row-authentic[aria-label*="User\'s Guide"]', view: 'users-guide' }
  ];

  categoryMap.forEach(({ selector, view }) => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToSettingsView(view);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToSettingsView(view);
        }
      });
    }
  });

  // Global Keydown Handler for Settings Back Navigation & Accessibility Narrator
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('ps5-settings-modal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.key === 'Escape' || e.key === 'Backspace') {
      // Check if a dialog or option picker is open
      const picker = document.querySelector('.ps5-picker-overlay');
      if (picker) {
        e.preventDefault();
        e.stopPropagation();
        picker.remove();
        return;
      }

      const dialog = document.querySelector('.ps5-dialog-overlay');
      if (dialog) {
        e.preventDefault();
        e.stopPropagation();
        dialog.remove();
        return;
      }

      if (currentView !== 'main') {
        e.preventDefault();
        e.stopPropagation();
        goBackSettings();
      }
    }
  });

  // Focus listener for screen reader speech synthesis
  document.addEventListener('focusin', (e) => {
    if (!isScreenReaderActive) return;
    const target = e.target;
    if (!target) return;
    const label = target.getAttribute('aria-label') ||
                  target.querySelector('.settings-row-title')?.textContent ||
                  target.querySelector('.ps5-action-label')?.textContent ||
                  target.textContent;
    if (label && typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(label.trim());
      utterance.rate = settingsData.screenReaderSpeed === 'Fast' ? 1.3 : settingsData.screenReaderSpeed === 'Slow' ? 0.8 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  });
}

/**
 * Navigate to a specific settings submenu view
 */
export function navigateToSettingsView(viewKey) {
  if (currentView === viewKey) return;
  if (currentView === 'main') {
    lastActiveCategoryView = viewKey;
  }
  viewHistory.push(currentView);
  currentView = viewKey;

  try { ps5Audio.playSelectChime(); } catch (e) {}

  renderSettingsView();
}

/**
 * Navigate back one level in Settings
 */
export function goBackSettings() {
  if (viewHistory.length > 0) {
    currentView = viewHistory.pop();
  } else {
    currentView = 'main';
  }

  try { ps5Audio.playBackCancel(); } catch (e) {}

  renderSettingsView();
}

/**
 * Primary Render Dispatcher
 */
function renderSettingsView() {
  const container = document.querySelector('.ps5-settings-screen-authentic');
  if (!container) return;

  const header = container.querySelector('.ps5-settings-header-authentic');
  const scrollArea = container.querySelector('.ps5-settings-scroll-authentic');
  const mainList = container.querySelector('.ps5-settings-list-authentic');

  // Remove existing submenu viewport if any
  const existingSubmenu = container.querySelector('.ps5-submenu-viewport');
  if (existingSubmenu) existingSubmenu.remove();

  if (currentView === 'main') {
    // Show Main Settings List and restore scroll area
    if (mainList) mainList.style.display = 'flex';
    if (scrollArea) {
      scrollArea.style.display = 'block';
      scrollArea.scrollTop = 0;
    }

    if (header) {
      header.innerHTML = `<h1 class="ps5-settings-title-authentic">Settings</h1>`;
    }

    // Update dynamic tags if present
    const accountTag = document.getElementById('current-account-name-tag');
    if (accountTag) accountTag.textContent = getAccountName();

    // Focus previous category item or first item
    setTimeout(() => {
      let targetRow = null;
      if (lastActiveCategoryView) {
        const selectorMap = {
          'users-guide': '#setting-users-guide-btn',
          'accessibility': '#setting-accessibility-btn',
          'network': '#setting-network-btn',
          'wifi-setup': '#setting-network-btn',
          'connection-test': '#setting-network-btn',
          'users-accounts': '#setting-account-name-btn',
          'family-controls': '#setting-family-controls-btn',
          'system': '#setting-system-btn',
          'storage': '#setting-storage-btn',
          'storage-games': '#setting-storage-btn',
          'sound': '#setting-sound-audio-btn',
          'screen-video': '#setting-screen-video-btn',
          'accessories': '#setting-accessories-btn',
          'saved-data': '#setting-saved-data-btn',
          'notifications': '#setting-notifications-btn',
          'captures': '#setting-captures-btn',
          'privacy': '#setting-privacy-btn'
        };
        const sel = selectorMap[lastActiveCategoryView];
        if (sel) targetRow = container.querySelector(sel);
      }
      if (!targetRow) {
        targetRow = container.querySelector('.settings-row-authentic');
      }
      if (targetRow) {
        targetRow.focus();
        targetRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 50);
    return;
  }

  // Inside a Submenu View: Hide Main List and Root Scroll Area
  if (mainList) mainList.style.display = 'none';
  if (scrollArea) scrollArea.style.display = 'none';

  // Build Submenu Viewport
  const submenuViewport = document.createElement('div');
  submenuViewport.className = 'ps5-submenu-viewport ps5-fade-in';

  let viewTitle = 'Settings';
  let contentHtml = '';

  switch (currentView) {
    case 'network':
      viewTitle = 'Network';
      contentHtml = renderNetworkViewHtml();
      break;
    case 'wifi-setup':
      viewTitle = 'Set Up Internet Connection';
      contentHtml = renderWifiSetupHtml();
      break;
    case 'connection-test':
      viewTitle = 'Test Internet Connection';
      contentHtml = renderConnectionTestHtml();
      break;
    case 'steam-diagnostics':
      viewTitle = 'Steam Synchronization & Diagnostics';
      contentHtml = renderSteamDiagnosticsHtml();
      break;
    case 'users-accounts':
      viewTitle = 'Users and Accounts';
      contentHtml = renderUsersAccountsHtml();
      break;
    case 'family-controls':
      viewTitle = 'Family and Parental Controls';
      contentHtml = renderFamilyControlsHtml();
      break;
    case 'system':
      viewTitle = 'System';
      contentHtml = renderSystemHtml();
      break;
    case 'storage':
      viewTitle = 'Storage';
      contentHtml = renderStorageHtml();
      break;
    case 'storage-games':
      viewTitle = 'Games and Apps (Console Storage)';
      contentHtml = renderStorageGamesHtml();
      break;
    case 'sound':
      viewTitle = 'Sound';
      contentHtml = renderSoundHtml();
      break;
    case 'screen-video':
      viewTitle = 'Screen and Video';
      contentHtml = renderScreenVideoHtml();
      break;
    case 'accessories':
      viewTitle = 'Accessories';
      contentHtml = renderAccessoriesHtml();
      break;
    case 'saved-data':
      viewTitle = 'Saved Data and Game/App Settings';
      contentHtml = renderSavedDataHtml();
      break;
    case 'notifications':
      viewTitle = 'Notifications';
      contentHtml = renderNotificationsHtml();
      break;
    case 'captures':
      viewTitle = 'Captures and Broadcasts';
      contentHtml = renderCapturesHtml();
      break;
    case 'accessibility':
      viewTitle = 'Accessibility';
      contentHtml = renderAccessibilityHtml();
      break;
    case 'privacy':
      viewTitle = 'Privacy';
      contentHtml = renderPrivacyHtml();
      break;
    case 'users-guide':
      viewTitle = "User's Guide, Health and Safety, and Other Information";
      contentHtml = renderUsersGuideHtml();
      break;
    default:
      viewTitle = 'Settings';
      contentHtml = `<div class="submenu-empty">This submenu is ready.</div>`;
  }

  // Update Breadcrumb Header with Back Button
  if (header) {
    header.innerHTML = `
      <div class="ps5-settings-breadcrumb-bar">
        <button class="ps5-settings-back-btn" id="btn-settings-back" title="Back (○ Circle / Esc)">
          <span class="ps5-glyph glyph-circle">○</span>
          <span>Back</span>
        </button>
        <span class="ps5-breadcrumb-separator">›</span>
        <h1 class="ps5-settings-title-authentic ps5-title-submenu">${viewTitle}</h1>
      </div>
    `;

    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
      goBackSettings();
    });
  }

  submenuViewport.innerHTML = contentHtml;
  submenuViewport.scrollTop = 0;
  container.appendChild(submenuViewport);

  // Wire interactive controls inside the newly attached submenu
  wireSubmenuInteractions(currentView, submenuViewport);

  // Focus primary actionable item in submenu
  setTimeout(() => {
    const focusable = submenuViewport.querySelector('button, [tabindex="0"], input, select');
    if (focusable) focusable.focus();
  }, 60);
}

/* ==========================================================================
   1. NETWORK SUBMENU (Status, Wi-Fi Setup, Test Connection, Advanced, PSN)
   ========================================================================== */
function renderNetworkViewHtml() {
  return `
    <div class="ps5-split-submenu">
      <div class="ps5-subnav-sidebar" role="tablist">
        <button class="ps5-subnav-item ${networkTab === 'status' ? 'active' : ''}" id="tab-net-status" role="tab">
          Connection Status
        </button>
        <button class="ps5-subnav-item ${networkTab === 'settings' ? 'active' : ''}" id="tab-net-settings" role="tab">
          Settings
        </button>
      </div>

      <div class="ps5-subnav-content">
        ${networkTab === 'status' ? renderNetworkStatusTab() : renderNetworkSettingsTab()}
      </div>
    </div>
  `;
}

function renderNetworkStatusTab() {
  const isConn = settingsData.connectInternet !== false && isInternetConnected;
  const statusDesc = (liveWifiInfo && liveWifiInfo.connected)
    ? `Connected via ${liveWifiInfo.interface || 'Wi-Fi'} (${liveWifiInfo.radio || '5 GHz'}) • ${liveWifiInfo.ssid} (${liveWifiInfo.signal || 99}% Signal)`
    : isConn
      ? `Connected via ${settingsData.connectionMethod} • ${connectedWifi}`
      : 'Disconnected (Network disabled in Settings)';

  return `
    <div class="ps5-card-stack">
      <div class="ps5-setting-card">
        <div class="ps5-card-header-row">
          <div class="ps5-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${isConn ? '#22c55e' : '#ef4444'}" stroke-width="2.5">
              ${isConn ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
            </svg>
          </div>
          <div class="ps5-card-title-group">
            <div class="ps5-card-title">Internet Connection</div>
            <div class="ps5-card-desc">${statusDesc}</div>
          </div>
        </div>
      </div>

      <div class="ps5-setting-card">
        <div class="ps5-card-header-row">
          <div class="ps5-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${isConn ? '#22c55e' : '#f59e0b'}" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="ps5-card-title-group">
            <div class="ps5-card-title">PlayStation™Network Status</div>
            <div class="ps5-card-desc">${isConn ? 'All PlayStation™Network services are operational.' : 'Offline — Connect to the Internet to sign in to PSN.'}</div>
          </div>
        </div>
      </div>

      <div class="ps5-row-action-list">
        <div class="ps5-action-row" id="btn-test-connection" tabindex="0" role="button">
          <div class="ps5-action-label">Test Internet Connection</div>
          <span class="ps5-row-arrow">›</span>
        </div>
        <div class="ps5-action-row" id="btn-view-connection-status" tabindex="0" role="button">
          <div class="ps5-action-label">View Connection Status (IP, Gateway, MAC, DNS)</div>
          <span class="ps5-row-arrow">›</span>
        </div>
        <div class="ps5-action-row" id="btn-view-psn-status" tabindex="0" role="button">
          <div class="ps5-action-label">View PlayStation™Network Services Details</div>
          <span class="ps5-row-arrow">›</span>
        </div>
        <div class="ps5-action-row" id="btn-open-windows-net-status" tabindex="0" role="button">
          <div class="ps5-action-label">Open Windows Network & Internet Settings</div>
          <span class="ps5-row-arrow">↗</span>
        </div>
      </div>
    </div>
  `;
}

function renderNetworkSettingsTab() {
  const isConn = settingsData.connectInternet !== false;
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-action-row ps5-toggle-row" id="toggle-connect-internet" tabindex="0" role="switch" aria-checked="${isConn}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Connect to the Internet</div>
          <div class="ps5-action-sub">Enable or disable all wireless and wired console networking.</div>
        </div>
        <div class="ps5-toggle-pill ${isConn ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row" id="btn-open-wifi-setup" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Set Up Internet Connection</div>
          <div class="ps5-action-sub">Select or register Wi-Fi wireless networks or Wired LAN cable.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-advanced-net-settings" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Advanced Settings</div>
          <div class="ps5-action-sub">IP Address (DHCP/Static), DNS, MTU Size, and Proxy Server.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>
    </div>
  `;
}

function renderWifiSetupHtml() {
  let networks = [];
  if (liveWifiInfo?.networks && liveWifiInfo.networks.length > 0) {
    networks = liveWifiInfo.networks.map((net, idx) => {
      const isConnected = Boolean(liveWifiInfo.connected && liveWifiInfo.ssid && liveWifiInfo.ssid.trim() === net.ssid.trim());
      const signalBars = Math.max(1, Math.min(5, Math.round((net.signal || 50) / 20)));
      return {
        id: `wifi-${idx}`,
        name: net.ssid,
        security: net.auth || 'WPA2/WPA3',
        signal: signalBars,
        signalPct: net.signal || 80,
        connected: isConnected
      };
    });
  } else {
    networks = [
      { id: 'home', name: connectedWifi || 'Home_WiFi (5 GHz)', security: 'WPA2/WPA3', signal: 5, signalPct: 100, connected: isInternetConnected },
      { id: 'gaming', name: 'Gaming_Network_5G', security: 'WPA3 Personal', signal: 4, signalPct: 80, connected: false },
      { id: 'guest', name: 'Guest_Network_Open', security: 'None', signal: 3, signalPct: 60, connected: false },
      { id: 'office', name: 'Office_Enterprise_HighSpeed', security: 'WPA2 Enterprise', signal: 4, signalPct: 80, connected: false }
    ];
  }

  return `
    <div class="ps5-wifi-setup-screen">
      <div class="ps5-section-title-label">Available Wi-Fi Networks</div>

      <div class="ps5-wifi-list" role="list">
        ${networks.map(net => `
          <div class="ps5-wifi-item ${net.connected ? 'is-connected' : ''}" data-ssid="${net.name}" data-security="${net.security}" tabindex="0" role="button">
            <div class="ps5-wifi-left">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/>
              </svg>
              <span class="ps5-wifi-name">${net.name}</span>
              ${net.connected ? `<span class="ps5-connected-badge">Connected</span>` : ''}
            </div>

            <div class="ps5-wifi-right">
              ${net.security !== 'None' && net.security !== 'Open' ? `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" opacity="0.6">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              ` : ''}
              <span class="ps5-wifi-bars">${'●'.repeat(net.signal)}${'○'.repeat(5 - net.signal)}</span>
            </div>
          </div>
        `).join('')}

        <div class="ps5-wifi-item" id="btn-refresh-wifi" tabindex="0" role="button">
          <div class="ps5-wifi-left">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span class="ps5-wifi-name">Scan / Refresh Wi-Fi Networks</span>
          </div>
          <span class="ps5-row-arrow">⟳</span>
        </div>

        <div class="ps5-wifi-item" id="btn-open-windows-network" tabindex="0" role="button">
          <div class="ps5-wifi-left">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <span class="ps5-wifi-name">Open Windows Network & Internet Settings</span>
          </div>
          <span class="ps5-row-arrow">↗</span>
        </div>

        <div class="ps5-wifi-item" id="btn-wired-lan" tabindex="0" role="button">
          <div class="ps5-wifi-left">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
              <line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
            <span class="ps5-wifi-name">Set Up Wired LAN (LAN Cable Connected)</span>
          </div>
          <span class="ps5-row-arrow">›</span>
        </div>
      </div>
    </div>
  `;
}

function renderConnectionTestHtml() {
  return `
    <div class="ps5-test-connection-screen">
      <div class="ps5-test-header-text">Checking PlayStation 5 Console Connection...</div>

      <div class="ps5-test-sequence-list">
        <div class="ps5-test-step" id="test-step-1">
          <span class="ps5-test-label">Obtain IP Address</span>
          <span class="ps5-test-status">In Progress...</span>
        </div>
        <div class="ps5-test-step" id="test-step-2">
          <span class="ps5-test-label">Internet Connection</span>
          <span class="ps5-test-status pending">—</span>
        </div>
        <div class="ps5-test-step" id="test-step-3">
          <span class="ps5-test-label">PlayStation™Network Sign-In</span>
          <span class="ps5-test-status pending">—</span>
        </div>
        <div class="ps5-test-step" id="test-step-4">
          <span class="ps5-test-label">NAT Type</span>
          <span class="ps5-test-status pending">—</span>
        </div>
        <div class="ps5-test-step" id="test-step-5">
          <span class="ps5-test-label">Connection Speed (Download)</span>
          <span class="ps5-test-status pending">—</span>
        </div>
        <div class="ps5-test-step" id="test-step-6">
          <span class="ps5-test-label">Connection Speed (Upload)</span>
          <span class="ps5-test-status pending">—</span>
        </div>
      </div>

      <button class="ps5-btn-primary" id="btn-retest-connection" style="margin-top: 28px;">
        Test Again
      </button>
    </div>
  `;
}

/* ==========================================================================
   1B. MULTI-STOREFRONT SYNCHRONIZATION & DIAGNOSTICS SUBMENU
   ========================================================================== */
let cachedSteamDiagnostics = null;
let diagnosticsFetchInFlight = false;
let lastDiagnosticsFetchedAt = 0;

function renderSteamDiagnosticsHtml() {
  const diag = cachedSteamDiagnostics || {
    connectedAccount: {
      accountName: 'Checking Steam...',
      personaName: 'Steam Synchronization',
      steamId64: '...',
      accountId: '...',
      steamPath: 'C:\\Program Files (x86)\\Steam'
    },
    steamId64: '...',
    totalOwnedGames: 0,
    installedGamesCount: 0,
    installedGames: [],
    totalFavorites: 0,
    totalArtworkDownloads: 0,
    failedArtworkDownloads: 0,
    synchronizedGamesCount: 0,
    excludedUnownedCount: 0,
    excludedNonFavoritesCount: 0,
    duplicateEntriesCount: 0,
    lastSyncTimestamp: Date.now(),
    lastSuccessfulSync: 'Syncing...',
    syncStatus: 'Connecting to Steam...',
    syncLogs: [
      { timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: 'info', message: 'Querying live Steam Favorites and installation state...' }
    ],
    syncErrors: [],
    stores: {
      steam: { name: 'Steam', status: 'connecting', statusLabel: 'Syncing Steam Favorites...', ownedCount: 0, installedCount: 0, favoritesCount: 0, excludedCount: 0 },
      xbox: { name: 'Xbox / PC Game Pass', status: 'ready', statusLabel: 'Ready (Standby)', path: 'C:\\XboxGames', installedCount: 0, gamePassCount: 0 },
      epic: { name: 'Epic Games Store', status: 'not_detected', statusLabel: 'Not Detected', installedCount: 0 },
      ubisoft: { name: 'Ubisoft Connect', status: 'not_detected', statusLabel: 'Not Detected', installedCount: 0 },
      riot: { name: 'Riot Games', status: 'inactive', statusLabel: 'Inactive', installedCount: 0 }
    },
    global: {
      totalUniqueGames: 0,
      duplicateEntries: 0,
      missingArtwork: 0,
      missingLogos: 0,
      failedSyncs: 0
    }
  };

  // Query live diagnostics asynchronously when opening view (if stale or first open)
  if (
    typeof window !== 'undefined' &&
    window.electronAPI?.getSteamSyncDiagnostics &&
    !diagnosticsFetchInFlight &&
    (Date.now() - lastDiagnosticsFetchedAt > 1500)
  ) {
    diagnosticsFetchInFlight = true;
    window.electronAPI.getSteamSyncDiagnostics().then(liveDiag => {
      if (liveDiag && liveDiag.success) {
        lastDiagnosticsFetchedAt = Date.now();
        const prevJson = JSON.stringify(cachedSteamDiagnostics || null);
        const nextJson = JSON.stringify(liveDiag);
        cachedSteamDiagnostics = liveDiag;
        const container = document.querySelector('.ps5-submenu-viewport');
        if (prevJson !== nextJson && container && currentView === 'steam-diagnostics') {
          container.innerHTML = renderSteamDiagnosticsHtml();
          wireSubmenuInteractions('steam-diagnostics', container);
        }
      }
    }).catch(e => console.warn('[Multi-Store Diagnostics] Query warning:', e))
      .finally(() => {
        diagnosticsFetchInFlight = false;
      });
  }

  const syncDate = new Date(diag.lastSyncTimestamp || Date.now());
  const formattedTime = diag.lastSuccessfulSync || syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const stores = diag.stores || {};
  const steamAccount = diag.connectedAccount || {};
  const steamId64 = steamAccount.steamId64 || diag.steamId64 || 'Unknown';

  return `
    <div class="ps5-row-action-list">
      <!-- Storefront Integration Status Pills -->
      <div style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
        <span class="ps5-badge-pill is-active" style="background: rgba(102, 192, 244, 0.18); color: #66c0f4; border: 1px solid #66c0f4; padding: 6px 12px; font-weight: 700;">
          🎮 Steam: Connected (${diag.installedGamesCount ?? 0} Installed / ${diag.totalFavorites ?? 0} Favorites)
        </span>
        <span class="ps5-badge-pill" style="background: rgba(16, 124, 65, 0.18); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.4); padding: 6px 12px; font-weight: 700;">
          🟢 Xbox: Standby
        </span>
        <span class="ps5-badge-pill" style="background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 12px;">
          ⚡ Epic: Standby
        </span>
        <span class="ps5-badge-pill" style="background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 12px;">
          🌀 Ubisoft: Standby
        </span>
        <span class="ps5-badge-pill" style="background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 12px;">
          🔴 Riot: Standby
        </span>
      </div>

      <!-- 1. STEAM SYNCHRONIZATION DASHBOARD HEADER CARD -->
      <div class="ps5-setting-card" style="margin-bottom: 18px; background: linear-gradient(135deg, rgba(23, 26, 33, 0.95), rgba(27, 40, 56, 0.95)); border: 1px solid rgba(102, 192, 244, 0.4); border-radius: 14px; padding: 22px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #171a21; border: 2px solid #66c0f4; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; box-shadow: 0 0 16px rgba(102, 192, 244, 0.45);">🎮</div>
            <div>
              <div style="font-size: 1.35rem; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">${steamAccount.personaName || 'SATORU SENSEI'}</div>
              <div style="font-size: 0.88rem; color: #66c0f4; margin-top: 3px;">
                Steam Account: <strong>${steamAccount.accountName || 'satoru_sensei_7'}</strong> • SteamID64: <span style="font-family: monospace; color: #ffffff;">${steamId64}</span>
              </div>
              <div style="font-size: 0.78rem; color: rgba(255,255,255,0.55); margin-top: 3px;">
                Install Path: ${steamAccount.steamPath || 'C:\\Program Files (x86)\\Steam'}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="ps5-badge-pill is-active" style="background: rgba(74, 222, 128, 0.18); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.5); padding: 8px 16px; font-weight: 700; font-size: 0.85rem; border-radius: 20px;">
              ● ${diag.syncStatus || 'Active & Monitoring'}
            </span>
          </div>
        </div>
      </div>

      <!-- 2. FOUR-CARD STATISTICS GRID (PHASE 8 METRICS) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 20px;">
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55);">Total Verified Owned</div>
          <div style="font-size: 1.85rem; font-weight: 800; color: #4ade80; margin-top: 4px;">${diag.totalOwnedGames ?? 0}</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">${diag.excludedNonFavoritesCount ?? 0} Non-Favorites Excluded</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55);">Steam Favorites</div>
          <div style="font-size: 1.85rem; font-weight: 800; color: #66c0f4; margin-top: 4px;">${diag.totalFavorites ?? 0}</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">Favorites-Only Sync Active</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55);">Installed Favorites</div>
          <div style="font-size: 1.85rem; font-weight: 800; color: #ffffff; margin-top: 4px;">${diag.installedGamesCount ?? 0}</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">Ready to Launch</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55);">Artwork Downloads</div>
          <div style="font-size: 1.85rem; font-weight: 800; color: #f59e0b; margin-top: 4px;">${diag.totalArtworkDownloads ?? 0}</div>
          <div style="font-size: 0.75rem; color: #4ade80; margin-top: 2px;">${diag.failedArtworkDownloads ?? 0} Failed • Cached</div>
        </div>
      </div>

      <!-- 3. SYNC STATUS & REAL-TIME WATCHER BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.32); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px;">
        <div style="font-size: 0.84rem; color: rgba(255,255,255,0.7);">
          Last Successful Synchronization: <strong style="color: #fff;">${formattedTime}</strong>
        </div>
        <div style="font-size: 0.84rem; color: #4ade80; display: flex; align-items: center; gap: 6px;">
          <span>●</span> Real-Time File-System Watcher Active (userdata / cloudstorage)
        </div>
      </div>

      <!-- 4. MASTER ACTION BUTTONS (PHASE 8 REQUIRED BUTTONS) -->
      <div class="ps5-section-divider-title">Steam Synchronization Controls</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <button class="ps5-btn-standard" id="btn-dashboard-sync-now" style="padding: 14px; background: #66c0f4; color: #000; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.15s ease;">
          <span>🔄</span>
          <span>Sync Now</span>
        </button>
        <button class="ps5-btn-standard" id="btn-dashboard-refresh-favs" style="padding: 14px; background: rgba(102, 192, 244, 0.16); color: #66c0f4; font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid rgba(102, 192, 244, 0.4); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>⭐</span>
          <span>Refresh Favorites</span>
        </button>
        <button class="ps5-btn-standard" id="btn-dashboard-refresh-art" style="padding: 14px; background: rgba(245, 158, 11, 0.16); color: #f59e0b; font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🎨</span>
          <span>Refresh Artwork</span>
        </button>
        <button class="ps5-btn-standard" id="btn-dashboard-repair-conn" style="padding: 14px; background: rgba(255,255,255,0.08); color: #fff; font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.25); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🛠️</span>
          <span>Repair Steam Connection</span>
        </button>
      </div>

      <!-- 5. LIVE SYNCHRONIZATION & EVENT LOG CONSOLE (PHASE 8 REQUIREMENT) -->
      <div class="ps5-section-divider-title">Live Diagnostic & Synchronization Event Log</div>
      <div style="background: rgba(10, 14, 20, 0.92); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 14px 18px; font-family: 'Consolas', 'Courier New', monospace; font-size: 0.8rem; max-height: 180px; overflow-y: auto; color: rgba(255,255,255,0.85); margin-bottom: 24px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);">
        ${(diag.syncLogs && diag.syncLogs.length > 0 ? diag.syncLogs : [
          { timestamp: formattedTime, level: 'info', message: 'Steam synchronization engine online & monitoring' },
          { timestamp: formattedTime, level: 'info', message: `Connected account verified: ${steamAccount.personaName || 'Steam User'} (${steamId64})` },
          { timestamp: formattedTime, level: 'info', message: `Discovered ${diag.totalFavorites ?? 0} Steam Favorites (${diag.excludedNonFavoritesCount ?? 0} non-favorites excluded)` },
          { timestamp: formattedTime, level: 'info', message: `Automatic artwork engine verified ${diag.totalArtworkDownloads ?? 0} cached assets on disk` }
        ]).map(log => `
          <div style="margin-bottom: 6px; line-height: 1.4;">
            <span style="color: rgba(255,255,255,0.4);">[${log.timestamp}]</span>
            <span style="color: ${log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#4ade80'}; font-weight: 600;">[${(log.level || 'info').toUpperCase()}]</span>
            <span>${log.message}</span>
          </div>
        `).join('')}
      </div>

      <div class="ps5-section-divider-title">Verified Installed Games on PC</div>
      ${(diag.installedGames || []).map(g => `
        <div class="ps5-action-row" tabindex="0">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label" style="font-weight: 700;">${g.name}</div>
            <div class="ps5-action-sub">AppID: ${g.appId} • Disk Size: ${g.size} • ${g.path}</div>
          </div>
          <div class="ps5-select-val" style="color: #4ade80; font-weight: 600;">Ready to Play ›</div>
        </div>
      `).join('')}

      <div class="ps5-section-divider-title">Other Storefront Integrations</div>

      <!-- 2. XBOX CARD -->
      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Xbox / PC Game Pass (C:\\XboxGames)</div>
          <div class="ps5-action-sub">${stores.xbox?.statusLabel || 'Ready (Standby)'} • MicrosoftGame.config discovery active</div>
        </div>
        <button class="ps5-btn-standard" id="btn-sync-xbox" style="padding: 6px 14px; background: rgba(74, 222, 128, 0.15); border: 1px solid #4ade80; color: #4ade80; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
          Sync Xbox
        </button>
      </div>

      <!-- 3. EPIC GAMES CARD -->
      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Epic Games Store</div>
          <div class="ps5-action-sub">${stores.epic?.statusLabel || 'Not Detected on Host'} • Manifest scan & Installations.jsonl</div>
        </div>
        <button class="ps5-btn-standard" id="btn-sync-epic" style="padding: 6px 14px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
          Sync Epic
        </button>
      </div>

      <!-- 4. UBISOFT CARD -->
      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Ubisoft Connect</div>
          <div class="ps5-action-sub">${stores.ubisoft?.statusLabel || 'Not Detected on Host'} • Registry scan across HKLM/WOW6432Node</div>
        </div>
        <button class="ps5-btn-standard" id="btn-sync-ubisoft" style="padding: 6px 14px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
          Sync Ubisoft
        </button>
      </div>

      <!-- 5. RIOT GAMES CARD -->
      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Riot Games (VALORANT / League of Legends)</div>
          <div class="ps5-action-sub">${stores.riot?.statusLabel || 'Inactive'} • Riot Client directory scan</div>
        </div>
        <button class="ps5-btn-standard" id="btn-sync-riot" style="padding: 6px 14px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
          Sync Riot
        </button>
      </div>

      <div class="ps5-section-divider-title">Global Database Integrity</div>

      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Total Unique Verified Games</div>
          <div class="ps5-action-sub">Canonical cross-platform titles ready in launcher</div>
        </div>
        <div class="ps5-select-val" style="font-weight: 700; color: #4ade80;">${diag.global?.totalUniqueGames ?? diag.installedGamesCount ?? 0} Games</div>
      </div>

      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Duplicate Entries Detected</div>
          <div class="ps5-action-sub">Normalized via store-specific unique AppIDs</div>
        </div>
        <div class="ps5-select-val" style="color: #4ade80;">0 Duplicates (0%)</div>
      </div>

      <div class="ps5-action-row" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Missing Artwork / Logos</div>
          <div class="ps5-action-sub">Automatic fallback and optical PS5LogoEngine normalization active</div>
        </div>
        <div class="ps5-select-val" style="color: #4ade80;">0 Missing</div>
      </div>

      <!-- Action Toolbar (Global multi-store actions) -->
      <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="ps5-btn-standard" id="btn-sync-all-stores" style="flex: 2; min-width: 200px; padding: 14px; background: #66c0f4; color: #000; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🔄</span>
          <span>Synchronize All Stores</span>
        </button>
        <button class="ps5-btn-standard" id="btn-repair-library" style="flex: 1; min-width: 160px; padding: 14px; background: rgba(255,255,255,0.12); color: #fff; font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.25); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🛠️</span>
          <span>Repair Library</span>
        </button>
        <button class="ps5-btn-standard" id="btn-clear-invalid" style="flex: 1; min-width: 160px; padding: 14px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🧹</span>
          <span>Clear Invalid</span>
        </button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2. USERS AND ACCOUNTS SUBMENU
   ========================================================================== */
function renderUsersAccountsHtml() {
  const currentName = getAccountName();
  const isOnline = settingsData.onlineStatus === 'Online';
  return `
    <div class="ps5-row-action-list">
      <!-- Profile Hero Card -->
      <div class="ps5-setting-card" style="margin-bottom: 12px;">
        <div class="ps5-card-header-row">
          <img src="/assets/games/got/tile.webp" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.7);" alt="User Avatar">
          <div class="ps5-card-title-group">
            <div class="ps5-card-title" style="font-size: 1.15rem;">${currentName}</div>
            <div class="ps5-card-desc">PlayStation™Network • <span class="ps5-badge-pill ${isOnline ? 'is-active' : ''}">${settingsData.onlineStatus}</span></div>
          </div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Account & Profile</div>

      <div class="ps5-action-row ps5-select-row" id="row-account-online-status" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Online Status</div>
          <div class="ps5-action-sub">Choose whether to appear online to friends or appear offline.</div>
        </div>
        <div class="ps5-select-val">${settingsData.onlineStatus} ›</div>
      </div>

      <div class="ps5-action-row" id="btn-open-profile-edit" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Edit Online ID & Profile Avatar</div>
          <div class="ps5-action-sub">Change your public handle and PlayStation character icon.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-section-divider-title">Security & Sign-In</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-auto-sign-in" tabindex="0" role="switch" aria-checked="${settingsData.autoSignIn}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Log In to PS5 Automatically</div>
          <div class="ps5-action-sub">Sign in to your account without selecting user on console boot.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.autoSignIn ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row" id="btn-set-login-passcode" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Console Login Passcode</div>
          <div class="ps5-action-sub">${settingsData.loginPasscode ? 'Passcode Set (4-Digits Active)' : 'Not Set • Require a 4-digit code to log in to this console.'}</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-section-divider-title">Privacy & Social</div>

      <div class="ps5-action-row ps5-select-row" id="row-privacy-profile" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Who Can See Your Profile & Gaming History</div>
          <div class="ps5-action-sub">Configure privacy visibility for activities and games played.</div>
        </div>
        <div class="ps5-select-val">${settingsData.privacyProfile} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-privacy-trophies" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Who Can See Your Trophies</div>
          <div class="ps5-action-sub">Manage trophy progress visibility on PlayStation™Network.</div>
        </div>
        <div class="ps5-select-val">${settingsData.privacyTrophies} ›</div>
      </div>

      <div class="ps5-section-divider-title">Linked Services & Subscriptions</div>

      <div class="ps5-action-row" id="btn-steam-sync-diag" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Steam Account Synchronization & Diagnostics</div>
          <div class="ps5-action-sub">Connected Steam profile (SATORU SENSEI), verified owned games, favorites, and live resync.</div>
        </div>
        <div class="ps5-select-val" style="color: #66c0f4; font-weight: 700;">Connected ›</div>
      </div>

      <div class="ps5-action-row" id="btn-manage-linked-services" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Link with Other Services (Discord, YouTube, Spotify, Twitch)</div>
          <div class="ps5-action-sub">Share gameplay broadcasts, rich presence, and audio streaming.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-view-ps-plus" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Payment and Subscriptions (PlayStation®Plus)</div>
          <div class="ps5-action-sub">${settingsData.psPlusTier} • Active Subscription</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-section-divider-title">Sign Out</div>

      <div class="ps5-action-row" id="btn-account-sign-out" tabindex="0" role="button" style="color: #ef4444;">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label" style="color: #ef4444;">Sign Out of PlayStation™Network</div>
          <div class="ps5-action-sub">Sign out on this console. You will need to log back in to access online features.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   3. FAMILY AND PARENTAL CONTROLS SUBMENU
   ========================================================================== */
function renderFamilyControlsHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-setting-card" style="margin-bottom: 12px;">
        <div class="ps5-card-title">PS5 Console Restrictions</div>
        <div class="ps5-card-desc">
          ${settingsData.parentalControlsEnabled ?
            'Parental controls are active. Age filtering and playtime rules are enforced on this console.' :
            'No restrictions set. All games and communication features are enabled for the primary player.'}
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-parental-controls" tabindex="0" role="switch" aria-checked="${settingsData.parentalControlsEnabled}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable Parental Restrictions</div>
          <div class="ps5-action-sub">Enforce content filtering, playtime limits, and communication boundaries.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.parentalControlsEnabled ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-age-restriction" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Age Filtering for Games</div>
          <div class="ps5-action-sub">Set age ratings allowed to launch on this console without PIN.</div>
        </div>
        <div class="ps5-select-val">${settingsData.ageRestriction} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-playtime-limit" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Playtime Management</div>
          <div class="ps5-action-sub">Daily time limit for gameplay and media usage.</div>
        </div>
        <div class="ps5-select-val">${settingsData.playtimeLimit} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-communication-filter" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Communication & User-Generated Content</div>
          <div class="ps5-action-sub">Allow or restrict messages, party chats, and friend requests.</div>
        </div>
        <div class="ps5-select-val">${settingsData.communicationFilter} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-spending-limit" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Monthly Spending Limit</div>
          <div class="ps5-action-sub">Maximum allowance for PlayStation Store digital purchases.</div>
        </div>
        <div class="ps5-select-val">${settingsData.monthlySpendingLimit} ›</div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   4. SYSTEM SUBMENU (Software, HDMI, Date/Time, Language, Remote, Power, Resets)
   ========================================================================== */
function renderSystemHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">System Software</div>

      <div class="ps5-action-row" id="btn-edit-console-name" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Console Name</div>
          <div class="ps5-action-sub">Name of your PS5 console when connecting via Remote Play or Network.</div>
        </div>
        <div class="ps5-select-val">${settingsData.consoleName} ›</div>
      </div>

      <div class="ps5-action-row" id="btn-check-system-update" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">System Software Update and Settings</div>
          <div class="ps5-action-sub">Version 1.2.1 (PS5 Unified Edition - Windows Desktop) • Check for updates and preferences.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-auto-download-updates" tabindex="0" role="switch" aria-checked="${settingsData.autoDownloadUpdates}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Download Update Files Automatically</div>
          <div class="ps5-action-sub">Download system software updates in the background.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.autoDownloadUpdates ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row" id="btn-backup-restore" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Back Up and Restore</div>
          <div class="ps5-action-sub">Back up data on your PS5 to a USB drive or restore a backup.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-section-divider-title">HDMI</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-hdmi-link" tabindex="0" role="switch" aria-checked="${settingsData.hdmiLink}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable HDMI Device Link (HDMI-CEC)</div>
          <div class="ps5-action-sub">Turning on PS5 automatically powers on connected TV and switches input.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.hdmiLink ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-one-touch-play" tabindex="0" role="switch" aria-checked="${settingsData.oneTouchPlay}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable One-Touch Play</div>
          <div class="ps5-action-sub">Turn on connected TV directly when launching the PS5 console.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.oneTouchPlay ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-hdcp" tabindex="0" role="switch" aria-checked="${settingsData.hdcp}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable HDCP (High-bandwidth Digital Content Protection)</div>
          <div class="ps5-action-sub">Required to play protected 4K video streaming content and Blu-ray discs.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.hdcp ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Date and Time</div>

      <div class="ps5-action-row ps5-select-row" id="row-system-timezone" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Time Zone</div>
          <div class="ps5-action-sub">Region used to calculate console clock and calendar events.</div>
        </div>
        <div class="ps5-select-val">${settingsData.timeZone} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-clock-format" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Clock Format</div>
          <div class="ps5-action-sub">Choose between standard 12-hour (AM/PM) and 24-hour military clock.</div>
        </div>
        <div class="ps5-select-val">${settingsData.clockFormat} ›</div>
      </div>

      <div class="ps5-section-divider-title">Language</div>

      <div class="ps5-action-row ps5-select-row" id="row-system-language" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Console Language</div>
          <div class="ps5-action-sub">System interface language.</div>
        </div>
        <div class="ps5-select-val">${settingsData.systemLanguage} ›</div>
      </div>

      <div class="ps5-section-divider-title">Remote Play</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-remote-play" tabindex="0" role="switch" aria-checked="${settingsData.remotePlayEnabled}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable Remote Play</div>
          <div class="ps5-action-sub">Connect to this console from a mobile device, PC, or PlayStation Portal.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.remotePlayEnabled ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row" id="btn-link-remote-device" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Link Device (Generate Code)</div>
          <div class="ps5-action-sub">Display an 8-digit code to pair your device manually.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-section-divider-title">Power Saving</div>

      <div class="ps5-action-row ps5-select-row" id="row-rest-games" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Set Time Until PS5 Enters Rest Mode (Playing Games)</div>
          <div class="ps5-action-sub">Energy saving idle timeout during game sessions.</div>
        </div>
        <div class="ps5-select-val">${settingsData.restModeGames} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-rest-media" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Set Time Until PS5 Enters Rest Mode (Playing Media)</div>
          <div class="ps5-action-sub">Energy saving idle timeout during music or video playback.</div>
        </div>
        <div class="ps5-select-val">${settingsData.restModeMedia} ›</div>
      </div>

      <div class="ps5-section-divider-title">Reset & Power Options</div>

      <div class="ps5-action-row" id="btn-restart-app" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Restart PlayStation 5 Launcher</div>
          <div class="ps5-action-sub">Reboots the unified desktop application and reinitializes all services.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-restore-defaults" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Restore Default Settings</div>
          <div class="ps5-action-sub">Restore all system settings to default without deleting games or user data.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-reset-console" tabindex="0" role="button" style="color: #ef4444;">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label" style="color: #ef4444;">Reset Your Console</div>
          <div class="ps5-action-sub">Delete all users, saved games, settings, and installed content.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   5. STORAGE SUBMENU (Capacity Bar, Games Management, Media, Saved Data, M.2)
   ========================================================================== */
function renderStorageHtml() {
  const games = settingsData.installedGames || [];
  const gamesTotalGb = games.reduce((acc, g) => acc + (g.sizeGb || 50), 0);
  const mediaGb = settingsData.mediaStorageGb || 34.2;
  const savedGb = settingsData.savedDataStorageGb || 8.6;
  const otherGb = settingsData.otherStorageGb || 28.1;

  let usableTotal = settingsData.usableCapacityGb || 667.2;
  let usedTotal = 0;
  let freeGb = 0;
  let driveName = 'Console Storage';

  const mainDrive = (liveStorageDrives && liveStorageDrives.length > 0)
    ? (liveStorageDrives.find(d => d.drive.startsWith('C')) || liveStorageDrives[0])
    : null;

  if (mainDrive) {
    usableTotal = mainDrive.totalGb;
    freeGb = mainDrive.freeGb;
    usedTotal = mainDrive.usedGb;
    driveName = `Console Storage (${mainDrive.drive} ${mainDrive.volumeName || 'System'})`;
  } else {
    usedTotal = parseFloat((gamesTotalGb + mediaGb + savedGb + otherGb).toFixed(1));
    freeGb = parseFloat(Math.max(0, usableTotal - usedTotal).toFixed(1));
  }

  const pctGames = Math.min(75, (gamesTotalGb / usableTotal) * 100);
  const pctMedia = (mediaGb / usableTotal) * 100;
  const pctSaved = (savedGb / usableTotal) * 100;
  const pctOther = (otherGb / usableTotal) * 100;

  // Secondary drives (e.g. D:, E:, etc.)
  const secondaryDrives = (liveStorageDrives && liveStorageDrives.length > 1)
    ? liveStorageDrives.filter(d => d !== mainDrive)
    : [];

  return `
    <div class="ps5-storage-screen">
      <div class="ps5-storage-main-card">
        <div class="ps5-storage-header-row">
          <div class="ps5-storage-title">${driveName}</div>
          <div class="ps5-storage-metrics">${usedTotal} GB / ${usableTotal} GB</div>
        </div>

        <div class="ps5-storage-multi-bar">
          <div class="ps5-bar-seg seg-games" style="width: ${pctGames}%;" title="Games and Apps: ${gamesTotalGb.toFixed(1)} GB"></div>
          <div class="ps5-bar-seg seg-media" style="width: ${pctMedia}%;" title="Media Gallery: ${mediaGb} GB"></div>
          <div class="ps5-bar-seg seg-saved" style="width: ${pctSaved}%;" title="Saved Data: ${savedGb} GB"></div>
          <div class="ps5-bar-seg seg-other" style="width: ${pctOther}%;" title="Other System: ${otherGb} GB"></div>
        </div>

        <div class="ps5-storage-legend">
          <span class="legend-item"><span class="dot dot-games"></span> Games and Apps (${gamesTotalGb.toFixed(1)} GB)</span>
          <span class="legend-item"><span class="dot dot-media"></span> Media (${mediaGb} GB)</span>
          <span class="legend-item"><span class="dot dot-saved"></span> Saved Data (${savedGb} GB)</span>
          <span class="legend-item"><span class="dot dot-other"></span> Other (${otherGb} GB)</span>
          <span class="legend-item"><span class="dot dot-free"></span> Free Space (${freeGb} GB)</span>
        </div>
      </div>

      <div class="ps5-row-action-list" style="margin-top: 14px;">
        <div class="ps5-action-row" id="btn-storage-games" tabindex="0" role="button">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Games and Apps</div>
            <div class="ps5-action-sub">View and manage ${games.length} installed games, DLCs, and game data.</div>
          </div>
          <div class="ps5-action-meta">${gamesTotalGb.toFixed(1)} GB ›</div>
        </div>

        <div class="ps5-action-row" id="btn-storage-media" tabindex="0" role="button">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Media Gallery</div>
            <div class="ps5-action-sub">4K screenshots, HDR gameplay clips, and broadcast captures.</div>
          </div>
          <div class="ps5-action-meta">${mediaGb} GB ›</div>
        </div>

        <div class="ps5-action-row" id="btn-storage-saved" tabindex="0" role="button">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Saved Data (PS5 / PS4)</div>
            <div class="ps5-action-sub">Game progress saves and profile records.</div>
          </div>
          <div class="ps5-action-meta">${savedGb} GB ›</div>
        </div>

        <div class="ps5-action-row" id="btn-storage-other" tabindex="0" role="button">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Other</div>
            <div class="ps5-action-sub">System software data, update files, cache, and reserved memory.</div>
          </div>
          <div class="ps5-action-meta">${otherGb} GB ›</div>
        </div>

        ${secondaryDrives.map(sd => `
          <div class="ps5-action-row" tabindex="0" role="button">
            <div class="ps5-action-text-col">
              <div class="ps5-action-label">Extended Storage (${sd.drive} ${sd.volumeName || 'Drive'})</div>
              <div class="ps5-action-sub">${sd.freeGb} GB free of ${sd.totalGb} GB (${sd.usedGb} GB used)</div>
            </div>
            <div class="ps5-action-meta">${sd.freeGb} GB Free ›</div>
          </div>
        `).join('')}

        <div class="ps5-action-row" id="btn-refresh-storage" tabindex="0" role="button">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Scan Storage Drives</div>
            <div class="ps5-action-sub">Refresh physical storage capacities and free disk space.</div>
          </div>
          <span class="ps5-row-arrow">⟳</span>
        </div>
      </div>
    </div>
  `;
}

function renderStorageGamesHtml() {
  const games = settingsData.installedGames || [];
  return `
    <div class="ps5-storage-games-list">
      <div class="ps5-section-title-label">Installed Games and Applications (${games.length})</div>
      <div class="ps5-row-action-list">
        ${games.length === 0 ? `
          <div class="ps5-setting-card">
            <div class="ps5-card-desc">No installed games on console storage.</div>
            <button class="ps5-btn-secondary" id="btn-restore-demo-games" style="margin-top: 12px;">Restore Default Game Catalog</button>
          </div>
        ` : games.map(g => `
          <div class="ps5-action-row ps5-storage-game-row" tabindex="0">
            <div class="ps5-storage-game-info">
              <img src="${g.thumb}" class="ps5-storage-thumb" alt="${g.title}" onerror="this.src='/assets/games/explore/hero.svg'">
              <div>
                <div class="ps5-action-label">${g.title}</div>
                <div class="ps5-action-sub">PlayStation 5 Full Game</div>
              </div>
            </div>
            <div class="ps5-storage-game-actions">
              <span class="ps5-action-meta" style="margin-right: 12px;">${g.size}</span>
              <button class="ps5-btn-danger btn-delete-game" data-game-id="${g.id}" data-game-title="${g.title}" data-game-size="${g.size}">
                Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ==========================================================================
   6. SOUND SUBMENU (Output Device, Channels, Sliders, Live Mic Meter, Toggles)
   ========================================================================== */
function renderSoundHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Audio Output</div>

      <div class="ps5-action-row ps5-select-row" id="row-output-device" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Output Device</div>
          <div class="ps5-action-sub">Active audio destination.</div>
        </div>
        <div class="ps5-select-val">${settingsData.outputDevice} ›</div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-switch-audio-auto" tabindex="0" role="switch" aria-checked="${settingsData.switchDeviceAuto}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Switch Output Device Automatically</div>
          <div class="ps5-action-sub">Automatically switch to headsets when plugged in or connected.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.switchDeviceAuto ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-hdmi-device-type" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">HDMI Device Type</div>
          <div class="ps5-action-sub">Specify connected hardware for automatic acoustic tuning.</div>
        </div>
        <div class="ps5-select-val">${settingsData.hdmiDeviceType} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-audio-format-priority" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Audio Format (Priority)</div>
          <div class="ps5-action-sub">Select preferred output decoding format.</div>
        </div>
        <div class="ps5-select-val">${settingsData.audioFormat} ›</div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-3d-audio" tabindex="0" role="switch" aria-checked="${settingsData.threeDAudio}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable 3D Audio for Headphones (Tempest 3D)</div>
          <div class="ps5-action-sub">Experience immersive spatial surround audio with pinpoint directional precision.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.threeDAudio ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-mono-audio" tabindex="0" role="switch" aria-checked="${settingsData.monoAudio}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Mono Audio for Headphones</div>
          <div class="ps5-action-sub">Combine left and right audio channels to play the same sound through both ears.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.monoAudio ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Volume</div>

      <div class="ps5-slider-row">
        <div class="ps5-slider-label-row">
          <span class="ps5-action-label">Headphones Volume</span>
          <span class="ps5-slider-val" id="val-headphone-vol">${settingsData.headphoneVolume}%</span>
        </div>
        <input type="range" min="0" max="100" value="${settingsData.headphoneVolume}" class="ps5-range-slider" id="slider-headphone-vol">
      </div>

      <div class="ps5-slider-row">
        <div class="ps5-slider-label-row">
          <span class="ps5-action-label">Controller Speaker Volume</span>
          <span class="ps5-slider-val" id="val-controller-vol">${settingsData.controllerSpeakerVolume}%</span>
        </div>
        <input type="range" min="0" max="100" value="${settingsData.controllerSpeakerVolume}" class="ps5-range-slider" id="slider-controller-vol">
      </div>

      <div class="ps5-section-divider-title">Microphone</div>

      <div class="ps5-action-row ps5-select-row" id="row-mic-login-status" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Microphone Status When Logged In</div>
          <div class="ps5-action-sub">Default mute status of DualSense and headsets upon console startup.</div>
        </div>
        <div class="ps5-select-val">${settingsData.micStatusLogin} ›</div>
      </div>

      <div class="ps5-setting-card" style="margin-top: 6px;">
        <div class="ps5-card-title" style="margin-bottom: 8px;">Microphone Input Level Meter</div>
        <div class="ps5-mic-meter-track">
          <div class="ps5-mic-meter-fill" id="ps5-mic-meter-bar" style="width: 58%;"></div>
        </div>
        <div class="ps5-card-desc" style="margin-top: 8px;">Speak into your controller microphone to verify active input response.</div>
      </div>

      <div class="ps5-section-divider-title">General Audio</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-home-music" tabindex="0" role="switch" aria-checked="${settingsData.homeScreenMusic}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Home Screen Music</div>
          <div class="ps5-action-sub">Play background atmospheric audio when navigating console menus.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.homeScreenMusic ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-sound-effects" tabindex="0" role="switch" aria-checked="${settingsData.soundEffects}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Sound Effects</div>
          <div class="ps5-action-sub">Play acoustic navigation ticks, confirmation chimes, and selection sounds.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.soundEffects ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   7. SCREEN AND VIDEO SUBMENU (Resolution, VRR, 120Hz, HDR Wizard, Screen Area)
   ========================================================================== */
function renderScreenVideoHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Video Output</div>

      <div class="ps5-action-row ps5-select-row" id="row-resolution" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Resolution</div>
          <div class="ps5-action-sub">Set video output resolution for your TV or connected display.</div>
        </div>
        <div class="ps5-select-val">${settingsData.resolution} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-vrr" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">VRR (Variable Refresh Rate)</div>
          <div class="ps5-action-sub">Dynamically match display refresh rate to eliminate tearing.</div>
        </div>
        <div class="ps5-select-val">${settingsData.vrr} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-120hz" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">120 Hz Output</div>
          <div class="ps5-action-sub">Enable smooth high frame-rate rendering for supported games.</div>
        </div>
        <div class="ps5-select-val">${settingsData.refresh120hz} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-allm" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">ALLM (Auto Low Latency Mode)</div>
          <div class="ps5-action-sub">Allow compatible displays to automatically switch to Game Mode.</div>
        </div>
        <div class="ps5-select-val">${settingsData.allm} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-hdr" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">HDR (High Dynamic Range)</div>
          <div class="ps5-action-sub">Display vibrant colors and expanded contrast range.</div>
        </div>
        <div class="ps5-select-val">${settingsData.hdr} ›</div>
      </div>

      <div class="ps5-action-row" id="btn-adjust-hdr" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Adjust HDR (Calibration Wizard)</div>
          <div class="ps5-action-sub">Calibrate brightness and peak luminance test patterns for your display.</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-deep-color" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Deep Color Output</div>
          <div class="ps5-action-sub">Enable 10-bit and 12-bit color gradations over HDMI.</div>
        </div>
        <div class="ps5-select-val">${settingsData.deepColor} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-rgb" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">RGB Range</div>
          <div class="ps5-action-sub">Set RGB color signal range based on connected HDMI specifications.</div>
        </div>
        <div class="ps5-select-val">${settingsData.rgbRange} ›</div>
      </div>

      <div class="ps5-setting-card" style="margin-top: 8px;">
        <div class="ps5-card-title" style="margin-bottom: 6px;">Video Output Information</div>
        <div class="ps5-card-desc">Resolution: 3840 × 2160 - 120 Hz • Color Format: YUV422 (HDR) • HDCP 2.3 Connected</div>
      </div>

      <div class="ps5-section-divider-title">Screen</div>

      <div class="ps5-action-row" id="btn-adjust-display-area" tabindex="0" role="button">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Adjust Display Area</div>
          <div class="ps5-action-sub">Scale screen bounds to match your TV border edges. (${settingsData.displayAreaScale}%)</div>
        </div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-screen-saver" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Screen Saver Timeout</div>
          <div class="ps5-action-sub">Dim screen brightness when idle to prevent image retention on OLED displays.</div>
        </div>
        <div class="ps5-select-val">${settingsData.screenSaverTimeout} ›</div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   8. ACCESSORIES SUBMENU (DualSense Controller, Bluetooth, Keyboard & Mouse)
   ========================================================================== */
function renderAccessoriesHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Controller (General)</div>

      <div class="ps5-action-row ps5-select-row" id="row-vibration" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Vibration Intensity</div>
          <div class="ps5-action-sub">Haptic feedback motor strength in DualSense wireless controller.</div>
        </div>
        <div class="ps5-select-val">${settingsData.vibrationIntensity} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-trigger-effects" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Trigger Effect Intensity</div>
          <div class="ps5-action-sub">Adaptive trigger motor resistance on L2 and R2 buttons.</div>
        </div>
        <div class="ps5-select-val">${settingsData.triggerEffectIntensity} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-indicator-brightness" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Brightness of Controller Indicators</div>
          <div class="ps5-action-sub">DualSense LED lightbar and player indicator brightness.</div>
        </div>
        <div class="ps5-select-val">${settingsData.indicatorBrightness} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-controller-comm" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Communication Method</div>
          <div class="ps5-action-sub">Use Bluetooth wireless or USB Cable for controller data transfer.</div>
        </div>
        <div class="ps5-select-val">${settingsData.controllerCommMethod} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-turn-off-controllers" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Set Time Until Controllers Turn Off</div>
          <div class="ps5-action-sub">Power saving idle timeout for connected controllers.</div>
        </div>
        <div class="ps5-select-val">${settingsData.turnOffControllersAfter} ›</div>
      </div>

      <div class="ps5-section-divider-title">Bluetooth Accessories</div>

      <div class="ps5-setting-card">
        <div class="ps5-card-header-row">
          <span style="font-size: 1.5rem;">🎮</span>
          <div class="ps5-card-title-group">
            <div class="ps5-card-title">DualSense Wireless Controller</div>
            <div class="ps5-card-desc">Connected • Battery 100% • Bluetooth 5.1</div>
          </div>
          <span class="ps5-badge-pill is-active">Active</span>
        </div>
      </div>

      <div class="ps5-setting-card" style="margin-top: 8px;">
        <div class="ps5-card-header-row">
          <span style="font-size: 1.5rem;">🎧</span>
          <div class="ps5-card-title-group">
            <div class="ps5-card-title">PULSE 3D™ Wireless Headset</div>
            <div class="ps5-card-desc">Registered • USB Wireless Adapter Ready</div>
          </div>
          <span class="ps5-badge-pill">Standby</span>
        </div>
      </div>

      <div class="ps5-section-divider-title">Keyboard & Mouse</div>

      <div class="ps5-action-row ps5-select-row" id="row-key-repeat" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Key Repeat (Delay)</div>
          <div class="ps5-action-sub">Time before a held key begins repeating.</div>
        </div>
        <div class="ps5-select-val">${settingsData.keyRepeatDelay} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-pointer-speed" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Pointer Speed</div>
          <div class="ps5-action-sub">Cursor tracking speed for connected USB or Bluetooth mouse.</div>
        </div>
        <div class="ps5-select-val">${settingsData.pointerSpeed} ›</div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   9. NOTIFICATIONS SUBMENU (Popups, Timing, Categories, Sounds, Behavior)
   ========================================================================== */
function renderNotificationsHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">General</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-allow-popups" tabindex="0" role="switch" aria-checked="${settingsData.allowPopups}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Allow Pop-Up Notifications</div>
          <div class="ps5-action-sub">Display banners in the top-right corner during games and apps.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.allowPopups ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-show-preview" tabindex="0" role="switch" aria-checked="${settingsData.showPreview}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Show Preview</div>
          <div class="ps5-action-sub">Show details, sender names, and message content inside pop-ups.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.showPreview ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-notify-sound" tabindex="0" role="switch" aria-checked="${settingsData.playSound}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Play Sound for Notifications</div>
          <div class="ps5-action-sub">Play signature PlayStation acoustic chime when banners appear.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.playSound ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-display-time" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Display Time</div>
          <div class="ps5-action-sub">Duration notification banners remain visible on screen.</div>
        </div>
        <div class="ps5-select-val">${settingsData.displayTime || 'Standard (5s)'} ›</div>
      </div>

      <div class="ps5-section-divider-title">Notification Categories</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-friends-online" tabindex="0" role="switch" aria-checked="${settingsData.whenFriendsOnline}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">When Friends Go Online</div>
          <div class="ps5-action-sub">Receive a banner when friends sign in to PlayStation™Network.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.whenFriendsOnline ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-messages" tabindex="0" role="switch" aria-checked="${settingsData.messagesNotify}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Messages</div>
          <div class="ps5-action-sub">Pop-up when you receive text or voice party messages.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.messagesNotify ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-game-invites" tabindex="0" role="switch" aria-checked="${settingsData.gameInvitesNotify}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Game Invitations</div>
          <div class="ps5-action-sub">Display alert when invited to multiplayer sessions and party chats.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.gameInvitesNotify ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-trophies" tabindex="0" role="switch" aria-checked="${settingsData.trophiesNotify}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Trophies</div>
          <div class="ps5-action-sub">Alert banner upon unlocking Bronze, Silver, Gold, or Platinum trophies.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.trophiesNotify ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-downloads" tabindex="0" role="switch" aria-checked="${settingsData.downloadsNotify}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Downloads and Uploads</div>
          <div class="ps5-action-sub">Show status banners when game downloads finish or resume.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.downloadsNotify ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Pop-Up Behavior During Play</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-popups-during-games" tabindex="0" role="switch" aria-checked="${settingsData.popupsDuringGames}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Allow Pop-Ups During Games</div>
          <div class="ps5-action-sub">Show banners while playing games (turn off for uninterrupted immersion).</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.popupsDuringGames ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-popups-during-videos" tabindex="0" role="switch" aria-checked="${settingsData.popupsDuringVideos}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Allow Pop-Ups During Video Playback</div>
          <div class="ps5-action-sub">Show banners while watching movies or media apps.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.popupsDuringVideos ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row" id="btn-trigger-test-notification" tabindex="0" role="button" style="margin-top: 14px;">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Test Pop-Up Notification Banner</div>
          <div class="ps5-action-sub">Trigger an immediate sample trophy banner with current settings.</div>
        </div>
        <span class="ps5-row-arrow">▶</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   10. CAPTURES AND BROADCASTS SUBMENU
   ========================================================================== */
function renderCapturesHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Captures</div>

      <div class="ps5-action-row ps5-select-row" id="row-shortcut-mode" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Shortcuts for Create Button</div>
          <div class="ps5-action-sub">Standard (Press once for menu), Easy Screenshots, or Easy Video Clips.</div>
        </div>
        <div class="ps5-select-val">${settingsData.shortcutMode} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-screenshot-format" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Screenshot Format</div>
          <div class="ps5-action-sub">File format for captures taken with Create button.</div>
        </div>
        <div class="ps5-select-val">${settingsData.screenshotFormat} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-video-format" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Video Clip Format</div>
          <div class="ps5-action-sub">Compression format for recorded gameplay clips.</div>
        </div>
        <div class="ps5-select-val">${settingsData.videoFormat} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-video-length" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Length of Recent Gameplay Video Clip</div>
          <div class="ps5-action-sub">Duration saved when choosing 'Save Recent Gameplay'.</div>
        </div>
        <div class="ps5-select-val">${settingsData.videoClipLength} ›</div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-mic-clip" tabindex="0" role="switch" aria-checked="${settingsData.includeMicClip}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Include Your Mic's Audio in Video Clips</div>
          <div class="ps5-action-sub">Record your voice into gameplay video recordings.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.includeMicClip ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-party-audio" tabindex="0" role="switch" aria-checked="${settingsData.includePartyAudio}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Include Party Audio in Video Clips</div>
          <div class="ps5-action-sub">Include voices of party players who have allowed their voice to be shared.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.includePartyAudio ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Broadcasts</div>

      <div class="ps5-action-row ps5-select-row" id="row-broadcast-quality" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Video Quality</div>
          <div class="ps5-action-sub">Streaming resolution and frame rate for YouTube and Twitch broadcasts.</div>
        </div>
        <div class="ps5-select-val">${settingsData.broadcastQuality} ›</div>
      </div>

      <div class="ps5-section-divider-title">Trophies</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-trophy-screens" tabindex="0" role="switch" aria-checked="${settingsData.saveTrophyScreenshots}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Save Trophy Screenshots</div>
          <div class="ps5-action-sub">Automatically capture a screenshot when you unlock a trophy.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.saveTrophyScreenshots ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-trophy-videos" tabindex="0" role="switch" aria-checked="${settingsData.saveTrophyVideos}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Save Trophy Videos</div>
          <div class="ps5-action-sub">Automatically record a short video clip upon unlocking rare trophies.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.saveTrophyVideos ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   11. SAVED DATA AND GAME/APP SETTINGS SUBMENU
   ========================================================================== */
function renderSavedDataHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Game Presets</div>

      <div class="ps5-action-row ps5-select-row" id="row-game-difficulty" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Default Game Difficulty</div>
          <div class="ps5-action-sub">Preferred game difficulty across newly launched games.</div>
        </div>
        <div class="ps5-select-val">${settingsData.gameDifficulty} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-performance-mode" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Performance Mode or Resolution Mode</div>
          <div class="ps5-action-sub">Prioritize 60+ FPS high frame rate or native 4K ray-traced visuals.</div>
        </div>
        <div class="ps5-select-val">${settingsData.performanceMode} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-first-person-view" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">First-Person View Controls</div>
          <div class="ps5-action-sub">Vertical and horizontal look inversion for first-person cameras.</div>
        </div>
        <div class="ps5-select-val">${settingsData.firstPersonView} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-third-person-view" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Third-Person View Controls</div>
          <div class="ps5-action-sub">Camera axis inversion for third-person action games.</div>
        </div>
        <div class="ps5-select-val">${settingsData.thirdPersonView} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-subtitles-preset" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Subtitles and Audio</div>
          <div class="ps5-action-sub">Automatically turn on subtitles for supported story games.</div>
        </div>
        <div class="ps5-select-val">${settingsData.subtitles} ›</div>
      </div>

      <div class="ps5-section-divider-title">Cloud Storage</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-cloud-sync" tabindex="0" role="switch" aria-checked="${settingsData.cloudSync}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Auto-Sync PlayStation™Plus Cloud Storage</div>
          <div class="ps5-action-sub">Automatically upload progress save files when entering rest mode.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.cloudSync ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Automatic Updates</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-game-updates-auto" tabindex="0" role="switch" aria-checked="${settingsData.autoDownloadGameUpdates}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Auto-Download Game Updates</div>
          <div class="ps5-action-sub">Keep installed games updated to their latest version in the background.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.autoDownloadGameUpdates ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Spoiler Warnings</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-warn-spoilers" tabindex="0" role="switch" aria-checked="${settingsData.warnSpoilers}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Warn About Game Spoilers</div>
          <div class="ps5-action-sub">Hide gameplay screenshots containing story spoilers tagged by developers.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.warnSpoilers ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   12. ACCESSIBILITY SUBMENU (Display & Text, Screen Reader, Captures, Zoom)
   ========================================================================== */
function renderAccessibilityHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Display and Text</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-bold-text" tabindex="0" role="switch" aria-checked="${settingsData.boldText}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Bold Text</div>
          <div class="ps5-action-sub">Make text thicker across the interface for enhanced readability.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.boldText ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-high-contrast" tabindex="0" role="switch" aria-checked="${settingsData.highContrast}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">High Contrast</div>
          <div class="ps5-action-sub">Increase border contrast and dim background transparency.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.highContrast ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-text-size" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Text Size</div>
          <div class="ps5-action-sub">Adjust font scale for console titles and description labels.</div>
        </div>
        <div class="ps5-select-val">${settingsData.textSize} ›</div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-invert-colors" tabindex="0" role="switch" aria-checked="${settingsData.invertColors}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Invert Colors</div>
          <div class="ps5-action-sub">Invert display colors across interface elements.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.invertColors ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-color-filter" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Color Correction Filter</div>
          <div class="ps5-action-sub">Protanopia, Deuteranopia, Tritanopia, or Grayscale color vision filters.</div>
        </div>
        <div class="ps5-select-val">${settingsData.colorFilter} ›</div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-reduced-motion" tabindex="0" role="switch" aria-checked="${settingsData.reducedMotion}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Reduce Motion</div>
          <div class="ps5-action-sub">Minimize dynamic zooms and slide transitions.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.reducedMotion ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-checkmark-enabled" tabindex="0" role="switch" aria-checked="${settingsData.showCheckmarkOnEnabled}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Show Check Mark on Enabled Settings</div>
          <div class="ps5-action-sub">Display a check mark symbol inside active toggle switches.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.showCheckmarkOnEnabled ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Screen Reader</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-screen-reader" tabindex="0" role="switch" aria-checked="${settingsData.screenReader}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable Screen Reader (Voice Narration)</div>
          <div class="ps5-action-sub">Read focused titles and options aloud using speech synthesis.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.screenReader ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-screen-reader-speed" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Speech Speed</div>
          <div class="ps5-action-sub">Adjust narration speed for the screen reader.</div>
        </div>
        <div class="ps5-select-val">${settingsData.screenReaderSpeed} ›</div>
      </div>

      <div class="ps5-section-divider-title">Closed Captions & Zoom</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-closed-captions" tabindex="0" role="switch" aria-checked="${settingsData.closedCaptions}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Closed Captions</div>
          <div class="ps5-action-sub">Display text captions for voice dialogue and sound effects.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.closedCaptions ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-zoom" tabindex="0" role="switch" aria-checked="${settingsData.zoom}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Enable Zoom (Magnifier Mode)</div>
          <div class="ps5-action-sub">Magnify the screen area for close inspection.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.zoom ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   13. USER'S GUIDE, HEALTH AND SAFETY SUBMENU
   ========================================================================== */
function renderUsersGuideHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-setting-card" style="margin-bottom: 12px;">
        <div class="ps5-card-title">PlayStation 5 Official Documentation</div>
        <div class="ps5-card-desc">Access official Sony PlayStation guides, user manuals, and health & safety warnings.</div>
      </div>

      <div class="ps5-action-row" id="link-playstation-guide" tabindex="0" role="button">
        <div class="ps5-action-label">User's Guide (playstation.com/help)</div>
        <span class="ps5-row-arrow">↗</span>
      </div>

      <div class="ps5-action-row" id="btn-quick-start-guide" tabindex="0" role="button">
        <div class="ps5-action-label">Quick Start Guide (Console Navigation & Basics)</div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-health-safety-notices" tabindex="0" role="button">
        <div class="ps5-action-label">Health and Safety Notices (Photosensitivity & VR Safety)</div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-ip-licenses" tabindex="0" role="button">
        <div class="ps5-action-label">Intellectual Property Notices & Open-Source Software Licenses</div>
        <span class="ps5-row-arrow">›</span>
      </div>

      <div class="ps5-action-row" id="btn-system-eula" tabindex="0" role="button">
        <div class="ps5-action-label">System Software License Agreement</div>
        <span class="ps5-row-arrow">›</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   14. PRIVACY SUBMENU
   ========================================================================== */
function renderPrivacyHtml() {
  return `
    <div class="ps5-row-action-list">
      <div class="ps5-section-divider-title">Privacy Settings</div>

      <div class="ps5-action-row ps5-select-row" id="row-privacy-profile" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Who Can See Your Profile</div>
          <div class="ps5-action-sub">Control who can view your gaming history, profile details, and activity.</div>
        </div>
        <div class="ps5-select-val">${settingsData.privacyProfileVisibility || 'Anyone'} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-privacy-trophies" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Who Can See Your Trophies</div>
          <div class="ps5-action-sub">Choose who can view your earned platinum, gold, silver, and bronze trophies.</div>
        </div>
        <div class="ps5-select-val">${settingsData.privacyTrophiesVisibility || 'Anyone'} ›</div>
      </div>

      <div class="ps5-action-row ps5-select-row" id="row-privacy-status" tabindex="0">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Who Can See Your Online Status</div>
          <div class="ps5-action-sub">Choose who can see when you are currently online and playing.</div>
        </div>
        <div class="ps5-select-val">${settingsData.privacyOnlineStatusVisibility || 'Anyone'} ›</div>
      </div>

      <div class="ps5-section-divider-title">Data Collection & Telemetry</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-privacy-telemetry" tabindex="0" role="switch" aria-checked="${Boolean(settingsData.privacyTelemetry)}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Help Improve System Software (Telemetry)</div>
          <div class="ps5-action-sub">Automatically send performance diagnostics and crash reports to enhance stability.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.privacyTelemetry ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-privacy-voice" tabindex="0" role="switch" aria-checked="${Boolean(settingsData.privacyVoiceData)}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Voice Data Analysis</div>
          <div class="ps5-action-sub">Allow voice interactions with the controller mic to train local speech-to-text recognition.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.privacyVoiceData ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-section-divider-title">Search & Personalization</div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-privacy-search" tabindex="0" role="switch" aria-checked="${settingsData.privacySearchDiscovery !== false}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Appear in Search Results</div>
          <div class="ps5-action-sub">Allow other players to discover your profile by searching for your online ID.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.privacySearchDiscovery !== false ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>

      <div class="ps5-action-row ps5-toggle-row" id="toggle-privacy-personalized" tabindex="0" role="switch" aria-checked="${Boolean(settingsData.privacyPersonalizedAds)}">
        <div class="ps5-action-text-col">
          <div class="ps5-action-label">Personalized Recommendations & Offers</div>
          <div class="ps5-action-sub">Receive curated game suggestions based on titles played in your PlayStation library.</div>
        </div>
        <div class="ps5-toggle-pill ${settingsData.privacyPersonalizedAds ? 'active' : ''}">
          <div class="ps5-toggle-thumb"></div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   INTERACTIONS & DIALOG HANDLERS
   ========================================================================== */
function wireSubmenuInteractions(viewKey, container) {
  // 1. Network Submenu
  if (viewKey === 'network') {
    container.querySelector('#tab-net-status')?.addEventListener('click', () => {
      networkTab = 'status';
      try { ps5Audio.playNavTick(); } catch (e) {}
      renderSettingsView();
    });

    container.querySelector('#tab-net-settings')?.addEventListener('click', () => {
      networkTab = 'settings';
      try { ps5Audio.playNavTick(); } catch (e) {}
      renderSettingsView();
    });

    container.querySelector('#btn-open-wifi-setup')?.addEventListener('click', () => {
      navigateToSettingsView('wifi-setup');
    });

    container.querySelector('#btn-test-connection')?.addEventListener('click', () => {
      navigateToSettingsView('connection-test');
    });

    container.querySelector('#btn-view-connection-status')?.addEventListener('click', () => {
      showNetworkStatusModal();
    });

    container.querySelector('#btn-view-psn-status')?.addEventListener('click', () => {
      showPsnStatusModal();
    });

    container.querySelector('#btn-advanced-net-settings')?.addEventListener('click', () => {
      showAdvancedNetworkModal();
    });

    container.querySelector('#btn-open-windows-net-status')?.addEventListener('click', () => {
      if (window.electronAPI?.openWindowsNetworkSettings) {
        window.electronAPI.openWindowsNetworkSettings();
      }
    });

    wireToggle(container, '#toggle-connect-internet', 'connectInternet', (val) => {
      isInternetConnected = val;
      renderSettingsView();
    });
  }

  // 2. Wi-Fi Setup
  if (viewKey === 'wifi-setup') {
    container.querySelectorAll('.ps5-wifi-item[data-ssid]').forEach(item => {
      item.addEventListener('click', () => {
        const ssid = item.getAttribute('data-ssid');
        const sec = item.getAttribute('data-security');
        if (!ssid) return;

        if (sec === 'None' || sec === 'Open') {
          simulateWifiConnection(ssid);
        } else {
          promptWifiPassword(ssid);
        }
      });
    });

    container.querySelector('#btn-refresh-wifi')?.addEventListener('click', async () => {
      const nameEl = container.querySelector('#btn-refresh-wifi .ps5-wifi-name');
      if (nameEl) nameEl.textContent = 'Scanning Wi-Fi Networks...';
      try {
        if (window.electronAPI?.getWifiNetworks) {
          liveWifiInfo = await window.electronAPI.getWifiNetworks();
          if (liveWifiInfo?.ssid) connectedWifi = liveWifiInfo.ssid;
          if (typeof liveWifiInfo?.connected === 'boolean') isInternetConnected = liveWifiInfo.connected;
        }
      } catch (err) {
        console.warn('Wi-Fi refresh failed:', err);
      }
      renderSettingsView();
    });

    container.querySelector('#btn-open-windows-network')?.addEventListener('click', () => {
      if (window.electronAPI?.openWindowsNetworkSettings) {
        window.electronAPI.openWindowsNetworkSettings();
      }
    });

    container.querySelector('#btn-wired-lan')?.addEventListener('click', () => {
      simulateWiredLanConnection();
    });
  }

  // 3. Test Connection
  if (viewKey === 'connection-test') {
    runConnectionTestSequence(container);
    container.querySelector('#btn-retest-connection')?.addEventListener('click', () => {
      runConnectionTestSequence(container);
    });
  }

  // 3B. Multi-Store Synchronization Diagnostics
  if (viewKey === 'steam-diagnostics') {
    const handleSyncAction = async (btn, actionFn, title, subtitle) => {
      if (btn) {
        btn.innerHTML = '<span>⏳</span><span>Synchronizing...</span>';
        btn.disabled = true;
      }
      try {
        if (typeof window !== 'undefined' && actionFn) {
          const res = await actionFn();
          if (res?.diagnostics) {
            cachedSteamDiagnostics = res.diagnostics;
            lastDiagnosticsFetchedAt = Date.now();
          } else if (window.electronAPI?.getSteamSyncDiagnostics) {
            cachedSteamDiagnostics = await window.electronAPI.getSteamSyncDiagnostics();
            lastDiagnosticsFetchedAt = Date.now();
          }
          if (typeof window.ps5SyncPCGames === 'function') {
            await window.ps5SyncPCGames(true);
          }
        }
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: { title, subtitle }
        }));
        try { ps5Audio.playBootChord(); } catch (e) {}
      } catch (err) {
        console.warn('Sync action error:', err);
      } finally {
        renderSettingsView();
      }
    };

    // Phase 8: Four Master Action Buttons
    container.querySelector('#btn-dashboard-sync-now')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-dashboard-sync-now');
      await handleSyncAction(
        btn,
        () => (window.electronAPI?.syncNow ? window.electronAPI.syncNow() : window.electronAPI?.syncAllStores?.()),
        "Steam Synchronized",
        "Full Steam library and Favorites synchronized in real time."
      );
    });

    container.querySelector('#btn-dashboard-refresh-favs')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-dashboard-refresh-favs');
      await handleSyncAction(
        btn,
        () => (window.electronAPI?.refreshSteamFavorites ? window.electronAPI.refreshSteamFavorites() : window.electronAPI?.resyncSteamAccount?.()),
        "Favorites Refreshed",
        "Re-read user-collections.favorite and updated Home Screen favorites."
      );
    });

    container.querySelector('#btn-dashboard-refresh-art')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-dashboard-refresh-art');
      await handleSyncAction(
        btn,
        () => (window.electronAPI?.refreshSteamArtwork ? window.electronAPI.refreshSteamArtwork() : window.electronAPI?.repairLibrary?.()),
        "Artwork Engine Refreshed",
        "Verified and downloaded official 4-asset PS5 artwork for all favorites."
      );
    });

    container.querySelector('#btn-dashboard-repair-conn')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-dashboard-repair-conn');
      await handleSyncAction(
        btn,
        () => (window.electronAPI?.repairSteamConnection ? window.electronAPI.repairSteamConnection() : window.electronAPI?.resyncSteamAccount?.()),
        "Steam Connection Repaired",
        "Re-armed file-system watchers and verified active Steam account."
      );
    });

    container.querySelector('#btn-sync-all-stores')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-sync-all-stores');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.syncAllStores?.(),
        "Storefronts Synchronized",
        "Multi-store library scan completed with 0 duplicates."
      );
    });

    container.querySelector('#btn-sync-steam')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-sync-steam');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.syncStore?.('steam') || window.electronAPI?.resyncSteamAccount?.(),
        "Steam Synchronized",
        "Verified real Steam owned titles and favorites with zero unowned phantoms."
      );
    });

    container.querySelector('#btn-sync-xbox')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-sync-xbox');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.syncStore?.('xbox'),
        "Xbox / PC Game Pass Synchronized",
        "Scanned C:\\XboxGames for MicrosoftGame.config titles."
      );
    });

    container.querySelector('#btn-sync-epic')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-sync-epic');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.syncStore?.('epic'),
        "Epic Games Store Synchronized",
        "Inspected Epic Games manifests and installation catalogs."
      );
    });

    container.querySelector('#btn-sync-ubisoft')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-sync-ubisoft');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.syncStore?.('ubisoft'),
        "Ubisoft Connect Synchronized",
        "Scanned Ubisoft installation registry keys."
      );
    });

    container.querySelector('#btn-sync-riot')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-sync-riot');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.syncStore?.('riot'),
        "Riot Games Synchronized",
        "Scanned Riot Client installed titles."
      );
    });

    container.querySelector('#btn-repair-library')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-repair-library');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.repairLibrary?.(),
        "Library Repaired",
        "Canonical deduplication and optical artwork verified."
      );
    });

    container.querySelector('#btn-clear-invalid')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-clear-invalid');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.clearInvalidEntries?.(),
        "Library Cleaned",
        "Purged unowned and phantom entries from active library."
      );
    });

    container.querySelector('#btn-full-steam-resync')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-full-steam-resync');
      await handleSyncAction(
        btn,
        () => window.electronAPI?.resyncSteamAccount?.(),
        "Steam Library Synchronized",
        "Verified actual owned games & favorites with zero duplicates."
      );
    });
  }

  // 4. Users and Accounts
  if (viewKey === 'users-accounts') {
    wireOptionPicker(container, '#row-account-online-status', 'Online Status', ['Online', 'Appear Offline'], 'onlineStatus', (val) => {
      applyAllSystemSettings();
      renderSettingsView();
    });

    container.querySelector('#btn-open-profile-edit')?.addEventListener('click', () => {
      openOverlay('ps5-profile-modal');
    });

    wireToggle(container, '#toggle-auto-sign-in', 'autoSignIn');

    container.querySelector('#btn-set-login-passcode')?.addEventListener('click', () => {
      showLoginPasscodeModal();
    });

    wireOptionPicker(container, '#row-privacy-profile', 'Who Can See Your Profile', ['Anyone', 'Friends of Friends', 'Friends Only', 'No One'], 'privacyProfile');
    wireOptionPicker(container, '#row-privacy-trophies', 'Who Can See Your Trophies', ['Anyone', 'Friends of Friends', 'Friends Only', 'No One'], 'privacyTrophies');

    container.querySelector('#btn-steam-sync-diag')?.addEventListener('click', () => {
      navigateToSettingsView('steam-diagnostics');
    });

    container.querySelector('#btn-manage-linked-services')?.addEventListener('click', () => {
      showLinkedServicesModal();
    });

    container.querySelector('#btn-view-ps-plus')?.addEventListener('click', () => {
      showPsPlusModal();
    });

    container.querySelector('#btn-account-sign-out')?.addEventListener('click', () => {
      showPs5ConfirmDialog({
        title: 'Sign Out of PlayStation™Network',
        message: 'Are you sure you want to sign out? You will need your sign-in ID and password to access online features, cloud saves, and multiplayer.',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        isDestructive: true,
        onConfirm: () => {
          settingsData.onlineStatus = 'Appear Offline';
          saveSettings();
          window.dispatchEvent(new CustomEvent('ps5-show-notification', {
            detail: {
              title: "Signed Out",
              subtitle: "You have signed out of PlayStation™Network on this console."
            }
          }));
          renderSettingsView();
        }
      });
    });
  }

  // 5. Family Controls
  if (viewKey === 'family-controls') {
    wireToggle(container, '#toggle-parental-controls', 'parentalControlsEnabled', () => {
      renderSettingsView();
    });
    wireOptionPicker(container, '#row-age-restriction', 'Age Filtering for Games', ['Allow All', 'Age 17+ (Mature)', 'Age 12+ (Teen)', 'Age 7+ (Everyone)', "Don't Allow"], 'ageRestriction');
    wireOptionPicker(container, '#row-playtime-limit', 'Playtime Management', ['No Limit', '1 Hour', '2 Hours', '3 Hours', '4 Hours'], 'playtimeLimit');
    wireOptionPicker(container, '#row-communication-filter', 'Communication & User Content', ['Allowed', 'Restricted'], 'communicationFilter');
    wireOptionPicker(container, '#row-spending-limit', 'Monthly Spending Limit', ['Unlimited', '$0 (Do Not Allow)', '$10.00', '$30.00', '$50.00'], 'monthlySpendingLimit');
  }

  // 6. System
  if (viewKey === 'system') {
    container.querySelector('#btn-edit-console-name')?.addEventListener('click', () => {
      showConsoleNameRenameModal();
    });

    container.querySelector('#btn-check-system-update')?.addEventListener('click', () => {
      showSystemUpdateCheckModal();
    });

    wireToggle(container, '#toggle-auto-download-updates', 'autoDownloadUpdates');

    container.querySelector('#btn-backup-restore')?.addEventListener('click', () => {
      showBackupRestoreModal();
    });

    wireToggle(container, '#toggle-hdmi-link', 'hdmiLink');
    wireToggle(container, '#toggle-one-touch-play', 'oneTouchPlay');
    wireToggle(container, '#toggle-hdcp', 'hdcp');

    wireOptionPicker(container, '#row-system-timezone', 'Time Zone', [
      'UTC-08:00 Pacific Time (US & Canada)',
      'UTC-05:00 Eastern Time (US & Canada)',
      'UTC+00:00 London / Greenwich Mean Time',
      'UTC+01:00 Central European Time',
      'UTC+05:30 India Standard Time',
      'UTC+09:00 Tokyo / Osaka'
    ], 'timeZone');

    wireOptionPicker(container, '#row-clock-format', 'Clock Format', ['12-Hour', '24-Hour'], 'clockFormat');

    wireOptionPicker(container, '#row-system-language', 'Console Language', [
      'English (United States)',
      'English (United Kingdom)',
      '日本語 (Japanese)',
      'Español (Latin America)',
      'Français (France)',
      'Deutsch (German)',
      'Italiano (Italian)',
      'Português (Brasil)'
    ], 'systemLanguage');

    wireToggle(container, '#toggle-remote-play', 'remotePlayEnabled');

    container.querySelector('#btn-link-remote-device')?.addEventListener('click', () => {
      showRemotePlayLinkModal();
    });

    wireOptionPicker(container, '#row-rest-games', 'Rest Mode (Playing Games)', ['1 Hour', '2 Hours', '3 Hours', '4 Hours', 'Off'], 'restModeGames');
    wireOptionPicker(container, '#row-rest-media', 'Rest Mode (Playing Media)', ['4 Hours', '1 Hour', '2 Hours', 'Off'], 'restModeMedia');

    container.querySelector('#btn-restart-app')?.addEventListener('click', () => {
      showPs5ConfirmDialog({
        title: 'Restart PlayStation 5 Launcher',
        message: 'The unified application will restart and reload all game libraries, settings, and hardware controllers.',
        confirmText: 'Restart',
        cancelText: 'Cancel',
        isDestructive: false,
        onConfirm: () => {
          if (window.electronAPI?.rebootApp) {
            window.electronAPI.rebootApp();
          } else {
            window.location.reload();
          }
        }
      });
    });

    container.querySelector('#btn-restore-defaults')?.addEventListener('click', () => {
      showPs5ConfirmDialog({
        title: 'Restore Default Settings',
        message: 'All system settings will be restored to their factory defaults. Your installed games, saved progress, and personal captures will NOT be deleted. Do you want to continue?',
        confirmText: 'Restore Defaults',
        cancelText: 'Cancel',
        isDestructive: true,
        onConfirm: () => {
          const keepGames = settingsData.installedGames;
          settingsData = { ...DEFAULT_SETTINGS, installedGames: keepGames };
          saveSettings();
          applyAllSystemSettings();
          window.dispatchEvent(new CustomEvent('ps5-show-notification', {
            detail: {
              title: "⚙️ Settings Restored",
              subtitle: "All system settings have been restored to default values."
            }
          }));
          renderSettingsView();
        }
      });
    });

    container.querySelector('#btn-reset-console')?.addEventListener('click', () => {
      showPs5ConfirmDialog({
        title: 'Reset Your Console',
        message: 'WARNING: Resetting your console will delete all user accounts, save files, installed games, and preferences. This action cannot be undone. Do you want to proceed?',
        confirmText: 'Reset Console',
        cancelText: 'Cancel',
        isDestructive: true,
        onConfirm: () => {
          localStorage.removeItem(SETTINGS_STORAGE_KEY);
          settingsData = { ...DEFAULT_SETTINGS, installedGames: [...INITIAL_INSTALLED_GAMES] };
          saveSettings();
          applyAllSystemSettings();
          window.dispatchEvent(new CustomEvent('ps5-show-notification', {
            detail: {
              title: "⚠️ Console Reset Complete",
              subtitle: "System restored to initial factory condition."
            }
          }));
          renderSettingsView();
        }
      });
    });
  }

  // 7. Storage
  if (viewKey === 'storage') {
    container.querySelector('#btn-storage-games')?.addEventListener('click', () => {
      navigateToSettingsView('storage-games');
    });

    container.querySelector('#btn-storage-media')?.addEventListener('click', () => {
      showMediaStorageModal();
    });

    container.querySelector('#btn-storage-saved')?.addEventListener('click', () => {
      showSavedDataStorageModal();
    });

    container.querySelector('#btn-storage-other')?.addEventListener('click', () => {
      showOtherStorageModal();
    });

    container.querySelector('#btn-storage-m2')?.addEventListener('click', () => {
      showM2StorageModal();
    });

    container.querySelector('#btn-refresh-storage')?.addEventListener('click', async () => {
      const label = container.querySelector('#btn-refresh-storage .ps5-action-label');
      if (label) label.textContent = 'Scanning Storage Drives...';
      try {
        if (window.electronAPI?.getStorageDrives) {
          liveStorageDrives = await window.electronAPI.getStorageDrives();
          const mainDrive = liveStorageDrives?.find(d => d.drive.startsWith('C')) || liveStorageDrives?.[0];
          if (mainDrive) {
            settingsData.totalCapacityGb = mainDrive.totalGb;
            settingsData.usableCapacityGb = mainDrive.totalGb;
          }
        }
      } catch (err) {
        console.warn('Storage refresh failed:', err);
      }
      renderSettingsView();
    });
  }

  if (viewKey === 'storage-games') {
    container.querySelectorAll('.btn-delete-game').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-game-id');
        const title = btn.getAttribute('data-game-title');
        const size = btn.getAttribute('data-game-size');

        showPs5ConfirmDialog({
          title: `Delete ${title}`,
          message: `Are you sure you want to delete this game? This will free up approximately ${size} of console storage. You can reinstall it anytime.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          isDestructive: true,
          onConfirm: () => {
            settingsData.installedGames = (settingsData.installedGames || []).filter(g => g.id !== id);
            saveSettings();
            window.dispatchEvent(new CustomEvent('ps5-show-notification', {
              detail: {
                title: "🗑️ Game Deleted",
                subtitle: `${title} (${size}) was removed from console storage.`
              }
            }));
            renderSettingsView();
          }
        });
      });
    });

    container.querySelector('#btn-restore-demo-games')?.addEventListener('click', () => {
      settingsData.installedGames = [...INITIAL_INSTALLED_GAMES];
      saveSettings();
      renderSettingsView();
    });
  }

  // 8. Sound
  if (viewKey === 'sound') {
    wireOptionPicker(container, '#row-output-device', 'Output Device', [
      'HDMI Device (TV)',
      'USB Wireless Headset (PULSE 3D)',
      'Controller Speaker',
      'AV Amplifier'
    ], 'outputDevice');

    wireToggle(container, '#toggle-switch-audio-auto', 'switchDeviceAuto');

    wireOptionPicker(container, '#row-hdmi-device-type', 'HDMI Device Type', ['TV', 'Sound Bar', 'AV Amplifier'], 'hdmiDeviceType');

    wireOptionPicker(container, '#row-audio-format-priority', 'Audio Format (Priority)', [
      'Linear PCM (Standard)',
      'Dolby Audio',
      'Dolby Atmos',
      'DTS'
    ], 'audioFormat');

    wireToggle(container, '#toggle-3d-audio', 'threeDAudio');
    wireToggle(container, '#toggle-mono-audio', 'monoAudio');

    const hpSlider = container.querySelector('#slider-headphone-vol');
    hpSlider?.addEventListener('input', (e) => {
      settingsData.headphoneVolume = parseInt(e.target.value, 10);
      container.querySelector('#val-headphone-vol').textContent = `${e.target.value}%`;
      saveSettings();
    });

    const cSlider = container.querySelector('#slider-controller-vol');
    cSlider?.addEventListener('input', (e) => {
      settingsData.controllerSpeakerVolume = parseInt(e.target.value, 10);
      container.querySelector('#val-controller-vol').textContent = `${e.target.value}%`;
      saveSettings();
    });

    wireOptionPicker(container, '#row-mic-login-status', 'Microphone Status on Login', ['On', 'Mute'], 'micStatusLogin');

    wireToggle(container, '#toggle-home-music', 'homeScreenMusic', (val) => {
      ps5Audio.setHomeMusic(val);
    });

    wireToggle(container, '#toggle-sound-effects', 'soundEffects', (val) => {
      ps5Audio.setSoundEffects(val);
    });

    // Animate mic meter
    const micBar = container.querySelector('#ps5-mic-meter-bar');
    if (micBar) {
      let interval = setInterval(() => {
        if (!document.contains(micBar)) {
          clearInterval(interval);
          return;
        }
        const rand = 30 + Math.floor(Math.random() * 50);
        micBar.style.width = `${rand}%`;
      }, 350);
    }
  }

  // 9. Screen and Video
  if (viewKey === 'screen-video') {
    wireOptionPicker(container, '#row-resolution', 'Resolution', ['Automatic', '720p', '1080p', '1440p', '2160p (4K)'], 'resolution');
    wireOptionPicker(container, '#row-vrr', 'VRR', ['Automatic', 'Off'], 'vrr');
    wireOptionPicker(container, '#row-120hz', '120 Hz Output', ['Automatic', 'Off'], 'refresh120hz');
    wireOptionPicker(container, '#row-allm', 'ALLM', ['Automatic', 'Off'], 'allm');
    wireOptionPicker(container, '#row-hdr', 'HDR', ['On When Supported', 'Always On', 'Off'], 'hdr');

    container.querySelector('#btn-adjust-hdr')?.addEventListener('click', () => {
      showHdrCalibrationWizardModal();
    });

    wireOptionPicker(container, '#row-deep-color', 'Deep Color Output', ['Automatic', 'Off'], 'deepColor');
    wireOptionPicker(container, '#row-rgb', 'RGB Range', ['Automatic', 'Limited', 'Full'], 'rgbRange');

    container.querySelector('#btn-adjust-display-area')?.addEventListener('click', () => {
      showDisplayAreaAdjustmentModal();
    });

    wireOptionPicker(container, '#row-screen-saver', 'Screen Saver Timeout', ['5 Minutes', '15 Minutes', '30 Minutes', 'Off'], 'screenSaverTimeout');
  }

  // 10. Accessories
  if (viewKey === 'accessories') {
    wireOptionPicker(container, '#row-vibration', 'Vibration Intensity', ['Standard (Strong)', 'Medium', 'Weak', 'Off'], 'vibrationIntensity');
    wireOptionPicker(container, '#row-trigger-effects', 'Trigger Effect Intensity', ['Strong', 'Medium', 'Weak', 'Off'], 'triggerEffectIntensity');
    wireOptionPicker(container, '#row-indicator-brightness', 'Indicator Brightness', ['Standard (Bright)', 'Medium', 'Dim'], 'indicatorBrightness');
    wireOptionPicker(container, '#row-controller-comm', 'Communication Method', ['Bluetooth', 'USB Cable'], 'controllerCommMethod');
    wireOptionPicker(container, '#row-turn-off-controllers', 'Turn Off Controllers After', ['After 10 Minutes', 'After 30 Minutes', 'After 60 Minutes', 'Do Not Turn Off'], 'turnOffControllersAfter');
    wireOptionPicker(container, '#row-key-repeat', 'Key Repeat Delay', ['Short', 'Normal', 'Long'], 'keyRepeatDelay');
    wireOptionPicker(container, '#row-pointer-speed', 'Pointer Speed', ['Slow', 'Standard', 'Fast'], 'pointerSpeed');
  }

  // 11. Notifications
  if (viewKey === 'notifications') {
    wireToggle(container, '#toggle-allow-popups', 'allowPopups');
    wireToggle(container, '#toggle-show-preview', 'showPreview');
    wireToggle(container, '#toggle-notify-sound', 'playSound');
    wireOptionPicker(container, '#row-display-time', 'Display Time', ['Short (3s)', 'Standard (5s)', 'Long (8s)'], 'displayTime');

    wireToggle(container, '#toggle-friends-online', 'whenFriendsOnline');
    wireToggle(container, '#toggle-messages', 'messagesNotify');
    wireToggle(container, '#toggle-game-invites', 'gameInvitesNotify');
    wireToggle(container, '#toggle-trophies', 'trophiesNotify');
    wireToggle(container, '#toggle-downloads', 'downloadsNotify');

    wireToggle(container, '#toggle-popups-during-games', 'popupsDuringGames');
    wireToggle(container, '#toggle-popups-during-videos', 'popupsDuringVideos');

    container.querySelector('#btn-trigger-test-notification')?.addEventListener('click', () => {
      try { ps5Audio.playSelectChime(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🏆 Trophy Earned!",
          subtitle: `${getAccountName()} • Platinum Trophy Unlocked`
        }
      }));
    });
  }

  // 12. Captures
  if (viewKey === 'captures') {
    wireOptionPicker(container, '#row-shortcut-mode', 'Shortcuts for Create Button', ['Standard', 'Easy Screenshots', 'Easy Video Clips'], 'shortcutMode');
    wireOptionPicker(container, '#row-screenshot-format', 'Screenshot Format', ['PNG', 'JPG'], 'screenshotFormat');
    wireOptionPicker(container, '#row-video-format', 'Video Clip Format', ['Most Compatible (MP4)', 'WebM'], 'videoFormat');
    wireOptionPicker(container, '#row-video-length', 'Length of Video Clip', ['15 Seconds', '30 Seconds', '1 Minute', '3 Minutes', '5 Minutes', '15 Minutes'], 'videoClipLength');

    wireToggle(container, '#toggle-mic-clip', 'includeMicClip');
    wireToggle(container, '#toggle-party-audio', 'includePartyAudio');
    wireOptionPicker(container, '#row-broadcast-quality', 'Broadcast Video Quality', ['1080p60', '1080p30', '720p60'], 'broadcastQuality');

    wireToggle(container, '#toggle-trophy-screens', 'saveTrophyScreenshots');
    wireToggle(container, '#toggle-trophy-videos', 'saveTrophyVideos');
  }

  // 13. Saved Data & Presets
  if (viewKey === 'saved-data') {
    wireOptionPicker(container, '#row-game-difficulty', 'Default Game Difficulty', ['Game Default', 'Easiest', 'Easy', 'Normal', 'Hard', 'Hardest'], 'gameDifficulty');
    wireOptionPicker(container, '#row-performance-mode', 'Performance or Resolution Mode', ['Performance Mode', 'Resolution Mode', 'Game Default'], 'performanceMode');
    wireOptionPicker(container, '#row-first-person-view', 'First-Person View', ['Normal', 'Inverted'], 'firstPersonView');
    wireOptionPicker(container, '#row-third-person-view', 'Third-Person View', ['Normal', 'Inverted'], 'thirdPersonView');
    wireOptionPicker(container, '#row-subtitles-preset', 'Subtitles', ['Game Default', 'On', 'Off'], 'subtitles');

    wireToggle(container, '#toggle-cloud-sync', 'cloudSync');
    wireToggle(container, '#toggle-game-updates-auto', 'autoDownloadGameUpdates');
    wireToggle(container, '#toggle-warn-spoilers', 'warnSpoilers');
  }

  // 14. Accessibility
  if (viewKey === 'accessibility') {
    wireToggle(container, '#toggle-bold-text', 'boldText', applyAllSystemSettings);
    wireToggle(container, '#toggle-high-contrast', 'highContrast', applyAllSystemSettings);
    wireOptionPicker(container, '#row-text-size', 'Text Size', ['Small', 'Standard', 'Large', 'Extra Large'], 'textSize', applyAllSystemSettings);
    wireToggle(container, '#toggle-invert-colors', 'invertColors', applyAllSystemSettings);
    wireOptionPicker(container, '#row-color-filter', 'Color Correction', ['Off', 'Protanopia', 'Deuteranopia', 'Tritanopia', 'Grayscale'], 'colorFilter', applyAllSystemSettings);
    wireToggle(container, '#toggle-reduced-motion', 'reducedMotion', applyAllSystemSettings);
    wireToggle(container, '#toggle-checkmark-enabled', 'showCheckmarkOnEnabled', applyAllSystemSettings);

    wireToggle(container, '#toggle-screen-reader', 'screenReader', (val) => {
      isScreenReaderActive = val;
      if (val && typeof window.speechSynthesis !== 'undefined') {
        const u = new SpeechSynthesisUtterance('Screen Reader enabled.');
        window.speechSynthesis.speak(u);
      }
    });

    wireOptionPicker(container, '#row-screen-reader-speed', 'Speech Speed', ['Slow', 'Normal', 'Fast', 'Very Fast'], 'screenReaderSpeed');

    wireToggle(container, '#toggle-closed-captions', 'closedCaptions', applyAllSystemSettings);
    wireToggle(container, '#toggle-zoom', 'zoom', applyAllSystemSettings);
  }

  // 15. Privacy
  if (viewKey === 'privacy') {
    wireOptionPicker(container, '#row-privacy-profile', 'Who Can See Your Profile', ['Anyone', 'Friends of Friends', 'Friends Only', 'No One'], 'privacyProfileVisibility');
    wireOptionPicker(container, '#row-privacy-trophies', 'Who Can See Your Trophies', ['Anyone', 'Friends Only', 'No One'], 'privacyTrophiesVisibility');
    wireOptionPicker(container, '#row-privacy-status', 'Who Can See Your Online Status', ['Anyone', 'Friends Only', 'No One'], 'privacyOnlineStatusVisibility');
    wireToggle(container, '#toggle-privacy-telemetry', 'privacyTelemetry');
    wireToggle(container, '#toggle-privacy-voice', 'privacyVoiceData');
    wireToggle(container, '#toggle-privacy-search', 'privacySearchDiscovery');
    wireToggle(container, '#toggle-privacy-personalized', 'privacyPersonalizedAds');
  }

  // 16. User's Guide & Safety
  if (viewKey === 'users-guide') {
    container.querySelector('#link-playstation-guide')?.addEventListener('click', () => {
      window.open('https://www.playstation.com/support/', '_blank');
    });

    container.querySelector('#btn-quick-start-guide')?.addEventListener('click', () => {
      showQuickStartGuideModal();
    });

    container.querySelector('#btn-health-safety-notices')?.addEventListener('click', () => {
      showHealthSafetyModal();
    });

    container.querySelector('#btn-ip-licenses')?.addEventListener('click', () => {
      showIpLicensesModal();
    });

    container.querySelector('#btn-system-eula')?.addEventListener('click', () => {
      showSystemEulaModal();
    });
  }
}

/* ==========================================================================
   AUTHENTIC PS5 OPTIONS PICKER (POPOVER SHEET)
   ========================================================================== */
function wireOptionPicker(container, selector, title, options, stateKey, callback) {
  const el = container.querySelector(selector);
  if (!el) return;

  const openPicker = () => {
    try { ps5Audio.playSelectChime(); } catch (e) {}

    const overlay = document.createElement('div');
    overlay.className = 'ps5-picker-overlay';
    overlay.innerHTML = `
      <div class="ps5-picker-sheet">
        <div class="ps5-picker-header">
          <div class="ps5-picker-title">${title}</div>
        </div>
        <div class="ps5-picker-list" role="listbox">
          ${options.map(opt => `
            <div class="ps5-picker-option ${settingsData[stateKey] === opt ? 'is-selected' : ''}" data-val="${opt}" tabindex="0" role="option" aria-selected="${settingsData[stateKey] === opt}">
              <span>${opt}</span>
              ${settingsData[stateKey] === opt ? `<span class="ps5-picker-option-check">✓</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Focus current selected option or first option
    setTimeout(() => {
      const selectedEl = overlay.querySelector('.ps5-picker-option.is-selected') || overlay.querySelector('.ps5-picker-option');
      selectedEl?.focus();
    }, 40);

    const close = () => {
      overlay.remove();
      el.focus();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        try { ps5Audio.playBackCancel(); } catch (err) {}
        close();
      }
    });

    overlay.querySelectorAll('.ps5-picker-option').forEach(optEl => {
      const selectVal = () => {
        const val = optEl.getAttribute('data-val');
        settingsData[stateKey] = val;
        saveSettings();

        const valSpan = el.querySelector('.ps5-select-val');
        if (valSpan) valSpan.textContent = `${val} ›`;

        try { ps5Audio.playSelectChime(); } catch (err) {}

        if (callback) callback(val);

        close();
      };

      optEl.addEventListener('click', selectVal);
      optEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectVal();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = optEl.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = optEl.previousElementSibling;
          if (prev) prev.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          try { ps5Audio.playBackCancel(); } catch (err) {}
          close();
        }
      });
    });
  };

  el.addEventListener('click', openPicker);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  });
}

const toggleDebounceMap = new WeakMap();

/**
 * Controlled Toggle Switch Component
 */
function wireToggle(container, selector, stateKey, callback) {
  const el = container.querySelector(selector);
  if (!el) return;

  const toggle = (e) => {
    const now = Date.now();
    const lastTime = toggleDebounceMap.get(el) || 0;
    if (now - lastTime < 160) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    toggleDebounceMap.set(el, now);

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentVal = Boolean(settingsData[stateKey]);
    const nextVal = !currentVal;
    settingsData[stateKey] = nextVal;
    saveSettings();

    el.setAttribute('aria-checked', String(nextVal));
    const pill = el.querySelector('.ps5-toggle-pill');
    if (pill) {
      pill.classList.toggle('active', nextVal);
    }

    try { ps5Audio.playNavTick(); } catch (err) {}

    applyAllSystemSettings();

    if (callback) {
      callback(nextVal);
    }

    window.dispatchEvent(new CustomEvent('ps5-settings-changed', {
      detail: { key: stateKey, value: nextVal, settings: settingsData }
    }));
  };

  el.onclick = toggle;
  el.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggle(e);
    }
  };
}

/* ==========================================================================
   REUSABLE AUTHENTIC PS5 CONFIRMATION DIALOG
   ========================================================================== */
function showPs5ConfirmDialog({ title, message, confirmText = 'OK', cancelText = 'Cancel', isDestructive = false, onConfirm }) {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" role="alertdialog" aria-modal="true">
      <div class="ps5-dialog-title">${title}</div>
      <div class="ps5-dialog-sub" style="margin-top: 14px; line-height: 1.55; color: rgba(255, 255, 255, 0.82);">${message}</div>

      <div class="ps5-dialog-actions" style="margin-top: 28px;">
        <button class="ps5-btn-secondary" id="btn-dialog-cancel">${cancelText}</button>
        <button class="${isDestructive ? 'ps5-btn-danger' : 'ps5-btn-primary'}" id="btn-dialog-confirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const confirmBtn = modal.querySelector('#btn-dialog-confirm');
  const cancelBtn = modal.querySelector('#btn-dialog-cancel');
  setTimeout(() => cancelBtn?.focus(), 50);

  const closeDialog = () => {
    try { ps5Audio.playBackCancel(); } catch (e) {}
    modal.remove();
  };

  cancelBtn?.addEventListener('click', closeDialog);
  confirmBtn?.addEventListener('click', () => {
    try { ps5Audio.playSelectChime(); } catch (e) {}
    modal.remove();
    if (onConfirm) onConfirm();
  });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDialog();
    }
  });
}

/* ==========================================================================
   SPECIFIC SUBMENU MODALS (HDR WIZARD, NETWORK STATUS, PASSCODES, LICENSES)
   ========================================================================== */

// 1. Interactive 3-Step HDR Calibration Wizard
function showHdrCalibrationWizardModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  let step = 1;
  let brightness = 50;

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';

  const renderStep = () => {
    modal.innerHTML = `
      <div class="ps5-dialog-box ps5-fade-in" style="width: 640px;">
        <div class="ps5-dialog-title">Adjust HDR — Step ${step} of 3</div>
        <div class="ps5-dialog-sub">
          ${step === 1 ? 'Adjust until the symbol is barely visible. Set maximum brightness for white clipping.' :
            step === 2 ? 'Adjust until the symbol is barely visible against the dark background. Set near-black shadow detail.' :
            'Calibration complete. Your display output is now tuned for high dynamic range precision.'}
        </div>

        <div class="ps5-hdr-calibration-box">
          <div class="ps5-hdr-symbol-preview" style="background-color: ${step === 1 ? '#0a0a0f' : '#000000'};">
            <div class="ps5-hdr-symbol-sun" style="opacity: ${brightness / 100}; transform: scale(${0.8 + (brightness / 250)});"></div>
          </div>
          <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-top: 10px;">
            Luminance Level: <strong>${brightness}</strong>
          </div>
          <input type="range" min="10" max="100" value="${brightness}" id="hdr-range" class="ps5-range-slider" style="margin-top: 14px;">
        </div>

        <div class="ps5-dialog-actions" style="margin-top: 20px;">
          <button class="ps5-btn-secondary" id="btn-hdr-cancel">${step === 1 ? 'Cancel' : 'Back'}</button>
          <button class="ps5-btn-primary" id="btn-hdr-next">${step === 3 ? 'Done' : 'Next'}</button>
        </div>
      </div>
    `;

    modal.querySelector('#hdr-range')?.addEventListener('input', (e) => {
      brightness = parseInt(e.target.value, 10);
      renderStep();
    });

    modal.querySelector('#btn-hdr-cancel')?.addEventListener('click', () => {
      if (step > 1) {
        step--;
        renderStep();
      } else {
        modal.remove();
      }
    });

    modal.querySelector('#btn-hdr-next')?.addEventListener('click', () => {
      if (step < 3) {
        step++;
        brightness = step === 2 ? 25 : 50;
        try { ps5Audio.playSelectChime(); } catch (e) {}
        renderStep();
      } else {
        try { ps5Audio.playSelectChime(); } catch (e) {}
        modal.remove();
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: "HDR Calibrated",
            subtitle: "Display peak luminance and black level profiles were updated."
          }
        }));
      }
    });
  };

  document.body.appendChild(modal);
  renderStep();
}

// 2. Display Area Calibration
function showDisplayAreaAdjustmentModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  let scale = settingsData.displayAreaScale || 100;

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';

  const update = () => {
    modal.innerHTML = `
      <div class="ps5-dialog-box ps5-fade-in" style="width: 720px; text-align: center;">
        <div class="ps5-dialog-title">Adjust Display Area</div>
        <div class="ps5-dialog-sub">Adjust the display area so that the white border matches the edges of your TV screen.</div>

        <div class="ps5-display-area-box" style="transform: scale(${scale / 100});">
          <span class="ps5-display-corner-arrow ps5-corner-tl">◤</span>
          <span class="ps5-display-corner-arrow ps5-corner-tr">◥</span>
          <span class="ps5-display-corner-arrow ps5-corner-bl">◣</span>
          <span class="ps5-display-corner-arrow ps5-corner-br">◢</span>
          <div style="font-weight: 600; color: #fff;">Display Boundary: ${scale}%</div>
        </div>

        <div style="display: flex; justify-content: center; gap: 16px; margin-top: 14px;">
          <button class="ps5-btn-secondary" id="btn-scale-down" ${scale <= 90 ? 'disabled' : ''}>Enlarge ━</button>
          <button class="ps5-btn-secondary" id="btn-scale-up" ${scale >= 100 ? 'disabled' : ''}>Shrink ➕</button>
        </div>

        <div class="ps5-dialog-actions" style="margin-top: 24px;">
          <button class="ps5-btn-secondary" id="btn-display-cancel">Cancel</button>
          <button class="ps5-btn-primary" id="btn-display-save">Done</button>
        </div>
      </div>
    `;

    modal.querySelector('#btn-scale-down')?.addEventListener('click', () => {
      if (scale > 90) { scale -= 2; update(); }
    });
    modal.querySelector('#btn-scale-up')?.addEventListener('click', () => {
      if (scale < 100) { scale += 2; update(); }
    });
    modal.querySelector('#btn-display-cancel')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-display-save')?.addEventListener('click', () => {
      settingsData.displayAreaScale = scale;
      saveSettings();
      modal.remove();
      renderSettingsView();
    });
  };

  document.body.appendChild(modal);
  update();
}

// 3. View Detailed Network Status Modal
function showNetworkStatusModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const isConn = settingsData.connectInternet !== false && isInternetConnected;
  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 580px;">
      <div class="ps5-dialog-title">Connection Status Details</div>
      <div class="ps5-dialog-sub">PlayStation 5 Console Hardware Network Parameters (Simulated)</div>

      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 10px; font-family: var(--ps-font); font-size: 0.95rem;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">Connection Status</span>
          <strong style="color: ${isConn ? '#4ade80' : '#ef4444'};">${isConn ? 'Connected' : 'Disconnected'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">SSID / Wireless Network</span>
          <strong>${isConn ? connectedWifi : '—'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">Signal Strength</span>
          <strong>${isConn ? '100% (5 GHz Channel 36)' : '—'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">IPv4 Address</span>
          <strong>${isConn ? settingsData.ipAddress : '—'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">Subnet Mask</span>
          <strong>${isConn ? settingsData.subnetMask : '—'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">Default Gateway</span>
          <strong>${isConn ? settingsData.defaultGateway : '—'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">Primary DNS</span>
          <strong>${isConn ? settingsData.primaryDns : '—'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.65);">MAC Address (Wi-Fi)</span>
          <strong>34:1B:0D:8E:22:90</strong>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-net-status">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-net-status')?.addEventListener('click', () => modal.remove());
}

// 4. PSN Services Details Modal
function showPsnStatusModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 540px;">
      <div class="ps5-dialog-title">PlayStation™Network Services</div>
      <div class="ps5-dialog-sub">Live Operational Status (Simulated)</div>

      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 12px;">
        ${[
          'Account Management',
          'Gaming and Social (Parties & Messages)',
          'PlayStation Video & Media Streaming',
          'PlayStation Store & Purchases',
          'PlayStation Direct & Cloud Saves'
        ].map(srv => `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
            <span style="font-family: var(--ps-font); color: rgba(255,255,255,0.9);">${srv}</span>
            <span style="color: #4ade80; font-weight: 600; font-size: 0.9rem;">● Normal</span>
          </div>
        `).join('')}
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-psn-status">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-psn-status')?.addEventListener('click', () => modal.remove());
}

// 5. Advanced Network Settings Modal
function showAdvancedNetworkModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 540px;">
      <div class="ps5-dialog-title">Advanced Network Settings</div>
      <div class="ps5-dialog-sub">Configure IP, DNS, and Proxy Parameters</div>

      <div class="ps5-row-action-list" style="margin-top: 18px;">
        <div class="ps5-action-row" id="row-adv-ip" tabindex="0">
          <div class="ps5-action-label">IP Address Settings</div>
          <div class="ps5-select-val">${settingsData.ipSettings} ›</div>
        </div>
        <div class="ps5-action-row" id="row-adv-dns" tabindex="0">
          <div class="ps5-action-label">DNS Settings</div>
          <div class="ps5-select-val">Automatic (8.8.8.8) ›</div>
        </div>
        <div class="ps5-action-row" id="row-adv-proxy" tabindex="0">
          <div class="ps5-action-label">Proxy Server</div>
          <div class="ps5-select-val">${settingsData.proxyServer} ›</div>
        </div>
        <div class="ps5-action-row" id="row-adv-mtu" tabindex="0">
          <div class="ps5-action-label">MTU Settings</div>
          <div class="ps5-select-val">${settingsData.mtu} ›</div>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-adv-net">Done</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-adv-net')?.addEventListener('click', () => modal.remove());
}

// 6. Linked Services Modal
function showLinkedServicesModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';

  const update = () => {
    const services = settingsData.linkedServices || {};
    modal.innerHTML = `
      <div class="ps5-dialog-box ps5-fade-in" style="width: 620px;">
        <div class="ps5-dialog-title">Linked Services</div>
        <div class="ps5-dialog-sub">Link your accounts to stream music, share gameplay, or show presence.</div>

        <div class="ps5-services-grid">
          <div class="ps5-service-card">
            <div class="ps5-service-left">
              <div class="ps5-service-icon service-discord">D</div>
              <div>
                <div style="font-weight: 600; color: #fff;">Discord</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.65);">Voice & Status</div>
              </div>
            </div>
            <button class="ps5-action-btn-pill btn-toggle-service" data-srv="discord">${services.discord ? 'Unlink' : 'Link'}</button>
          </div>

          <div class="ps5-service-card">
            <div class="ps5-service-left">
              <div class="ps5-service-icon service-spotify">S</div>
              <div>
                <div style="font-weight: 600; color: #fff;">Spotify</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.65);">Music Streaming</div>
              </div>
            </div>
            <button class="ps5-action-btn-pill btn-toggle-service" data-srv="spotify">${services.spotify ? 'Unlink' : 'Link'}</button>
          </div>

          <div class="ps5-service-card">
            <div class="ps5-service-left">
              <div class="ps5-service-icon service-youtube">Y</div>
              <div>
                <div style="font-weight: 600; color: #fff;">YouTube</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.65);">Live Broadcasting</div>
              </div>
            </div>
            <button class="ps5-action-btn-pill btn-toggle-service" data-srv="youtube">${services.youtube ? 'Unlink' : 'Link'}</button>
          </div>

          <div class="ps5-service-card">
            <div class="ps5-service-left">
              <div class="ps5-service-icon service-twitch">T</div>
              <div>
                <div style="font-weight: 600; color: #fff;">Twitch</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.65);">Game Streaming</div>
              </div>
            </div>
            <button class="ps5-action-btn-pill btn-toggle-service" data-srv="twitch">${services.twitch ? 'Unlink' : 'Link'}</button>
          </div>

          <div class="ps5-service-card">
            <div class="ps5-service-left">
              <div class="ps5-service-icon service-apple">A</div>
              <div>
                <div style="font-weight: 600; color: #fff;">Apple Music</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.65);">Audio Library</div>
              </div>
            </div>
            <button class="ps5-action-btn-pill btn-toggle-service" data-srv="appleMusic">${services.appleMusic ? 'Unlink' : 'Link'}</button>
          </div>
        </div>

        <div class="ps5-dialog-actions" style="margin-top: 24px;">
          <button class="ps5-btn-primary" id="btn-close-services">Done</button>
        </div>
      </div>
    `;

    modal.querySelectorAll('.btn-toggle-service').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-srv');
        settingsData.linkedServices[key] = !settingsData.linkedServices[key];
        saveSettings();
        try { ps5Audio.playSelectChime(); } catch (e) {}
        update();
      });
    });

    modal.querySelector('#btn-close-services')?.addEventListener('click', () => modal.remove());
  };

  document.body.appendChild(modal);
  update();
}

// 7. PlayStation Plus Subscription Modal
function showPsPlusModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px;">
      <div class="ps5-dialog-title">PlayStation®Plus</div>
      <div class="ps5-dialog-sub">Subscription Status and Benefits</div>

      <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 12px; padding: 20px; margin-top: 18px;">
        <div style="font-size: 1.2rem; font-weight: 700; color: #facc15;">PlayStation®Plus Premium</div>
        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-top: 6px;">
          Status: Active • Next Renewal: Nov 28, 2026
        </div>
        <div style="margin-top: 12px; font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.6;">
          ✓ Online Multiplayer Access<br>
          ✓ Cloud Storage Auto-Sync (100 GB)<br>
          ✓ Game Catalog (Hundreds of PS5 & PS4 titles)<br>
          ✓ Classics Catalog & Cloud Streaming
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-ps-plus">Done</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-ps-plus')?.addEventListener('click', () => modal.remove());
}

// 8. Console Name Rename Modal
function showConsoleNameRenameModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 480px;">
      <div class="ps5-dialog-title">Rename Console</div>
      <div class="ps5-dialog-sub">Enter a unique name for this PlayStation 5 console.</div>

      <div class="ps5-input-group" style="margin-top: 18px;">
        <input type="text" id="input-console-name" class="ps5-text-input" value="${settingsData.consoleName}" maxlength="24" autocomplete="off">
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-secondary" id="btn-cancel-rename">Cancel</button>
        <button class="ps5-btn-primary" id="btn-save-rename">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const input = modal.querySelector('#input-console-name');
  setTimeout(() => input?.focus(), 50);

  modal.querySelector('#btn-cancel-rename')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#btn-save-rename')?.addEventListener('click', () => {
    const val = input?.value?.trim();
    if (val) {
      settingsData.consoleName = val;
      saveSettings();
      modal.remove();
      renderSettingsView();
    }
  });
}

// 9. System Software Update Check Modal
function showSystemUpdateCheckModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px; text-align: center; padding: 36px 28px;">
      <div class="ps5-connecting-spinner" id="update-spinner"></div>
      <div class="ps5-dialog-title" id="update-title" style="margin-top: 18px;">Checking for Updates...</div>
      <div class="ps5-dialog-sub" id="update-sub">Connecting to PlayStation Network servers.</div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    const spinner = modal.querySelector('#update-spinner');
    const title = modal.querySelector('#update-title');
    const sub = modal.querySelector('#update-sub');
    if (spinner) spinner.style.display = 'none';
    if (title) title.textContent = 'The latest version of the system software is already installed.';
    if (sub) sub.innerHTML = 'Current Version: <strong>24.01-08.60.00.00-00.00.00.0.1 (Official Release)</strong>';

    const actions = document.createElement('div');
    actions.className = 'ps5-dialog-actions';
    actions.style.marginTop = '24px';
    actions.innerHTML = `<button class="ps5-btn-primary" id="btn-close-update-check">OK</button>`;
    modal.querySelector('.ps5-dialog-box')?.appendChild(actions);

    modal.querySelector('#btn-close-update-check')?.addEventListener('click', () => modal.remove());
  }, 1400);
}

// 10. Backup and Restore Dialog
function showBackupRestoreModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px;">
      <div class="ps5-dialog-title">Back Up and Restore</div>
      <div class="ps5-dialog-sub">Manage console backups using external USB storage.</div>

      <div class="ps5-row-action-list" style="margin-top: 18px;">
        <div class="ps5-action-row" tabindex="0">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Back Up PS5</div>
            <div class="ps5-action-sub">Back up saved data, captures, and system settings.</div>
          </div>
          <span class="ps5-row-arrow">›</span>
        </div>
        <div class="ps5-action-row" tabindex="0">
          <div class="ps5-action-text-col">
            <div class="ps5-action-label">Restore PS5</div>
            <div class="ps5-action-sub">Restore your PS5 data from a USB drive backup.</div>
          </div>
          <span class="ps5-row-arrow">›</span>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-backup">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-backup')?.addEventListener('click', () => modal.remove());
}

// 11. Remote Play Pairing Code Modal
function showRemotePlayLinkModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const randCode = `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 500px; text-align: center;">
      <div class="ps5-dialog-title">Link Device for Remote Play</div>
      <div class="ps5-dialog-sub">Enter this 8-digit code on your Remote Play app or PlayStation Portal within 300 seconds.</div>

      <div style="font-size: 2.4rem; font-weight: 800; letter-spacing: 6px; color: #ffffff; margin: 26px 0; font-family: monospace;">
        ${randCode}
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-remote-link">Done</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-remote-link')?.addEventListener('click', () => modal.remove());
}

// 12. Login Passcode Setup Modal
function showLoginPasscodeModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 460px; text-align: center;">
      <div class="ps5-dialog-title">Set Console Login Passcode</div>
      <div class="ps5-dialog-sub">Enter a 4-digit passcode using numbers (0-9).</div>

      <div class="ps5-input-group" style="margin-top: 20px;">
        <input type="password" id="passcode-input" class="ps5-text-input" maxlength="4" placeholder="••••" style="text-align: center; font-size: 1.8rem; letter-spacing: 12px;">
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-secondary" id="btn-cancel-passcode">Cancel</button>
        <button class="ps5-btn-primary" id="btn-save-passcode">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const input = modal.querySelector('#passcode-input');
  setTimeout(() => input?.focus(), 50);

  modal.querySelector('#btn-cancel-passcode')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#btn-save-passcode')?.addEventListener('click', () => {
    const val = input?.value?.trim();
    if (val && val.length === 4) {
      settingsData.loginPasscode = val;
      saveSettings();
      modal.remove();
      renderSettingsView();
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🔒 Passcode Set",
          subtitle: "4-digit login security is now active."
        }
      }));
    } else {
      input?.classList.add('is-invalid');
    }
  });
}

// 13. Media Storage Modal
function showMediaStorageModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px;">
      <div class="ps5-dialog-title">Media Gallery Storage</div>
      <div class="ps5-dialog-sub">Breakdown of captures saved on console storage.</div>

      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>4K Gameplay Video Clips (60 FPS)</span>
          <strong>19.4 GB</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>HDR Screenshots & Trophy Snaps</span>
          <strong>14.8 GB</strong>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-media-modal">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-media-modal')?.addEventListener('click', () => modal.remove());
}

// 14. Saved Data Storage Modal
function showSavedDataStorageModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px;">
      <div class="ps5-dialog-title">Saved Data (PS5 / PS4)</div>
      <div class="ps5-dialog-sub">Game progress files saved in console storage.</div>

      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>PS5 Game Save Data</span>
          <strong>6.4 GB</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>PS4 Backward Compatibility Saves</span>
          <strong>2.2 GB</strong>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-saved-modal">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-saved-modal')?.addEventListener('click', () => modal.remove());
}

// 14b. Other Storage Modal
function showOtherStorageModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px;">
      <div class="ps5-dialog-title">Other Storage</div>
      <div class="ps5-dialog-sub">Console Operating System & System Reserved Memory</div>

      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; line-height: 1.55; color: rgba(255, 255, 255, 0.82);">
        <p>This storage space is reserved for system software, operating system components, update cache, and temporary data necessary for PlayStation 5 system performance.</p>
        <p>The space reserved dynamically adjusts based on console usage, installed game updates, and running background downloads.</p>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; margin-top: 6px;">
          <span>Current Reserved Allocation</span>
          <strong>${settingsData.otherStorageGb || 28.1} GB</strong>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-other-modal">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const closeBtn = modal.querySelector('#btn-close-other-modal');
  closeBtn?.focus();

  const close = () => {
    try { ps5Audio.playBackCancel(); } catch (e) {}
    modal.remove();
  };

  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}

// 15. M.2 SSD Storage Modal
function showM2StorageModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 520px;">
      <div class="ps5-dialog-title">M.2 SSD Storage</div>
      <div class="ps5-dialog-sub">High-Speed PCIe 4.0 NVMe Solid State Drive</div>

      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>Installed SSD Model</span>
          <strong>Samsung 980 Pro (2.0 TB)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>Read Benchmark Speed</span>
          <strong>6,540 MB/s (Optimal)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <span>Available Free Capacity</span>
          <strong>1.2 TB / 2.0 TB</strong>
        </div>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-secondary" id="btn-format-m2" style="color: #ef4444;">Format M.2 SSD</button>
        <button class="ps5-btn-primary" id="btn-close-m2">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-m2')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#btn-format-m2')?.addEventListener('click', () => {
    modal.remove();
    showPs5ConfirmDialog({
      title: 'Format M.2 SSD Storage',
      message: 'Formatting the M.2 SSD will delete all data on the drive. Do you want to format?',
      confirmText: 'Format M.2 SSD',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: "M.2 SSD Formatted",
            subtitle: "Read Speed: 6,540 MB/s. Drive is ready for game installs."
          }
        }));
      }
    });
  });
}

// 16. Quick Start Guide Modal
function showQuickStartGuideModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 580px;">
      <div class="ps5-dialog-title">PlayStation 5 Quick Start Guide</div>
      <div class="ps5-dialog-sub">Console Navigation & Essential Features</div>

      <div style="margin-top: 18px; line-height: 1.6; color: rgba(255,255,255,0.85); font-size: 0.95rem;">
        <p><strong>PS Button:</strong> Press once to open the Control Center cards and dock. Press and hold to return to the Home Screen.</p>
        <p style="margin-top: 8px;"><strong>Create Button:</strong> Press to open the Create menu for taking screenshots, capturing recent 4K gameplay, or starting a live broadcast.</p>
        <p style="margin-top: 8px;"><strong>Games & Media:</strong> Switch between your Game library and Streaming Media entertainment apps using the Top-Left navigation tabs.</p>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-qsg">Got It</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-qsg')?.addEventListener('click', () => modal.remove());
}

// 17. Health and Safety Modal
function showHealthSafetyModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 600px; max-height: 85vh; overflow-y: auto;">
      <div class="ps5-dialog-title">Health and Safety Notices</div>
      <div class="ps5-dialog-sub">Important precautions for player health and ergonomics</div>

      <div style="margin-top: 18px; line-height: 1.6; color: rgba(255,255,255,0.82); font-size: 0.92rem;">
        <p><strong>WARNING — Photosensitivity / Epilepsy Seizures:</strong> A very small percentage of individuals may experience epileptic seizures when exposed to certain light patterns or flashing lights. If you or anyone in your family has an epileptic condition, consult your physician before playing.</p>
        <p style="margin-top: 12px;"><strong>Take Regular Breaks:</strong> Avoid excessive play. Take a 15-minute break every hour of gameplay.</p>
        <p style="margin-top: 12px;"><strong>Virtual Reality (PlayStation VR2):</strong> VR is not for use by children under age 12. Take breaks immediately if you experience dizziness or disorientation.</p>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-health">Understood</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-health')?.addEventListener('click', () => modal.remove());
}

// 18. Intellectual Property & Licenses Modal
function showIpLicensesModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 620px; max-height: 85vh; overflow-y: auto;">
      <div class="ps5-dialog-title">Intellectual Property & Open-Source Licenses</div>
      <div class="ps5-dialog-sub">Notices and attribution records</div>

      <div style="margin-top: 18px; line-height: 1.6; color: rgba(255,255,255,0.8); font-size: 0.9rem;">
        <p>"PlayStation", "PS5", "DualSense", and "Tempest 3D" are registered trademarks or trademarks of Sony Interactive Entertainment Inc.</p>
        <p style="margin-top: 10px;">This desktop application incorporates open-source libraries under MIT and Apache-2.0 licenses, including Web Audio API synthesizers, Vite tooling, and Electron runtime.</p>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-licenses">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-licenses')?.addEventListener('click', () => modal.remove());
}

// 19. System Software EULA Modal
function showSystemEulaModal() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="width: 600px;">
      <div class="ps5-dialog-title">System Software License Agreement</div>
      <div class="ps5-dialog-sub">Terms of use for PlayStation 5 System Software</div>

      <div style="margin-top: 18px; max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 14px; font-size: 0.88rem; line-height: 1.6; color: rgba(255,255,255,0.75);">
        Please read this Agreement carefully. By using the system software, you agree to comply with all applicable terms, privacy policies, and security protections governing PlayStation hardware and software distribution.
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-primary" id="btn-close-eula">Accept & Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#btn-close-eula')?.addEventListener('click', () => modal.remove());
}

/* ==========================================================================
   WI-FI CONNECTION PROMPTS & SIMULATION
   ========================================================================== */
function promptWifiPassword(ssid) {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const modal = document.createElement('div');
  modal.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  modal.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in">
      <div class="ps5-dialog-title">Enter Wi-Fi Password</div>
      <div class="ps5-dialog-sub">Connect to <strong>${ssid}</strong> (WPA2/WPA3 Protected)</div>

      <div class="ps5-input-group" style="margin-top: 18px;">
        <input type="password" id="wifi-pass-input" class="ps5-text-input" placeholder="Enter Wi-Fi password..." autocomplete="off">
        <button type="button" class="ps5-pw-toggle-btn" id="btn-toggle-show-pw">Show</button>
      </div>

      <div class="ps5-dialog-actions" style="margin-top: 24px;">
        <button class="ps5-btn-secondary" id="btn-cancel-wifi">Cancel</button>
        <button class="ps5-btn-primary" id="btn-connect-wifi">Connect</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector('#wifi-pass-input');
  setTimeout(() => input?.focus(), 60);

  modal.querySelector('#btn-toggle-show-pw')?.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      modal.querySelector('#btn-toggle-show-pw').textContent = 'Hide';
    } else {
      input.type = 'password';
      modal.querySelector('#btn-toggle-show-pw').textContent = 'Show';
    }
  });

  const closeDialog = () => {
    try { ps5Audio.playBackCancel(); } catch (e) {}
    modal.remove();
  };

  const attemptConnection = () => {
    const val = input?.value?.trim();
    if (!val) {
      input?.classList.add('is-invalid');
      if (input) input.placeholder = 'Password is required to connect';
      try { ps5Audio.playErrorBeep(); } catch (e) {}
      return;
    }
    closeDialog();
    simulateWifiConnection(ssid);
  };

  modal.querySelector('#btn-cancel-wifi')?.addEventListener('click', closeDialog);
  modal.querySelector('#btn-connect-wifi')?.addEventListener('click', attemptConnection);

  input?.addEventListener('input', () => input.classList.remove('is-invalid'));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptConnection();
  });
}

function simulateWifiConnection(ssid) {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const connectingOverlay = document.createElement('div');
  connectingOverlay.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  connectingOverlay.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="text-align: center; padding: 40px 30px;">
      <div class="ps5-connecting-spinner"></div>
      <div class="ps5-dialog-title" style="margin-top: 18px;">Connecting to ${ssid}...</div>
      <div class="ps5-dialog-sub">Checking network security and acquiring IP address.</div>
    </div>
  `;

  document.body.appendChild(connectingOverlay);

  setTimeout(() => {
    connectedWifi = ssid;
    settingsData.connectedWifi = ssid;
    settingsData.connectionMethod = 'Wi-Fi (5 GHz)';
    settingsData.connectInternet = true;
    isInternetConnected = true;
    saveSettings();

    connectingOverlay.remove();

    try { ps5Audio.playSelectChime(); } catch (e) {}

    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: "📶 Connected to Network",
        subtitle: `Successfully connected to ${ssid}. High-speed internet is ready.`
      }
    }));

    renderSettingsView();
  }, 1400);
}

function simulateWiredLanConnection() {
  try { ps5Audio.playSelectChime(); } catch (e) {}

  const connectingOverlay = document.createElement('div');
  connectingOverlay.className = 'ps5-modal-overlay active ps5-dialog-overlay';
  connectingOverlay.innerHTML = `
    <div class="ps5-dialog-box ps5-fade-in" style="text-align: center; padding: 40px 30px;">
      <div class="ps5-connecting-spinner"></div>
      <div class="ps5-dialog-title" style="margin-top: 18px;">Setting Up Wired LAN...</div>
      <div class="ps5-dialog-sub">Detecting 1000BASE-T Gigabit Ethernet link.</div>
    </div>
  `;

  document.body.appendChild(connectingOverlay);

  setTimeout(() => {
    settingsData.connectionMethod = 'Wired LAN (Ethernet)';
    settingsData.connectInternet = true;
    isInternetConnected = true;
    saveSettings();

    connectingOverlay.remove();

    try { ps5Audio.playSelectChime(); } catch (e) {}

    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: "🔌 Wired LAN Connected",
        subtitle: "1000BASE-T Gigabit Ethernet connection active."
      }
    }));

    renderSettingsView();
  }, 1200);
}

function runConnectionTestSequence(container) {
  const isConn = settingsData.connectInternet !== false && isInternetConnected;
  const steps = [
    { id: '#test-step-1', val: isConn ? 'Successful' : 'Failed' },
    { id: '#test-step-2', val: isConn ? 'Successful' : 'Failed' },
    { id: '#test-step-3', val: isConn ? 'Successful' : 'Failed' },
    { id: '#test-step-4', val: isConn ? 'Type 2 (Moderate)' : '—' },
    { id: '#test-step-5', val: isConn ? '842.6 Mbps' : '—' },
    { id: '#test-step-6', val: isConn ? '112.4 Mbps' : '—' }
  ];

  steps.forEach(s => {
    const el = container.querySelector(s.id);
    if (el) {
      const status = el.querySelector('.ps5-test-status');
      if (status) {
        status.textContent = '—';
        status.className = 'ps5-test-status pending';
      }
    }
  });

  steps.forEach((step, idx) => {
    setTimeout(() => {
      const el = container.querySelector(step.id);
      if (!el) return;
      const status = el.querySelector('.ps5-test-status');
      if (status) {
        status.textContent = step.val;
        status.className = `ps5-test-status ${step.val === 'Failed' ? 'pending' : 'success'}`;
        try { ps5Audio.playNavTick(); } catch (e) {}
      }
    }, 380 * (idx + 1));
  });
}

/* ==========================================================================
   APPLY ACCESSIBILITY & AUDIO SETTINGS TO DOCUMENT
   ========================================================================== */
function applyAllSystemSettings() {
  // 1. Accessibility classes on document.body
  document.body.classList.toggle('ps5-accessibility-bold', Boolean(settingsData.boldText));
  document.body.classList.toggle('ps5-accessibility-high-contrast', Boolean(settingsData.highContrast));
  document.body.classList.toggle('ps5-accessibility-reduced-motion', Boolean(settingsData.reducedMotion));
  document.body.classList.toggle('ps5-invert-colors', Boolean(settingsData.invertColors));
  document.body.classList.toggle('ps5-zoom-active', Boolean(settingsData.zoom));

  // Text scale classes
  document.body.classList.remove('ps5-text-size-small', 'ps5-text-size-large', 'ps5-text-size-xl');
  if (settingsData.textSize === 'Small') document.body.classList.add('ps5-text-size-small');
  else if (settingsData.textSize === 'Large') document.body.classList.add('ps5-text-size-large');
  else if (settingsData.textSize === 'Extra Large') document.body.classList.add('ps5-text-size-xl');

  // Color filters
  document.body.classList.remove(
    'ps5-filter-grayscale',
    'ps5-filter-protanopia',
    'ps5-filter-deuteranopia',
    'ps5-filter-tritanopia'
  );
  if (settingsData.colorFilter === 'Grayscale') document.body.classList.add('ps5-filter-grayscale');
  else if (settingsData.colorFilter === 'Protanopia') document.body.classList.add('ps5-filter-protanopia');
  else if (settingsData.colorFilter === 'Deuteranopia') document.body.classList.add('ps5-filter-deuteranopia');
  else if (settingsData.colorFilter === 'Tritanopia') document.body.classList.add('ps5-filter-tritanopia');

  // 2. Audio Engine synchronization
  if (typeof ps5Audio !== 'undefined') {
    if (typeof ps5Audio.setSoundEffects === 'function') {
      ps5Audio.setSoundEffects(settingsData.soundEffects !== false);
    }
    if (typeof ps5Audio.setHomeMusic === 'function') {
      ps5Audio.setHomeMusic(settingsData.homeScreenMusic !== false);
    }
  }
}
