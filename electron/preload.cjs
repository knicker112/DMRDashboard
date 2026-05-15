const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronUpdater', {
  onUpdateAvailable:  (cb) => ipcRenderer.on('update-available',  (_, info) => cb(info)),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (_, p)    => cb(p)),
  onUpdateReady:      (cb) => ipcRenderer.on('update-downloaded', (_, info) => cb(info)),
  installAndRestart:  ()   => ipcRenderer.send('install-update'),
  checkForUpdates:    ()   => ipcRenderer.invoke('check-for-updates'),
})
