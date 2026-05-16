import { useState, useEffect } from 'react'
import { useConfig } from './hooks/useConfig'
import { useUpdateCheck } from './hooks/useUpdateCheck'
import { useElectronUpdater } from './hooks/useElectronUpdater'
import { applyCustomTgNames } from './hooks/useTalkgroups'
import { HotspotPanel } from './components/HotspotPanel'
import { StationMap } from './components/StationMap'
import { SetupScreen } from './components/SetupScreen'

declare global {
  interface Window {
    electronWindow?: {
      toggleFullscreen: () => Promise<void>
      getFullscreen: () => Promise<boolean>
      onFullscreenChange: (cb: (v: boolean) => void) => void
    }
  }
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    window.electronWindow?.getFullscreen().then(setIsFullscreen)
    window.electronWindow?.onFullscreenChange(setIsFullscreen)

    // Web-Fallback
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggle() {
    if (window.electronWindow) {
      window.electronWindow.toggleFullscreen()
    } else if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return { isFullscreen, toggle }
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null

    async function acquire() {
      try { lock = await navigator.wakeLock?.request('screen') } catch {}
    }

    acquire()

    const onVisibility = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      lock?.release()
    }
  }, [])
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function ClockDisplay() {
  const now = useClock()
  const fmt = (tz: string) =>
    now.toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const utc = fmt('UTC')
  const cet = fmt('Europe/Berlin')
  const cetLabel = now.toLocaleDateString('en-US', { timeZone: 'Europe/Berlin', timeZoneName: 'short' })
    .split(', ')[1] ?? 'CET'

  return (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center leading-none">
        <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums tracking-wider">{utc}</span>
        <span className="text-xs text-slate-500 font-bold tracking-widest mt-0.5">UTC</span>
      </div>
      <div className="flex flex-col items-center leading-none">
        <span className="text-2xl font-bold font-mono text-slate-300 tabular-nums tracking-wider">{cet}</span>
        <span className="text-xs text-slate-500 font-bold tracking-widest mt-0.5">{cetLabel}</span>
      </div>
    </div>
  )
}

export default function App() {
  const { config, saveConfig } = useConfig()
  const [showSettings, setShowSettings] = useState(false)
  const electronUpdate = useElectronUpdater()
  useWakeLock()

  useEffect(() => {
    if (config?.customTgNames) applyCustomTgNames(config.customTgNames)
  }, [config?.customTgNames])

  if (!config) {
    return <SetupScreen onSave={cfg => saveConfig(cfg)} electronUpdate={electronUpdate} />
  }

  if (showSettings) {
    return (
      <SetupScreen
        initial={config}
        onSave={cfg => { saveConfig(cfg); setShowSettings(false) }}
        onCancel={() => setShowSettings(false)}
        electronUpdate={electronUpdate}
      />
    )
  }

  return <Dashboard config={config} onOpenSettings={() => setShowSettings(true)} electronUpdate={electronUpdate} />
}

function Dashboard({ config, onOpenSettings, electronUpdate }: {
  config: NonNullable<ReturnType<typeof useConfig>['config']>
  onOpenSettings: () => void
  electronUpdate: ReturnType<typeof useElectronUpdater>
}) {
  const updateInfo = useUpdateCheck()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

  // Fenstertitel anpassen wenn Update bereit
  useEffect(() => {
    if (electronUpdate.ready) {
      document.title = '🔔 UPDATE BEREIT — DMR Dashboard'
    } else if (electronUpdate.downloading) {
      document.title = `⬇ Update ${Math.round(electronUpdate.percent)}% — DMR Dashboard`
    } else {
      document.title = 'DMR Dashboard'
    }
  }, [electronUpdate.ready, electronUpdate.downloading, electronUpdate.percent])

  return (
    <div className="min-h-screen bg-slate-950 font-mono">

      {/* Update-Banner */}
      {electronUpdate.ready && (
        <div
          onClick={() => electronUpdate.install()}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black tracking-widest text-center py-2.5 cursor-pointer transition-colors animate-pulse select-none"
        >
          ↑ UPDATE BEREIT — v{electronUpdate.version} — HIER KLICKEN ZUM NEU STARTEN
        </div>
      )}
      {electronUpdate.downloading && (
        <div className="w-full bg-sky-800 text-sky-200 text-xs font-bold tracking-widest text-center py-2 flex items-center justify-center gap-3">
          <div className="w-32 bg-sky-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-400 h-full transition-all duration-300" style={{ width: `${electronUpdate.percent}%` }} />
          </div>
          <span>UPDATE WIRD GELADEN… {Math.round(electronUpdate.percent)}%</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-sky-400 text-xl font-bold tracking-widest">
            Brandmeister Dashboard · {config.callsign}
          </h1>
          <div className="flex items-center gap-6">
            <ClockDisplay />

            {/* Versionsnummer / Web-Update-Hinweis */}
            {updateInfo?.hasUpdate && !electronUpdate.available ? (
              <a
                href={updateInfo.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-sky-800/60 hover:bg-sky-700/60 border border-sky-600 text-sky-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>↑</span>
                <span>v{updateInfo.latestVersion} verfügbar</span>
              </a>
            ) : (
              <span className="text-slate-600 text-xs font-bold tracking-widest">
                v{__APP_VERSION__}
              </span>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Vollbild verlassen (F11 / ESC)' : 'Vollbild (F11)'}
              className="text-slate-500 hover:text-slate-300 transition-colors text-base font-mono"
            >
              {isFullscreen ? '⊡' : '⊞'}
            </button>

            <button
              onClick={onOpenSettings}
              title="Einstellungen"
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Ein Panel pro Hotspot — responsiv: Hochformat=untereinander, Querformat=nebeneinander */}
        {(() => {
          const n = config.hotspots.length
          const grid = n === 1
            ? ''
            : n === 2
              ? 'grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6'
              : 'grid grid-cols-1 landscape:grid-cols-3 md:grid-cols-3 gap-4'
          return (
            <div className={grid}>
              {config.hotspots.map((hotspot, idx) => (
                <HotspotPanel
                  key={hotspot.id}
                  hotspot={hotspot}
                  config={config}
                  hotspotIndex={idx}
                  compact={n > 1}
                />
              ))}
            </div>
          )
        })()}

        {/* Gemeinsame Karte für alle Hotspots */}
        <StationMap
          stations={[]}
          homeLat={config.lat}
          homeLng={config.lng}
          homeCallsign={config.callsign}
        />

        {/* Branding */}
        <div className="mt-6 text-center text-slate-700 text-xs font-mono tracking-widest">
          DMR Dashboard · Entwickelt von Christian Schmitz DO2EF
        </div>

      </div>
    </div>
  )
}
