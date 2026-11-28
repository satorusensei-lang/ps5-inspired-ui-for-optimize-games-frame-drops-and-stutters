const { app, BrowserWindow, ipcMain, shell, globalShortcut, dialog, protocol, net } = require('electron');
const path = require('path');
const http = require('http');
const child_process = require('child_process');
const fs = require('fs');
const util = require('util');
const { pathToFileURL } = require('url');
const { readXboxAccountGames, stripXboxPlatformSuffix, mergeXboxMetadataIntoRecord } = require('./xbox-sync.cjs');
const { createGameBoostManager } = require('./game-boost.cjs');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

const execAsync = util.promisify(child_process.exec);
const execFileAsync = util.promisify(child_process.execFile);
let mainWindow = null;
let viteProcess = null;
let isGameplayBoostPaused = false;
let lastBoostOptions = { boostRestoreClosedApps: false };
let launchReadinessProcess = null;
let isAwaitingGameLoad = false;
let launchPrevAlwaysOnTop = false;
let launchShouldMinimizeWhenReady = true;
let launchTargetMeta = null;

// Set Windows AppUserModelId for authentic taskbar grouping & icon display
if (process.platform === 'win32') {
  app.setAppUserModelId('com.sony.playstation5');
}

// --------------------------------------------------------------------------
// Persistent Atomic Database Storage Engine (ps5_library.json, ps5_settings.json)
// --------------------------------------------------------------------------
function getUserDataDir() {
  try {
    return app.getPath('userData');
  } catch (e) {
    return process.env.APPDATA ? path.join(process.env.APPDATA, 'MYRAA') : path.join(__dirname, '..', 'data');
  }
}

function getCacheRootDir() {
  if (app.isPackaged) {
    return path.join(getUserDataDir(), 'cache');
  }
  return path.join(__dirname, '..', 'public', 'assets', 'cache');
}

function getStaticAssetsRoot() {
  if (app.isPackaged) {
    return path.join(__dirname, '..', 'dist');
  }
  return path.join(__dirname, '..', 'public');
}

class JsonStore {
  constructor(filePath, defaults) {
    this.filePath = filePath;
    this.defaults = defaults;
    this.timer = null;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return { ...structuredClone(this.defaults), ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn(`[Store] Error reading ${this.filePath}, trying backup:`, e.message);
      try {
        const bakPath = this.filePath + '.bak';
        if (fs.existsSync(bakPath)) {
          const rawBak = fs.readFileSync(bakPath, 'utf8');
          return { ...structuredClone(this.defaults), ...JSON.parse(rawBak) };
        }
      } catch (e2) {}
    }
    return structuredClone(this.defaults);
  }

  saveSoon(delay = 300) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.saveNow(), delay);
  }

  saveNow() {
    clearTimeout(this.timer);
    this.timer = null;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = this.filePath + '.tmp';
      const bak = this.filePath + '.bak';
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
      if (fs.existsSync(this.filePath)) {
        try { fs.copyFileSync(this.filePath, bak); } catch (e) {}
      }
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      console.error('[Store] Failed to save', this.filePath, err);
    }
  }
}

let libraryStore = null;
let settingsStore = null;

function getLibraryStore() {
  if (!libraryStore) {
    const dataDir = getUserDataDir();
    libraryStore = new JsonStore(path.join(dataDir, 'ps5_library.json'), { games: [] });
  }
  return libraryStore;
}

function getSettingsStore() {
  if (!settingsStore) {
    const dataDir = getUserDataDir();
    settingsStore = new JsonStore(path.join(dataDir, 'ps5_settings.json'), {});
  }
  return settingsStore;
}

const gameBoost = createGameBoostManager(getUserDataDir);

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function checkDevServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(600, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function ensureDevServer(url) {
  if (await checkDevServer(url)) return true;
  console.log('[Electron] Starting local Vite server for dashboard services...');
  try {
    const isWin = process.platform === 'win32';
    const localVite = isWin
      ? path.join(__dirname, '../node_modules/.bin/vite.cmd')
      : path.join(__dirname, '../node_modules/.bin/vite');

    if (fs.existsSync(localVite)) {
      viteProcess = child_process.spawn(localVite, ['--port', '5173'], {
        cwd: path.join(__dirname, '..'),
        shell: isWin,
        stdio: 'ignore',
        windowsHide: isWin
      });
    } else {
      viteProcess = child_process.spawn('npx', ['vite', '--port', '5173'], {
        cwd: path.join(__dirname, '..'),
        shell: isWin,
        stdio: 'ignore',
        windowsHide: isWin
      });
    }

    for (let i = 0; i < 35; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (await checkDevServer(url)) {
        console.log('[Electron] Local Vite server is online!');
        return true;
      }
    }
  } catch (err) {
    console.warn('[Electron] Could not spawn Vite server:', err);
  }
  return false;
}

async function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'icon.ico')
    : path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#050508',
    title: 'PlayStation 5',
    icon: iconPath,
    frame: false, // Frameless for authentic PS5 console borderless experience
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Keep Steam progress polling and its UI updates live while MYRAA is
      // covered by Steam or another window. Electron throttles hidden pages
      // by default, which can leave the dashboard showing an old snapshot.
      backgroundThrottling: false,
      webSecurity: false // Allows smooth loading of local game covers & media assets
    }
  });

  if (fs.existsSync(iconPath)) {
    try {
      mainWindow.setIcon(iconPath);
    } catch (e) {}
  }

  // Smooth show once ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Track fullscreen and minimize/restore idle state (so UI animations pause when covered/minimized)
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-changed', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-changed', false);
  });
  mainWindow.on('minimize', () => {
    if (isAwaitingGameLoad) {
      releaseLaunchGuard({ minimize: false });
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (gameBoost.getCurrentState().active) {
        try { mainWindow.webContents.setBackgroundThrottling(true); } catch (e) {}
      }
      mainWindow.webContents.send('window:idle-state', true);
    }
  });
  mainWindow.on('restore', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try { mainWindow.webContents.setBackgroundThrottling(false); } catch (e) {}
      mainWindow.webContents.send('window:idle-state', false);
    }
  });

  // Ensure local dashboard services / dev server are running
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  let isDev = false;
  if (!app.isPackaged) {
    isDev = await ensureDevServer(devServerUrl);
  }

  if (isDev) {
    console.log(`[Electron] Connecting to Vite dev server at ${devServerUrl}...`);
    await mainWindow.loadURL(devServerUrl);
  } else {
    console.log('[Electron] Loading production bundle via app://myraa/index.html...');
    await mainWindow.loadURL('app://myraa/index.html');
  }

  // Window-scoped F11 for Fullscreen Toggle, and F5 / Ctrl+R for Reload (does not hijack Windows OS shortcuts)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F11') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
          event.preventDefault();
        }
      } else if (input.key === 'F5' || ((input.control || input.meta) && input.key.toLowerCase() === 'r')) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
          event.preventDefault();
        }
      }
    }
  });

  // In Electron development mode, the renderer polls the Vite downloads endpoint.
  // Do not run a second CDP poller in parallel; packaged builds use this main-process poller.
  if (!isDev) startSteamDownloadPolling();

  // Recover any leftover Windows power scheme from an unexpected exit and pre-cache CPU/GPU profile
  gameBoost.recoverLeftoverBoostOnStartup().catch(() => {});
  gameBoost.warmupSystemProfile?.().catch(() => {});

  // Auto-sync Steam library & auto-download game card and background whenever PS5 opens
  setTimeout(async () => {
    try {
      await syncLiveFavoritesFromSteamClient();
      startSteamLibraryWatcher();
      autoDownloadAllSteamArtworks(getSteamArtworkAppIds());
    } catch (e) {
      console.warn('[Steam Auto-Sync] Startup sync warning:', e.message);
    }
  }, 400);
}

// Steam library discovery and executable resolution helpers
const candidateSteamDirs = [
  'C:\\Program Files (x86)\\Steam',
  'C:\\Program Files\\Steam',
  'C:\\Steam',
  'C:\\SteamLibrary',
  'D:\\Steam',
  'D:\\SteamLibrary',
  'D:\\Program Files (x86)\\Steam',
  'D:\\Program Files\\Steam',
  'E:\\Steam',
  'E:\\SteamLibrary',
  'F:\\Steam',
  'F:\\SteamLibrary',
  'G:\\Steam',
  'G:\\SteamLibrary'
];

function getExistingWindowsDrives() {
  const drives = [];
  for (let code = 67; code <= 90; code++) {
    const d = String.fromCharCode(code);
    try {
      if (fs.existsSync(`${d}:\\`)) drives.push(d);
    } catch (e) {}
  }
  return drives;
}

let cachedRegistrySteamDirs = null;
function getSteamInstallDirs() {
  const dirs = new Set(candidateSteamDirs);
  if (process.platform === 'win32') {
    if (process.env['ProgramFiles(x86)']) dirs.add(path.normalize(path.join(process.env['ProgramFiles(x86)'], 'Steam')));
    if (process.env.ProgramFiles) dirs.add(path.normalize(path.join(process.env.ProgramFiles, 'Steam')));
    for (const d of getExistingWindowsDrives()) {
      dirs.add(`${d}:\\Steam`);
      dirs.add(`${d}:\\SteamLibrary`);
    }
    if (cachedRegistrySteamDirs === null) {
      cachedRegistrySteamDirs = [];
      const regQueries = [
        ['HKCU\\Software\\Valve\\Steam', 'SteamPath'],
        ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'],
        ['HKLM\\SOFTWARE\\Valve\\Steam', 'InstallPath']
      ];
      for (const [key, valName] of regQueries) {
        try {
          const out = child_process.execFileSync('reg.exe', ['query', key, '/v', valName], {
            windowsHide: true,
            encoding: 'utf8',
            timeout: 1500,
            stdio: ['ignore', 'pipe', 'ignore']
          });
          const m = out.match(new RegExp(`${valName}\\s+REG_\\w+\\s+(.+)`, 'i'));
          if (m && m[1]) {
            const p = path.normalize(m[1].trim());
            if (fs.existsSync(p)) cachedRegistrySteamDirs.push(p);
          }
        } catch (e) {}
      }
    }
    for (const rd of cachedRegistrySteamDirs) dirs.add(rd);
  }
  return [...dirs].filter(d => {
    try { return fs.existsSync(d); } catch (e) { return false; }
  });
}

function getSteamLibraryFolders() {
  const steamLibraryFolders = new Set();
  const dirsToCheck = getSteamInstallDirs();
  for (const sDir of dirsToCheck) {
    if (fs.existsSync(sDir)) {
      const sApps = path.join(sDir, 'steamapps');
      if (fs.existsSync(sApps)) {
        steamLibraryFolders.add(sApps);
        const libVdf = path.join(sApps, 'libraryfolders.vdf');
        if (fs.existsSync(libVdf)) {
          try {
            const vdfContent = fs.readFileSync(libVdf, 'utf-8');
            const matches = [...vdfContent.matchAll(/"path"\s+"([^"]+)"/g)];
            for (const m of matches) {
              const fullLib = path.normalize(path.join(m[1].replace(/\\\\/g, path.sep), 'steamapps'));
              if (fs.existsSync(fullLib)) steamLibraryFolders.add(fullLib);
            }
          } catch (e) {}
        }
      }
    }
  }
  return steamLibraryFolders;
}

const SKIP_EXE_SCAN_DIRS = new Set([
  '_commonredist', 'redist', 'directx', '__installer', 'installers',
  'support', 'easyanticheat', 'battleye', 'extras', 'node_modules'
]);

function resolveSteamExecutablesWithPaths(targetAppId, title) {
  const exeNames = new Set();
  const exePaths = new Set();
  try {
    const steamLibraries = getSteamLibraryFolders();
    let installDir = '';
    let foundSteamApps = null;

    for (const sApps of steamLibraries) {
      if (!fs.existsSync(sApps)) continue;
      if (targetAppId) {
        const manifestPath = path.join(sApps, `appmanifest_${targetAppId}.acf`);
        if (fs.existsSync(manifestPath)) {
          try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            const matchDir = manifestContent.match(/"installdir"\s+"([^"]+)"/);
            if (matchDir) {
              installDir = matchDir[1];
              foundSteamApps = sApps;
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (!installDir && title) {
      for (const sApps of steamLibraries) {
        const commonDir = path.join(sApps, 'common');
        if (fs.existsSync(commonDir)) {
          try {
            const commons = fs.readdirSync(commonDir);
            const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const matched = commons.find(c => {
              const cleanC = c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              return cleanTitle.includes(cleanC) || cleanC.includes(cleanTitle);
            });
            if (matched) {
              installDir = matched;
              foundSteamApps = sApps;
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (installDir && foundSteamApps) {
      const fullGameDir = path.join(foundSteamApps, 'common', installDir);
      if (fs.existsSync(fullGameDir)) {
        const scanExes = (dir, depth = 0) => {
          if (depth > 4) return;
          const entries = fs.readdirSync(dir);
          for (const entry of entries) {
            const full = path.join(dir, entry);
            try {
              const stat = fs.statSync(full);
              if (stat.isDirectory()) {
                const dirLow = entry.toLowerCase();
                if (!entry.startsWith('.') && !SKIP_EXE_SCAN_DIRS.has(dirLow)) {
                  scanExes(full, depth + 1);
                }
              } else if (entry.toLowerCase().endsWith('.exe')) {
                const l = entry.toLowerCase();
                if (
                  !l.includes('crash') &&
                  !l.includes('report') &&
                  !l.includes('setup') &&
                  !l.includes('installer') &&
                  !l.includes('unins') &&
                  !l.includes('redist') &&
                  !l.includes('dxsetup') &&
                  !l.includes('vcredist') &&
                  !l.includes('ueprereq') &&
                  !l.includes('cleanup') &&
                  !l.includes('touchup')
                ) {
                  exeNames.add(entry);
                  exePaths.add(full);
                }
              }
            } catch (e) {}
          }
        };
        scanExes(fullGameDir);
      }
    }
  } catch (err) {
    console.warn('[Electron Launcher] Failed to resolve Steam executable:', err);
  }
  return { names: [...exeNames], paths: [...exePaths] };
}

function resolveSteamExecutables(targetAppId, title) {
  return resolveSteamExecutablesWithPaths(targetAppId, title).names;
}

// --------------------------------------------------------------------------
// Process Exit Monitoring & Anti-Stutter Boost Lifecycle Helpers
// --------------------------------------------------------------------------
let activeGameMonitorInterval = null;
let activeMonitoredGame = null;

function setGameplayIdleThrottling(paused) {
  isGameplayBoostPaused = Boolean(paused);
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.setBackgroundThrottling(Boolean(paused));
    } catch (e) {}
  }
}

async function endGameplayBoost({ restoreClosedApps = false } = {}) {
  setGameplayIdleThrottling(false);
  if (gameBoost.isActivatingOrActive?.()) {
    await gameBoost.disableGameBoost({ restoreClosedApps }).catch(() => {});
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('boost:state-changed', gameBoost.getCurrentState());
    }
  }
}

function stopLaunchReadinessWatcher() {
  if (launchReadinessProcess) {
    try {
      launchReadinessProcess.kill();
    } catch (e) {}
    launchReadinessProcess = null;
  }
}

function enterLaunchGuard(shouldMinimizeWhenReady, meta = {}) {
  stopLaunchReadinessWatcher();
  isAwaitingGameLoad = true;
  launchShouldMinimizeWhenReady = Boolean(shouldMinimizeWhenReady);
  launchTargetMeta = meta;

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      launchPrevAlwaysOnTop = mainWindow.isAlwaysOnTop();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      mainWindow.moveTop();
      mainWindow.focus();
    } catch (e) {}
  }
}

function releaseLaunchGuard({ minimize = false, keepWatcherForExit = false } = {}) {
  if (!keepWatcherForExit) {
    stopLaunchReadinessWatcher();
  }
  const wasAwaiting = isAwaitingGameLoad;
  isAwaitingGameLoad = false;

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (wasAwaiting) {
        mainWindow.setAlwaysOnTop(Boolean(launchPrevAlwaysOnTop));
      }
      if (minimize && !mainWindow.isMinimized()) {
        setGameplayIdleThrottling(true);
        mainWindow.minimize();
      }
    } catch (e) {}
  }
  launchPrevAlwaysOnTop = false;
  if (!keepWatcherForExit) {
    launchTargetMeta = null;
  }
}

function restoreMainWindowToFront() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try { mainWindow.webContents.setBackgroundThrottling(false); } catch (e) {}
  try { mainWindow.flashFrame(false); } catch (e) {}
  try {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.show();
    mainWindow.moveTop();
    mainWindow.focus();
    app.focus({ steal: true });
  } catch (e) {}
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !isAwaitingGameLoad) {
      try {
        mainWindow.setAlwaysOnTop(false);
        mainWindow.flashFrame(false);
      } catch (e) {}
    }
  }, 180);
}

function handleDetectedGameExit({ appId = null, title = null, launchTimedOut = false } = {}) {
  const activeMeta = activeMonitoredGame || launchTargetMeta || {};
  const finalAppId = appId ?? activeMeta.appId ?? null;
  const finalTitle = title ?? activeMeta.title ?? null;

  stopActiveGameMonitor();
  isAwaitingGameLoad = false;
  launchPrevAlwaysOnTop = false;
  launchTargetMeta = null;
  stopLaunchReadinessWatcher();

  restoreMainWindowToFront();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('game:process-exited', launchTimedOut
      ? { appId: finalAppId, title: finalTitle, launchTimedOut: true }
      : { appId: finalAppId, title: finalTitle });
  }
  endGameplayBoost({
    restoreClosedApps: !launchTimedOut && Boolean(lastBoostOptions?.boostRestoreClosedApps)
  }).catch(() => {});
}

function getNativeWindowHandleString(win) {
  try {
    if (!win || win.isDestroyed()) return '0';
    const buf = win.getNativeWindowHandle();
    if (!buf || buf.length < 4) return '0';
    if (buf.length >= 8 && typeof buf.readBigUInt64LE === 'function') {
      return buf.readBigUInt64LE(0).toString();
    }
    return String(buf.readUInt32LE(0));
  } catch (e) {
    return '0';
  }
}

function startLaunchReadinessWatcher({ targetExes = [], pid = 0, appId = null, title = null, shouldMinimize = true } = {}) {
  stopLaunchReadinessWatcher();
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) {
    releaseLaunchGuard({ minimize: Boolean(shouldMinimize) });
    return;
  }

  const rawExes = Array.isArray(targetExes) ? targetExes.filter(Boolean) : [];
  const mainExes = rawExes.filter(e => !/protocolselector|bootstrap|crash|report|setup|installer|unins|redist|dxsetup|vcredist|ueprereq/i.test(e));
  const effectiveExes = mainExes.length > 0 ? mainExes : rawExes;
  const targetNames = [...new Set(
    effectiveExes
      .map(e => path.basename(String(e)).toLowerCase().replace(/\.exe$/i, ''))
      .filter(n => n && !['steam', 'steamwebhelper', 'gameoverlayui'].includes(n))
  )];

  const myraaHwndStr = getNativeWindowHandleString(mainWindow);
  const launchedPid = Number.isFinite(Number(pid)) && Number(pid) > 0 ? Math.floor(Number(pid)) : 0;
  const targetNamesEnv = targetNames.join('|');

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'
$csCode = @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

public static class Win32LaunchGuard {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern int GetSystemMetrics(int nIndex);
    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("kernel32.dll", SetLastError = true)] public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);
    [DllImport("kernel32.dll", SetLastError = true)] public static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);
    [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr hObject);
    [DllImport("kernel32.dll", SetLastError = true)] public static extern bool SetProcessInformation(IntPtr hProcess, int ProcessInformationClass, ref PROCESS_POWER_THROTTLING_STATE ProcessInformation, int ProcessInformationSize);

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_POWER_THROTTLING_STATE {
        public uint Version;
        public uint ControlMask;
        public uint StateMask;
    }

    public static readonly IntPtr HWND_BOTTOM = new IntPtr(1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOACTIVATE = 0x0010;
    public const int SW_SHOW = 5;
    public const int SW_RESTORE = 9;
    public const uint SMTO_ABORTIFHUNG = 0x0002;
    public const uint SYNCHRONIZE = 0x00100000;
    public const uint PROCESS_SET_INFORMATION = 0x0200;

    public static void InitDpi() {
        try { SetProcessDPIAware(); } catch {}
    }

    public static bool DisableEcoQoSByPid(int pid) {
        if (pid <= 0) return false;
        IntPtr hProc = IntPtr.Zero;
        try {
            hProc = OpenProcess(PROCESS_SET_INFORMATION, false, pid);
            if (hProc == IntPtr.Zero) return false;
            var state = new PROCESS_POWER_THROTTLING_STATE { Version = 1, ControlMask = 1, StateMask = 0 };
            return SetProcessInformation(hProc, 4, ref state, Marshal.SizeOf(typeof(PROCESS_POWER_THROTTLING_STATE)));
        } catch {
            return false;
        } finally {
            if (hProc != IntPtr.Zero) CloseHandle(hProc);
        }
    }

    public static void ForceForeground(IntPtr targetHwnd) {
        if (targetHwnd == IntPtr.Zero || !IsWindow(targetHwnd)) return;
        if (IsIconic(targetHwnd)) ShowWindow(targetHwnd, SW_RESTORE);
        else ShowWindow(targetHwnd, SW_SHOW);
        IntPtr fg = GetForegroundWindow();
        uint fgTid = 0;
        if (fg != IntPtr.Zero) {
            uint dummy;
            fgTid = GetWindowThreadProcessId(fg, out dummy);
        }
        uint curTid = GetCurrentThreadId();
        uint dummy2;
        uint targetTid = GetWindowThreadProcessId(targetHwnd, out dummy2);
        bool attachedFg = false;
        bool attachedTarget = false;
        try {
            if (fgTid != 0 && fgTid != curTid) attachedFg = AttachThreadInput(curTid, fgTid, true);
            if (targetTid != 0 && targetTid != curTid && targetTid != fgTid) attachedTarget = AttachThreadInput(curTid, targetTid, true);
            BringWindowToTop(targetHwnd);
            SetForegroundWindow(targetHwnd);
        } catch {} finally {
            if (attachedTarget) try { AttachThreadInput(curTid, targetTid, false); } catch {}
            if (attachedFg) try { AttachThreadInput(curTid, fgTid, false); } catch {}
        }
    }

    public static bool IsWindowResponding(IntPtr hWnd) {
        IntPtr res;
        IntPtr ret = SendMessageTimeout(hWnd, 0x0000, IntPtr.Zero, IntPtr.Zero, SMTO_ABORTIFHUNG, 120, out res);
        if (ret != IntPtr.Zero) return true;
        int err = Marshal.GetLastWin32Error();
        return err == 5; // ERROR_ACCESS_DENIED (elevated/anti-cheat window) -> treat as alive
    }

    public static Dictionary<int, List<IntPtr>> GetVisibleWindowsByPid() {
        var map = new Dictionary<int, List<IntPtr>>();
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd) && !IsIconic(hWnd)) {
                uint winPid = 0;
                GetWindowThreadProcessId(hWnd, out winPid);
                if (winPid > 0) {
                    List<IntPtr> list;
                    if (!map.TryGetValue((int)winPid, out list)) {
                        list = new List<IntPtr>();
                        map[(int)winPid] = list;
                    }
                    list.Add(hWnd);
                }
            }
            return true;
        }, IntPtr.Zero);
        return map;
    }

    public static void PushWindowBehind(IntPtr hWnd) {
        SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        SetWindowPos(hWnd, HWND_BOTTOM, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    }
}
'@
Add-Type -TypeDefinition $csCode
[Win32LaunchGuard]::InitDpi()

[Int64]$hwndParsed = 0
$null = [Int64]::TryParse($env:MYRAA_HWND, [ref]$hwndParsed)
$myraaHwnd = [IntPtr]::new($hwndParsed)

$targetSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
if ($env:MYRAA_TARGET_EXES) {
    foreach ($t in $env:MYRAA_TARGET_EXES.Split([char]'|')) {
        if ($t) { $null = $targetSet.Add($t) }
    }
}
[int]$launchedPid = 0
$null = [int]::TryParse($env:MYRAA_LAUNCHED_PID, [ref]$launchedPid)
$steamNames = @('steam', 'steamwebhelper', 'gameoverlayui')
$ignoredFallbackNames = @(
  'steam', 'steamwebhelper', 'gameoverlayui', 'electron', 'explorer', 'dwm',
  'shellexperiencehost', 'searchhost', 'startmenuexperiencehost', 'textinputhost',
  'applicationframehost', 'systemsettings', 'taskmgr', 'powershell', 'pwsh', 'cmd',
  'conhost', 'windowsterminal', 'nvidia overlay', 'nvidia share', 'nvcontainer',
  'chrome', 'msedge', 'firefox', 'brave', 'opera', 'code', 'antigravity', 'node', 'vite'
)
$baselineStartUtc = [DateTime]::UtcNow.AddSeconds(-2)

$screenW = [Math]::Max(800, [Win32LaunchGuard]::GetSystemMetrics(0))
$screenH = [Math]::Max(600, [Win32LaunchGuard]::GetSystemMetrics(1))

$readyStreak = 0
$lastCandidateHwnd = [IntPtr]::Zero
$lastFocusEventAt = [DateTime]::MinValue

$activeGamePid = 0
$activeGameHwnd = [IntPtr]::Zero

