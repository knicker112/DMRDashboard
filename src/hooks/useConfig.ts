import { useState, useCallback } from 'react'
import type { AudioChannelConfig } from '../utils/audio'
import { defaultAudioRx, defaultAudioTx } from '../utils/audio'

export type { AudioChannelConfig }

export interface HotspotConfig {
  id: string
  name: string
  slots: 1 | 2
}

export type DashboardLayout = 'standard' | 'compact'

export interface AppConfig {
  hotspots: HotspotConfig[]
  callsign: string
  lat: number
  lng: number
  aprsApiKey: string
  customTgNames: Record<string, string>
  audioRx: AudioChannelConfig
  audioTx: AudioChannelConfig
  layout: DashboardLayout
}

const STORAGE_KEY = 'dmr-dashboard-config'

declare global {
  interface Window {
    electronConfig?: {
      save: (data: unknown) => Promise<void>
      load: () => Promise<unknown>
    }
  }
}

function envDefaults(): AppConfig | null {
  const hotspotId = import.meta.env.VITE_HOTSPOT_ID
  const callsign = import.meta.env.VITE_CALLSIGN
  if (!hotspotId || !callsign) return null
  return {
    hotspots: [{ id: hotspotId, name: 'Hotspot 1', slots: 2 }],
    callsign,
    lat: parseFloat(import.meta.env.VITE_LAT ?? '51.0'),
    lng: parseFloat(import.meta.env.VITE_LNG ?? '10.0'),
    aprsApiKey: import.meta.env.VITE_APRS_API_KEY ?? '',
    customTgNames: {},
    audioRx: { ...defaultAudioRx },
    audioTx: { ...defaultAudioTx },
    layout: 'standard' as DashboardLayout,
  }
}

function migrate(raw: any): AppConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const envKey = import.meta.env.VITE_APRS_API_KEY ?? ''

  // Altes Format: { hotspotId, callsign, lat, lng, aprsApiKey }
  if (raw.hotspotId && !raw.hotspots) {
    return {
      hotspots: [{ id: String(raw.hotspotId), name: 'Hotspot 1', slots: 2 }],
      callsign: raw.callsign ?? '',
      lat: raw.lat ?? 0,
      lng: raw.lng ?? 0,
      aprsApiKey: raw.aprsApiKey || envKey,
      customTgNames: raw.customTgNames ?? {},
      audioRx: migrateAudio(raw.audioRx) ?? { ...defaultAudioRx },
      audioTx: migrateAudio(raw.audioTx) ?? { ...defaultAudioTx },
      layout: 'standard' as DashboardLayout,
    }
  }

  // Neues Format — alle vorhandenen Felder übernehmen, fehlende mit Defaults füllen
  // KEIN && raw.callsign — leerer String darf Config nicht verwerfen
  if (Array.isArray(raw.hotspots) && raw.hotspots.length > 0) {
    return {
      hotspots: raw.hotspots as HotspotConfig[],
      callsign: raw.callsign ?? '',
      lat: raw.lat ?? 0,
      lng: raw.lng ?? 0,
      aprsApiKey: raw.aprsApiKey || envKey,
      customTgNames: raw.customTgNames ?? {},
      audioRx: migrateAudio(raw.audioRx) ?? { ...defaultAudioRx },
      audioTx: migrateAudio(raw.audioTx) ?? { ...defaultAudioTx },
      layout: (raw.layout === 'compact' ? 'compact' : 'standard') as DashboardLayout,
    }
  }

  return null
}

function migrateAudio(raw: any): AudioChannelConfig | null {
  if (!raw || typeof raw !== 'object') return null
  return {
    enabled: raw.enabled ?? true,
    volume:  raw.volume  ?? 0.7,
    preset:  raw.preset  ?? 'beep',
    customDataUrl:  raw.customDataUrl,
    customFileName: raw.customFileName,
  }
}

async function restoreFromBackup(): Promise<void> {
  try {
    const raw = await window.electronConfig?.load()
    if (!raw) return
    const cfg = migrate(raw)
    if (cfg) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
      // Seite neu laden damit die wiederhergestellte Config aktiv wird
      window.location.reload()
    }
  } catch {}
}

function loadConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const cfg = migrate(JSON.parse(raw))
      if (cfg) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
        return cfg
      }
    }
  } catch {}

  // localStorage leer oder ungültig → Backup aus Datei versuchen (Electron)
  if (window.electronConfig) {
    restoreFromBackup()  // async, löst Reload aus wenn Daten gefunden
  }

  const defaults = envDefaults()
  if (defaults) localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
  return defaults
}

export function useConfig() {
  const [config, setConfigState] = useState<AppConfig | null>(loadConfig)

  const saveConfig = useCallback((next: AppConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.electronConfig?.save(next)  // Backup-Datei aktuell halten
    setConfigState(next)
  }, [])

  const clearConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setConfigState(envDefaults())
  }, [])

  return { config, saveConfig, clearConfig }
}
