import { useState, useEffect } from 'react'
import { useConfig } from './hooks/useConfig'
import { useUpdateCheck } from './hooks/useUpdateCheck'
import { applyCustomTgNames } from './hooks/useTalkgroups'
import { HotspotPanel } from './components/HotspotPanel'
import { StationMap } from './components/StationMap'
import { SetupScreen } from './components/SetupScreen'

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

  useEffect(() => {
    if (config?.customTgNames) applyCustomTgNames(config.customTgNames)
  }, [config?.customTgNames])

  if (!config) {
    return <SetupScreen onSave={cfg => saveConfig(cfg)} />
  }

  if (showSettings) {
    return (
      <SetupScreen
        initial={config}
        onSave={cfg => { saveConfig(cfg); setShowSettings(false) }}
        onCancel={() => setShowSettings(false)}
      />
    )
  }

  return <Dashboard config={config} onOpenSettings={() => setShowSettings(true)} />
}

function Dashboard({ config, onOpenSettings }: {
  config: NonNullable<ReturnType<typeof useConfig>['config']>
  onOpenSettings: () => void
}) {
  const updateInfo = useUpdateCheck()

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-mono">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-sky-400 text-xl font-bold tracking-widest">
            Brandmeister Dashboard · {config.callsign}
          </h1>
          <div className="flex items-center gap-6">
            <ClockDisplay />
            <button
              onClick={onOpenSettings}
              title="Einstellungen"
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Update-Banner */}
        {updateInfo?.hasUpdate && (
          <a
            href={updateInfo.releaseUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-sky-900/60 border border-sky-600 text-sky-300 text-sm font-bold px-4 py-2 rounded-lg mb-6 hover:bg-sky-800/60 transition-colors"
          >
            <span>↑</span>
            <span>Version {updateInfo.latestVersion} verfügbar — Jetzt aktualisieren</span>
          </a>
        )}

        {/* Ein Panel pro Hotspot */}
        {(() => {
          const n = config.hotspots.length
          const grid = n === 1 ? '' : n === 2 ? 'grid grid-cols-2 gap-6' : 'grid grid-cols-3 gap-4'
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

      </div>
    </div>
  )
}
