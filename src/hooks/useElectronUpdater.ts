import { useEffect, useState } from 'react'

interface ElectronUpdater {
  onUpdateAvailable:  (cb: (info: { version: string }) => void) => void
  onDownloadProgress: (cb: (p: { percent: number }) => void) => void
  onUpdateReady:      (cb: (info: { version: string }) => void) => void
  installAndRestart:  () => void
  checkForUpdates?:   () => Promise<void>
}

declare global {
  interface Window {
    electronUpdater?: ElectronUpdater
  }
}

interface UpdaterState {
  available:   boolean
  downloading: boolean
  ready:       boolean
  version:     string
  percent:     number
  install:     () => void
}

export function useElectronUpdater(): UpdaterState {
  const [available,   setAvailable]   = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [ready,       setReady]       = useState(false)
  const [version,     setVersion]     = useState('')
  const [percent,     setPercent]     = useState(0)

  useEffect(() => {
    const eu = window.electronUpdater
    if (!eu) return

    eu.onUpdateAvailable(({ version }) => {
      setAvailable(true)
      setDownloading(true)
      setVersion(version)
    })

    eu.onDownloadProgress(({ percent }) => {
      setPercent(percent)
    })

    eu.onUpdateReady(({ version }) => {
      setDownloading(false)
      setReady(true)
      setVersion(version)
    })
  }, [])

  return {
    available,
    downloading,
    ready,
    version,
    percent,
    install: () => window.electronUpdater?.installAndRestart(),
  }
}