for ($tick = 0; $tick -lt 450; $tick++) {
    $winMap = [Win32LaunchGuard]::GetVisibleWindowsByPid()
    $fgNow = [Win32LaunchGuard]::GetForegroundWindow()
    [uint32]$fgNowPid = 0
    if ($fgNow -ne [IntPtr]::Zero) {
        $null = [Win32LaunchGuard]::GetWindowThreadProcessId($fgNow, [ref]$fgNowPid)
    }

    $procs = [System.Diagnostics.Process]::GetProcesses()
    $steamPids = New-Object 'System.Collections.Generic.HashSet[int]'

    $bestHwnd = [IntPtr]::Zero
    $bestArea = 0
    $bestW = 0
    $bestH = 0
    $bestPid = 0
    $bestName = ''
    $bestIsFullOrLarge = $false

    try {
        foreach ($p in $procs) {
            $pName = ''
            $procId = 0
            try {
                $pName = $p.ProcessName.ToLowerInvariant()
                $procId = $p.Id
            } catch { continue }

            if ($steamNames -contains $pName) {
                $null = $steamPids.Add($procId)
                continue
            }

            if (-not $winMap.ContainsKey($procId)) { continue }

            $isMatch = $false
            $isForegroundFallback = $false
            if ($launchedPid -gt 0 -and $procId -eq $launchedPid) {
                $isMatch = $true
            } elseif ($targetSet.Count -gt 0 -and $targetSet.Contains($pName)) {
                $isMatch = $true
            } elseif (-not ($ignoredFallbackNames -contains $pName)) {
                $startedFresh = $false
                try {
                    if ($p.StartTime.ToUniversalTime() -ge $baselineStartUtc) { $startedFresh = $true }
                } catch {}
                if ($startedFresh) {
                    $isMatch = $true
                } elseif ([int]$fgNowPid -eq $procId) {
                    $isMatch = $true
                    $isForegroundFallback = $true
                }
            }

            if (-not $isMatch) { continue }

            $isExactTarget = ($launchedPid -gt 0 -and $procId -eq $launchedPid) -or ($targetSet.Count -gt 0 -and $targetSet.Contains($pName))
            foreach ($hWnd in $winMap[$procId]) {
                if ($hWnd -eq $myraaHwnd) { continue }
                $rect = New-Object Win32LaunchGuard+RECT
                if ([Win32LaunchGuard]::GetWindowRect($hWnd, [ref]$rect)) {
                    $w = $rect.Right - $rect.Left
                    $h = $rect.Bottom - $rect.Top
                    $isFullOrLarge = ($w -ge ($screenW * 0.72) -and $h -ge ($screenH * 0.72)) -or ($w -ge 1200 -and $h -ge 680)
                    $isWindowedGame = (-not $isForegroundFallback) -and (($w -ge 760 -and $h -ge 480) -or ($w -ge ($screenW * 0.50) -and $h -ge ($screenH * 0.50)))
                    $isFullFallback = $isForegroundFallback -and ($w -ge ($screenW * 0.85) -and $h -ge ($screenH * 0.85))
                    # Allow compact Nixxes / pre-game launcher windows (e.g. Play / Settings / Quit in Spider-Man, Ghost of Tsushima)
                    $isMatchedPreLauncher = (-not $isForegroundFallback) -and $isExactTarget -and ($w -ge 300 -and $h -ge 200)
                    $isFreshLauncherWin = (-not $isForegroundFallback) -and (-not $isExactTarget) -and ($w -ge 300 -and $h -ge 200)
                    if ($isFullOrLarge -or $isWindowedGame -or $isFullFallback -or $isMatchedPreLauncher -or $isFreshLauncherWin) {
                        if (-not [Win32LaunchGuard]::IsWindowResponding($hWnd)) { continue }
                        $area = [Int64]$w * [Int64]$h
                        if ($area -gt $bestArea) {
                            $bestArea = $area
                            $bestHwnd = $hWnd
                            $bestW = $w
                            $bestH = $h
                            $bestPid = $procId
                            $bestName = $pName
                            $bestIsFullOrLarge = ($isFullOrLarge -or $isFullFallback -or $isMatchedPreLauncher)
                        }
                    }
                }
            }
        }
    } finally {
        foreach ($p in $procs) { try { $p.Dispose() } catch {} }
    }

    if ($bestHwnd -ne [IntPtr]::Zero) {
        if ($bestHwnd -eq $lastCandidateHwnd) {
            $readyStreak++
        } else {
            $lastCandidateHwnd = $bestHwnd
            $readyStreak = 1
        }
        $requiredStreak = if ($bestIsFullOrLarge) { 2 } else { 3 }
        if ($readyStreak -ge $requiredStreak) {
            $null = [Win32LaunchGuard]::DisableEcoQoSByPid($bestPid)
            $bestExePath = ''
            try {
                $bestProcObj = [System.Diagnostics.Process]::GetProcessById($bestPid)
                try { $bestExePath = $bestProcObj.MainModule.FileName } catch {}
                $bestProcObj.Dispose()
            } catch {}
            $payload = @{
                event = 'game_ready'
                pid = $bestPid
                hwnd = $bestHwnd.ToInt64()
                processName = $bestName
                exePath = $bestExePath
                width = $bestW
                height = $bestH
            } | ConvertTo-Json -Compress
            [Console]::Out.WriteLine($payload)
            [Console]::Out.Flush()
            Start-Sleep -Milliseconds 220
            if (-not [Win32LaunchGuard]::IsIconic($bestHwnd)) {
                [Win32LaunchGuard]::ForceForeground($bestHwnd)
            }
            $activeGamePid = $bestPid
            $activeGameHwnd = $bestHwnd
            break
        }
    } else {
        $readyStreak = 0
        $lastCandidateHwnd = [IntPtr]::Zero

        # Push any visible Steam / Steamwebhelper launch popups behind MYRAA while waiting
        foreach ($spid in $steamPids) {
            if ($winMap.ContainsKey($spid)) {
                foreach ($shwnd in $winMap[$spid]) {
                    if ($shwnd -eq $myraaHwnd) { continue }
                    $srect = New-Object Win32LaunchGuard+RECT
                    if ([Win32LaunchGuard]::GetWindowRect($shwnd, [ref]$srect)) {
                        $sw = $srect.Right - $srect.Left
                        $sh = $srect.Bottom - $srect.Top
                        if ($sw -gt 30 -and $sh -gt 30) {
                            [Win32LaunchGuard]::PushWindowBehind($shwnd)
                        }
                    }
                }
            }
        }

        if ($fgNow -ne [IntPtr]::Zero -and $fgNow -ne $myraaHwnd) {
            if ($steamPids.Contains([int]$fgNowPid)) {
                [Win32LaunchGuard]::PushWindowBehind($fgNow)
                $null = [Win32LaunchGuard]::SetForegroundWindow($myraaHwnd)
                $nowUtc = [DateTime]::UtcNow
                if (($nowUtc - $lastFocusEventAt).TotalMilliseconds -ge 500) {
                    $lastFocusEventAt = $nowUtc
                    [Console]::Out.WriteLine('{"event":"steam_stole_focus"}')
                    [Console]::Out.Flush()
                }
            }
        }
    }

    Start-Sleep -Milliseconds 200
}

