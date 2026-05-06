import { useState, useEffect } from 'react'

export interface AprsPosition {
  lat: number
  lng: number
  lastSeen: Date
  comment: string
}

const cache = new Map<string, { pos: AprsPosition; fetchedAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000   // Position 5 Min gültig
const POLL_MS      = 2 * 60 * 1000   // Alle 2 Min nachfragen solange Slot aktiv

export function useAprs(callsign: string | null, apiKey: string) {
  const [position, setPosition] = useState<AprsPosition | null>(null)

  useEffect(() => {
    if (!callsign || !apiKey) {
      setPosition(null)
      return
    }

    const cacheKey = `${apiKey}:${callsign}`
    let cancelled = false

    async function update() {
      if (cancelled) return
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setPosition(cached.pos)
        return
      }

      const url = `https://api.aprs.fi/api/get?name=${encodeURIComponent(callsign!)}&what=loc&apikey=${apiKey}&format=json`
      try {
        const r = await fetch(url)
        const data = await r.json() as {
          result: string
          found: number
          entries?: Array<{ lat: string; lng: string; lasttime: string; comment?: string }>
        }
        if (cancelled) return
        if (data.result === 'ok' && data.found > 0 && data.entries?.[0]) {
          const e = data.entries[0]
          const pos: AprsPosition = {
            lat: parseFloat(e.lat),
            lng: parseFloat(e.lng),
            lastSeen: new Date(Number(e.lasttime) * 1000),
            comment: e.comment ?? '',
          }
          cache.set(cacheKey, { pos, fetchedAt: Date.now() })
          setPosition(pos)
        } else {
          setPosition(null)
        }
      } catch {
        if (!cancelled) setPosition(null)
      }
    }

    update()
    const id = setInterval(update, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [callsign, apiKey])

  return position
}
