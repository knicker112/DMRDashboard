import { useState, useCallback } from 'react'
import type { AudioChannelConfig } from '../utils/audio'
import { defaultAudioRx, defaultAudioTx } from '../utils/audio'

export type { AudioChannelConfig }

export interface HotspotConfig {
  id: string
  name: string
  slots: 1 | 2
}

export interface AppConfig {
  hotspots: HotspotConfig[]
  callsign: string
  lat: number
  lng: number
  aprsApiKey: string
  customTgNames: Record<string, string>
  audioRx: AudioChannelConfig
  audioTx: AudioChannelConfig
}

const STORAGE_KEY = 'dmr-dashboard-config'

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
      audioRx: raw.audioRx ?? { ...defaultAudioRx },
      audioTx: raw.audioTx ?? { ...defaultAudioTx },
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
      audioRx: raw.audioRx ?? { ...defaultAudioRx },
      audioTx: raw.audioTx ?? { ...defaultAudioTx },
    }
  }

  return null
}

function loadConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const cfg = migrate(JSON.parse(raw))
      if (cfg) {
        // Migrierte Config zurückspeichern damit neue Felder (z.B. aprsApiKey aus Env) erhalten bleiben
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
        return cfg
      }
    }
  } catch {}
  const defaults = envDefaults()
  if (defaults) localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
  return defaults
}

export function useConfig() {
  const [config, setConfigState] = useState<AppConfig | null>(loadConfig)

  const saveConfig = useCallback((next: AppConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setConfigState(next)
  }, [])

  const clearConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setConfigState(envDefaults())
  }, [])

  return { config, saveConfig, clearConfig }
}
