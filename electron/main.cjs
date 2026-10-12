const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');
const child_process = require('child_process');

let mainWindow = null;

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
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
    req.setTimeout(800, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#050508',
    title: 'PlayStation 5',
    icon: path.join(__dirname, '../public/favicon.ico'),
    frame: false, // Frameless for authentic PS5 console borderless experience
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false // Allows smooth loading of local game covers & media assets
    }
  });

  // Smooth show once ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Track fullscreen changes
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-changed', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-changed', false);
  });

  // Check if Vite Dev Server is running
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const isDev = !app.isPackaged && (process.env.NODE_ENV === 'development' || await checkDevServer(devServerUrl));

  if (isDev) {
    console.log(`[Electron] Connecting to Vite dev server at ${devServerUrl}...`);
    await mainWindow.loadURL(devServerUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log(`[Electron] Loading production bundle from ${indexPath}...`);
    await mainWindow.loadFile(indexPath);
  }

  // Register F11 for Fullscreen Toggle
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
}

// --------------------------------------------------------------------------
// IPC Handlers: Native Game Launching & System Controls
// --------------------------------------------------------------------------
ipcMain.handle('game:launch', async (_event, data) => {
  try {
    const { execPath, uri, appId, title, args } = data || {};
    console.log(`[Electron Launcher] Request to launch: ${title || appId || uri || execPath}`);

    // 1. Direct Executable Launch
    if (execPath) {
      const cleanPath = execPath.trim();
      const argList = args ? (Array.isArray(args) ? args : args.split(' ').filter(Boolean)) : [];
      const proc = child_process.spawn(cleanPath, argList, {
        detached: true,
        stdio: 'ignore'
      });
      proc.unref();
      return { success: true, method: 'spawn', path: cleanPath };
    }

    // 2. Protocol / Steam URI Launch
    if (uri || appId) {
      const launchTarget = uri || `steam://rungameid/${appId}`;
      await shell.openExternal(launchTarget);
      return { success: true, method: 'shell', target: launchTarget };
    }

    return { success: false, error: 'No launch path or URI provided' };
  } catch (err) {
    console.error('[Electron Launcher] Launch error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('game:close', async (_event, data) => {
  try {
    const { execPath, title } = data || {};
    if (execPath) {
      const exeName = path.basename(execPath);
      child_process.exec(`taskkill /IM "${exeName}" /F`, (err) => {
        if (err) console.warn(`[Electron Launcher] taskkill info:`, err.message);
      });
      return { success: true, closed: exeName };
    }
    return { success: true, info: `Close requested for ${title}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Window Controls
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
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

ipcMain.handle('system:get-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    user: process.env.USERNAME || 'Player 1'
  };
});

// --------------------------------------------------------------------------
// App Lifecycle
// --------------------------------------------------------------------------
app.whenReady().then(() => {
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
  globalShortcut.unregisterAll();
});