# Phase 2: Ultra-idle kernel wait on game process & window handoffs (pre-launcher -> full game)
if ($activeGamePid -gt 0 -and $activeGameHwnd -ne [IntPtr]::Zero) {
    try { [System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal } catch {}
    $hProc = [Win32LaunchGuard]::OpenProcess([Win32LaunchGuard]::SYNCHRONIZE, $false, $activeGamePid)
    while ($true) {
        $procExited = $false
        if ($hProc -ne [IntPtr]::Zero) {
            $waitRes = [Win32LaunchGuard]::WaitForSingleObject($hProc, 350)
            if ($waitRes -eq 0) {
                $procExited = $true
            }
        } else {
            $procAlive = $true
            try {
                $pCheck = [System.Diagnostics.Process]::GetProcessById($activeGamePid)
                $pCheck.Dispose()
            } catch {
                $procAlive = $false
            }
            if (-not $procAlive) { $procExited = $true }
            else { Start-Sleep -Milliseconds 350 }
        }

        if ($procExited) {
            if ($hProc -ne [IntPtr]::Zero) { $null = [Win32LaunchGuard]::CloseHandle($hProc); $hProc = [IntPtr]::Zero }
            # Give companion/spawned main game exe up to 1.5s to replace a pre-game launcher process
            $handedOff = $false
            if ($targetSet.Count -gt 0) {
                for ($handoffTry = 0; $handoffTry -lt 3 -and -not $handedOff; $handoffTry++) {
                    Start-Sleep -Milliseconds 500
                    $winMapNext = [Win32LaunchGuard]::GetVisibleWindowsByPid()
                    $nextProcs = [System.Diagnostics.Process]::GetProcesses()
                    try {
                        foreach ($np in $nextProcs) {
                            $npName = ''
                            $npId = 0
                            try { $npName = $np.ProcessName.ToLowerInvariant(); $npId = $np.Id } catch { continue }
                            if ($targetSet.Contains($npName)) {
                                $nextHwnd = [IntPtr]::Zero
                                if ($winMapNext.ContainsKey($npId)) {
                                    foreach ($c in $winMapNext[$npId]) {
                                        $r3 = New-Object Win32LaunchGuard+RECT
                                        if ([Win32LaunchGuard]::GetWindowRect($c, [ref]$r3)) {
                                            if (($r3.Right - $r3.Left) -ge 200 -and ($r3.Bottom - $r3.Top) -ge 200) {
                                                $nextHwnd = $c; break
                                            }
                                        }
                                    }
                                }
                                $activeGamePid = $npId
                                $activeGameHwnd = $nextHwnd
                                $hProc = [Win32LaunchGuard]::OpenProcess([Win32LaunchGuard]::SYNCHRONIZE, $false, $activeGamePid)
                                $handedOff = $true
                                break
                            }
                        }
                    } finally {
                        foreach ($np in $nextProcs) { try { $np.Dispose() } catch {} }
                    }
                }
            }
            if (-not $handedOff) { break }
            continue
        }

        # While the process is still alive, refresh window handle silently when a pre-launcher dialog transitions to the full game window
        if ($activeGameHwnd -eq [IntPtr]::Zero -or (-not [Win32LaunchGuard]::IsWindow($activeGameHwnd))) {
            $winMapExit = [Win32LaunchGuard]::GetVisibleWindowsByPid()
            if ($winMapExit.ContainsKey($activeGamePid)) {
                foreach ($cand in $winMapExit[$activeGamePid]) {
                    $r2 = New-Object Win32LaunchGuard+RECT
                    if ([Win32LaunchGuard]::GetWindowRect($cand, [ref]$r2)) {
                        if (($r2.Right - $r2.Left) -ge 200 -and ($r2.Bottom - $r2.Top) -ge 200) {
                            $activeGameHwnd = $cand
                            break
                        }
                    }
                }
            }
        }
    }
    if ($hProc -ne [IntPtr]::Zero) { $null = [Win32LaunchGuard]::CloseHandle($hProc) }
    if ($myraaHwnd -ne [IntPtr]::Zero) {
        [Win32LaunchGuard]::ForceForeground($myraaHwnd)
    }
    $exitPayload = @{ event = 'game_exited'; pid = $activeGamePid } | ConvertTo-Json -Compress
    [Console]::Out.WriteLine($exitPayload)
    [Console]::Out.Flush()
}
`;

  try {
    const dataDir = getUserDataDir();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const scriptPath = path.join(dataDir, 'launch_guard.ps1');
    const existingScript = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '';
    if (existingScript !== psScript) {
      fs.writeFileSync(scriptPath, psScript, 'utf8');
    }
    const proc = child_process.spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          MYRAA_HWND: myraaHwndStr,
          MYRAA_LAUNCHED_PID: String(launchedPid),
          MYRAA_TARGET_EXES: targetNamesEnv
        }
      }
    );
    launchReadinessProcess = proc;

    let stdoutBuf = '';
    proc.stderr.on('data', (chunk) => {
      const errText = chunk.toString('utf8').trim();
      if (errText) console.warn('[Launch Watcher PS]', errText);
    });
    proc.stdout.on('data', (chunk) => {
      if (launchReadinessProcess !== proc) return;
      stdoutBuf += chunk.toString('utf8');
      const lines = stdoutBuf.split(/\r?\n/);
      stdoutBuf = lines.pop() || '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('{')) continue;
        let msg = null;
        try { msg = JSON.parse(line); } catch (e) { continue; }
        if (!msg || !msg.event) continue;

        if (msg.event === 'steam_stole_focus') {
          if (isAwaitingGameLoad && mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMinimized()) {
            try {
              mainWindow.setAlwaysOnTop(true, 'screen-saver');
              mainWindow.moveTop();
              mainWindow.focus();
            } catch (e) {}
          }
        } else if (msg.event === 'game_ready') {
          const meta = launchTargetMeta || { appId, title };
          const minimizeNow = Boolean(launchShouldMinimizeWhenReady);
          console.log(`[Electron Launcher] Game window ready (${msg.processName} ${msg.width}x${msg.height}) for ${meta.title || meta.appId || 'game'}`);
          if (activeMonitoredGame && msg.pid && !activeMonitoredGame.pid) {
            activeMonitoredGame.pid = Number(msg.pid);
          } else if (!activeMonitoredGame && msg.pid) {
            startActiveGameMonitor({
              appId: meta.appId || appId || null,
              title: meta.title || title || null,
              pid: Number(msg.pid),
              targetExes: msg.processName ? [`${msg.processName}.exe`] : []
            });
          }
          if (msg.exePath && typeof gameBoost.applyHighPerfGpuPreferences === 'function') {
            gameBoost.applyHighPerfGpuPreferences([msg.exePath]).catch(() => {});
          }
          if (gameBoost.isActivatingOrActive?.() && lastBoostOptions?.boostGameProcessPriority !== false && msg.pid) {
            gameBoost.boostGameProcessPriority({ pid: Number(msg.pid), targetExes: msg.processName ? [`${msg.processName}.exe`] : [] }).catch(() => {});
          }
          releaseLaunchGuard({ minimize: minimizeNow, keepWatcherForExit: true });
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('game:launch-ready', {
              appId: meta.appId || appId || null,
              title: meta.title || title || null,
              pid: msg.pid,
              processName: msg.processName,
              width: msg.width,
              height: msg.height
            });
          }
        } else if (msg.event === 'game_exited') {
          console.log(`[Electron Launcher] Game window/process exited (PID ${msg.pid}); restoring PS5 immediately.`);
          handleDetectedGameExit();
        }
      }
    });

    proc.on('exit', () => {
      if (launchReadinessProcess === proc) {
        launchReadinessProcess = null;
      }
    });
    proc.on('error', () => {
      if (launchReadinessProcess === proc) {
        launchReadinessProcess = null;
      }
    });
  } catch (err) {
    console.warn('[Electron Launcher] Could not start launch readiness watcher:', err.message);
    releaseLaunchGuard({ minimize: Boolean(shouldMinimize) });
  }
}

function stopActiveGameMonitor() {
  if (activeGameMonitorInterval) {
    clearTimeout(activeGameMonitorInterval);
    activeGameMonitorInterval = null;
  }
  activeMonitoredGame = null;
}

function startActiveGameMonitor(gameInfo) {
  stopActiveGameMonitor();
  activeMonitoredGame = gameInfo;

  let hasBeenDetectedRunning = false;
  let checkCount = 0;

  // Pick main game executables first (ignore transient Steam protocol selectors once a real game exe exists)
  const rawExes = Array.isArray(gameInfo?.targetExes) ? gameInfo.targetExes.filter(Boolean) : [];
  const mainExes = rawExes.filter(e => !/protocolselector|bootstrap|crash|report/i.test(e));
  const checkExes = mainExes.length > 0 ? mainExes : rawExes;

  const scheduleNextTick = () => {
    if (!activeMonitoredGame || !mainWindow || mainWindow.isDestroyed()) {
      stopActiveGameMonitor();
      return;
    }
    const delayMs = activeMonitoredGame.pid
      ? (launchReadinessProcess ? 1500 : 250)
      : (hasBeenDetectedRunning ? 1000 : 1000);
    activeGameMonitorInterval = setTimeout(runCheck, delayMs);
  };

  const runCheck = async () => {
    checkCount++;
    if (!activeMonitoredGame || !mainWindow || mainWindow.isDestroyed()) {
      stopActiveGameMonitor();
      return;
    }

    // Give Steam ~2s to spawn the real game before first tasklist check (avoids startup contention)
    if (!hasBeenDetectedRunning && !activeMonitoredGame.pid && checkCount <= 2) {
      scheduleNextTick();
      return;
    }

    const { pid, appId, title } = activeMonitoredGame;
    let isRunning = false;

    if (pid) {
      try {
        process.kill(pid, 0);
        isRunning = true;
      } catch (e) {
        isRunning = false;
      }
      // If tracked PID exited cleanly, verify once whether another main executable is still alive
      if (!isRunning && checkExes.length > 0) {
        try {
          const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 2500 });
          const csvLow = String(stdout || '').toLowerCase();
          const altAlive = checkExes.some(exe => csvLow.includes(`"${String(exe || '').toLowerCase()}"`));
          if (altAlive) {
            isRunning = true;
            activeMonitoredGame.pid = null;
          }
        } catch (e) {}
      }
    } else if (checkExes.length > 0) {
      try {
        const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 2500 });
        const lines = String(stdout || '').split(/\r?\n/);
        for (const line of lines) {
          if (!line) continue;
          const cols = line.split('","');
          if (cols.length < 2) continue;
          const img = cols[0].replace(/^"/, '').trim().toLowerCase();
          if (checkExes.some(exe => String(exe || '').toLowerCase() === img)) {
            isRunning = true;
            const foundPid = Number(cols[1].replace(/"/g, '').trim());
            if (Number.isFinite(foundPid) && foundPid > 0 && activeMonitoredGame) {
              activeMonitoredGame.pid = foundPid;
            }
            break;
          }
        }
      } catch (e) {}
    }

    if (isRunning) {
      if (!hasBeenDetectedRunning && gameBoost.isActivatingOrActive?.() && lastBoostOptions?.boostGameProcessPriority !== false) {
        gameBoost.boostGameProcessPriority({ pid: activeMonitoredGame.pid, targetExes: checkExes }).then((res) => {
          // Lock onto primary running game PID so all subsequent monitor checks use 0-cost process.kill(pid, 0)
          if (!activeMonitoredGame?.pid && Array.isArray(res?.pids) && res.pids.length > 0 && activeMonitoredGame) {
            activeMonitoredGame.pid = res.pids[0];
          }
        }).catch(() => {});
      }
      hasBeenDetectedRunning = true;
      scheduleNextTick();
    } else if (hasBeenDetectedRunning || checkCount > 85) {
      if (hasBeenDetectedRunning) {
        console.log(`[Electron Launcher] Detected game process exit for: ${title || appId}`);
        handleDetectedGameExit({ appId, title, launchTimedOut: false });
      } else {
        handleDetectedGameExit({ appId, title, launchTimedOut: true });
      }
    } else {
      scheduleNextTick();
    }
  };

  scheduleNextTick();
}

// --------------------------------------------------------------------------
// IPC Handlers: Native Game Launching & System Controls
// --------------------------------------------------------------------------
function isActualGameLaunchRequest(data = {}) {
  const { execPath, uri, appId, title } = data || {};
  if (String(appId) === '431960' || (title && title.toLowerCase().includes('wallpaper engine'))) return false;
  const u = String(uri || '').toLowerCase().trim();
  if (u.startsWith('steam://install/') || u.startsWith('http://') || u.startsWith('https://') || u.startsWith('ms-settings:')) {
    return false;
  }
  return Boolean((appId && /^\d+$/.test(String(appId))) || (execPath && fs.existsSync(String(execPath).trim())) || u);
}

ipcMain.handle('game:launch', async (_event, data) => {
  try {
    const { execPath, uri, appId, title, args } = data || {};
    console.log(`[Electron Launcher] Request to launch: ${title || appId || uri || execPath}`);

    // Prevent launching non-game apps (e.g. Wallpaper Engine, background tools)
    if (appId === '431960' || (title && title.toLowerCase().includes('wallpaper engine'))) {
      console.warn('[Electron Launcher] Skipping launch for non-game utility:', title);
      return { success: false, error: 'Utility app cannot be launched as a console game' };
    }

    const resolvedSteam = (appId && /^\d+$/.test(String(appId)))
      ? resolveSteamExecutablesWithPaths(String(appId), title || undefined)
      : { names: [], paths: [] };
    const isRealLaunch = isActualGameLaunchRequest(data);

    // Safety net: ALWAYS auto-enable Game Boost + Anti-Stutter concurrently with game startup (0ms launch delay)
    if (isRealLaunch && !gameBoost.isActivatingOrActive?.()) {
      try {
        const storedSettings = getSettingsStore().data || {};
        lastBoostOptions = {
          boostCloseBrowsers: storedSettings.boostCloseBrowsers !== false,
          boostCloseChatMedia: storedSettings.boostCloseChatMedia !== false,
          boostCloseUnusedLaunchers: storedSettings.boostCloseUnusedLaunchers !== false,
          boostCloseWindowsApps: storedSettings.boostCloseWindowsApps !== false,
          boostHighPerformancePower: storedSettings.boostHighPerformancePower !== false,
          boostGameProcessPriority: storedSettings.boostGameProcessPriority !== false,
          boostMinimizeOnLaunch: storedSettings.boostMinimizeOnLaunch !== false,
          boostAntiStutter: true,
          boostThrottleHelpers: true,
          boostTrimRam: true,
          boostForceHighPerfGpu: true,
          boostSuppressPopups: true,
          boostRestoreClosedApps: storedSettings.boostRestoreClosedApps === true,
          boostExcludedApps: Array.isArray(storedSettings.boostExcludedApps) ? storedSettings.boostExcludedApps : []
        };
        const candidateExePaths = resolvedSteam.paths.length > 0 ? resolvedSteam.paths : (execPath ? [execPath] : []);
        gameBoost.enableGameBoost({
          ...lastBoostOptions,
          autoGameBoost: true,
          gameInfo: { appId, title, uri, execPath, candidateExePaths }
        }).then((boostRes) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('boost:state-changed', { ...gameBoost.getCurrentState(), ...boostRes });
          }
        }).catch((e) => {
          console.warn('[Game Boost] Backend auto-boost warning:', e.message);
        });
      } catch (e) {
        console.warn('[Game Boost] Backend auto-boost warning:', e.message);
      }
    }

    const storedSettingsForMin = getSettingsStore().data || {};
    const shouldMinimize = lastBoostOptions?.boostMinimizeOnLaunch !== undefined
      ? lastBoostOptions.boostMinimizeOnLaunch !== false
      : storedSettingsForMin.boostMinimizeOnLaunch !== false;

    // Keep MYRAA visible and topmost above Steam's "Starting game" overlay; defer minimize until the game window loads
    if (isRealLaunch) {
      enterLaunchGuard(shouldMinimize, { appId: appId ? String(appId) : null, title: title || null });
    }

    // 1. Steam Games: Always prefer Steam URI protocol so Steam overlay, achievements, and DRM work properly
    if (appId && /^\d+$/.test(String(appId))) {
      const launchTarget = uri || `steam://rungameid/${appId}`;
      await shell.openExternal(launchTarget);
      try {
        startActiveGameMonitor({ appId: String(appId), title, targetExes: resolvedSteam.names });
      } catch (e) {}
      if (isRealLaunch) {
        startLaunchReadinessWatcher({
          appId: String(appId),
          title,
          targetExes: resolvedSteam.names,
          shouldMinimize
        });
      }
      return { success: true, method: 'shell', target: launchTarget };
    }

    // 2. Direct Executable Launch (with explicit working directory)
    if (execPath && fs.existsSync(execPath.trim())) {
      const cleanPath = execPath.trim();
      const exeDir = path.dirname(cleanPath);
      const argList = args ? (Array.isArray(args) ? args : args.split(' ').filter(Boolean)) : [];
      const proc = child_process.spawn(cleanPath, argList, {
        cwd: exeDir,
        detached: true,
        stdio: 'ignore'
      });
      proc.on('exit', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('game:process-exited', { execPath: cleanPath, title, pid: proc.pid });
        }
      });
      proc.unref();
      startActiveGameMonitor({ execPath: cleanPath, title, pid: proc.pid, targetExes: [path.basename(cleanPath)] });
      if (isRealLaunch) {
        startLaunchReadinessWatcher({
          title,
          pid: proc.pid,
          targetExes: [path.basename(cleanPath)],
          shouldMinimize
        });
      }
      return { success: true, method: 'spawn', path: cleanPath, cwd: exeDir, pid: proc.pid };
    }

    // 3. General Protocol / URI Launch
    if (uri) {
      await shell.openExternal(uri);
      if (isRealLaunch) {
        startLaunchReadinessWatcher({
          title,
          targetExes: [],
          shouldMinimize
        });
      }
      return { success: true, method: 'shell', target: uri };
    }

    if (isRealLaunch) releaseLaunchGuard({ minimize: false });
    return { success: false, error: 'No launch path or URI provided' };
  } catch (err) {
    releaseLaunchGuard({ minimize: false });
    console.error('[Electron Launcher] Launch error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('game:close', async (_event, data) => {
  try {
    const payload = data || {};
    const { execPath, title, appId, launchUri, pid } = payload;

    releaseLaunchGuard({ minimize: false });
    stopActiveGameMonitor();
    await endGameplayBoost({ restoreClosedApps: Boolean(lastBoostOptions?.boostRestoreClosedApps) });

    // Prefer PID-based termination when the sender knows the exact PID.
    if (pid && !isNaN(Number(pid))) {
      const targetPid = Number(pid);
      try {
        await execAsync(`taskkill /PID ${targetPid} /T /F`);
      } catch (err) {
        console.warn(`[Electron Launcher] taskkill pid info:`, err.message);
      }
      return { success: true, closedPid: targetPid, processesKilled: 1 };
    }

    // For Steam games, resolve the install folder from the manifest and kill the
    // executables Steam placed there. Do this only for a numeric appId (direct or
    // extracted from a steam://rungameid URI). Do not use client-supplied title
    // heuristics, and do not treat an arbitrary execPath basename as a safe target.
    let targetAppId = appId;
    if (!targetAppId && launchUri && typeof launchUri === 'string' && launchUri.startsWith('steam://rungameid/')) {
      targetAppId = launchUri.replace('steam://rungameid/', '').trim();
    }

    if (targetAppId && /^\d+$/.test(String(targetAppId))) {
      const normalized = String(targetAppId);
      if (normalized === '431960') {
        return { success: false, error: 'Utility app cannot be closed as a console game' };
      }
      try {
        const resolvedExes = resolveSteamExecutables(normalized, title || undefined);
        if (resolvedExes.length > 0) {
          let killed = 0;
          await Promise.all(resolvedExes.map(async (exeName) => {
            try {
              await execAsync(`taskkill /IM "${exeName}" /T /F`);
              killed++;
            } catch (err) {
              console.warn(`[Electron Launcher] taskkill info for ${exeName}:`, err.message);
            }
          }));
          return { success: true, closed: resolvedExes, appId: normalized, processesKilled: killed };
        }
        return { success: false, error: `No eligible executables found for Steam app ${normalized} in its manifest install folder.` };
      } catch (steamErr) {
        console.warn(`[Electron Launcher] Error resolving Steam executable for close:`, steamErr);
        return { success: false, error: steamErr.message || 'Failed to resolve Steam game executables.' };
      }
    }

    // If the sender previously launched a direct executable through this process and
    // it recorded the path, kill that specific executable by basename.
    if (execPath && typeof execPath === 'string' && execPath.trim()) {
      const trimmed = execPath.trim();
      if (!fs.existsSync(trimmed)) {
        return { success: false, error: 'Provided execPath does not exist on disk.' };
      }
      const exeName = path.basename(trimmed);
      if (!exeName.toLowerCase().endsWith('.exe')) {
        return { success: false, error: 'Provided execPath does not point to an .exe.' };
      }
      let killed = 0;
      try {
        await execAsync(`taskkill /IM "${exeName}" /T /F`);
        killed = 1;
      } catch (err) {
        console.warn(`[Electron Launcher] taskkill info for ${exeName}:`, err.message);
      }
      return { success: true, closed: exeName, path: trimmed, processesKilled: killed };
    }

    // If a URI was provided and it is not a steam://rungameid URI (already handled),
    // treat it as a protocol/URI request and refuse unilateral process killing.
    if (launchUri && typeof launchUri === 'string') {
      return { success: false, error: 'Cannot close a process from a non-Steam URI without a PID or launched execPath.' };
    }

    return { success: false, error: 'No PID, Steam appId, or launched execPath provided to close.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:kill-pid', async (_event, pid) => {
  try {
    const targetPid = typeof pid === 'object' && pid !== null ? pid.pid : pid;
    if (targetPid && !isNaN(Number(targetPid))) {
      try {
        await execAsync(`taskkill /PID ${targetPid} /T /F`);
      } catch (err) {
        console.warn(`[Electron Launcher] taskkill pid info:`, err.message);
      }
      return { success: true, pid: targetPid };
    }
    return { success: false, error: 'Invalid PID provided' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Window Controls
ipcMain.handle('window:minimize', () => {
  if (isAwaitingGameLoad) {
    releaseLaunchGuard({ minimize: true });
    return;
  }
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.handle('window:restore', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// Game Boost & Performance Mode Controls
ipcMain.handle('boost:get-status', async (_event, options = {}) => {
  try {
    return { success: true, ...(await gameBoost.getRunningBoostCandidates(options || {})) };
  } catch (err) {
    return { success: false, error: err.message, candidates: [], totalRamMb: 0 };
  }
});

ipcMain.handle('boost:enable', async (_event, options = {}) => {
  try {
    lastBoostOptions = { ...(options || {}) };
    const enrichedOptions = { ...(options || {}) };
    if (enrichedOptions.gameInfo?.appId && /^\d+$/.test(String(enrichedOptions.gameInfo.appId))) {
      const resolved = resolveSteamExecutablesWithPaths(String(enrichedOptions.gameInfo.appId), enrichedOptions.gameInfo.title);
      if (resolved.paths.length > 0) {
        enrichedOptions.gameInfo = { ...enrichedOptions.gameInfo, candidateExePaths: resolved.paths };
      }
    }
    if (!enrichedOptions?.dryRun) {
      setGameplayIdleThrottling(true);
    }
    const res = await gameBoost.enableGameBoost(enrichedOptions);
    if (mainWindow && !mainWindow.isDestroyed() && !enrichedOptions?.dryRun) {
      mainWindow.webContents.send('boost:state-changed', { ...gameBoost.getCurrentState(), ...res });
    }
    return res;
  } catch (err) {
    setGameplayIdleThrottling(false);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('boost:disable', async (_event, options = {}) => {
  try {
    setGameplayIdleThrottling(false);
    const res = await gameBoost.disableGameBoost({
      restoreClosedApps: Boolean(options?.restoreClosedApps ?? lastBoostOptions?.boostRestoreClosedApps)
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('boost:state-changed', gameBoost.getCurrentState());
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:toggle-fullscreen', () => {
  if (mainWindow) {
    const state = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(state);
    return state;
  }
  return false;
});

ipcMain.handle('window:is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('window:close', () => {
  app.quit();
});

ipcMain.handle('app:reboot', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('shell:open-external', async (_event, url) => {
  try {
    const raw = String(url || '').trim();
    if (/^https?:\/\//i.test(raw)) {
      await shell.openExternal(raw);
      return true;
    }
  } catch (e) {}
  return false;
});

ipcMain.handle('system:get-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    user: process.env.USERNAME || 'Player 1'
  };
});

ipcMain.handle('game:cache-artwork', async (_event, data) => {
  try {
    const { gameId, tileDataUrl, heroDataUrl, logoDataUrl } = data || {};
    if (!gameId) return { success: false, error: 'No gameId provided' };

    const safeId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheDir = path.join(getCacheRootDir(), 'games', safeId);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const saved = {};
    const timestamp = Date.now();

    const appIdMatch = gameId.match(/pc_steam_(\d+)/) || (data?.appId ? ['', String(data.appId)] : null);
    const appId = appIdMatch ? appIdMatch[1] : null;

    async function saveImage(source, filename) {
      if (source && typeof source === 'string') {
        if (source.includes('base64,')) {
          const base64Data = source.split('base64,')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const filePath = path.join(cacheDir, filename);
          fs.writeFileSync(filePath, buffer);
          return `/assets/cache/games/${safeId}/${filename}?t=${timestamp}`;
        }
        if (source.startsWith('http://') || source.startsWith('https://')) {
          try {
            const resp = await fetch(source);
            if (resp.ok && (resp.headers.get('content-type') || '').startsWith('image/')) {
              const arrBuf = await resp.arrayBuffer();
              const buffer = Buffer.from(arrBuf);
              if (buffer.length < 1024) return null;
              const filePath = path.join(cacheDir, filename);
              fs.writeFileSync(filePath, buffer);
              return `/assets/cache/games/${safeId}/${filename}?t=${timestamp}`;
            }
          } catch (fetchErr) {
            console.warn(`[Electron Cache] Network fetch error for ${source}:`, fetchErr.message);
          }
        }
        if (source.startsWith('/assets/')) {
          return source;
        }
      }

      // Check local Steam librarycache
      if (appId) {
        for (const sDir of getSteamInstallDirs()) {
          const lcDir = path.join(sDir, 'appcache', 'librarycache', appId);
          if (fs.existsSync(lcDir)) {
            const candidateFiles = filename === 'tile.jpg'
              ? ['library_600x900_2x.jpg', 'library_600x900.jpg', 'library_capsule.jpg']
              : filename === 'hero.jpg'
              ? ['library_hero.jpg', 'hero.jpg']
              : ['logo.png'];
            for (const cFn of candidateFiles) {
              const localSrc = path.join(lcDir, cFn);
              if (fs.existsSync(localSrc)) {
                const filePath = path.join(cacheDir, filename);
                fs.copyFileSync(localSrc, filePath);
                return `/assets/cache/games/${safeId}/${filename}?t=${timestamp}`;
              }
            }
          }
        }

        // Fallback fetch from Steam Akamai CDN
        try {
          const cdnPath = filename === 'tile.jpg'
            ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`
            : filename === 'hero.jpg'
            ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`
            : `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/logo.png`;
          const resp = await fetch(cdnPath);
          if (resp.ok) {
            const arrBuf = await resp.arrayBuffer();
            const filePath = path.join(cacheDir, filename);
            fs.writeFileSync(filePath, Buffer.from(arrBuf));
            return `/assets/cache/games/${safeId}/${filename}?t=${timestamp}`;
          }
        } catch (e) {}
      }

      return null;
    }

    if (tileDataUrl || appId) saved.tileIcon = await saveImage(tileDataUrl, 'tile.jpg');
    if (heroDataUrl || appId) saved.heroBg = await saveImage(heroDataUrl, 'hero.jpg');
    if (logoDataUrl || appId) saved.logoImg = await saveImage(logoDataUrl, 'logo.png');

    return { success: true, saved };
  } catch (err) {
    console.error('[Electron Cache] Failed to cache artwork:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:get-appdetails', async (_event, appId) => {
  const id = String(appId || '').trim();
  if (!/^\d+$/.test(id)) return null;
  return fetchSteamStoreAppDetails(id);
});

// Native Windows File Dialog for Custom Artwork / Backgrounds
ipcMain.handle('dialog:browse-image', async () => {
  if (!mainWindow) return null;
  try {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Custom Game Artwork or Background',
      properties: ['openFile'],
      filters: [
        { name: 'Images (*.png;*.jpg;*.jpeg;*.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }
      ]
    });
    if (res.canceled || !res.filePaths.length) return null;
    return res.filePaths[0];
  } catch (err) {
    console.error('[Dialog Error]', err);
    return null;
  }
});

// Persistent Library Storage Handlers
ipcMain.handle('library:get-all', async () => {
  const store = getLibraryStore();
  const list = store ? store.data.games : [];
  return Array.isArray(list)
    ? list.filter(g => {
      if (!g) return false;
      const tLow = String(g.title || '').toLowerCase().trim();
      const idLow = String(g.id || '').toLowerCase();
      return tLow !== 'minecraft launcher' && idLow !== 'xbox_id_1794566092' && idLow !== 'xbox_minecraft_launcher';
    })
    : [];
});

ipcMain.handle('library:save-game', async (_event, gameData) => {
  if (!gameData || !gameData.id) return { success: false, error: 'No game ID provided' };
  const store = getLibraryStore();
  const list = store.data.games || [];
  const idx = list.findIndex(g => g.id === gameData.id);
  const updated = {
    ...(idx !== -1 ? list[idx] : {}),
    ...gameData,
    lastUpdated: Date.now()
  };
  if (idx !== -1) {
    list[idx] = updated;
  } else {
    list.push(updated);
  }
  store.data.games = list;
  store.saveSoon();
  return { success: true, game: updated };
});

// Custom Artwork & Background Persistence Handler (Atomic disk write + JSON database)
ipcMain.handle('game:save-custom-artwork', async (_event, data) => {
  try {
    const { gameId, type, source, title, filePath, dataUrl } = data || {};
    if (!gameId) return { success: false, error: 'No gameId provided' };

    const safeId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheDir = path.join(getCacheRootDir(), 'games', safeId);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // Also persist into app user data artwork directory for backup permanence
    const userDataArtDir = path.join(getUserDataDir(), 'artwork', safeId);
    if (!fs.existsSync(userDataArtDir)) fs.mkdirSync(userDataArtDir, { recursive: true });

    const timestamp = Date.now();
    let filename = '';
    if (type === 'hero' || type === 'background') filename = 'hero.jpg';
    else if (type === 'tile' || type === 'cover') filename = 'tile.jpg';
    else if (type === 'logo') filename = 'logo.png';
    else filename = `${type || 'custom'}.png`;

    const destCachePath = path.join(cacheDir, filename);
    const destUserPath = path.join(userDataArtDir, filename);

    if (filePath && fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, destCachePath);
      try { fs.copyFileSync(filePath, destUserPath); } catch (e) {}
    } else if (dataUrl && dataUrl.includes('base64,')) {
      const b64 = dataUrl.split('base64,')[1];
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(destCachePath, buf);
      try { fs.writeFileSync(destUserPath, buf); } catch (e) {}
    } else if (source && (source.startsWith('http://') || source.startsWith('https://'))) {
      const resp = await fetch(source);
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        fs.writeFileSync(destCachePath, buf);
        try { fs.writeFileSync(destUserPath, buf); } catch (e) {}
      }
    }

    const publicUrl = `/assets/cache/games/${safeId}/${filename}?t=${timestamp}`;

    // Update persistent JSON store immediately
    const store = getLibraryStore();
    const list = store.data.games || [];
    const idx = list.findIndex(g => g.id === gameId);
    const existing = idx !== -1 ? list[idx] : { id: gameId, title: title || gameId };

    const patch = {
      ...existing,
      hasCustomArtwork: true,
      customArtwork: true,
      artworkSource: 'User Custom',
      lastUpdated: timestamp
    };

    if (type === 'hero' || type === 'background') {
      patch.heroBg = publicUrl;
      patch.backgroundImage = publicUrl;
    } else if (type === 'tile' || type === 'cover') {
      patch.tileIcon = publicUrl;
      patch.coverImage = publicUrl;
      patch.thumbnail = publicUrl;
    } else if (type === 'logo') {
      patch.logoImg = publicUrl;
      patch.logoImage = publicUrl;
    }

    if (idx !== -1) list[idx] = patch;
    else list.push(patch);
    store.data.games = list;
    store.saveSoon();

    return { success: true, url: publicUrl, gameId, type, game: patch };
  } catch (err) {
    console.error('[Electron] Error saving custom artwork:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('game:restore-default-artwork', async (_event, gameId) => {
  if (!gameId) return { success: false, error: 'No gameId provided' };
  const safeId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cacheDir = path.join(getCacheRootDir(), 'games', safeId);
  const userDataArtDir = path.join(getUserDataDir(), 'artwork', safeId);

  try {
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      for (const f of files) {
        try { fs.unlinkSync(path.join(cacheDir, f)); } catch (e) {}
      }
    }
    if (fs.existsSync(userDataArtDir)) {
      const files = fs.readdirSync(userDataArtDir);
      for (const f of files) {
        try { fs.unlinkSync(path.join(userDataArtDir, f)); } catch (e) {}
      }
    }
  } catch (e) {}

  const store = getLibraryStore();
  const list = store.data.games || [];
  const idx = list.findIndex(g => g.id === gameId);
  if (idx !== -1) {
    delete list[idx].hasCustomArtwork;
    delete list[idx].customArtwork;
    delete list[idx].heroBg;
    delete list[idx].tileIcon;
    delete list[idx].logoImg;
    delete list[idx].backgroundImage;
    delete list[idx].coverImage;
    delete list[idx].logoImage;
    list[idx].lastUpdated = Date.now();
    store.saveSoon();
  }

  return { success: true, gameId };
});

// Settings Persistence Handlers
ipcMain.handle('settings:load', async () => {
  const store = getSettingsStore();
  return store ? store.data : {};
});

ipcMain.handle('settings:save', async (_event, newSettings) => {
  const store = getSettingsStore();
  if (!store || !newSettings) return { success: false };
  store.data = { ...store.data, ...newSettings };
  store.saveSoon();
  return { success: true, settings: store.data };
});

// Live Windows Wi-Fi Network Query
ipcMain.handle('system:get-wifi-networks', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve({ connected: null, networks: [] });
    }
    child_process.exec('netsh wlan show networks mode=bssid', { windowsHide: true }, (err, stdout) => {
      const networks = [];
      if (!err && stdout) {
        const blocks = stdout.split(/SSID \d+\s*:\s*/i).slice(1);
        for (const block of blocks) {
          const lines = block.split(/\r?\n/);
          const ssid = (lines[0] || '').trim();
          if (!ssid) continue;
          const auth = (block.match(/Authentication\s*:\s*([^\r\n]+)/i)?.[1] || '').trim();
          const signal = (block.match(/Signal\s*:\s*(\d+)%/i)?.[1] || '0').trim();
          const band = (block.match(/Band\s*:\s*([^\r\n]+)/i)?.[1] || '5 GHz').trim();
          networks.push({ ssid, auth, signal: parseInt(signal, 10), band });
        }
      }
      child_process.exec('netsh wlan show interfaces', { windowsHide: true }, (_err2, stdout2) => {
        let connected = null;
        if (stdout2) {
          const state = (stdout2.match(/State\s*:\s*([^\r\n]+)/i)?.[1] || '').trim();
          const curSsid = (stdout2.match(/\bSSID\s*:\s*([^\r\n]+)/i)?.[1] || '').trim();
          const curSignal = (stdout2.match(/Signal\s*:\s*(\d+)%/i)?.[1] || '0').trim();
          const curRadio = (stdout2.match(/Radio type\s*:\s*([^\r\n]+)/i)?.[1] || '').trim();
          if (state.toLowerCase().includes('connected') && curSsid) {
            connected = { ssid: curSsid, signal: parseInt(curSignal, 10), radio: curRadio };
          }
        }
        resolve({ connected, networks });
      });
    });
  });
});

// Live Windows Logical Disks Storage Query
ipcMain.handle('system:get-storage-drives', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve([]);
    }
    const ps = "Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 } | ForEach-Object { [PSCustomObject]@{ DeviceID = $_.DeviceID; VolumeName = $_.VolumeName; Size = [math]::Round($_.Size / 1GB, 1); FreeSpace = [math]::Round($_.FreeSpace / 1GB, 1) } } | ConvertTo-Json -Compress";
    child_process.exec(`powershell.exe -NoProfile -Command "${ps}"`, { windowsHide: true }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      try {
        let list = JSON.parse(stdout.trim());
        if (!Array.isArray(list)) list = [list];
        resolve(list.map(d => ({
          drive: d.DeviceID,
          name: d.VolumeName || 'Console NVMe Storage',
          totalGb: d.Size || 0,
          freeGb: d.FreeSpace || 0,
          usedGb: Math.max(0, Math.round(((d.Size || 0) - (d.FreeSpace || 0)) * 10) / 10),
          usedPercent: d.Size ? Math.round(((d.Size - d.FreeSpace) / d.Size) * 100) : 0
        })));
      } catch (e) {
        resolve([]);
      }
    });
  });
});

// Windows Network & Graphics Settings Integration
ipcMain.handle('system:open-network-settings', () => {
  shell.openExternal('ms-settings:network');
  return true;
});

ipcMain.handle('system:open-graphics-settings', () => {
  shell.openExternal('ms-settings:display-advancedgraphics');
  return true;
});

// Metadata dictionary for known real Steam games with official titles, studios, genres, and PS5 assets
const KNOWN_REAL_GAMES_METADATA = {
  '1778820': { title: 'TEKKEN 8', studio: 'Bandai Namco Studios • Unreal Engine 5', genre: '3D Fighting • Next-Gen Arena Fighter', installSize: '120.8 GB', tileIcon: '/assets/cache/games/pc_steam_1778820/tile.jpg', heroBg: '/assets/cache/games/pc_steam_1778820/hero.jpg', logoImg: '/assets/cache/games/pc_steam_1778820/logo.png' },
  '730': { title: 'Counter-Strike 2', studio: 'Valve • Source 2', genre: 'Tactical FPS • Competitive Esports', installSize: '85 GB', tileIcon: '/assets/games/cs2/tile.webp', heroBg: '/assets/games/cs2/hero.webp', logoImg: '/assets/games/cs2/logo.png' },
  '12210': { title: 'Grand Theft Auto IV: The Complete Edition', studio: 'Rockstar Games • Liberty City', genre: 'Action • Crime Open World', installSize: '22 GB' },
  '21690': { title: 'Resident Evil 5', studio: 'Capcom • Action Co-Op', genre: 'Action • Co-Op Horror', installSize: '15 GB' },
  '35140': { title: 'Batman: Arkham Asylum Game of the Year Edition', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero', installSize: '8 GB' },
  '200260': { title: 'Batman: Arkham City - Game of the Year Edition', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero', installSize: '17 GB' },
  '208650': { title: 'Batman™: Arkham Knight', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero', installSize: '45 GB' },
  '209000': { title: 'Batman™: Arkham Origins', studio: 'WB Games Montréal • WB Games', genre: 'Action Adventure • Superhero', installSize: '20 GB' },
  '221040': { title: 'Resident Evil 6', studio: 'Capcom • Dramatic Horror', genre: 'Action • Dramatic Horror', installSize: '16 GB' },
  '313690': { title: 'LEGO® Batman™ 3: Beyond Gotham', studio: 'TT Games • Warner Bros. Games', genre: 'Action • LEGO Family Adventure', installSize: '10 GB' },
  '418370': { title: 'Resident Evil 7 Biohazard', studio: 'Capcom • RE Engine', genre: 'Survival Horror • RE Engine', installSize: '24 GB' },
  '498240': { title: 'Batman - The Telltale Series', studio: 'Telltale Games', genre: 'Episodic Adventure • Story', installSize: '12 GB' },
  '851850': { title: 'DRAGON BALL Z: KAKAROT', studio: 'CyberConnect2 • Bandai Namco', genre: 'Action RPG • Anime Adventure', installSize: '116.86 GB', tileIcon: '/assets/games/dbzkakarot/tile.webp', heroBg: '/assets/games/dbzkakarot/hero.webp', logoImg: '/assets/games/dbzkakarot/logo.png' },
  '883710': { title: 'Resident Evil 2', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', installSize: '26 GB' },
  '952060': { title: 'Resident Evil 3', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', installSize: '45 GB' },
  '1091500': { title: 'Cyberpunk 2077', studio: 'CD PROJEKT RED • Night City', genre: 'Action RPG • Cyberpunk', installSize: '70 GB' },
  '1196590': { title: 'Resident Evil Village', studio: 'Capcom • RE Engine', genre: 'Survival Horror • Ethan Winters', installSize: '30 GB' },
  '1245620': { title: 'Elden Ring', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Dark Fantasy', installSize: '60 GB' },
  '1546970': { title: 'Grand Theft Auto III – The Definitive Edition', studio: 'Rockstar Games', genre: 'Action • Open World', installSize: '5 GB' },
  '1546990': { title: 'Grand Theft Auto: Vice City – The Definitive Edition', studio: 'Rockstar Games', genre: 'Action • Open World', installSize: '10 GB' },
  '1547000': { title: 'Grand Theft Auto: San Andreas – The Definitive Edition', studio: 'Rockstar Games', genre: 'Action • Open World', installSize: '19 GB' },
  '1551360': { title: 'Forza Horizon 5', studio: 'Playground Games • Xbox Game Studios', genre: 'Open World Racing • Festival', installSize: '110 GB', tileIcon: '/assets/games/forzahorizon5/tile.jpg', heroBg: '/assets/games/forzahorizon5/hero.jpg', logoImg: '/assets/games/forzahorizon5/logo.png' },
  '1593500': { title: 'God of War', studio: 'Santa Monica Studio • PlayStation PC', genre: 'Action Adventure • Mythological Epic', installSize: '70 GB', tileIcon: '/assets/games/gow/tile.webp', heroBg: '/assets/games/gow/hero.webp', logoImg: '/assets/games/gow/logo.png' },
  '1650010': { title: 'RIDE 5', studio: 'Milestone S.r.l. • Unreal Engine 5', genre: 'Motorcycle Racing • Superbike Simulation', installSize: '50 GB', tileIcon: '/assets/games/ride5/tile.webp', heroBg: '/assets/games/ride5/hero.webp', logoImg: '/assets/games/ride5/logo.png' },
  '1790600': { title: 'DRAGON BALL: Sparking! ZERO', studio: 'Spike Chunsoft • Bandai Namco', genre: 'Anime Fighting • 3D Arena Brawler', installSize: '29 GB', tileIcon: '/assets/games/sparkingzero/tile.webp', heroBg: '/assets/games/sparkingzero/hero.webp', logoImg: '/assets/games/sparkingzero/logo.png' },
  '1815780': { title: 'Asphalt Legends', studio: 'Gameloft • High-Octane Racing', genre: 'Arcade Racing • Supercars', installSize: '10 GB', tileIcon: '/assets/games/asphaltlegends/tile.webp', heroBg: '/assets/games/asphaltlegends/hero.webp', logoImg: '/assets/games/asphaltlegends/logo.png' },
  '1817070': { title: 'Marvel’s Spider-Man Remastered', studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', installSize: '75 GB', tileIcon: '/assets/games/spidermanremastered/tile.webp', heroBg: '/assets/games/spidermanremastered/hero.webp', logoImg: '/assets/games/spidermanremastered/logo.png' },
  '1817190': { title: 'Marvel’s Spider-Man: Miles Morales', studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', installSize: '75 GB', tileIcon: '/assets/games/spidermanmilesmorales/tile.webp', heroBg: '/assets/games/spidermanmilesmorales/hero.webp', logoImg: '/assets/games/spidermanmilesmorales/logo.png' },
  '1888930': { title: 'The Last of Us™ Part I', studio: 'Naughty Dog • PlayStation PC', genre: 'Action Adventure • Post-Apocalyptic', installSize: '100 GB', tileIcon: '/assets/games/tlou1/tile.webp', heroBg: '/assets/games/tlou1/hero.webp', logoImg: '/assets/games/tlou1/logo.png' },
  '2050650': { title: 'Resident Evil 4', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', installSize: '67 GB', tileIcon: '/assets/games/re4/tile.webp', heroBg: '/assets/games/re4/hero.webp', logoImg: '/assets/games/re4/logo.png' },
  '2215430': { title: "Ghost of Tsushima DIRECTOR'S CUT", studio: 'Sucker Punch • PlayStation PC Publishing', genre: 'Action Adventure • Samurai Epic', installSize: '75 GB', tileIcon: '/assets/games/got/tile.webp', heroBg: '/assets/games/got/hero.webp', logoImg: '/assets/games/got/logo.png' },
  '2322010': { title: 'God of War Ragnarök', studio: 'Santa Monica Studio • PlayStation PC', genre: 'Action • Mythological Epic', installSize: '190 GB', tileIcon: '/assets/games/gowragnarok/tile.webp', heroBg: '/assets/games/gowragnarok/hero.webp' },
  '2358720': { title: 'Black Myth: Wukong', studio: 'Game Science • Action RPG', genre: 'Action RPG • Journey to the West', installSize: '130 GB', tileIcon: '/assets/games/wukong/ps5_tile.webp', heroBg: '/assets/games/wukong/ps5_hero.webp', logoImg: '/assets/games/wukong/logo.png' },
  '2440510': { title: 'Forza Motorsport', studio: 'Turn 10 Studios • Xbox Game Studios', genre: 'Track Racing • Motorsport Simulation', installSize: '130 GB', tileIcon: '/assets/games/forzamotorsport/tile.jpg', heroBg: '/assets/games/forzamotorsport/hero.jpg', logoImg: '/assets/games/forzamotorsport/logo.png' },
  '2483190': { title: 'Forza Horizon 6', studio: 'Playground Games • Xbox Game Studios', genre: 'Open World Racing • Simulation', installSize: '167 GB', tileIcon: '/assets/games/forza6/tile.jpg', heroBg: '/assets/games/forza6/hero.jpg', logoImg: '/assets/games/forza6/logo.png' },
  '2531310': { title: 'The Last of Us™ Part II Remastered', studio: 'Naughty Dog • PlayStation PC', genre: 'Action Adventure • Post-Apocalyptic', installSize: '150 GB', tileIcon: '/assets/games/tlou2/tile.webp', heroBg: '/assets/games/tlou2/hero.webp', logoImg: '/assets/games/tlou2/logo.png' },
  '2651280': { title: "Marvel's Spider-Man 2", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', installSize: '140 GB', tileIcon: '/assets/games/spiderman2/tile.webp', heroBg: '/assets/games/spiderman2/hero.webp', logoImg: '/assets/games/spiderman2/logo.png' },
  '2878960': { title: 'WWE 2K25', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • Pro Wrestling', installSize: '103 GB' },
  '3240220': { title: 'Grand Theft Auto V', studio: 'Rockstar Games • Los Santos', genre: 'Action • Crime Open World', installSize: '105 GB', tileIcon: '/assets/games/gtav/tile.jpg', heroBg: '/assets/games/gtav/hero.jpg', logoImg: '/assets/games/gtav/logo.png' },
  '3357650': { title: 'PRAGMATA', studio: 'Capcom • Sci-Fi Adventure', genre: 'Action Adventure • Lunar Dystopia', installSize: '40 GB', tileIcon: '/assets/games/pragmata/tile.png', heroBg: '/assets/games/pragmata/hero.jpg', logoImg: '/assets/games/pragmata/logo.png' },
  '3764200': { title: 'Resident Evil Requiem', studio: 'Capcom • Next-Gen Horror', genre: 'Survival Horror • RE Engine', installSize: '68 GB', tileIcon: '/assets/games/rerequiem/tile.jpg', heroBg: '/assets/games/rerequiem/hero.jpg', logoImg: '/assets/games/rerequiem/logo.png' },
  '389730': { title: 'TEKKEN 7', studio: 'Bandai Namco Entertainment • Fighting', genre: 'Fighting • 3D Martial Arts', installSize: '78.5 GB', tileIcon: '/assets/cache/games/pc_steam_389730/tile.jpg', heroBg: '/assets/cache/games/pc_steam_389730/hero.jpg', logoImg: '/assets/cache/games/pc_steam_389730/logo.png' },
  '3564740': { title: 'Where Winds Meet', studio: 'Everstone Studio • Open-World Wuxia', genre: 'Action RPG • Martial Arts Open World', installSize: '50.0 GB', tileIcon: '/assets/cache/games/pc_steam_3564740/tile.jpg', heroBg: '/assets/cache/games/pc_steam_3564740/hero.jpg', logoImg: '/assets/cache/games/pc_steam_3564740/logo.png' },
  '4080220': { title: 'EA SPORTS FC™ 27', studio: 'EA Vancouver • EA Sports', genre: 'Sports • Football Simulation', installSize: '100 GB', tileIcon: '/assets/games/eafc27/tile.jpg', heroBg: '/assets/games/eafc27/hero.jpg', logoImg: '/assets/games/eafc27/logo.png' },
  '2668510': { title: 'Red Dead Redemption', studio: 'Rockstar Games • Double Eleven', genre: 'Action Adventure • Western Classic', installSize: '12 GB', tileIcon: '/assets/cache/games/pc_steam_2668510/tile.jpg', heroBg: '/assets/cache/games/pc_steam_2668510/hero.jpg', logoImg: '/assets/cache/games/pc_steam_2668510/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '1174180': { title: 'Red Dead Redemption 2', studio: 'Rockstar Games • Van der Linde Gang', genre: 'Action Adventure • Epic Western', installSize: '120 GB', tileIcon: '/assets/cache/games/pc_steam_1174180/tile.jpg', heroBg: '/assets/cache/games/pc_steam_1174180/hero.jpg', logoImg: '/assets/cache/games/pc_steam_1174180/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '304240': { title: 'Resident Evil', studio: 'Capcom • Survival Horror Classic', genre: 'Action • Survival Horror HD', installSize: '20 GB', tileIcon: '/assets/cache/games/pc_steam_304240/tile.jpg', heroBg: '/assets/cache/games/pc_steam_304240/hero.jpg', logoImg: '/assets/cache/games/pc_steam_304240/logo.png' },
  '339340': { title: 'Resident Evil 0', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror HD', installSize: '13 GB', tileIcon: '/assets/cache/games/pc_steam_339340/tile.jpg', heroBg: '/assets/cache/games/pc_steam_339340/hero.jpg', logoImg: '/assets/cache/games/pc_steam_339340/logo.png' },
  '2698940': { title: 'The Crew™ Motorfest', studio: 'Ubisoft Ivory Tower • Hawaii', genre: 'Open World Racing • Island Festival', installSize: '40 GB', tileIcon: '/assets/cache/games/pc_steam_2698940/tile.jpg', heroBg: '/assets/cache/games/pc_steam_2698940/hero.jpg', logoImg: '/assets/cache/games/pc_steam_2698940/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '3768760': { title: '007 First Light', studio: 'IO Interactive • James Bond Origin Story', genre: 'Stealth Action • James Bond Origin', installSize: '50 GB', tileIcon: '/assets/cache/games/pc_steam_3768760/tile.jpg', heroBg: '/assets/cache/games/pc_steam_3768760/hero.jpg', logoImg: '/assets/cache/games/pc_steam_3768760/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '814380': { title: 'Sekiro™: Shadows Die Twice - GOTY Edition', studio: 'FromSoftware • Activision', genre: 'Action Adventure • Sengoku Shinobi', installSize: '25 GB', tileIcon: '/assets/cache/games/pc_steam_814380/tile.jpg', heroBg: '/assets/cache/games/pc_steam_814380/hero.jpg', logoImg: '/assets/cache/games/pc_steam_814380/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '3717070': { title: 'WWE 2K26', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • Pro Wrestling Simulation', installSize: '100 GB', tileIcon: '/assets/cache/games/pc_steam_3717070/tile.jpg', heroBg: '/assets/cache/games/pc_steam_3717070/hero.jpg', logoImg: '/assets/cache/games/pc_steam_3717070/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '2315690': { title: 'WWE 2K24', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • 40 Years of WrestleMania', installSize: '90 GB', tileIcon: '/assets/cache/games/pc_steam_2315690/tile.jpg', heroBg: '/assets/cache/games/pc_steam_2315690/hero.jpg', logoImg: '/assets/cache/games/pc_steam_2315690/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '502820': { title: 'Batman™: Arkham VR', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Virtual Reality', installSize: '8 GB', tileIcon: '/assets/cache/games/pc_steam_502820/tile.jpg', heroBg: '/assets/cache/games/pc_steam_502820/hero.jpg', logoImg: '/assets/cache/games/pc_steam_502820/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '570940': { title: 'DARK SOULS™: REMASTERED', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Lordran Epic', installSize: '8 GB', tileIcon: '/assets/cache/games/pc_steam_570940/tile.jpg', heroBg: '/assets/cache/games/pc_steam_570940/hero.jpg', logoImg: '/assets/cache/games/pc_steam_570940/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '374320': { title: 'DARK SOULS™ III', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Lothric Kingdom', installSize: '25 GB', tileIcon: '/assets/cache/games/pc_steam_374320/tile.jpg', heroBg: '/assets/cache/games/pc_steam_374320/hero.jpg', logoImg: '/assets/cache/games/pc_steam_374320/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '335300': { title: 'DARK SOULS™ II: Scholar of the First Sin', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Drangleic Kingdom', installSize: '12 GB', tileIcon: '/assets/cache/games/pc_steam_335300/tile.jpg', heroBg: '/assets/cache/games/pc_steam_335300/hero.jpg', logoImg: '/assets/cache/games/pc_steam_335300/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' },
  '431960': { title: 'Wallpaper Engine', studio: 'Kristjan Skutta • Steam Software', genre: 'Live Wallpaper & Customization', installSize: '1.3 GB', tileIcon: '/assets/games/wallpaper/tile.jpg', heroBg: '/assets/games/wallpaper/hero.jpg', logoImg: '/assets/games/wallpaper/logo.png', heroBgPos: 'center center', heroBgSize: 'cover', heroBgZoom: 1.0, heroBgOrigin: 'center center' }
};

// Whitelist of known real Steam game App IDs (not tools/SDKs/utilities)
const KNOWN_REAL_GAME_APPIDS = new Set(Object.keys(KNOWN_REAL_GAMES_METADATA));

// IDs that are definitively NOT games (tools, SDKs, runtimes, utilities, redistributables, demos)
const NON_GAME_APPIDS = new Set([
  '7','228980','1070560','1391110','1628350','216938','250820',
  '365670','1905180','223850','294420','3301060','480','760',
  '1887720','1493710','2371090','241100','1755070','2215200'
]);

function isNonGameSteamApp(title, appId) {
  if (appId && String(appId) === '431960') return false;
  if (title && title.toLowerCase() === 'wallpaper engine') return false;
  if (appId && NON_GAME_APPIDS.has(String(appId))) return true;
  if (!title) return false;
  const t = title.toLowerCase();
  if (/^steam\s+app\s+\d+$/i.test(title)) return true;
  if (/^steam\s+game\s+\d+$/i.test(title)) return true;
  if (t.includes(' demo') || t.endsWith(' demo') || t.includes('demo edition')) return true;
  const nonGameKeywords = [
    'steamworks','redistributable','common redist','runtime',
    'proton','dedicated server','server tool','benchmark','3dmark','obs studio',
    'soundpad','sdk','openvr','steamvr','audio visualizer',
    'desktop mate','vroid studio','spacewar'
  ];
  return nonGameKeywords.some(kw => t.includes(kw));
}

let persistentSteamWs = null;
let persistentSteamWsUrl = null;
let steamWsConnectingPromise = null;
const cdpPendingResolvers = new Map();
let cdpSeq = 1;

function getNextCdpId() {
  cdpSeq = (cdpSeq + 1) % 1000000;
  return cdpSeq;
}

function resetPersistentSteamWs() {
  if (persistentSteamWs) {
    try { persistentSteamWs.close(); } catch (e) {}
  }
  persistentSteamWs = null;
  persistentSteamWsUrl = null;
  steamWsConnectingPromise = null;
  for (const resolver of cdpPendingResolvers.values()) {
    resolver(null);
  }
  cdpPendingResolvers.clear();
}

async function ensureSteamCdpSocket() {
  const WS = globalThis.WebSocket;
  if (!WS) {
    logSteamCdpDiagnostic('WebSocket is unavailable in the Electron main process.');
    return null;
  }

  let res;
  try {
    res = await fetch('http://127.0.0.1:8080/json');
  } catch (e) {
    if (persistentSteamWs) resetPersistentSteamWs();
    return null;
  }
  if (!res.ok) {
    logSteamCdpDiagnostic(`Steam debugger endpoint returned HTTP ${res.status}.`);
    resetPersistentSteamWs();
    return null;
  }

  const targets = await res.json();
  const shared = targets.find(t => t.title === 'SharedJSContext');
  if (!shared?.webSocketDebuggerUrl) {
    logSteamCdpDiagnostic('Steam debugger is running but SharedJSContext was not found.');
    resetPersistentSteamWs();
    return null;
  }

  const targetUrl = shared.webSocketDebuggerUrl;
  if (persistentSteamWs && persistentSteamWsUrl === targetUrl && persistentSteamWs.readyState === 1) {
    return persistentSteamWs;
  }

  if (steamWsConnectingPromise) {
    return await steamWsConnectingPromise;
  }

  resetPersistentSteamWs();
  steamWsConnectingPromise = new Promise((resolve) => {
    try {
      const ws = new WS(targetUrl);
      persistentSteamWs = ws;
      persistentSteamWsUrl = targetUrl;

      let opened = false;
      const openTimer = setTimeout(() => {
        if (!opened) {
          steamWsConnectingPromise = null;
          resolve(null);
        }
      }, 1000);

      ws.onopen = () => {
        opened = true;
        clearTimeout(openTimer);
        steamWsConnectingPromise = null;
        resolve(ws);
      };

      ws.onmessage = (msg) => {
        try {
          const d = JSON.parse(msg.data);
          const resolver = cdpPendingResolvers.get(d.id);
          if (resolver) {
            cdpPendingResolvers.delete(d.id);
            if (d.error || d.result?.exceptionDetails) {
              logSteamCdpDiagnostic(`Steam CDP evaluation failed: ${d.error?.message || d.result?.exceptionDetails?.text || 'unknown response error'}`);
              resolver(null);
            } else {
              resolver(d.result?.result?.value ?? null);
            }
          }
        } catch (e) {}
      };

      ws.onerror = (event) => {
        logSteamCdpDiagnostic(`Steam WebSocket connection failed${event?.message ? `: ${event.message}` : '.'}`);
        clearTimeout(openTimer);
        resetPersistentSteamWs();
        if (!opened) resolve(null);
      };

      ws.onclose = () => {
        clearTimeout(openTimer);
        resetPersistentSteamWs();
        if (!opened) resolve(null);
      };
    } catch (err) {
      resetPersistentSteamWs();
      resolve(null);
    }
  });

  return await steamWsConnectingPromise;
}

async function evaluateSteamCdp(expression, { awaitPromise = false, timeoutMs = 1000 } = {}) {
  try {
    const ws = await ensureSteamCdpSocket();
    if (!ws || ws.readyState !== 1) return null;

    const requestId = getNextCdpId();
    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        cdpPendingResolvers.delete(requestId);
        logSteamCdpDiagnostic('Timed out waiting for Steam SharedJSContext response.');
        resolve(null);
      }, timeoutMs);

      cdpPendingResolvers.set(requestId, (value) => {
        clearTimeout(timer);
        resolve(value);
      });

      try {
        ws.send(JSON.stringify({
          id: requestId,
          method: 'Runtime.evaluate',
          params: {
            expression,
            awaitPromise,
            returnByValue: true
          }
        }));
      } catch (sendErr) {
        clearTimeout(timer);
        cdpPendingResolvers.delete(requestId);
        resolve(null);
      }
    });
  } catch (err) {
    return null;
  }
}

let cachedLiveSteamFavorites = null;
let cachedLiveSteamFavoritesMeta = new Map();
let hasAuthoritativeLiveFavorites = false;
let cachedLiveOwnedCount = null;
let lastSteamFavoritesSnapshotHash = '';
let steamTitlesCacheMap = null;

function getSteamTitlesCachePath() {
  return path.join(getCacheRootDir(), 'steam_titles_cache.json');
}

function getCachedSteamTitle(appId) {
  const key = String(appId || '').trim();
  if (!key) return '';
  if (!steamTitlesCacheMap) {
    steamTitlesCacheMap = new Map();
    try {
      const p = getSteamTitlesCachePath();
      if (fs.existsSync(p)) {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string' && v.trim()) steamTitlesCacheMap.set(k, v.trim());
          }
        }
      }
    } catch (e) {}
  }
  return steamTitlesCacheMap.get(key) || '';
}

function saveCachedSteamTitle(appId, title) {
  const key = String(appId || '').trim();
  const cleanTitle = String(title || '').trim();
  if (!key || !cleanTitle || /^Steam App \d+$/i.test(cleanTitle)) return;
  getCachedSteamTitle(key);
  if (steamTitlesCacheMap.get(key) === cleanTitle) return;
  steamTitlesCacheMap.set(key, cleanTitle);
  try {
    const p = getSteamTitlesCachePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(Object.fromEntries(steamTitlesCacheMap), null, 2), 'utf-8');
  } catch (e) {}
}

function hasNonEmptyFile(filePath) {
  try {
    return Boolean(filePath && fs.existsSync(filePath) && fs.statSync(filePath).size > 0);
  } catch (e) {
    return false;
  }
}

function getSteamFavoritesCachePaths() {
  return {
    favPath: path.join(getCacheRootDir(), 'steam_favorites.json'),
    snapshotPath: path.join(getUserDataDir(), 'steam_favorites_snapshot.json')
  };
}

function formatSteamPlaytime(minutes) {
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins <= 0) return null;
  if (mins >= 60) {
    const hrs = Math.round(mins / 60);
    return `${hrs}h`;
  }
  return `${Math.round(mins)}m`;
}

function formatSteamByteSize(bytes) {
  const b = Number(bytes);
  if (!Number.isFinite(b) || b <= 1048576) return null;
  const gb = b / 1073741824;
  return gb >= 10 ? `${gb.toFixed(1)} GB` : `${gb.toFixed(2)} GB`;
}

function resolveCuratedPublicAsset(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return '';
  if (!assetPath.startsWith('/assets/')) return assetPath;
  const diskPath = assetPath.startsWith('/assets/cache/')
    ? path.join(getCacheRootDir(), assetPath.slice('/assets/cache/'.length))
    : path.join(getStaticAssetsRoot(), assetPath.slice(1));
  return hasNonEmptyFile(diskPath) ? assetPath : '';
}

function resolveSteamAssetUrls(appId, meta = {}) {
  const strId = String(appId || '').trim();
  const cacheBaseDir = path.join(getCacheRootDir(), 'games', `pc_steam_${strId}`);
  const hasCachedTile = hasNonEmptyFile(path.join(cacheBaseDir, 'tile.jpg'));
  const hasCachedHero = hasNonEmptyFile(path.join(cacheBaseDir, 'hero.jpg'));
  const hasCachedLogo = hasNonEmptyFile(path.join(cacheBaseDir, 'logo.png'));

  const curatedTile = resolveCuratedPublicAsset(meta.tileIcon);
  const curatedHero = resolveCuratedPublicAsset(meta.heroBg);
  const curatedLogo = resolveCuratedPublicAsset(meta.logoImg);

  const tileIcon = curatedTile || (hasCachedTile
    ? `/assets/cache/games/pc_steam_${strId}/tile.jpg`
    : `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/library_600x900_2x.jpg`);
  const heroBg = curatedHero || (hasCachedHero
    ? `/assets/cache/games/pc_steam_${strId}/hero.jpg`
    : `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/library_hero.jpg`);
  const logoImg = curatedLogo || (hasCachedLogo
    ? `/assets/cache/games/pc_steam_${strId}/logo.png`
    : `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/logo.png`);

  return { tileIcon, heroBg, logoImg };
}

async function syncLiveFavoritesFromSteamClient() {
  try {
    const expr = `(() => {
      const appStore = window.appStore;
      const colStore = window.collectionStore;
      if (!appStore || !colStore) return null;
      const favCol = colStore.GetCollection ? colStore.GetCollection('favorite') : null;
      if (!favCol) return null;
      const hiddenCol = colStore.GetCollection ? colStore.GetCollection('hidden') : null;
      const hiddenApps = hiddenCol?.apps || null;
      const source = favCol.visibleApps || favCol.allApps || favCol.apps || [];
      const favorites = [];
      const seen = new Set();
      for (const entry of source) {
        const aid = typeof entry === 'object' ? entry.appid : entry;
        if (!aid) continue;
        const strAid = String(aid);
        if (seen.has(strAid)) continue;
        const ov = (typeof entry === 'object' && entry.display_name)
          ? entry
          : (appStore.GetAppOverviewByAppID ? appStore.GetAppOverviewByAppID(aid) : null);
        if (!ov || !ov.visible_in_game_list) continue;
        if (hiddenApps && typeof hiddenApps.has === 'function' && hiddenApps.has(Number(aid))) continue;
        if (ov.app_type === 4 || ov.app_type === 8 || ov.app_type === 2048) continue;
        seen.add(strAid);
        favorites.push({
          appId: strAid,
          title: ov.display_name || '',
          appType: ov.app_type ?? 1,
          installed: Boolean(ov.installed),
          sizeOnDisk: ov.size_on_disk ? Number(ov.size_on_disk) : 0,
          playtimeMinutes: Number(ov.minutes_playtime_forever || 0),
          lastPlayed: Number(ov.rt_last_time_played || 0)
        });
      }
      const ownedCount = Array.isArray(appStore.allApps)
        ? appStore.allApps.filter(ov => ov && ov.visible_in_game_list && ov.app_type !== 4 && ov.app_type !== 8 && ov.app_type !== 2048).length
        : null;
      return {
        steamId: window.App?.GetCurrentUser?.()?.strSteamID || null,
        ownedCount,
        favorites
      };
    })()`;

    const payload = await evaluateSteamCdp(expr, { awaitPromise: false, timeoutMs: 1100 });
    if (payload && Array.isArray(payload.favorites)) {
      const cleanFavs = payload.favorites.filter(f => f && f.appId && !isNonGameSteamApp(f.title, f.appId));
      const newFavIds = cleanFavs.map(f => String(f.appId));
      const nextHash = JSON.stringify(cleanFavs.map(f => `${f.appId}:${f.installed ? 1 : 0}:${f.title}`).sort());
      const changed = nextHash !== lastSteamFavoritesSnapshotHash;
      lastSteamFavoritesSnapshotHash = nextHash;

      cachedLiveSteamFavorites = new Set(newFavIds);
      cachedLiveSteamFavoritesMeta = new Map(cleanFavs.map(f => [String(f.appId), f]));
      hasAuthoritativeLiveFavorites = true;
      if (Number.isFinite(payload.ownedCount)) cachedLiveOwnedCount = payload.ownedCount;

      if (changed) {
        const { favPath, snapshotPath } = getSteamFavoritesCachePaths();
        try {
          const cacheDir = path.dirname(favPath);
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
          fs.writeFileSync(favPath, JSON.stringify(newFavIds), 'utf-8');
        } catch (e) {}
        try {
          const account = getConnectedSteamAccount();
          const snapDir = path.dirname(snapshotPath);
          if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir, { recursive: true });
          fs.writeFileSync(snapshotPath, JSON.stringify({
            accountId: account.accountId,
            steamId64: payload.steamId || account.steamId64,
            syncedAt: Date.now(),
            ownedCount: cachedLiveOwnedCount,
            favorites: cleanFavs
          }, null, 2), 'utf-8');
        } catch (e) {}
      }
      return cachedLiveSteamFavorites;
    }
  } catch (e) {}
  return null;
}

function loadOfflineSteamFavoritesSnapshot(allowGlobalCache = false) {
  const { favPath, snapshotPath } = getSteamFavoritesCachePaths();
  const account = getConnectedSteamAccount();
  try {
    if (fs.existsSync(snapshotPath)) {
      const snap = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
      if (snap && Array.isArray(snap.favorites) && (!snap.accountId || !account.accountId || snap.accountId === account.accountId)) {
        const validFavs = snap.favorites.filter(f => f && f.appId && !isNonGameSteamApp(f.title, f.appId));
        cachedLiveSteamFavoritesMeta = new Map(validFavs.map(f => [String(f.appId), f]));
        if (Number.isFinite(snap.ownedCount)) cachedLiveOwnedCount = snap.ownedCount;
        return new Set(validFavs.map(f => String(f.appId)));
      }
    }
  } catch (e) {}

  if (!allowGlobalCache) return null;
  try {
    if (fs.existsSync(favPath)) {
      const data = JSON.parse(fs.readFileSync(favPath, 'utf-8'));
      if (Array.isArray(data)) {
        return new Set(data.map(String).filter(id => /^\d+$/.test(id) && !isNonGameSteamApp(null, id)));
      }
    }
  } catch (e) {}
  return null;
}

function getLocallyVerifiedSteamOwnedAppIds() {
  const owned = new Set();
  for (const sApps of getSteamLibraryFolders()) {
    try {
      if (!fs.existsSync(sApps)) continue;
      for (const file of fs.readdirSync(sApps)) {
        const m = /^appmanifest_(\d+)\.acf$/i.exec(file);
        if (m && !isNonGameSteamApp(null, m[1])) owned.add(m[1]);
      }
    } catch (e) {}
  }

  const account = getConnectedSteamAccount();
  if (account?.userDataPath && fs.existsSync(account.userDataPath)) {
    const lcPath = path.join(account.userDataPath, 'config', 'localconfig.vdf');
    if (fs.existsSync(lcPath)) {
      try {
        const lcContent = fs.readFileSync(lcPath, 'utf-8');
        const appMatches = [...lcContent.matchAll(/"(\d{3,8})"\s*\{([^}]*)\}/g)];
        for (const m of appMatches) {
          const aid = m[1];
          const body = m[2];
          if (body.includes('LastPlayed') || body.includes('Playtime') || body.includes('DefaultLaunchOption')) {
            if (!isNonGameSteamApp(null, aid)) owned.add(aid);
          }
        }
      } catch (e) {}
    }

    const libCacheDir = path.join(account.userDataPath, 'config', 'librarycache');
    if (fs.existsSync(libCacheDir)) {
      try {
        for (const f of fs.readdirSync(libCacheDir)) {
          const m = /^(\d+)\.json$/i.exec(f);
          if (m && !isNonGameSteamApp(null, m[1])) owned.add(m[1]);
        }
      } catch (e) {}
    }
  }
  return owned;
}

function getSteamFavoriteAppIds() {
  if (hasAuthoritativeLiveFavorites && cachedLiveSteamFavorites) {
    return cachedLiveSteamFavorites;
  }

  // Always inspect active Steam user's disk collections first (cloudstorage, localconfig, sharedconfig)
  // so offline favorite edits and different accounts never get shadowed by a stale cache file.
  const account = getConnectedSteamAccount();
  const steamDirs = getSteamInstallDirs();
  const rawDiscovered = new Set();
  const hiddenSet = new Set();
  let hasExplicitCollections = false;
  const userPathsToScan = account?.userDataPath && fs.existsSync(account.userDataPath)
    ? [account.userDataPath]
    : steamDirs
        .map(d => path.join(d, 'userdata'))
        .filter(ud => fs.existsSync(ud))
        .flatMap(ud => {
          try {
            return fs.readdirSync(ud)
              .filter(u => u !== '0' && u !== 'anonymous')
              .map(u => path.join(ud, u));
          } catch (e) { return []; }
        });

  for (const uPath of userPathsToScan) {
    const cloudStorageDir = path.join(uPath, 'config', 'cloudstorage');
    if (fs.existsSync(cloudStorageDir)) {
      try {
        for (const csFile of fs.readdirSync(cloudStorageDir)) {
          if (csFile.startsWith('cloud-storage-namespace-') && csFile.endsWith('.json') && !csFile.endsWith('.modified.json')) {
            try {
              const parsed = JSON.parse(fs.readFileSync(path.join(cloudStorageDir, csFile), 'utf-8'));
              if (Array.isArray(parsed)) {
                for (const entry of parsed) {
                  if (!Array.isArray(entry) || entry.length < 2) continue;
                  const [key, obj] = entry;
                  if (key === 'user-collections.hidden' && obj?.value && !obj?.is_deleted) {
                    const hv = typeof obj.value === 'string' ? JSON.parse(obj.value) : obj.value;
                    const hRemoved = new Set((Array.isArray(hv?.removed) ? hv.removed : []).map(String));
                    for (const aid of (Array.isArray(hv?.added) ? hv.added : [])) {
                      if (!hRemoved.has(String(aid))) hiddenSet.add(String(aid));
                    }
                  }
                  if (key === 'user-collections.favorite' && obj?.value && !obj?.is_deleted) {
                    hasExplicitCollections = true;
                    const val = typeof obj.value === 'string' ? JSON.parse(obj.value) : obj.value;
                    const added = Array.isArray(val?.added) ? val.added : [];
                    const removed = new Set((Array.isArray(val?.removed) ? val.removed : []).map(String));
                    for (const aid of added) {
                      const strAid = String(aid);
                      if (!removed.has(strAid) && !NON_GAME_APPIDS.has(strAid)) {
                        rawDiscovered.add(strAid);
                      }
                    }
                  }
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    const localConfigPath = path.join(uPath, 'config', 'localconfig.vdf');
    if (fs.existsSync(localConfigPath)) {
      try {
        const lcContent = fs.readFileSync(localConfigPath, 'utf-8');
        const ucMatch = lcContent.match(/"user-collections"\s+"([^"]+)"/);
        if (ucMatch && ucMatch[1]) {
          try {
            const unescaped = ucMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const ucObj = JSON.parse(unescaped);
            if (ucObj?.favorite?.added) {
              hasExplicitCollections = true;
              const lcRemoved = new Set((Array.isArray(ucObj.favorite.removed) ? ucObj.favorite.removed : []).map(String));
              for (const aid of ucObj.favorite.added) {
                const strAid = String(aid);
                if (!lcRemoved.has(strAid) && !NON_GAME_APPIDS.has(strAid)) rawDiscovered.add(strAid);
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    const sharedConfigPath = path.join(uPath, '7', 'remote', 'sharedconfig.vdf');
    if (fs.existsSync(sharedConfigPath)) {
      try {
        const scContent = fs.readFileSync(sharedConfigPath, 'utf-8');
        const appBlocks = scContent.matchAll(/"(\d{3,8})"\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g);
        for (const m of appBlocks) {
          const aid = String(m[1]);
          const body = m[2] || '';
          if (/"favorite"/i.test(body) && !/"Hidden"\s+"1"/i.test(body) && !NON_GAME_APPIDS.has(aid)) {
            hasExplicitCollections = true;
            rawDiscovered.add(aid);
          }
        }
      } catch (e) {}
    }
  }

  if (!hasExplicitCollections && rawDiscovered.size === 0) {
    const offlineSnap = loadOfflineSteamFavoritesSnapshot(!account?.accountId);
    if (offlineSnap) {
      cachedLiveSteamFavorites = offlineSnap;
      return cachedLiveSteamFavorites;
    }
  }

  const locallyOwned = getLocallyVerifiedSteamOwnedAppIds();
  const discovered = new Set();
  for (const aid of rawDiscovered) {
    if (!hiddenSet.has(aid) && locallyOwned.has(aid)) {
      discovered.add(aid);
    }
  }

  // Fallback for fresh/clean Steam setups where favorites exist in cloudstorage before local manifests/librarycache exist
  if (discovered.size === 0 && rawDiscovered.size > 0) {
    for (const aid of rawDiscovered) {
      if (!hiddenSet.has(aid) && !isNonGameSteamApp(null, aid)) {
        discovered.add(aid);
      }
    }
  }

  cachedLiveSteamFavorites = discovered;
  return cachedLiveSteamFavorites;
}

function getConnectedSteamAccount() {
  const steamDirs = getSteamInstallDirs();
  for (const sDir of steamDirs) {
    const loginUsersPath = path.join(sDir, 'config', 'loginusers.vdf');
    if (fs.existsSync(loginUsersPath)) {
      try {
        const content = fs.readFileSync(loginUsersPath, 'utf-8');
        const userMatches = [...content.matchAll(/"(\d{16,20})"\s*\{([^}]*)\}/gs)];
        let mostRecentUser = null;
        let highestTimestamp = 0;

        for (const match of userMatches) {
          const steamId64 = match[1];
          const body = match[2];
          const accountName = body.match(/"AccountName"\s+"([^"]+)"/)?.[1] || '';
          const personaName = body.match(/"PersonaName"\s+"([^"]+)"/)?.[1] || accountName;
          const timestamp = parseInt(body.match(/"timestamp"\s+"([^"]+)"/)?.[1] || '0', 10);
          const autoLogin = body.match(/"AutoLogin"\s+"1"/i) !== null;

          let accountId = '';
          try {
            accountId = String(BigInt(steamId64) - 76561197960265728n);
          } catch (e) {
            accountId = String(Number(BigInt(steamId64) & 0xFFFFFFFFn));
          }

          const userObj = {
            steamId64,
            accountId,
            accountName,
            personaName,
            autoLogin,
            timestamp,
            steamPath: sDir,
            userDataPath: path.join(sDir, 'userdata', accountId)
          };

          if (autoLogin || timestamp > highestTimestamp || !mostRecentUser) {
            highestTimestamp = timestamp;
            mostRecentUser = userObj;
          }
        }

        if (mostRecentUser) return mostRecentUser;
      } catch (e) {
        console.warn('[Steam Account] Error reading loginusers.vdf:', e);
      }
    }
  }

  return {
    steamId64: '',
    accountId: '',
    accountName: '',
    personaName: '',
    autoLogin: false,
    timestamp: 0,
    steamPath: steamDirs[0] || '',
    userDataPath: ''
  };
}

function getVerifiedSteamOwnedAppIds() {
  const verified = new Set();
  const folders = getSteamLibraryFolders();
  for (const sApps of folders) {
    if (fs.existsSync(sApps)) {
      try {
        const files = fs.readdirSync(sApps);
        for (const file of files) {
          if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
            const m = file.match(/appmanifest_(\d+)\.acf/);
            if (m && m[1] && !isNonGameSteamApp(null, m[1])) {
              verified.add(m[1]);
            }
          }
        }
      } catch (e) {}
    }
  }

  const account = getConnectedSteamAccount();
  if (account?.userDataPath && fs.existsSync(account.userDataPath)) {
    const lcPath = path.join(account.userDataPath, 'config', 'localconfig.vdf');
    if (fs.existsSync(lcPath)) {
      try {
        const lcContent = fs.readFileSync(lcPath, 'utf-8');
        const appMatches = [...lcContent.matchAll(/"(\d{3,8})"\s*\{([^}]*)\}/g)];
        for (const m of appMatches) {
          const aid = m[1];
          const body = m[2];
          if (body.includes('LastPlayed') || body.includes('Playtime') || body.includes('DefaultLaunchOption')) {
            if (!isNonGameSteamApp(null, aid)) {
              verified.add(aid);
            }
          }
        }
      } catch (e) {}
    }
  }

  // Steam Favorites from user collections are part of the user's verified Steam library
  for (const favId of getSteamFavoriteAppIds()) {
    if (!isNonGameSteamApp(null, favId)) {
      verified.add(String(favId));
    }
  }

  return verified;
}

// Steam Synchronization Diagnostic Logging & Monitoring Engine
const steamSyncLogs = [
  { timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), level: 'info', message: 'Steam synchronization engine initialized' }
];

function addSteamSyncLog(message, level = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  steamSyncLogs.unshift({ timestamp, level, message });
  if (steamSyncLogs.length > 50) steamSyncLogs.length = 50;
  console.log(`[Steam Sync] [${level.toUpperCase()}] ${message}`);
}

function getArtworkDiagnostics() {
  const cacheDir = path.join(getCacheRootDir(), 'games');
  let totalArtworkDownloads = 0;
  let failedArtworkDownloads = 0;
  if (fs.existsSync(cacheDir)) {
    try {
      const folders = fs.readdirSync(cacheDir);
      for (const folder of folders) {
        if (!folder.startsWith('pc_steam_')) continue;
        const folderPath = path.join(cacheDir, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          const files = fs.readdirSync(folderPath);
          const hasTile = files.includes('tile.jpg');
          const hasHero = files.includes('hero.jpg');
          if (hasTile && hasHero) {
            totalArtworkDownloads++;
          } else {
            failedArtworkDownloads++;
          }
        }
      }
    } catch (e) {}
  }
  return { totalArtworkDownloads, failedArtworkDownloads };
}

function getSteamAccountDiagnostics() {
  const account = getConnectedSteamAccount();
  const libraryFolders = getSteamLibraryFolders();
  const favorites = getSteamFavoriteAppIds();
  const installedGames = [];
  const verifiedOwnedAppIds = getVerifiedSteamOwnedAppIds();
  const seenAppIds = new Set();
  let duplicatesCount = 0;
  let excludedNonFavoritesCount = 0;

  for (const sApps of libraryFolders) {
    if (fs.existsSync(sApps)) {
      try {
        const files = fs.readdirSync(sApps);
        for (const file of files) {
          if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
            try {
              const content = fs.readFileSync(path.join(sApps, file), 'utf-8');
              const name = content.match(/"name"\s+"([^"]+)"/)?.[1];
              const appId = content.match(/"appid"\s+"([^"]+)"/)?.[1];
              const sizeBytes = content.match(/"SizeOnDisk"\s+"([^"]+)"/)?.[1];
              const flags = parseInt(content.match(/"StateFlags"\s+"([^"]+)"/)?.[1] || '0', 10);
              const hasDiskBytes = sizeBytes && parseInt(sizeBytes, 10) > 1048576;
              const isInstalled = (flags & 4) !== 0 && Boolean(hasDiskBytes);

              if (name && appId && !isNonGameSteamApp(name, appId)) {
                if (favorites.size > 0 && !favorites.has(String(appId))) {
                  excludedNonFavoritesCount++;
                  continue;
                }
                if (seenAppIds.has(appId)) {
                  duplicatesCount++;
                } else {
                  seenAppIds.add(appId);
                  const sizeGb = hasDiskBytes ? (parseInt(sizeBytes, 10) / 1073741824).toFixed(1) + ' GB' : 'Ready to Download';
                  installedGames.push({
                    appId,
                    name,
                    installed: isInstalled,
                    size: sizeGb,
                    path: path.join(sApps, 'common', name)
                  });
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
  }

  const totalFavorites = favorites.size;
  let excludedUnowned = 0;
  if (account?.userDataPath && fs.existsSync(account.userDataPath)) {
    const csDir = path.join(account.userDataPath, 'config', 'cloudstorage');
    if (fs.existsSync(csDir)) {
      try {
        for (const csFile of fs.readdirSync(csDir)) {
          if (csFile.startsWith('cloud-storage-namespace-') && csFile.endsWith('.json') && !csFile.endsWith('.modified.json')) {
            const parsed = JSON.parse(fs.readFileSync(path.join(csDir, csFile), 'utf-8'));
            if (Array.isArray(parsed)) {
              for (const entry of parsed) {
                if (Array.isArray(entry) && entry[0] === 'user-collections.favorite' && entry[1]?.value) {
                  const val = typeof entry[1].value === 'string' ? JSON.parse(entry[1].value) : entry[1].value;
                  const removed = new Set((Array.isArray(val?.removed) ? val.removed : []).map(String));
                  for (const aid of (Array.isArray(val?.added) ? val.added : [])) {
                    const strAid = String(aid);
                    if (!removed.has(strAid) && !favorites.has(strAid)) {
                      excludedUnowned++;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  // 2. Xbox / PC Game Pass
  let xboxInstalled = [];
  for (const { full, folder } of getXboxGameFolders()) {
    const conf = path.join(full, 'Content', 'MicrosoftGame.config');
    const rootConf = path.join(full, 'MicrosoftGame.config');
    if (fs.existsSync(conf) || fs.existsSync(rootConf)) {
      xboxInstalled.push({ name: folder, path: full });
    }
  }

  // 3. Epic Games Store
  let epicInstalled = [];
  const candidateEpicDirs = getCandidateEpicManifestDirs();
  for (const ed of candidateEpicDirs) {
    if (fs.existsSync(ed)) {
      try {
        const items = fs.readdirSync(ed).filter(f => f.endsWith('.item'));
        for (const it of items) {
          const item = JSON.parse(fs.readFileSync(path.join(ed, it), 'utf8'));
          if (item?.DisplayName) {
            epicInstalled.push({ name: item.DisplayName, appId: item.AppName });
          }
        }
      } catch (e) {}
    }
  }

  // 4. Ubisoft Connect
  let ubiInstalled = [];
  const ubiRoot = fs.existsSync('C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher') || fs.existsSync('C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher');

  // 5. Riot Games
  let riotInstalled = [];
  const { riotClient, products: riotProducts } = discoverRiotClientAndGames();
  for (const rp of riotProducts) riotInstalled.push({ name: rp.title });

  const xboxAccountDiag = readXboxAccountGames();

  const totalUnique = installedGames.length + Math.max(xboxInstalled.length, xboxAccountDiag.games.length) + epicInstalled.length + ubiInstalled.length + riotInstalled.length;

  const artDiag = getArtworkDiagnostics();
  const lastSyncStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const totalOwnedCount = Number.isFinite(cachedLiveOwnedCount) ? cachedLiveOwnedCount : verifiedOwnedAppIds.size;

  return {
    success: true,
    connectedAccount: {
      accountName: account.accountName,
      personaName: account.personaName,
      steamId64: account.steamId64,
      accountId: account.accountId,
      steamPath: account.steamPath
    },
    steamId64: account.steamId64,
    totalOwnedGames: totalOwnedCount,
    installedGamesCount: installedGames.length,
    installedGames,
    totalFavorites,
    totalArtworkDownloads: artDiag.totalArtworkDownloads,
    failedArtworkDownloads: artDiag.failedArtworkDownloads,
    synchronizedGamesCount: totalFavorites,
    excludedUnownedCount: excludedUnowned,
    excludedNonFavoritesCount,
    duplicateEntriesCount: duplicatesCount,
    lastSyncTimestamp: Date.now(),
    lastSuccessfulSync: lastSyncStr,
    syncStatus: 'Active & Monitoring',
    syncLogs: [...steamSyncLogs],
    syncErrors: [],
    stores: {
      steam: {
        name: 'Steam',
        status: account.steamId64 || installedGames.length > 0 ? 'connected' : 'not_detected',
        statusLabel: favorites.size > 0
          ? 'Connected & Verified (Favorites Only)'
          : (installedGames.length > 0 ? 'Connected (Installed Library)' : 'Standby'),
        accountName: account.accountName,
        personaName: account.personaName,
        steamId64: account.steamId64,
        steamPath: account.steamPath,
        ownedCount: totalOwnedCount,
        installedCount: installedGames.length,
        favoritesCount: totalFavorites,
        verifiedFavoritesCount: totalFavorites,
        excludedCount: excludedUnowned,
        excludedNonFavoritesCount,
        totalArtworkDownloads: artDiag.totalArtworkDownloads,
        failedArtworkDownloads: artDiag.failedArtworkDownloads,
        installedGames
      },
      xbox: {
        name: 'Xbox / PC Game Pass',
        status: (xboxInstalled.length > 0 || xboxAccountDiag.games.length > 0) ? 'connected' : 'ready',
        statusLabel: xboxAccountDiag.gamertag
          ? `Connected (${xboxAccountDiag.gamertag})`
          : (xboxInstalled.length > 0 ? 'Connected' : 'Ready (Standby)'),
        gamertag: xboxAccountDiag.gamertag || '',
        xuid: xboxAccountDiag.xuid || '',
        path: xboxInstalled[0]?.path ? path.dirname(xboxInstalled[0].path) : 'XboxGames',
        installedCount: xboxInstalled.length,
        gamePassCount: xboxAccountDiag.games.length,
        installedGames: xboxInstalled
      },
      epic: {
        name: 'Epic Games Store',
        status: epicInstalled.length > 0 ? 'connected' : 'not_detected',
        statusLabel: epicInstalled.length > 0 ? 'Connected' : 'Not Detected',
        installedCount: epicInstalled.length,
        installedGames: epicInstalled
      },
      ubisoft: {
        name: 'Ubisoft Connect',
        status: ubiRoot ? 'detected' : 'not_detected',
        statusLabel: ubiRoot ? 'Detected' : 'Not Detected',
        installedCount: ubiInstalled.length,
        installedGames: ubiInstalled
      },
      riot: {
        name: 'Riot Games',
        status: riotClient ? 'detected' : 'not_detected',
        statusLabel: riotClient ? 'Client Detected' : 'Inactive',
        installedCount: riotInstalled.length,
        installedGames: riotInstalled
      }
    },
    global: {
      totalUniqueGames: totalUnique,
      duplicateEntries: 0,
      missingArtwork: 0,
      missingLogos: 0,
      failedSyncs: 0
    }
  };
}

function normalizePathForDedup(p) {
  if (!p || typeof p !== 'string') return '';
  let norm = p.trim().replace(/\//g, '\\').replace(/([^\\])\\+/g, '$1\\');
  if (norm.length > 3 && norm.endsWith('\\')) norm = norm.replace(/\\+$/, '');
  return norm.toLowerCase();
}

function normalizeHostTitleForDedup(title) {
  const stripped = stripXboxPlatformSuffix(title);
  const normalized = stripped.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return normalized.includes('wherewindsmeet') || normalized === 'wwm' || normalized.startsWith('wwmgame') || (normalized.includes('winds') && normalized.includes('meet')) ? 'wherewindsmeet' : normalized;
}

function isWhereWindsMeetRecord(game) {
  if (!game) return false;
  const appId = String(game.appId || game.id?.replace(/^pc_steam_/, '') || game.launchUri?.match(/rungameid\/(\d+)/i)?.[1] || '');
  return appId === '3564740' || normalizeHostTitleForDedup(game.title) === 'wherewindsmeet';
}

function deduplicateHostScannedGames(scannedList) {
  if (!Array.isArray(scannedList)) return [];
  const deduped = [];
  for (const g of scannedList) {
    if (!g) continue;
    const gTitleKey = normalizeHostTitleForDedup(g.title);
    const existing = deduped.find(e => {
      if (isWhereWindsMeetRecord(e) || isWhereWindsMeetRecord(g)) return isWhereWindsMeetRecord(e) && isWhereWindsMeetRecord(g);
      if (e.id && g.id && e.id === g.id) return true;
      if (e.appId && g.appId && String(e.appId).trim() === String(g.appId).trim()) return true;
      if (normalizeHostTitleForDedup(e.title) === 'wherewindsmeet' && gTitleKey === 'wherewindsmeet') return true;
      const p1 = normalizePathForDedup(e.execPath);
      const p2 = normalizePathForDedup(g.execPath);
      if (p1 && p2 && p1 === p2) return true;
      if (gTitleKey && normalizeHostTitleForDedup(e.title) === gTitleKey) {
        const eSteamId = e.store === 'steam' && e.appId && /^\d+$/.test(String(e.appId)) ? String(e.appId) : '';
        const gSteamId = g.store === 'steam' && g.appId && /^\d+$/.test(String(g.appId)) ? String(g.appId) : '';
        if (!eSteamId || !gSteamId || eSteamId === gSteamId) return true;
      }
      return false;
    });
    if (!existing) {
      deduped.push(g);
    } else {
      if (g.installed && !existing.installed) {
        existing.installed = true;
        existing.badge = 'Installed';
        if (g.execPath) existing.execPath = g.execPath;
        if (g.storageType) existing.storageType = g.storageType;
        if (g.liveStatus) existing.liveStatus = g.liveStatus;
      }
      if (existing.store === 'xbox' && g.store === 'xbox') {
        mergeXboxMetadataIntoRecord(existing, g);
      }
    }
  }
  return deduped;
}

function findBestGameExeInDir(rootDir, hints = []) {
  if (!rootDir || !fs.existsSync(rootDir)) return '';
  const badSubstrings = [
    'crash', 'report', 'setup', 'installer', 'unins', 'redist',
    'dxsetup', 'vcredist', 'ueprereq', 'cleanup', 'touchup', 'updater',
    'launcher_helper', 'eac_launcher', 'easyanticheat', 'battleye', 'webview'
  ];
  const hintTokens = hints
    .filter(Boolean)
    .map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  const candidates = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3) return;
    let entries;
    try { entries = fs.readdirSync(dir); } catch (e) { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          if (!entry.startsWith('.') && !SKIP_EXE_SCAN_DIRS.has(entry.toLowerCase())) {
            walk(full, depth + 1);
          }
        } else if (entry.toLowerCase().endsWith('.exe')) {
          const low = entry.toLowerCase();
          if (badSubstrings.some(b => low.includes(b))) continue;
          const cleanName = low.replace(/\.exe$/, '').replace(/[^a-z0-9]/g, '');
          let score = st.size / 1048576;
          if (depth === 0) score += 200;
          if (hintTokens.some(t => t && (cleanName.includes(t) || t.includes(cleanName)))) score += 500;
          if (low.includes('shipping') || low.includes('win64')) score += 300;
          candidates.push({ full, score });
        }
      } catch (e) {}
    }
  };
  walk(rootDir);
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.full || '';
}

function getCandidateEpicManifestDirs() {
  const dirs = new Set();
  if (process.env.ProgramData) {
    dirs.add(path.join(process.env.ProgramData, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests'));
  }
  for (const d of getExistingWindowsDrives()) {
    dirs.add(`${d}:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests`);
  }
  return [...dirs];
}

function getXboxGameFolders() {
  const roots = new Set();
  for (const d of getExistingWindowsDrives()) {
    roots.add(`${d}:\\XboxGames`);
    const gamingRootPath = `${d}:\\.GamingRoot`;
    if (fs.existsSync(gamingRootPath)) {
      try {
        const buf = fs.readFileSync(gamingRootPath);
        if (buf.length > 8) {
          const rawSub = buf.subarray(8).toString('utf16le').replace(/\0.*$/, '').trim();
          const cleaned = rawSub.replace(/[^\x20-\x7E]/g, '').replace(/^[\\\/]+/, '').trim();
          if (cleaned) roots.add(path.join(`${d}:`, cleaned));
        }
      } catch (e) {}
    }
  }

  const discovered = [];
  const seenDirs = new Set();
  for (const xDir of roots) {
    try {
      if (!fs.existsSync(xDir)) continue;
      for (const folder of fs.readdirSync(xDir)) {
        const folderLower = folder.toLowerCase();
        const isSystemFolder = ['$recycle.bin', 'system volume information', 'temp', 'tmp', 'cache', '.git'].includes(folderLower);
        if (isSystemFolder || folderLower.includes('myraa') || folderLower.includes('save') || folderLower.includes('minecraft launcher') || folder.startsWith('.')) continue;
        const full = path.join(xDir, folder);
        const normFull = full.toLowerCase();
        if (seenDirs.has(normFull)) continue;
        if (fs.statSync(full).isDirectory()) {
          seenDirs.add(normFull);
          discovered.push({ rootDir: xDir, folder, full });
        }
      }
    } catch (e) {}
  }
  return discovered;
}

function discoverRiotClientAndGames() {
  const pd = process.env.ProgramData || 'C:\\ProgramData';
  const clientCandidates = [];
  const installsJson = path.join(pd, 'Riot Games', 'RiotClientInstalls.json');
  if (fs.existsSync(installsJson)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(installsJson, 'utf-8'));
      for (const key of ['rc_live', 'rc_default', 'rc_esports', 'rc_beta']) {
        if (parsed?.[key]) clientCandidates.push(parsed[key]);
      }
      if (parsed?.associated_client && typeof parsed.associated_client === 'object') {
        for (const v of Object.values(parsed.associated_client)) {
          if (typeof v === 'string') clientCandidates.push(v);
        }
      }
    } catch (e) {}
  }
  for (const d of getExistingWindowsDrives()) {
    clientCandidates.push(`${d}:\\Riot Games\\Riot Client\\RiotClientServices.exe`);
  }
  const riotClient = clientCandidates.find(p => p && fs.existsSync(p)) || '';

  const productCatalog = {
    valorant: {
      id: 'pc_valorant',
      appId: 'valorant',
      title: 'VALORANT',
      studio: 'Riot Games • Tactical Hero Shooter',
      installSize: '45.2 GB',
      launchProduct: 'valorant',
      folderName: 'VALORANT',
      logoImg: '/assets/games/valorant/ps5_logo.svg',
      heroBg: '/assets/games/valorant/ps5_gamehub_cover.png',
      tileIcon: '/assets/games/valorant/ps5_master.png'
    },
    league_of_legends: {
      id: 'pc_league_of_legends',
      appId: 'league_of_legends',
      title: 'League of Legends',
      studio: 'Riot Games • MOBA',
      installSize: '25.0 GB',
      launchProduct: 'league_of_legends',
      folderName: 'League of Legends'
    }
  };

  const products = [];
  if (!riotClient) return { riotClient: '', products };

  const metaRoot = path.join(pd, 'Riot Games', 'Metadata');
  const drives = getExistingWindowsDrives();
  for (const [key, info] of Object.entries(productCatalog)) {
    const metaDir = path.join(metaRoot, `${key}.live`);
    const metaFile = path.join(metaDir, `${key}.live.product_settings.yaml`);
    const hasMeta = fs.existsSync(metaDir) || fs.existsSync(metaFile);
    const hasFolder = drives.some(d => fs.existsSync(`${d}:\\Riot Games\\${info.folderName}`));
    if (hasMeta || hasFolder) {
      products.push(info);
    }
  }
  return { riotClient, products };
}

const REGISTRY_SUBTREE_CACHE_TTL_MS = 5 * 60 * 1000;
const registrySubtreeCache = new Map();

function queryRegistrySubtree(regKeys) {
  const outputs = [];
  if (process.platform !== 'win32') return outputs;
  const now = Date.now();
  for (const regKey of regKeys) {
    const cached = registrySubtreeCache.get(regKey);
    if (cached && (now - cached.ts) < REGISTRY_SUBTREE_CACHE_TTL_MS) {
      if (cached.stdout) outputs.push(cached.stdout);
      continue;
    }
    try {
      const stdout = child_process.execFileSync('reg.exe', ['query', regKey, '/s'], {
        windowsHide: true,
        encoding: 'utf8',
        timeout: 3000,
        stdio: ['ignore', 'pipe', 'ignore']
      });
      registrySubtreeCache.set(regKey, { ts: now, stdout: stdout || '' });
      if (stdout) outputs.push(stdout);
    } catch (e) {
      registrySubtreeCache.set(regKey, { ts: now, stdout: '' });
    }
  }
  return outputs;
}

// Multi-Store Game Scanner (Steam, Epic Games, Ubisoft, Xbox Game Pass, Riot Games, GOG, EA App across all drives)
function scanHostStores() {
  const games = [];
  const seenTitles = new Set();
  const seenAppIds = new Set();
  const steamFavorites = getSteamFavoriteAppIds();
  const connectedSteamAccount = getConnectedSteamAccount();
  const steamLibraryFolders = getSteamLibraryFolders();
  // Strictly sync ONLY the user's Steam Favorites whenever Steam is connected or Favorites/libraries are present
  const hasSteamFavorites = Boolean(
    hasAuthoritativeLiveFavorites ||
    steamFavorites.size > 0 ||
    connectedSteamAccount?.steamId64 ||
    steamLibraryFolders.length > 0
  );

  // 1. Scan Installed & Downloading Steam Games across all discovered library folders (strictly Favorites-only)
  for (const sApps of steamLibraryFolders) {
    try {
      if (fs.existsSync(sApps)) {
        const files = fs.readdirSync(sApps);
        for (const file of files) {
          if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
            try {
              const content = fs.readFileSync(path.join(sApps, file), 'utf-8');
              const name = content.match(/"name"\s+"([^"]+)"/)?.[1];
              const appId = content.match(/"appid"\s+"([^"]+)"/)?.[1];
              const sizeBytes = content.match(/"SizeOnDisk"\s+"([^"]+)"/)?.[1];
              const flags = parseInt(content.match(/"StateFlags"\s+"([^"]+)"/)?.[1] || '0', 10);

              if (!name || !appId || isNonGameSteamApp(name, appId)) continue;
              if (hasSteamFavorites && !steamFavorites.has(String(appId))) continue;

              // In Steam: 4 = StateFullyInstalled. 256 = UpdateRunning, 512 = UpdatePaused, 1024 = UpdateStarted, 16 = FilesMissing.
              const hasDiskBytes = sizeBytes && parseInt(sizeBytes, 10) > 1048576;
              const hasActiveDownloadFlags = (flags & (256 | 512 | 1024 | 16)) !== 0 || flags === 1042;
              const hasDownloadingFolder = fs.existsSync(path.join(sApps, 'downloading', appId));
              const isDownloading = hasActiveDownloadFlags || ((flags & 4) === 0 && hasDownloadingFolder);
              const isFullyInstalled = (flags & 4) !== 0 && !hasActiveDownloadFlags && hasDiskBytes;

              let size = 'Ready to Download';
              if (hasDiskBytes) {
                size = (parseInt(sizeBytes, 10) / 1073741824).toFixed(1) + ' GB';
              } else {
                const bToDl = content.match(/"BytesToDownload"\s+"([^"]+)"/)?.[1];
                if (bToDl && parseInt(bToDl, 10) > 0) {
                  size = (parseInt(bToDl, 10) / 1073741824).toFixed(1) + ' GB';
                }
              }

              const liveMeta = cachedLiveSteamFavoritesMeta.get(String(appId));
              const meta = KNOWN_REAL_GAMES_METADATA[appId] || {};
              const gameTitle = meta.title || liveMeta?.title || getCachedSteamTitle(appId) || name;
              seenTitles.add(normalizeHostTitleForDedup(gameTitle));
              seenAppIds.add(String(appId));
              const exactSize = meta.installSize || size;
              const statusBadge = isFullyInstalled ? 'Installed' : (isDownloading ? ((flags & 512) ? 'Paused' : 'Downloading') : 'Owned');
              const playTime = formatSteamPlaytime(liveMeta?.playtimeMinutes) || (isFullyInstalled ? 'Ready to Play' : 'Ready to Download');
              const art = resolveSteamAssetUrls(appId, meta);
              const isFav = steamFavorites.has(String(appId));

              games.push({
                id: 'pc_steam_' + appId,
                appId: String(appId),
                store: 'steam',
                storeName: 'Steam',
                title: gameTitle,
                studio: meta.studio || (isDownloading ? 'Steam Library • Active Download' : (isFav ? 'Steam Library • Favorite' : 'Steam Library • Installed')),
                genre: meta.genre || (isFullyInstalled ? 'Installed on PC' : (isDownloading ? 'Action • Steam Download' : 'Steam Favorites • Owned')),
                badge: statusBadge,
                favorite: isFav,
                installed: isFullyInstalled,
                isDownloading,
                status: isDownloading ? ((flags & 512) ? 'Paused' : 'Downloading') : undefined,
                installSize: exactSize,
                playTime,
                lastPlayed: liveMeta?.lastPlayed || 0,
                storageType: isFullyInstalled ? `PC Storage (${path.basename(path.dirname(sApps))})` : (isDownloading ? 'Steam Library (Downloading)' : 'Steam Library (Ready to Download)'),
                liveStatus: isFullyInstalled ? `Installed on PC • ${exactSize} Ready` : (isDownloading ? `Downloading on Steam • ${exactSize}` : `Owned on Steam • ${exactSize} Download`),
                launchUri: `steam://rungameid/${appId}`,
                tileIcon: art.tileIcon,
                heroBg: art.heroBg,
                logoImg: art.logoImg,
                ...(meta.heroBgPos ? { heroBgPos: meta.heroBgPos } : {}),
                ...(meta.heroBgSize ? { heroBgSize: meta.heroBgSize } : {}),
                ...(meta.heroBgZoom !== undefined ? { heroBgZoom: meta.heroBgZoom } : {}),
                ...(meta.heroBgOrigin ? { heroBgOrigin: meta.heroBgOrigin } : {})
              });
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  // 1a. Merge active Steam downloads (Favorites only when Favorites exist, otherwise all game downloads)
  try {
    const currentDls = scanSteamDownloads();
    for (const [dlAppId, dlItem] of Object.entries(currentDls)) {
      if (!dlItem || seenAppIds.has(String(dlAppId)) || isNonGameSteamApp(dlItem.name, dlAppId)) continue;
      if (hasSteamFavorites && !steamFavorites.has(String(dlAppId))) continue;
      seenAppIds.add(String(dlAppId));
      const liveMeta = cachedLiveSteamFavoritesMeta.get(String(dlAppId));
      const meta = KNOWN_REAL_GAMES_METADATA[dlAppId] || {};
      const gameTitle = meta.title || liveMeta?.title || getCachedSteamTitle(dlAppId) || dlItem.name || `Steam App ${dlAppId}`;
      seenTitles.add(normalizeHostTitleForDedup(gameTitle));
      const totalGb = dlItem.bytesTotal ? (dlItem.bytesTotal / 1073741824).toFixed(1) + ' GB' : (meta.installSize || 'Steam Download');
      const art = resolveSteamAssetUrls(dlAppId, meta);
      games.push({
        id: 'pc_steam_' + dlAppId,
        appId: String(dlAppId),
        store: 'steam',
        storeName: 'Steam',
        title: gameTitle,
        studio: meta.studio || 'Steam Library • Active Download',
        genre: meta.genre || 'Action • Steam Download',
        badge: dlItem.status || 'Downloading',
        favorite: steamFavorites.has(String(dlAppId)),
        installed: false,
        isDownloading: true,
        status: dlItem.status || 'Downloading',
        installSize: totalGb,
        playTime: formatSteamPlaytime(liveMeta?.playtimeMinutes) || 'Downloading',
        lastPlayed: liveMeta?.lastPlayed || 0,
        storageType: 'Steam Library (Downloading)',
        liveStatus: `${dlItem.status || 'Downloading'} on Steam • ${totalGb}`,
        launchUri: `steam://rungameid/${dlAppId}`,
        tileIcon: art.tileIcon,
        heroBg: art.heroBg,
        logoImg: art.logoImg,
        ...(meta.heroBgPos ? { heroBgPos: meta.heroBgPos } : {}),
        ...(meta.heroBgSize ? { heroBgSize: meta.heroBgSize } : {}),
        ...(meta.heroBgZoom !== undefined ? { heroBgZoom: meta.heroBgZoom } : {}),
        ...(meta.heroBgOrigin ? { heroBgOrigin: meta.heroBgOrigin } : {})
      });
    }
  } catch (e) {}

  // 1b. Sync all remaining verified Steam Favorites from user's Steam Favorites collection
  for (const favAppIdRaw of steamFavorites) {
    const favAppId = String(favAppIdRaw);
    if (seenAppIds.has(favAppId)) {
      const existing = games.find(g => g.appId === favAppId || g.id === 'pc_steam_' + favAppId);
      if (existing) existing.favorite = true;
      continue;
    }

    const liveMeta = cachedLiveSteamFavoritesMeta.get(favAppId);
    const meta = KNOWN_REAL_GAMES_METADATA[favAppId] || {};
    const gameTitle = meta.title || liveMeta?.title || getCachedSteamTitle(favAppId) || `Steam App ${favAppId}`;
    if (isNonGameSteamApp(gameTitle, favAppId)) continue;

    const titleKey = normalizeHostTitleForDedup(gameTitle);
    if (seenTitles.has(titleKey)) {
      const existing = games.find(g => normalizeHostTitleForDedup(g.title) === titleKey);
      if (existing) existing.favorite = true;
      continue;
    }

    seenAppIds.add(favAppId);
    seenTitles.add(titleKey);
    const isInstalled = Boolean(liveMeta?.installed);
    const exactSize = meta.installSize || formatSteamByteSize(liveMeta?.sizeOnDisk) || 'Ready to Download';
    const playTime = formatSteamPlaytime(liveMeta?.playtimeMinutes) || (isInstalled ? 'Ready to Play' : 'Ready to Download');
    const art = resolveSteamAssetUrls(favAppId, meta);

    games.push({
      id: 'pc_steam_' + favAppId,
      appId: favAppId,
      store: 'steam',
      storeName: 'Steam',
      title: gameTitle,
      studio: meta.studio || 'Steam Library • Favorite',
      genre: meta.genre || 'Steam Favorites • Owned',
      badge: isInstalled ? 'Installed' : 'Owned',
      favorite: true,
      installed: isInstalled,
      installSize: exactSize,
      playTime,
      lastPlayed: liveMeta?.lastPlayed || 0,
      storageType: isInstalled ? 'PC Storage (Steam Library)' : 'Steam Library (Ready to Download)',
      liveStatus: isInstalled ? `Installed on PC • ${exactSize} Ready` : `Owned on Steam • ${exactSize} Download`,
      launchUri: `steam://rungameid/${favAppId}`,
      tileIcon: art.tileIcon,
      heroBg: art.heroBg,
      logoImg: art.logoImg,
      ...(meta.heroBgPos ? { heroBgPos: meta.heroBgPos } : {}),
      ...(meta.heroBgSize ? { heroBgSize: meta.heroBgSize } : {}),
      ...(meta.heroBgZoom !== undefined ? { heroBgZoom: meta.heroBgZoom } : {}),
      ...(meta.heroBgOrigin ? { heroBgOrigin: meta.heroBgOrigin } : {})
    });
  }

  // 2. Epic Games Store (Classic Manifests & Modern installations.jsonl)
  for (const epicDir of getCandidateEpicManifestDirs()) {
    try {
      if (fs.existsSync(epicDir)) {
        const files = fs.readdirSync(epicDir);
        for (const f of files) {
          if (f.endsWith('.item')) {
            try {
              const item = JSON.parse(fs.readFileSync(path.join(epicDir, f), 'utf-8'));
              const titleKey = normalizeHostTitleForDedup(item.DisplayName);
              if (item.DisplayName && item.AppName && !seenTitles.has(titleKey)) {
                seenTitles.add(titleKey);
                const exe = item.LaunchExecutable ? path.join(item.InstallLocation || '', item.LaunchExecutable) : findBestGameExeInDir(item.InstallLocation, [item.DisplayName]);
                games.push({
                  id: 'epic_' + item.AppName,
                  appId: item.AppName,
                  store: 'epic',
                  storeName: 'Epic Games',
                  title: item.DisplayName,
                  studio: 'Epic Games Launcher • PC',
                  genre: 'Installed on PC',
                  badge: 'Installed',
                  installed: true,
                  installSize: 'Epic Install',
                  storageType: 'PC Storage (Epic Games)',
                  liveStatus: 'Installed on PC • Ready to Launch via Epic',
                  execPath: exe,
                  launchUri: `com.epicgames.launcher://apps/${item.AppName}?action=launch&silent=true`
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  // 2b. Modern Epic Games v2 (com.epicgames.eglv2 installations.jsonl)
  try {
    const epicV2File = path.join(process.env.LOCALAPPDATA || '', 'com.epicgames.eglv2', 'installations.jsonl');
    if (fs.existsSync(epicV2File)) {
      const lines = fs.readFileSync(epicV2File, 'utf8').split(/\r?\n/).slice(1);
      const catalogFile = path.join(process.env.LOCALAPPDATA || '', 'com.epicgames.eglv2', 'cache', 'prod', 'catalog-cache.json');
      let catalogItems = {};
      try {
        if (fs.existsSync(catalogFile)) {
          catalogItems = JSON.parse(fs.readFileSync(catalogFile, 'utf8')).items || {};
        }
      } catch (e) {}

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          if (item && item.installationId && item.complete && !item.parentInstallationId) {
            const dir = item.dir;
            if (dir && fs.existsSync(dir)) {
              const catItem = catalogItems[item.itemId]?.item;
              const title = catItem?.title || path.basename(dir);
              const titleKey = normalizeHostTitleForDedup(title);
              if (!seenTitles.has(titleKey)) {
                seenTitles.add(titleKey);
                const exe = item.launchExecutable ? path.join(dir, item.launchExecutable) : findBestGameExeInDir(dir, [title]);
                games.push({
                  id: 'epic_' + (item.artifactId || item.installationId),
                  appId: item.artifactId || item.installationId,
                  store: 'epic',
                  storeName: 'Epic Games',
                  title,
                  studio: 'Epic Games Launcher • PC',
                  genre: 'Installed on PC',
                  badge: 'Installed',
                  installed: true,
                  installSize: 'Epic Install',
                  storageType: 'PC Storage (Epic Games)',
                  liveStatus: 'Installed on PC • Ready to Launch via Epic',
                  execPath: exe,
                  launchUri: `com.epicgames.launcher://apps/${encodeURIComponent(item.artifactId || item.installationId)}?action=launch&silent=true`
                });
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 2c. Ubisoft Connect (Registry scan across HKLM and WOW6432Node)
  for (const stdout of queryRegistrySubtree([
    'HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs',
    'HKLM\\SOFTWARE\\Ubisoft\\Launcher\\Installs'
  ])) {
    let curId = null;
    for (const line of stdout.split(/\r?\n/)) {
      const keyMatch = line.match(/Installs\\(\d+)$/i);
      if (keyMatch) {
        curId = keyMatch[1];
      } else if (curId && line.includes('InstallDir')) {
        const m = line.match(/InstallDir\s+REG_\w+\s+(.*)$/i);
        if (m && m[1]) {
          const ubiDir = path.normalize(m[1].trim());
          if (fs.existsSync(ubiDir)) {
            const title = path.basename(ubiDir);
            const titleKey = normalizeHostTitleForDedup(title);
            if (!seenTitles.has(titleKey)) {
              seenTitles.add(titleKey);
              games.push({
                id: 'ubisoft_' + curId,
                appId: curId,
                store: 'ubisoft',
                storeName: 'Ubisoft Connect',
                title,
                studio: 'Ubisoft • Ubisoft Connect',
                genre: 'Installed on PC',
                badge: 'Installed',
                installed: true,
                installSize: 'Ubisoft Install',
                storageType: 'PC Storage (Ubisoft Connect)',
                liveStatus: 'Installed on PC • Ready to Launch via Ubisoft Connect',
                execPath: findBestGameExeInDir(ubiDir, [title]),
                launchUri: `uplay://launch/${curId}/0`
              });
            }
          }
        }
      }
    }
  }

  // 2d. GOG Galaxy (Registry scan)
  for (const stdout of queryRegistrySubtree([
    'HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games',
    'HKLM\\SOFTWARE\\GOG.com\\Games'
  ])) {
    const blocks = stdout.split(/\r?\n\s*\r?\n/);
    for (const block of blocks) {
      const gogId = block.match(/GOG\.com\\Games\\(\d+)/i)?.[1];
      const title = (block.match(/gameName\s+REG_\w+\s+(.+)/i)?.[1] || '').trim();
      const gogDir = (block.match(/\bpath\s+REG_\w+\s+(.+)/i)?.[1] || '').trim();
      const exe = (block.match(/\bexe\s+REG_\w+\s+(.+)/i)?.[1] || '').trim();
      if (!gogId || !title || !gogDir || !fs.existsSync(gogDir)) continue;
      const titleKey = normalizeHostTitleForDedup(title);
      if (seenTitles.has(titleKey)) continue;
      seenTitles.add(titleKey);
      const resolvedExe = (exe && fs.existsSync(exe)) ? exe : findBestGameExeInDir(gogDir, [title]);
      games.push({
        id: 'gog_' + gogId,
        appId: gogId,
        store: 'gog',
        storeName: 'GOG Galaxy',
        title,
        studio: 'GOG • DRM-Free PC',
        genre: 'Installed on PC',
        badge: 'Installed',
        installed: true,
        installSize: 'GOG Install',
        storageType: 'PC Storage (GOG Galaxy)',
        liveStatus: 'Installed on PC • Ready to Launch',
        execPath: resolvedExe,
        launchUri: ''
      });
    }
  }

  // 2e. EA App / Origin (Registry scan)
  for (const stdout of queryRegistrySubtree([
    'HKLM\\SOFTWARE\\WOW6432Node\\EA Games',
    'HKLM\\SOFTWARE\\EA Games',
    'HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts',
    'HKLM\\SOFTWARE\\Electronic Arts'
  ])) {
    const blocks = stdout.split(/\r?\n\s*\r?\n/);
    for (const block of blocks) {
      const keyLine = block.split(/\r?\n/)[0] || '';
      const keyBase = path.basename(keyLine.trim());
      if (!keyBase || /^(EA Games|Electronic Arts|EA App|Origin|EA Desktop)$/i.test(keyBase)) continue;
      const displayName = (block.match(/DisplayName\s+REG_\w+\s+(.+)/i)?.[1] || '').trim() || keyBase;
      const installDir = (block.match(/Install Dir\s+REG_\w+\s+(.+)/i)?.[1] || '').trim();
      if (!installDir || !fs.existsSync(installDir)) continue;
      const titleKey = normalizeHostTitleForDedup(displayName);
      if (!titleKey || seenTitles.has(titleKey)) continue;
      const resolvedExe = findBestGameExeInDir(installDir, [displayName]);
      if (!resolvedExe) continue;
      seenTitles.add(titleKey);
      games.push({
        id: 'ea_' + titleKey,
        store: 'ea',
        storeName: 'EA App',
        title: displayName,
        studio: 'Electronic Arts • EA App',
        genre: 'Installed on PC',
        badge: 'Installed',
        installed: true,
        installSize: 'EA Install',
        storageType: 'PC Storage (EA App)',
        liveStatus: 'Installed on PC • Ready to Launch via EA App',
        execPath: resolvedExe,
        launchUri: ''
      });
    }
  }

  // 3. Xbox / PC Game Pass (Across all drives & custom .GamingRoot folders with MicrosoftGame.config)
  for (const { rootDir, folder, full } of getXboxGameFolders()) {
    try {
      const cfg1 = path.join(full, 'MicrosoftGame.config');
      const cfg2 = path.join(full, 'Content', 'MicrosoftGame.config');
      const activeCfg = fs.existsSync(cfg1) ? cfg1 : (fs.existsSync(cfg2) ? cfg2 : null);

      let gameTitle = folder;
      let launchUri = 'xbox://';
      let execPath = '';

      if (activeCfg) {
        try {
          const xml = fs.readFileSync(activeCfg, 'utf8');
          const displayName = xml.match(/<ShellVisuals[^>]*DefaultDisplayName="([^"]+)"/i)?.[1];
          if (displayName && !displayName.startsWith('ms-resource:')) {
            gameTitle = displayName;
          }
          const exeName = xml.match(/<Executable[^>]*Name="([^"]+)"/i)?.[1];
          if (exeName) {
            execPath = path.join(path.dirname(activeCfg), exeName);
          }
        } catch (e) {}
      } else {
        try {
          const subItems = fs.readdirSync(full);
          const hasExe = subItems.some(f => f.toLowerCase().endsWith('.exe'));
          if (!hasExe) continue;
        } catch (e) {
          continue;
        }
      }

      const folderTitleKey = normalizeHostTitleForDedup(gameTitle);
      if (!seenTitles.has(folderTitleKey)) {
        seenTitles.add(folderTitleKey);
        games.push({
          id: 'xbox_' + folder.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          store: 'xbox',
          storeName: 'Xbox Game Pass',
          title: gameTitle,
          studio: 'Xbox Game Studios • PC Game Pass',
          genre: 'Installed on PC',
          badge: 'Installed',
          installed: true,
          installSize: 'Xbox Install',
          storageType: `PC Storage (${rootDir})`,
          liveStatus: 'Installed on PC • Ready to Launch via Xbox',
          execPath,
          launchUri
        });
      }
    } catch (e) {}
  }

  // 3b. Signed-in Xbox App (Microsoft.GamingApp) account library & artwork
  try {
    const xboxAccount = readXboxAccountGames();
    for (const xg of xboxAccount.games) {
      if (!xg || !xg.title) continue;
      const key = normalizeHostTitleForDedup(xg.title);
      if (!key) continue;
      const existingByTitle = games.find(g => normalizeHostTitleForDedup(g.title) === key);
      if (existingByTitle) {
        if (existingByTitle.store === 'xbox') {
          mergeXboxMetadataIntoRecord(existingByTitle, xg);
        }
        seenTitles.add(key);
        continue;
      }
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        games.push(xg);
      }
    }
  } catch (e) {}

  // 4. Riot Games (VALORANT, League of Legends) via RiotClientInstalls.json + Metadata + all drives
  try {
    const { riotClient, products } = discoverRiotClientAndGames();
    for (const prod of products) {
      const key = normalizeHostTitleForDedup(prod.title);
      if (seenTitles.has(key)) continue;
      seenTitles.add(key);
      games.push({
        id: prod.id,
        appId: prod.appId,
        store: 'riot',
        storeName: 'Riot Games',
        title: prod.title,
        studio: prod.studio,
        genre: 'Installed on PC',
        execPath: riotClient,
        execArgs: `--launch-product=${prod.launchProduct} --launch-patchline=live`,
        launchUri: '',
        ...(prod.logoImg ? { logoImg: prod.logoImg } : {}),
        ...(prod.heroBg ? { heroBg: prod.heroBg } : {}),
        ...(prod.tileIcon ? { tileIcon: prod.tileIcon } : {}),
        installed: true,
        badge: 'Installed',
        installSize: prod.installSize,
        storageType: 'PC SSD (Riot Games)',
        liveStatus: 'Installed on PC • Ready to Launch via Riot Client'
      });
    }
  } catch (e) {}

  // Merge with persistent library records to retain custom artwork, backgrounds, playtime, etc.
  try {
    const lib = getLibraryStore();
    const savedGames = (lib && Array.isArray(lib.data.games)) ? lib.data.games : [];
    for (const g of games) {
      const saved = savedGames.find(s => s && (s.id === g.id || (s.appId && g.appId && String(s.appId) === String(g.appId))));
      if (saved) {
        if (saved.hasCustomArtwork || saved.customArtwork) {
          g.hasCustomArtwork = true;
          g.customArtwork = true;
          if (saved.heroBg) g.heroBg = saved.heroBg;
          if (saved.tileIcon) g.tileIcon = saved.tileIcon;
          if (saved.logoImg) g.logoImg = saved.logoImg;
          if (saved.backgroundImage) g.backgroundImage = saved.backgroundImage;
          if (saved.coverImage) g.coverImage = saved.coverImage;
          if (saved.logoImage) g.logoImage = saved.logoImage;
          if (saved.artworkSource) g.artworkSource = saved.artworkSource;
          if (saved.lastUpdated) g.lastUpdated = saved.lastUpdated;
        }
        if (saved.playTime) g.playTime = saved.playTime;
        if (saved.favorite !== undefined) g.favorite = saved.favorite;
      }
    }
  } catch (e) {}

  return deduplicateHostScannedGames(games);
}

ipcMain.handle('library:sync-all-stores', async () => {
  try {
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    const scanned = scanHostStores();
    const favAppIds = [...getSteamFavoriteAppIds()];
    autoDownloadAllSteamArtworks(getSteamArtworkAppIds(scanned));
    const diag = getSteamAccountDiagnostics();
    return { success: true, games: scanned, steamFavorites: favAppIds, steamSynced: true, diagnostics: diag };
  } catch (err) {
    return { success: false, error: err.message, games: [] };
  }
});

ipcMain.handle('steam:get-sync-diagnostics', async () => {
  try {
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    return getSteamAccountDiagnostics();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:resync-account', async () => {
  try {
    addSteamSyncLog('Steam account resync initiated');
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    const scanned = scanHostStores();
    const favAppIds = [...getSteamFavoriteAppIds()];
    autoDownloadAllSteamArtworks(getSteamArtworkAppIds(scanned));
    const diag = getSteamAccountDiagnostics();
    return { success: true, games: scanned, steamFavorites: favAppIds, steamSynced: true, diagnostics: diag };
  } catch (err) {
    addSteamSyncLog(`Steam account resync error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

// Phase 8: Steam Synchronization Dashboard Primary Action Handlers
ipcMain.handle('steam:sync-now', async () => {
  try {
    addSteamSyncLog('User triggered "Sync Now" - scanning live Steam Favorites & host stores');
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    const scanned = scanHostStores();
    const appIds = getSteamArtworkAppIds(scanned);
    autoDownloadAllSteamArtworks(appIds);
    addSteamSyncLog(`Sync complete: ${appIds.length} Steam titles synchronized (${scanned.length} total multi-store titles)`);
    const diag = getSteamAccountDiagnostics();
    return { success: true, games: scanned, steamFavorites: appIds, steamSynced: true, diagnostics: diag };
  } catch (err) {
    addSteamSyncLog(`Sync Now failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:refresh-favorites', async () => {
  try {
    addSteamSyncLog('User triggered "Refresh Favorites" - querying live Steam client and cloud collections');
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    const favAppIds = [...getSteamFavoriteAppIds()];
    const scanned = scanHostStores();
    autoDownloadAllSteamArtworks(getSteamArtworkAppIds(scanned));
    addSteamSyncLog(`Favorites refreshed: verified ${favAppIds.length} active Steam Favorites`);
    const diag = getSteamAccountDiagnostics();
    return { success: true, count: favAppIds.length, games: scanned, steamFavorites: favAppIds, steamSynced: true, diagnostics: diag };
  } catch (err) {
    addSteamSyncLog(`Refresh Favorites failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:refresh-artwork', async () => {
  try {
    addSteamSyncLog('User triggered "Refresh Artwork" - verifying and downloading PS5 assets for all favorites');
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    const scanned = scanHostStores();
    const appIds = getSteamArtworkAppIds(scanned);
    await autoDownloadAllSteamArtworks(appIds);
    const artDiag = getArtworkDiagnostics();
    addSteamSyncLog(`Artwork refreshed: ${artDiag.totalArtworkDownloads} assets verified on disk (${artDiag.failedArtworkDownloads} failed)`);
    const diag = getSteamAccountDiagnostics();
    return { success: true, diagnostics: diag };
  } catch (err) {
    addSteamSyncLog(`Refresh Artwork failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:repair-connection', async () => {
  try {
    addSteamSyncLog('User triggered "Repair Steam Connection" - resetting watchers and re-detecting account');
    resetPersistentSteamWs();
    try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    startSteamLibraryWatcher();
    const scanned = scanHostStores();
    const appIds = getSteamArtworkAppIds(scanned);
    autoDownloadAllSteamArtworks(appIds);
    addSteamSyncLog('Steam connection repaired: file-system watchers & live client sync re-armed');
    const diag = getSteamAccountDiagnostics();
    return { success: true, diagnostics: diag, games: scanned, steamFavorites: appIds, steamSynced: true };
  } catch (err) {
    addSteamSyncLog(`Repair Connection failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('library:sync-store', async (_event, store) => {
  try {
    if (!store || store === 'all' || store === 'steam') {
      try { await syncLiveFavoritesFromSteamClient(); } catch (e) {}
    }
    const scanned = scanHostStores();
    let filtered = scanned;
    if (store && store !== 'all') {
      filtered = scanned.filter(g => g.store === store);
    }
    const favAppIds = [...getSteamFavoriteAppIds()];
    const diag = getSteamAccountDiagnostics();
    return { success: true, store, games: filtered, steamFavorites: favAppIds, steamSynced: true, diagnostics: diag };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('library:repair', async () => {
  try {
    const scanned = scanHostStores();
    const deduped = deduplicateHostScannedGames(scanned);
    const diag = getSteamAccountDiagnostics();
    return { success: true, count: deduped.length, diagnostics: diag };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('library:clear-invalid', async () => {
  try {
    const scanned = scanHostStores();
    const validOnly = scanned.filter(g => g.installed || g.isDownloading);
    const diag = getSteamAccountDiagnostics();
    return { success: true, cleared: scanned.length - validOnly.length, diagnostics: diag };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Steam Root Directory Discovery Helper
function getSteamRootDir() {
  for (const sDir of getSteamInstallDirs()) {
    if (fs.existsSync(path.join(sDir, 'steam.exe'))) {
      return sDir;
    }
  }
  return null;
}

function normalizePercentValue(val) {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100) {
    return Math.round(val);
  }
  return null;
}

let lastSteamSyncDiagnosticAt = 0;
let lastSteamCdpDiagnosticAt = 0;
let lastEnrichmentErrorLogAt = 0;

function logSteamCdpDiagnostic(message) {
  const now = Date.now();
  if (now - lastSteamCdpDiagnosticAt < 5000) return;
  lastSteamCdpDiagnosticAt = now;
  console.warn(`[Steam CDP] ${message}`);
}

function normalizeSteamProgress(progress) {
  const downloaded = progress?.bytes_in_progress;
  const total = progress?.bytes_total;
  if (!Number.isFinite(downloaded) || !Number.isFinite(total) || downloaded < 0 || total <= 0 || downloaded > total) {
    return null;
  }
  return {
    bytesDownloaded: downloaded,
    bytesTotal: total,
    percent: normalizePercentValue((downloaded / total) * 100),
    timeRemainingSec: Number.isFinite(progress?.estimated_time_remaining_sec) && progress.estimated_time_remaining_sec >= 0
      ? progress.estimated_time_remaining_sec
      : null
  };
}

// Scan real-time Steam download & install state from verified local Steam sources
function scanSteamDownloads() {
  const steamRootDir = getSteamRootDir();
  const steamLibraries = getSteamLibraryFolders();
  const states = {};

  // 1. Read recent content_log.txt entries for active chunk targets, status changes, and transfer rates
  const totalChunksByAppId = {};
  const appLastStates = {};
  let currentDownloadRate = null;

  if (steamRootDir) {
    const contentLogPath = path.join(steamRootDir, 'logs', 'content_log.txt');
    if (fs.existsSync(contentLogPath)) {
      try {
        const logStat = fs.statSync(contentLogPath);
        const bufferSize = Math.min(logStat.size, 131072); // Read last 128KB max
        const buffer = Buffer.alloc(bufferSize);
        const fd = fs.openSync(contentLogPath, 'r');
        fs.readSync(fd, buffer, 0, bufferSize, logStat.size - bufferSize);
        fs.closeSync(fd);

        const lines = buffer.toString('utf-8').split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (currentDownloadRate === null) {
            const rateMatch = line.match(/Current download rate:\s+([\d.]+)\s+Mbps/);
            if (rateMatch) {
              currentDownloadRate = parseFloat(rateMatch[1]);
            }
          }
          const stateMatch = line.match(/AppID\s+(\d+)\s+(?:App update changed|update canceled|state changed|scheduler finished|update started)\s*:\s*(.+)/);
          if (stateMatch) {
            const aid = stateMatch[1];
            if (!appLastStates[aid]) {
              appLastStates[aid] = stateMatch[2].trim();
            }
          }
          const chunkMatch = line.match(/Downloading\s+(\d+)\s+chunks for depot\s+(\d+)/);
          if (chunkMatch) {
            const depotId = chunkMatch[2];
            for (let j = Math.max(0, i - 15); j <= Math.min(lines.length - 1, i + 5); j++) {
              const appMatch = lines[j].match(/AppID\s+(\d+)/);
              if (appMatch) {
                const aid = appMatch[1];
                if (!totalChunksByAppId[aid]) totalChunksByAppId[aid] = {};
                totalChunksByAppId[aid][depotId] = parseInt(chunkMatch[1], 10);
                break;
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  // 2. Scan all discovered steamapps library directories
  for (const sApps of steamLibraries) {
    if (!fs.existsSync(sApps)) continue;
    const dlDir = path.join(sApps, 'downloading');

    let manifestFiles = [];
    try {
      manifestFiles = fs.readdirSync(sApps).filter(f => f.startsWith('appmanifest_') && f.endsWith('.acf'));
    } catch (e) {}

    for (const mf of manifestFiles) {
      const manifestPath = path.join(sApps, mf);
      try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const appId = content.match(/"appid"\s+"([^"]+)"/)?.[1];
        if (!appId || NON_GAME_APPIDS.has(String(appId))) continue;

        const name = content.match(/"name"\s+"([^"]+)"/)?.[1] || '';
        if (isNonGameSteamApp(name, appId)) continue;

        const flags = parseInt(content.match(/"StateFlags"\s+"([^"]+)"/)?.[1] || '0', 10);
        const bToDl = parseInt(content.match(/"BytesToDownload"\s+"([^"]+)"/)?.[1] || '0', 10);
        const bDl = parseInt(content.match(/"BytesDownloaded"\s+"([^"]+)"/)?.[1] || '0', 10);
        const bToStage = parseInt(content.match(/"BytesToStage"\s+"([^"]+)"/)?.[1] || '0', 10);
        const bStaged = parseInt(content.match(/"BytesStaged"\s+"([^"]+)"/)?.[1] || '0', 10);
        const buildId = content.match(/"buildid"\s+"([^"]+)"/)?.[1] || '0';

        const isFullyInstalled = (flags & 4) !== 0;
        const isUpdateRunning = (flags & 256) !== 0;
        const isUpdatePaused = (flags & 512) !== 0;
        const isUpdateStarted = (flags & 1024) !== 0;
        const isUpdateRequired = (flags & 2) !== 0;

        let hasDownloadingFolder = false;
        let downloadedChunks = 0;
        let totalChunks = 0;
        let patchCount = 0;

        if (fs.existsSync(dlDir)) {
          const appDlPath = path.join(dlDir, appId);
          if (fs.existsSync(appDlPath)) {
            hasDownloadingFolder = true;
          }

          try {
            const dlFiles = fs.readdirSync(dlDir);
            for (const df of dlFiles) {
              if (df.startsWith(`state_${appId}_`) && df.endsWith('.patch')) {
                patchCount++;
                const pStat = fs.statSync(path.join(dlDir, df));
                const chunksInPatch = Math.floor(pStat.size / 24);
                downloadedChunks += chunksInPatch;

                const depotMatch = df.match(/state_\d+_(\d+)\.patch/);
                if (depotMatch) {
                  const depotId = depotMatch[1];
                  const depotTotal = totalChunksByAppId[appId]?.[depotId];
                  if (depotTotal) totalChunks += depotTotal;
                }
              }
            }
          } catch (e) {}
        }

        const lastState = appLastStates[appId] || '';
        const isSuspendedInLog = /suspended|disabled|none|canceled|stopping/i.test(lastState);
        const isRunningInLog = /running update|downloading/i.test(lastState);

        const isDownloadingOrUpdating = isUpdateRunning || isUpdateStarted || (isUpdatePaused && hasDownloadingFolder) || patchCount > 0 || hasDownloadingFolder;

        if (isDownloadingOrUpdating) {
          let status = 'Downloading';
          if (isUpdatePaused || isSuspendedInLog || (!isUpdateRunning && !isRunningInLog && !isFullyInstalled)) {
            status = 'Paused';
          } else if (isFullyInstalled && buildId !== '0') {
            status = 'Updating';
          } else {
            status = 'Downloading';
          }

          let percent = null;
          let bytesCurrent = bDl;
          let bytesTotal = bToDl || bToStage;

          if (bDl > 0 && bToDl > 0) {
            percent = Math.min(100, Math.floor((bDl / bToDl) * 100));
          } else if (downloadedChunks > 0 && totalChunks > 0) {
            percent = Math.min(99, Math.floor((downloadedChunks / totalChunks) * 100));
            if (bytesTotal > 0) {
              bytesCurrent = Math.floor((downloadedChunks / totalChunks) * bytesTotal);
            }
          } else if (bStaged > 0 && bToStage > 0) {
            percent = Math.min(100, Math.floor((bStaged / bToStage) * 100));
            bytesCurrent = bStaged;
            bytesTotal = bToStage;
          }

          const validDlPct = normalizePercentValue(percent);
          states[appId] = {
            appId,
            name,
            status, // 'Downloading' | 'Updating' | 'Paused'
            percent: validDlPct,
            downloadPercent: validDlPct,
            installPercent: null,
            bytesDownloaded: bytesCurrent,
            bytesTotal,
            downloadRateMbps: status === 'Paused' ? 0 : (currentDownloadRate || 0),
            downloadedChunks,
            totalChunks,
            stateFlags: flags,
            isFullyInstalled
          };
        } else if (isFullyInstalled && !isUpdateRequired && !hasDownloadingFolder) {
          states[appId] = {
            appId,
            name,
            status: 'Complete',
            percent: 100,
            downloadPercent: 100,
            installPercent: 100,
            bytesDownloaded: bToDl,
            bytesTotal: bToDl,
            downloadRateMbps: 0,
            stateFlags: flags,
            isFullyInstalled: true
          };
        }
      } catch (e) {}
    }
  }

  return states;
}

async function getLiveSteamCDPData() {
  try {
    return await evaluateSteamCdp(`
            new Promise((res) => {
              let overview = null;
              let items = null;
              let overviewReceived = false;
              let itemsReceived = false;
              let settled = false;
              let overviewHandle = null;
              let itemsHandle = null;

              const cleanup = () => {
                try { overviewHandle?.unregister?.(); } catch(e){}
                try { itemsHandle?.unregister?.(); } catch(e){}
              };

              const tryFinish = () => {
                if (!settled && overviewReceived && itemsReceived) {
                  settled = true;
                  clearTimeout(timeoutTimer);
                  cleanup();
                  res({ overview, items });
                }
              };

              const timeoutTimer = setTimeout(() => {
                if (!settled) {
                  settled = true;
                  cleanup();
                  res({ overview, items });
                }
              }, 700);

              try {
                const downloads = window.SteamClient?.Downloads;
                if (typeof downloads?.RegisterForDownloadOverview !== 'function') throw new Error('Download overview unavailable');
                overviewHandle = downloads.RegisterForDownloadOverview((ov) => {
                  const p2 = ov?.progress?.[2];
                  const p3 = ov?.progress?.[3];
                  overview = ov ? {
                    appid: Number(ov.update_appid),
                    paused: Boolean(ov.paused),
                    state: ov.update_state,
                    networkBytesPerSec: Number.isFinite(ov.update_network_bytes_per_second) ? ov.update_network_bytes_per_second : null,
                    discBytesPerSec: Number.isFinite(ov.update_disc_bytes_per_second) ? ov.update_disc_bytes_per_second : null,
                    downloadProgress: p2 ? {
                      bytes_in_progress: p2.bytes_in_progress,
                      bytes_total: p2.bytes_total,
                      estimated_time_remaining_sec: p2.estimated_time_remaining_sec
                    } : null,
                    installProgress: p3 ? {
                      bytes_in_progress: p3.bytes_in_progress,
                      bytes_total: p3.bytes_total,
                      estimated_time_remaining_sec: p3.estimated_time_remaining_sec
                    } : null,
                    installPercent: typeof ov.overall_percent_complete === 'number' ? ov.overall_percent_complete : null,
                    timeRemainingSec: Number.isFinite(ov.overall_estimated_time_remaining_sec) && ov.overall_estimated_time_remaining_sec >= 0
                      ? ov.overall_estimated_time_remaining_sec
                      : null
                  } : null;
                  overviewReceived = true;
                  tryFinish();
                });
                if (settled) cleanup();
              } catch(e) {
                overview = null;
                overviewReceived = true;
              }

              try {
                const downloads = window.SteamClient?.Downloads;
                if (typeof downloads?.RegisterForDownloadItems !== 'function') throw new Error('Download items unavailable');
                itemsHandle = downloads.RegisterForDownloadItems((isInitial, data) => {
                  items = data?.[0]?.item_data || [];
                  itemsReceived = true;
                  tryFinish();
                });
                if (settled) cleanup();
              } catch(e) {
                items = [];
                itemsReceived = true;
              }
              tryFinish();
            })
          `, { awaitPromise: true, timeoutMs: 900 });
  } catch (err) {
    logSteamCdpDiagnostic(`Steam snapshot request failed: ${err?.message || err}`);
    return null;
  }
}

async function getEnrichedSteamDownloads() {
  // Stamp a snapshot when its request starts so a slow older CDP response cannot
  // overwrite a newer pause/resume transition after it finally returns.
  const snapshotTimestamp = Date.now();
  const withSnapshotTimestamp = (downloads) => {
    downloads.__snapshotTimestamp = snapshotTimestamp;
    return downloads;
  };
  const states = scanSteamDownloads();
  try {
    const live = await getLiveSteamCDPData();
    if (!live) {
      // Manifest/content-log counters are useful for discovery, but they lag Steam's
      // live Download Overview. Never present them as current progress when the live
      // snapshot is unavailable.
      const now = Date.now();
      if (now - lastSteamSyncDiagnosticAt >= 5000) {
        lastSteamSyncDiagnosticAt = now;
        console.warn('[Steam Sync] Live Steam download snapshot unavailable; suppressing cached progress for active apps.');
      }
      for (const [aid, state] of Object.entries(states)) {
        if (!['Downloading', 'Updating', 'Paused'].includes(state?.status)) continue;
        states[aid] = {
          ...state,
          bytesDownloaded: null,
          bytesTotal: null,
          downloadPercent: null,
          percent: null,
          installPercent: null,
          downloadRateMbps: 0,
          syncSource: 'unavailable',
          syncStatus: 'syncing'
        };
      }
      return withSnapshotTimestamp(states);
    }
    if (live) {
      const overview = live.overview;
      const items = Array.isArray(live.items) ? live.items : [];
      const overviewAppId = Number.isInteger(overview?.appid) && overview.appid > 0 ? String(overview.appid) : '';

      // 1. Process items from queue inventory.
      // Download progress comes from the item's download-stage byte pair. Never use
      // Steam's overall_percent_complete here; that is the separate install-stage value.
      for (const item of items) {
        if (!item?.appid) continue;
        const aid = String(item.appid);
        // The overview is the authoritative live snapshot for the active app. Queue
        // inventory can contain zero/stale progress for that same app, so don't overwrite it.
        if (aid === overviewAppId) continue;
        const isPaused = Boolean(item.paused || (!item.active && !item.completed));
        const isDownloading = Boolean(item.active);
        // Queue inventory can lag the live Overview by several seconds. If Steam
        // has not supplied an Overview app ID in this snapshot, an active queue
        // item's bytes are not authoritative; keep its state visible as syncing.
        const itemProgress = item.active && aid !== overviewAppId
          ? null
          : normalizeSteamProgress(item.update_type_info?.[0]?.progress?.[2]);

        // Download rate from item (bytes/sec → Mbps)
        const rateMbps = (isDownloading && typeof item.current_download_rate === 'number')
          ? (item.current_download_rate * 8) / 1_000_000
          : 0;

        const baseEntry = {
          appId: aid,
          // The Electron main process does not own the Vite-only game database;
          // keep the manifest-discovered name when enriching queue snapshots.
          name: states[aid]?.name || `Steam App ${aid}`,
          status: isPaused ? 'Paused' : (isDownloading ? 'Downloading' : (item.completed ? 'Complete' : 'Queued')),
          bytesDownloaded: itemProgress?.bytesDownloaded ?? null,
          bytesTotal: itemProgress?.bytesTotal ?? null,
          downloadPercent: itemProgress?.percent ?? null,
          downloadRateMbps: isPaused ? 0 : rateMbps,
          installPercent: normalizePercentValue(item.overall_percent_complete),
          percent: itemProgress?.percent ?? null,
          isFullyInstalled: Boolean(item.completed),
          syncSource: 'steam-queue',
          syncStatus: isDownloading && !itemProgress ? 'syncing' : 'live',
          syncedAt: Date.now()
        };

        states[aid] = { ...(states[aid] || {}), ...baseEntry };
      }

      // 2. Overwrite / enrich the ACTIVE downloading game with live overview data.
      // Steam's Downloads overview progress[2] is the Downloading data stage; progress[3]
      // and overall_percent_complete describe installation. Keep the two stages separate.
      if (overviewAppId) {
        const activeAid = String(overview.appid);
        const isPaused = Boolean(overview.paused);
        const downloadProgress = normalizeSteamProgress(overview.downloadProgress);
        const installProgress = normalizeSteamProgress(overview.installProgress);
        const rateMbps = (!isPaused && Number.isFinite(overview.networkBytesPerSec) && overview.networkBytesPerSec >= 0)
          ? (overview.networkBytesPerSec * 8) / 1_000_000
          : 0;
        const diskRateMbps = (!isPaused && Number.isFinite(overview.discBytesPerSec) && overview.discBytesPerSec >= 0)
          ? (overview.discBytesPerSec * 8) / 1_000_000
          : 0;
        const installPercent = normalizePercentValue(overview.installPercent);

        states[activeAid] = {
          ...(states[activeAid] || {}),
          appId: activeAid,
          name: states[activeAid]?.name || `Steam App ${activeAid}`,
          status: isPaused ? 'Paused' : 'Downloading',
          bytesDownloaded: downloadProgress?.bytesDownloaded ?? null,
          bytesTotal: downloadProgress?.bytesTotal ?? null,
          downloadPercent: downloadProgress?.percent ?? null,
          downloadRateMbps: isPaused ? 0 : rateMbps,
          installPercent,
          diskRateMbps: isPaused ? 0 : diskRateMbps,
          percent: downloadProgress?.percent ?? null,
          timeRemainingSec: downloadProgress?.timeRemainingSec,
          installTimeRemainingSec: installProgress?.timeRemainingSec,
          isFullyInstalled: false,
          syncSource: 'steam-overview',
          syncStatus: downloadProgress ? 'live' : 'syncing',
          syncedAt: Date.now()
        };
      } else {
        // The Overview callback may be late while the queue callback is already
        // available. Do not expose manifest/queue counters as live progress for
        // an active download until Steam identifies the current app again.
        for (const [aid, state] of Object.entries(states)) {
          if (!['Downloading', 'Updating', 'Paused'].includes(state?.status)) continue;
          states[aid] = {
            ...state,
            bytesDownloaded: null,
            bytesTotal: null,
            downloadPercent: null,
            percent: null,
            installPercent: null,
            downloadRateMbps: 0,
            diskRateMbps: 0,
            syncSource: 'steam-overview-pending',
            syncStatus: 'syncing',
            syncedAt: snapshotTimestamp
          };
        }
      }
    }
  } catch (err) {
    const message = err?.stack || err?.message || String(err);
    if (Date.now() - lastEnrichmentErrorLogAt >= 5000) {
      lastEnrichmentErrorLogAt = Date.now();
      console.error('[Steam Sync] Failed to enrich the live download snapshot:', message);
      try {
        const diagnosticPath = path.join(app.getPath('userData'), 'steam-sync-diagnostics.log');
        fs.appendFileSync(diagnosticPath, `[${new Date().toISOString()}] ${message}\n`);
      } catch (logError) {
        console.warn('[Steam Sync] Could not persist diagnostic:', logError?.message || logError);
      }
    }
    for (const [aid, state] of Object.entries(states)) {
      if (!['Downloading', 'Updating', 'Paused'].includes(state?.status)) continue;
      states[aid] = {
        ...state,
        bytesDownloaded: null,
        bytesTotal: null,
        downloadPercent: null,
        percent: null,
        installPercent: null,
        downloadRateMbps: 0,
        diskRateMbps: 0,
        syncSource: 'error',
        syncStatus: 'syncing',
        syncedAt: snapshotTimestamp
      };
    }
  }
  return withSnapshotTimestamp(states);
}

function isSteamProcessRunning() {
  try {
    const stdout = child_process.execSync('tasklist /FI "IMAGENAME eq steam.exe" /NH', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 1000
    });
    return stdout.toLowerCase().includes('steam.exe');
  } catch (e) {
    return false;
  }
}

async function controlSteamDownload(appId, action) {
  try {
    const normalizedAppId = String(appId ?? '').trim();
    if (!/^\d+$/.test(normalizedAppId) || !['pause', 'resume'].includes(action)) {
      return { success: false, error: 'Invalid Steam download command parameters.' };
    }

    let res;
    try {
      res = await fetch('http://127.0.0.1:8080/json');
    } catch (netErr) {
      const running = isSteamProcessRunning();
      if (running) {
        return { success: false, error: 'Steam is running, but the remote control interface (debugging port 8080) is not responding.' };
      }
      return { success: false, error: 'Steam is not running. Please launch Steam first.' };
    }

    if (!res.ok) {
      const running = isSteamProcessRunning();
      if (running) {
        return { success: false, error: `Steam is running, but remote debugging returned HTTP ${res.status}.` };
      }
      return { success: false, error: 'Steam is not running. Please launch Steam first.' };
    }

    const targets = await res.json();
    const shared = targets.find(t => t.title === 'SharedJSContext');
    const WS = globalThis.WebSocket;
    if (!WS || !shared?.webSocketDebuggerUrl) {
      return { success: false, error: 'Steam remote control interface is available, but SharedJSContext was not found.' };
    }

    const numId = Number(normalizedAppId);
    const expression = `new Promise((resolve) => {
      const dl = window.SteamClient?.Downloads;
      if (!dl) {
        return resolve({ success: false, error: 'SteamClient.Downloads is unavailable.' });
      }
      const numId = ${numId};
      const remoteId = "0";

      let settled = false;
      let listenerHandle = null;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        try { listenerHandle?.unregister?.(); } catch (e) {}
        resolve(result);
      };

      const timeoutTimer = setTimeout(() => {
        finish({ success: false, error: 'Steam did not confirm download state transition.' });
      }, 2500);

      try {
        listenerHandle = dl.RegisterForDownloadItems((isInitial, data) => {
          const item = data?.[0]?.item_data?.find(i => i.appid === numId);
          if (item) {
            ${action === 'pause' ? `
              if (item.paused === true || (item.active === false && !item.completed)) {
                finish({ success: true, status: 'Paused', paused: true, active: false });
              }
            ` : `
              if (item.active === true && item.paused === false) {
                finish({ success: true, status: 'Downloading', paused: false, active: true });
              }
            `}
          }
        });
      } catch (e) {}

      try {
        ${action === 'pause' ? `
          if (typeof dl.PauseAppUpdate !== 'function') {
            return finish({ success: false, error: 'Steam does not expose PauseAppUpdate.' });
          }
          dl.PauseAppUpdate(numId, remoteId);
          try { dl.PauseAppUpdate(numId, 0); } catch(e){}
          try { dl.PauseAppUpdate(numId); } catch(e){}
        ` : `
          if (typeof dl.ResumeAppUpdate === 'function') {
            dl.ResumeAppUpdate(numId, remoteId);
            try { dl.ResumeAppUpdate(numId, 0); } catch(e){}
          }
          if (typeof dl.QueueAppUpdate === 'function') {
            dl.QueueAppUpdate(numId, remoteId);
            try { dl.QueueAppUpdate(numId, 0); } catch(e){}
          }
          if (typeof dl.EnableAllDownloads === 'function') {
            dl.EnableAllDownloads(true, remoteId);
            try { dl.EnableAllDownloads(true); } catch(e){}
          }
        `}
      } catch (err) {
        finish({ success: false, error: String(err?.message || err) });
      }
    })`;

    const result = await new Promise((resolve) => {
      const ws = new WS(shared.webSocketDebuggerUrl);
      const requestId = getNextCdpId();
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { ws.close(); } catch (e) {}
        resolve(value);
      };
      const timer = setTimeout(() => finish({ success: false, error: 'Timed out waiting for Steam response.' }), 3500);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: requestId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true }
        }));
      };
      ws.onmessage = (message) => {
        try {
          const response = JSON.parse(message.data);
          if (response.id !== requestId) return;
          if (response.error || response.result?.exceptionDetails) {
            const errDetails = response.error?.message || response.result?.exceptionDetails?.text || 'Steam rejected the download command.';
            finish({ success: false, error: errDetails });
            return;
          }
          const val = response.result?.result?.value;
          if (val && typeof val === 'object' && val.success === true) {
            finish({ success: true, status: val.status });
          } else {
            finish({ success: false, error: val?.error || 'Steam did not accept the download command.' });
          }
        } catch (error) {
          finish({ success: false, error: 'Could not parse Steam command response.' });
        }
      };
      ws.onerror = () => finish({ success: false, error: 'Could not connect to Steam WebSocket debugger.' });
    });

    return result;
  } catch (e) {
    return { success: false, error: e.message || 'Steam download command failed.' };
  }
}

ipcMain.handle('steam:get-downloads', async () => {
  try {
    const downloads = await getEnrichedSteamDownloads();
    return { success: true, downloads };
  } catch (err) {
    return { success: false, error: err.message, downloads: {} };
  }
});

ipcMain.handle('steam:resume-download', async (_event, appId) => {
  const normalized = String(appId ?? '').trim();
  if (!/^\d+$/.test(normalized)) return { success: false, error: 'Invalid Steam AppID.' };
  try {
    const command = await controlSteamDownload(normalized, 'resume');
    if (!command.success) return command;
    const dls = await getEnrichedSteamDownloads();
    if (mainWindow && !mainWindow.isDestroyed()) {
      lastKnownDownloadsJson = JSON.stringify(dls);
      mainWindow.webContents.send('steam:downloads-updated', dls);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to resume Steam download.' };
  }
});

ipcMain.handle('steam:pause-download', async (_event, appId) => {
  const normalized = String(appId ?? '').trim();
  if (!/^\d+$/.test(normalized)) return { success: false, error: 'Invalid Steam AppID.' };
  try {
    const command = await controlSteamDownload(normalized, 'pause');
    if (!command.success) return command;
    const dls = await getEnrichedSteamDownloads();
    if (mainWindow && !mainWindow.isDestroyed()) {
      lastKnownDownloadsJson = JSON.stringify(dls);
      mainWindow.webContents.send('steam:downloads-updated', dls);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to pause Steam download.' };
  }
});

let steamDownloadPollTimer = null;
let lastKnownDownloadsJson = '';

function startSteamDownloadPolling() {
  if (steamDownloadPollTimer) clearTimeout(steamDownloadPollTimer);

  const check = async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (isGameplayBoostPaused) {
      steamDownloadPollTimer = setTimeout(check, 5000);
      return;
    }
    try {
      const downloads = await getEnrichedSteamDownloads();
      const serialized = JSON.stringify(downloads);
      if (serialized !== lastKnownDownloadsJson) {
        lastKnownDownloadsJson = serialized;
        mainWindow.webContents.send('steam:downloads-updated', downloads);
      }

      const hasActiveOrPaused = Object.values(downloads).some(
        d => d.status === 'Downloading' || d.status === 'Updating' || d.status === 'Paused'
      );
      // Schedule only after the current snapshot completes, so requests never overlap.
      // A short active cadence keeps the renderer within the sub-second sync target.
      const nextInterval = hasActiveOrPaused ? 300 : 5000;
      steamDownloadPollTimer = setTimeout(check, nextInterval);
    } catch (err) {
      steamDownloadPollTimer = setTimeout(check, 1000);
    }
  };

  steamDownloadPollTimer = setTimeout(check, 0);
}

// --------------------------------------------------------------------------
// Real-Time Steam Library Watcher & Artwork Auto-Download Engine
// --------------------------------------------------------------------------
async function fetchSteamStoreAppDetails(appId) {
  const id = String(appId || '').trim();
  if (!/^\d+$/.test(id)) return null;
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&l=english&cc=US`);
    if (!response.ok) return null;
    const payload = await response.json();
    const entry = payload?.[id];
    const data = entry?.success ? entry.data : null;
    if (!data?.name) return null;
    return {
      success: true,
      appId: id,
      name: data.name,
      header_image: data.header_image || data.capsule_image || '',
      background_raw: data.background_raw || '',
      background: data.background || '',
      screenshots: Array.isArray(data.screenshots)
        ? data.screenshots.map(item => ({ path_full: item.path_full })).filter(item => item.path_full)
        : []
    };
  } catch (error) {
    console.warn(`[Steam Auto-Artwork] Store details unavailable for ${id}:`, error.message);
    return null;
  }
}

async function saveRemoteArtworkImage(url, targetPath) {
  if (!url) return false;
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.startsWith('image/')) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1024) return false;
    fs.writeFileSync(targetPath, buffer);
    return true;
  } catch (error) {
    return false;
  }
}

async function autoDownloadSteamGameArtwork(appId) {
  const strId = String(appId).trim();
  if (!/^\d+$/.test(strId)) return null;

  const cacheDir = path.join(getCacheRootDir(), 'games', `pc_steam_${strId}`);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const tilePath = path.join(cacheDir, 'tile.jpg');
  const heroPath = path.join(cacheDir, 'hero.jpg');
  const logoPath = path.join(cacheDir, 'logo.png');

  let updated = false;

  // 1. Try local Steam appcache/librarycache first (Instant local file copy)
  for (const sDir of getSteamInstallDirs()) {
    const lcDir = path.join(sDir, 'appcache', 'librarycache', strId);
    if (fs.existsSync(lcDir)) {
      if (!hasNonEmptyFile(tilePath)) {
        const tileCandidates = ['library_600x900_2x.jpg', 'library_600x900.jpg', 'library_capsule.jpg'];
        for (const fn of tileCandidates) {
          const src = path.join(lcDir, fn);
          if (hasNonEmptyFile(src)) {
            try { fs.copyFileSync(src, tilePath); updated = true; break; } catch (e) {}
          }
        }
      }
      if (!hasNonEmptyFile(heroPath)) {
        const heroCandidates = ['library_hero.jpg', 'hero.jpg'];
        for (const fn of heroCandidates) {
          const src = path.join(lcDir, fn);
          if (hasNonEmptyFile(src)) {
            try { fs.copyFileSync(src, heroPath); updated = true; break; } catch (e) {}
          }
        }
      }
      if (!hasNonEmptyFile(logoPath)) {
        const src = path.join(lcDir, 'logo.png');
        if (hasNonEmptyFile(src)) {
          try { fs.copyFileSync(src, logoPath); updated = true; } catch (e) {}
        }
      }
    }
  }

  // 2. Download missing assets directly from official Steam Akamai CDN (Async fetch in Node.js)
  const downloadTasks = [];
  if (!hasNonEmptyFile(tilePath)) {
    downloadTasks.push((async () => {
      try {
        let resp = await fetch(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/library_600x900_2x.jpg`);
        if (!resp.ok) {
          resp = await fetch(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/library_600x900.jpg`);
        }
        if (resp.ok && (resp.headers.get('content-type') || '').startsWith('image/')) {
          const buf = Buffer.from(await resp.arrayBuffer());
          if (buf.length >= 1024) { fs.writeFileSync(tilePath, buf); updated = true; }
        }
      } catch (e) {}
    })());
  }

  if (!hasNonEmptyFile(heroPath)) {
    downloadTasks.push((async () => {
      try {
        const resp = await fetch(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/library_hero.jpg`);
        if (resp.ok && (resp.headers.get('content-type') || '').startsWith('image/')) {
          const buf = Buffer.from(await resp.arrayBuffer());
          if (buf.length >= 1024) { fs.writeFileSync(heroPath, buf); updated = true; }
        }
      } catch (e) {}
    })());
  }

  if (!hasNonEmptyFile(logoPath)) {
    downloadTasks.push((async () => {
      try {
        const resp = await fetch(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${strId}/logo.png`);
        if (resp.ok && (resp.headers.get('content-type') || '').startsWith('image/')) {
          const buf = Buffer.from(await resp.arrayBuffer());
          if (buf.length >= 1024) { fs.writeFileSync(logoPath, buf); updated = true; }
        }
      } catch (e) {}
    })());
  }

  if (downloadTasks.length > 0) {
    await Promise.all(downloadTasks);
  }

  let storeDetails = null;
  const knownTitle = KNOWN_REAL_GAMES_METADATA[strId]?.title || cachedLiveSteamFavoritesMeta.get(strId)?.title || getCachedSteamTitle(strId);
  if (!hasNonEmptyFile(tilePath) || !hasNonEmptyFile(heroPath) || !knownTitle) {
    storeDetails = await fetchSteamStoreAppDetails(strId);
    if (storeDetails) {
      if (storeDetails.name && !knownTitle) {
        saveCachedSteamTitle(strId, storeDetails.name);
        updated = true;
      }
      if (!hasNonEmptyFile(tilePath)) {
        updated = (await saveRemoteArtworkImage(storeDetails.header_image, tilePath)) || updated;
      }
      if (!hasNonEmptyFile(heroPath)) {
        const heroSource = storeDetails.background_raw || storeDetails.screenshots?.[0]?.path_full;
        updated = (await saveRemoteArtworkImage(heroSource, heroPath)) || updated;
      }
    }
  }

  const resolvedTitle = storeDetails?.name || knownTitle || null;
  const ts = Date.now();
  const result = {
    appId: strId,
    title: resolvedTitle,
    gameId: `pc_steam_${strId}`,
    tileIcon: hasNonEmptyFile(tilePath) ? `/assets/cache/games/pc_steam_${strId}/tile.jpg?t=${ts}` : null,
    heroBg: hasNonEmptyFile(heroPath) ? `/assets/cache/games/pc_steam_${strId}/hero.jpg?t=${ts}` : null,
    ...(hasNonEmptyFile(logoPath) ? { logoImg: `/assets/cache/games/pc_steam_${strId}/logo.png?t=${ts}` } : {}),
    updated
  };

  if (updated && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('steam:artwork-updated', result);
  }

  return result;
}

let isAutoDownloadingArtwork = false;
const pendingSteamArtworkIds = new Set();
async function autoDownloadAllSteamArtworks(appIds) {
  if (!Array.isArray(appIds) || appIds.length === 0) return;
  appIds.forEach(id => {
    const normalized = String(id || '').trim();
    if (/^\d+$/.test(normalized)) pendingSteamArtworkIds.add(normalized);
  });
  if (isAutoDownloadingArtwork || isGameplayBoostPaused || pendingSteamArtworkIds.size === 0) return;
  isAutoDownloadingArtwork = true;
  try {
    const concurrency = 4;
    const workers = Array(concurrency).fill(0).map(async () => {
      while (pendingSteamArtworkIds.size > 0 && !isGameplayBoostPaused) {
        const id = pendingSteamArtworkIds.values().next().value;
        pendingSteamArtworkIds.delete(id);
        if (id) {
          try {
            await autoDownloadSteamGameArtwork(id);
          } catch (e) {}
        }
      }
    });
    await Promise.all(workers);
  } catch (e) {
    console.warn('[Steam Auto-Artwork] Error batch downloading artwork:', e);
  } finally {
    isAutoDownloadingArtwork = false;
  }
}

function getSteamArtworkAppIds(scannedGames = null) {
  const favIds = [...getSteamFavoriteAppIds()].filter(id => !isNonGameSteamApp(null, id));
  if (favIds.length > 0) return favIds;
  const sourceGames = Array.isArray(scannedGames) ? scannedGames : scanHostStores();
  return [...new Set(
    sourceGames
      .filter(g => g && g.store === 'steam' && g.appId && !isNonGameSteamApp(g.title, g.appId))
      .map(g => String(g.appId))
  )];
}

let steamLibraryWatchers = [];
let steamWatcherDebounce = null;
let liveSteamFavMonitorTimer = null;
let lastBroadcastSteamSignature = '';
let steamBroadcastInFlight = false;

function computeSteamLibrarySignature(games) {
  const steamItems = (games || [])
    .filter(g => g && g.store === 'steam')
    .map(g => `${g.appId}:${g.installed ? 1 : 0}:${g.isDownloading ? 1 : 0}:${g.badge}:${g.title}:${g.playTime || ''}`)
    .sort();
  return steamItems.join('|');
}

async function syncAndBroadcastSteamIfChanged(reason = '') {
  if (steamBroadcastInFlight || isGameplayBoostPaused) return;
  steamBroadcastInFlight = true;
  try {
    await syncLiveFavoritesFromSteamClient();
    const scanned = scanHostStores();
    const nextSig = computeSteamLibrarySignature(scanned);
    if (nextSig !== lastBroadcastSteamSignature) {
      lastBroadcastSteamSignature = nextSig;
      const favIds = [...getSteamFavoriteAppIds()];
      if (reason) addSteamSyncLog(reason);
      autoDownloadAllSteamArtworks(getSteamArtworkAppIds(scanned));
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('steam:library-changed', {
          count: favIds.length,
          steamFavorites: favIds,
          steamSynced: true,
          games: scanned
        });
      }
    }
  } catch (e) {
  } finally {
    steamBroadcastInFlight = false;
  }
}

function startSteamLibraryWatcher() {
  steamLibraryWatchers.forEach(w => {
    try { w.close(); } catch (e) {}
  });
  steamLibraryWatchers = [];
  if (liveSteamFavMonitorTimer) {
    clearInterval(liveSteamFavMonitorTimer);
    liveSteamFavMonitorTimer = null;
  }

  // Seed signature with initial synced favorites state so no redundant broadcast fires
  try {
    lastBroadcastSteamSignature = computeSteamLibrarySignature(scanHostStores());
  } catch (e) {}

  const dirsToWatch = new Set();

  for (const sDir of getSteamInstallDirs()) {
    const userDataPath = path.join(sDir, 'userdata');
    if (fs.existsSync(userDataPath)) {
      dirsToWatch.add(userDataPath);
      try {
        const uDirs = fs.readdirSync(userDataPath);
        for (const u of uDirs) {
          const uPath = path.join(userDataPath, u);
          if (fs.existsSync(uPath) && fs.statSync(uPath).isDirectory()) {
            const cs = path.join(uPath, 'config', 'cloudstorage');
            if (fs.existsSync(cs)) dirsToWatch.add(cs);
            const cfg = path.join(uPath, 'config');
            if (fs.existsSync(cfg)) dirsToWatch.add(cfg);
            const sharedConfigRemote = path.join(uPath, '7', 'remote');
            if (fs.existsSync(sharedConfigRemote)) dirsToWatch.add(sharedConfigRemote);
          }
        }
      } catch (e) {}
    }

    const sApps = path.join(sDir, 'steamapps');
    if (fs.existsSync(sApps)) {
      dirsToWatch.add(sApps);
    }
  }

  const triggerChange = () => {
    if (isGameplayBoostPaused) return;
    if (steamWatcherDebounce) clearTimeout(steamWatcherDebounce);
    steamWatcherDebounce = setTimeout(() => {
      syncAndBroadcastSteamIfChanged('Real-time Steam change detected on disk (cloudstorage / vdf / manifest)');
    }, 300);
  };

  for (const dir of dirsToWatch) {
    try {
      const watcher = fs.watch(dir, { recursive: false }, (_eventType, filename) => {
        if (!filename) return triggerChange();
        const f = filename.toLowerCase();
        if (f.endsWith('.json') || f.endsWith('.vdf') || f.endsWith('.acf')) {
          triggerChange();
        }
      });
      steamLibraryWatchers.push(watcher);
    } catch (e) {
      console.warn(`[Steam Watcher] Failed to watch ${dir}:`, e.message);
    }
  }

  // Lightweight live Steam client Favorites monitor (event-driven via fs.watch; CDP polled gently without blocking full store scans)
  let prevLiveFavSignature = [...getSteamFavoriteAppIds()].sort().join(',');
  liveSteamFavMonitorTimer = setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed() || isGameplayBoostPaused || steamBroadcastInFlight) return;
    try {
      await syncLiveFavoritesFromSteamClient();
      const nextFavSig = [...getSteamFavoriteAppIds()].sort().join(',');
      if (nextFavSig !== prevLiveFavSignature) {
        prevLiveFavSignature = nextFavSig;
        await syncAndBroadcastSteamIfChanged('Live Steam client Favorites update detected');
      }
    } catch (e) {}
  }, 8000);

  console.log(`[Steam Real-Time Sync] Watching ${steamLibraryWatchers.length} Steam library directories + lightweight Favorites monitor.`);
}

function resolveAppProtocolFilePath(requestUrl) {
  try {
    const parsed = new URL(requestUrl);
    let relPath = decodeURIComponent(parsed.pathname || '/').replace(/^\/+/, '');
    if (!relPath) relPath = 'index.html';

    const rootsToCheck = [];
    if (relPath.startsWith('assets/cache/')) {
      rootsToCheck.push({ root: getCacheRootDir(), rel: relPath.slice('assets/cache/'.length) });
    }
    rootsToCheck.push({ root: path.join(__dirname, '..', 'dist'), rel: relPath });
    if (!app.isPackaged) {
      rootsToCheck.push({ root: path.join(__dirname, '..', 'public'), rel: relPath });
    }

    for (const { root, rel } of rootsToCheck) {
      const resolvedRoot = path.resolve(root);
      const candidate = path.resolve(resolvedRoot, rel);
      if (candidate !== resolvedRoot && !candidate.startsWith(resolvedRoot + path.sep)) continue;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  } catch (e) {}
  return null;
}

async function handleAppProtocolRequest(request) {
  let parsed;
  try {
    parsed = new URL(request.url);
  } catch (e) {
    return new Response('Bad Request', { status: 400 });
  }

  if (parsed.pathname === '/api/steam/search') {
    const term = (parsed.searchParams.get('term') || '').trim();
    if (!term) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    try {
      const resp = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
      const body = resp.ok ? await resp.text() : JSON.stringify({ items: [] });
      return new Response(body, {
        status: resp.ok ? 200 : resp.status,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (parsed.pathname === '/api/steam/appdetails') {
    const appId = (parsed.searchParams.get('appId') || parsed.searchParams.get('appids') || '').trim();
    if (!/^\d+$/.test(appId)) {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const details = await fetchSteamStoreAppDetails(appId);
    return new Response(JSON.stringify(details || { success: false }), {
      status: details ? 200 : 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (parsed.pathname === '/api/pc/asset') {
    const appId = (parsed.searchParams.get('appId') || '').trim();
    const type = (parsed.searchParams.get('type') || 'tile').trim().toLowerCase();
    if (/^\d+$/.test(appId)) {
      const file = type === 'logo' ? 'logo.png' : (type === 'hero' ? 'hero.jpg' : 'tile.jpg');
      const localCachePath = path.join(getCacheRootDir(), 'games', `pc_steam_${appId}`, file);
      if (hasNonEmptyFile(localCachePath)) {
        return net.fetch(pathToFileURL(localCachePath).toString());
      }
      const cdnFile = type === 'logo' ? 'logo.png' : (type === 'hero' ? 'library_hero.jpg' : 'library_600x900_2x.jpg');
      return Response.redirect(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/${cdnFile}`, 302);
    }
    return new Response('Not Found', { status: 404 });
  }

  const filePath = resolveAppProtocolFilePath(request.url);
  if (!filePath) {
    return new Response('Not Found', { status: 404 });
  }
  return net.fetch(pathToFileURL(filePath).toString());
}

// --------------------------------------------------------------------------
// App Lifecycle
// --------------------------------------------------------------------------
app.whenReady().then(() => {
  protocol.handle('app', (request) => handleAppProtocolRequest(request));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopLaunchReadinessWatcher();
  isGameplayBoostPaused = false;
  if (gameBoost.getCurrentState().active) {
    gameBoost.disableGameBoost({ restoreClosedApps: false }).catch(() => {});
  }
  if (steamDownloadPollTimer) clearTimeout(steamDownloadPollTimer);
  if (steamWatcherDebounce) clearTimeout(steamWatcherDebounce);
  if (liveSteamFavMonitorTimer) clearInterval(liveSteamFavMonitorTimer);
  try { resetPersistentSteamWs(); } catch (e) {}
  steamLibraryWatchers.forEach(w => {
    try { w.close(); } catch (e) {}
  });
  steamLibraryWatchers = [];
  try {
    if (typeof globalShortcut !== 'undefined' && globalShortcut && typeof globalShortcut.unregisterAll === 'function') {
      globalShortcut.unregisterAll();
    }
  } catch (e) {}
  if (viteProcess) {
    try {
      if (process.platform === 'win32') {
        child_process.exec(`taskkill /pid ${viteProcess.pid} /T /F`, () => {});
      } else {
        viteProcess.kill();
      }
    } catch (e) {}
  }
});


