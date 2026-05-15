const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronUpdater', {
  onUpdateAvailable:  (cb) => ipcRenderer.on('update-available',  (_, info) => cb(info)),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (_, p)    => cb(p)),
  onUpdateReady:      (cb) => ipcRenderer.on('update-downloaded', (_, info) => cb(info)),
  installAndRestart:  ()   => ipcRenderer.send('install-update'),
  checkForUpdates:    ()   => ipcRenderer.invoke('check-for-updates'),
})

contextBridge.exposeInMainWorld('electronWindow', {
  toggleFullscreen:    () => ipcRenderer.invoke('toggle-fullscreen'),
  getFullscreen:       () => ipcRenderer.invoke('get-fullscreen'),
  onFullscreenChange:  (cb) => ipcRenderer.on('fullscreen-change', (_, v) => cb(v)),
})

contextBridge.exposeInMainWorld('electronConfig', {
  save:    (data) => ipcRenderer.invoke('config-save', data),
  load:    ()     => ipcRenderer.invoke('config-load'),
})
