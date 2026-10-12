const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  launchGame: (data) => ipcRenderer.invoke('game:launch', data),
  closeGame: (data) => ipcRenderer.invoke('game:close', data),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  rebootApp: () => ipcRenderer.invoke('app:reboot'),
  getSystemInfo: () => ipcRenderer.invoke('system:get-info'),
  onFullscreenChange: (callback) => {
    ipcRenderer.on('window:fullscreen-changed', (_event, isFullscreen) => callback(isFullscreen));
  }
});
