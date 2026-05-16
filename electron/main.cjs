const { app, BrowserWindow, shell, ipcMain, globalShortcut, session } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = !app.isPackaged

// Linux Mint / Ubuntu: Sandbox deaktivieren wenn Kernel keine User-Namespaces unterstützt
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-gpu-sandbox')
}

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

  // F11 = Vollbild ein/aus, ESC = Vollbild verlassen
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
    if (input.key === 'Escape' && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false)
    }
  })

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change', true)
  })
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change', false)
  })

  ipcMain.handle('toggle-fullscreen', () => {
    mainWindow?.setFullScreen(!mainWindow.isFullScreen())
  })

  ipcMain.handle('get-fullscreen', () => {
    return mainWindow?.isFullScreen() ?? false
  })
}

// Config-Backup im userData-Ordner (überlebt Reinstallation)
const CONFIG_BACKUP = path.join(app.getPath('userData'), 'config-backup.json')

ipcMain.handle('config-save', (_event, data) => {
  try { fs.writeFileSync(CONFIG_BACKUP, JSON.stringify(data), 'utf8') } catch {}
})

ipcMain.handle('config-load', () => {
  try {
    if (fs.existsSync(CONFIG_BACKUP)) return JSON.parse(fs.readFileSync(CONFIG_BACKUP, 'utf8'))
  } catch {}
  return null
})

function setupAutoUpdater() {
  if (isDev) return

  const { autoUpdater } = require('electron-updater')

  // Auf Linux: nur updaten wenn AppImage beschreibbar ist
  if (process.platform === 'linux' && !autoUpdater.isUpdaterActive()) return

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

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-error', err.message)
  })

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('check-for-updates', () => {
    autoUpdater.checkForUpdatesAndNotify()
  })

  // Beim Start prüfen (nach 5s) und danach stündlich wiederholen
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify()
    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 60 * 60 * 1000)
  }, 5000)
}

app.whenReady().then(() => {
  // CORS-Bypass: BrandMeister API antwortet ohne Access-Control-Header wenn kein Origin gesendet wird.
  // Electron (file://) sendet keinen Origin-Header → Response wird vom Renderer blockiert.
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://api.brandmeister.network/*'] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*'],
          'Access-Control-Allow-Methods': ['GET, OPTIONS'],
          'Access-Control-Allow-Headers': ['Content-Type'],
        },
      })
    }
  )

  createWindow()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
