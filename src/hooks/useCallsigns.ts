import { useState, useEffect, useCallback } from 'react'

interface CallsignInfo {
  firstName: string
  city: string | null
}

type CallsignData = Record<string, CallsignInfo>

const CACHE_KEY      = 'callsigns-data-v1'
const TIMESTAMP_KEY  = 'callsigns-updated-v1'
const MAX_AGE_MS     = 7 * 24 * 60 * 60 * 1000   // 7 Tage
const GITHUB_REPO    = import.meta.env.VITE_GITHUB_REPO ?? 'knicker112/DMRDashboard'
const REMOTE_URL     = `https://raw.githubusercontent.com/${GITHUB_REPO}/master/public/callsigns.json`

// Lädt gecachte Daten aus localStorage; null wenn nicht vorhanden/fehlerhaft
function loadCached(): CallsignData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CallsignData
    return Object.keys(parsed).length > 0 ? parsed : null
  } catch {
    return null
  }
}

// Prüft ob ein Refresh nötig ist (fehlt oder > 7 Tage alt)
function needsRefresh(): boolean {
  const ts = localStorage.getItem(TIMESTAMP_KEY)
  if (!ts) return true
  return Date.now() - Number(ts) > MAX_AGE_MS
}

// Modulweiter Cache — einmal geladen, für die gesamte Session gültig
let inMemory: CallsignData | null = loadCached()

export function useCallsigns() {
  const [data, setData] = useState<CallsignData>(inMemory ?? {})

  useEffect(() => {
    // Gebündelte Datei laden falls noch nichts im Speicher
    if (!inMemory) {
      fetch('./callsigns.json')
        .then(r => r.json())
        .then((json: { callsigns?: CallsignData }) => {
          if (json.callsigns) {
            inMemory = json.callsigns
            setData(json.callsigns)
          }
        })
        .catch(() => {})
    }

    // Im Hintergrund frische Daten von GitHub laden wenn > 7 Tage alt
    if (!needsRefresh()) return
    fetch(REMOTE_URL)
      .then(r => r.json())
      .then((json: { callsigns?: CallsignData; updated?: string }) => {
        if (!json.callsigns) return
        inMemory = json.callsigns
        setData(json.callsigns)
        // Nur Zeitstempel speichern; Daten in localStorage sind optional (Größe ~3 MB)
        localStorage.setItem(TIMESTAMP_KEY, String(Date.now()))
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(json.callsigns))
        } catch {
          // localStorage zu klein → ignorieren, nächste Session holt erneut
        }
      })
      .catch(() => {})
  }, [])

  const lookup = useCallback(
    (callsign: string): CallsignInfo | null => data[callsign.toUpperCase()] ?? null,
    [data],
  )

  return { lookup }
}
