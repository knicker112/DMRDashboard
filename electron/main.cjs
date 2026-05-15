const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = !app.isPackaged

app.setAboutPanelOptions({
  applicationName: 'DMR Dashboard',
  applicationVersion: app.getVersion(),
  copyright: '© 2026 Christian Schmitz DO2EF',
  authors: ['Christian Schmitz DO2EF'],
  website: 'https://github.com/knicker112/DMRDashboard',
})

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'DMR Dashboard',
    icon: (() => {
      const p = path.join(__dirname, '../public/favicon.ico')
      return fs.existsSync(p) ? p : undefined
    })(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    backgroundColor: '#0f172a',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function setupAutoUpdater() {
  if (isDev) return

  const { autoUpdater } = require('electron-updater')

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info)
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('download-progress', progress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info)
  })

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('check-for-updates', () => {
    autoUpdater.checkForUpdatesAndNotify()
  })

  // Kurz warten bis das Fenster geladen ist, dann prüfen
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 5000)
}

app.whenReady().then(() => {
  createWindow()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
