const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  launchGame: (data) => ipcRenderer.invoke('game:launch', data),
  closeGame: (data) => ipcRenderer.invoke('game:close', data),
  killPid: (pid) => ipcRenderer.invoke('app:kill-pid', pid),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  restoreWindow: () => ipcRenderer.invoke('window:restore'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  getBoostStatus: (opts) => ipcRenderer.invoke('boost:get-status', opts),
  enableGameBoost: (opts) => ipcRenderer.invoke('boost:enable', opts),
  disableGameBoost: (opts) => ipcRenderer.invoke('boost:disable', opts),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  rebootApp: () => ipcRenderer.invoke('app:reboot'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  getSystemInfo: () => ipcRenderer.invoke('system:get-info'),
  syncAllStores: () => ipcRenderer.invoke('library:sync-all-stores'),
  syncNow: () => ipcRenderer.invoke('steam:sync-now'),
  getSteamSyncDiagnostics: () => ipcRenderer.invoke('steam:get-sync-diagnostics'),
  resyncSteamAccount: () => ipcRenderer.invoke('steam:resync-account'),
  refreshSteamFavorites: () => ipcRenderer.invoke('steam:refresh-favorites'),
  refreshSteamArtwork: () => ipcRenderer.invoke('steam:refresh-artwork'),
  repairSteamConnection: () => ipcRenderer.invoke('steam:repair-connection'),
  syncStore: (store) => ipcRenderer.invoke('library:sync-store', store),
  repairLibrary: () => ipcRenderer.invoke('library:repair'),
  clearInvalidEntries: () => ipcRenderer.invoke('library:clear-invalid'),
  cacheArtwork: (data) => ipcRenderer.invoke('game:cache-artwork', data),
  getSteamAppDetails: (appId) => ipcRenderer.invoke('steam:get-appdetails', appId),
  getSteamDownloads: () => ipcRenderer.invoke('steam:get-downloads'),
  resumeSteamDownload: (appId) => ipcRenderer.invoke('steam:resume-download', appId),
  pauseSteamDownload: (appId) => ipcRenderer.invoke('steam:pause-download', appId),
  saveCustomArtwork: (data) => ipcRenderer.invoke('game:save-custom-artwork', data),
  restoreDefaultArtwork: (gameId) => ipcRenderer.invoke('game:restore-default-artwork', gameId),
  loadPersistentLibrary: () => ipcRenderer.invoke('library:get-all'),
  savePersistentGame: (game) => ipcRenderer.invoke('library:save-game', game),
  loadPersistentSettings: () => ipcRenderer.invoke('settings:load'),
  savePersistentSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getWifiNetworks: () => ipcRenderer.invoke('system:get-wifi-networks'),
  getStorageDrives: () => ipcRenderer.invoke('system:get-storage-drives'),
  openWindowsNetworkSettings: () => ipcRenderer.invoke('system:open-network-settings'),
  openWindowsGraphicsSettings: () => ipcRenderer.invoke('system:open-graphics-settings'),
  browseLocalImage: () => ipcRenderer.invoke('dialog:browse-image'),
  onSteamDownloadsUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('steam:downloads-updated', handler);
    return () => ipcRenderer.removeListener('steam:downloads-updated', handler);
  },
  onSteamLibraryChanged: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('steam:library-changed', handler);
    return () => ipcRenderer.removeListener('steam:library-changed', handler);
  },
  onSteamArtworkUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('steam:artwork-updated', handler);
    return () => ipcRenderer.removeListener('steam:artwork-updated', handler);
  },
  onFullscreenChange: (callback) => {
    ipcRenderer.on('window:fullscreen-changed', (_event, isFullscreen) => callback(isFullscreen));
  },
  onGameProcessExited: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('game:process-exited', handler);
    return () => ipcRenderer.removeListener('game:process-exited', handler);
  },
  onGameLaunchReady: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('game:launch-ready', handler);
    return () => ipcRenderer.removeListener('game:launch-ready', handler);
  },
  onBoostStateChanged: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('boost:state-changed', handler);
    return () => ipcRenderer.removeListener('boost:state-changed', handler);
  },
  onWindowIdleState: (callback) => {
    const handler = (_event, isIdle) => callback(isIdle);
    ipcRenderer.on('window:idle-state', handler);
    return () => ipcRenderer.removeListener('window:idle-state', handler);
  }
});
