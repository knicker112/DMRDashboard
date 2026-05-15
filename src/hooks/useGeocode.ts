import { useState, useEffect } from 'react'

export interface GeoPos { lat: number; lng: number }

const CACHE_KEY = 'geocode-cache-v1'

type GeoCache = Record<string, GeoPos | null>

// Einmal laden, für die Session im Speicher halten
const cache: GeoCache = (() => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as GeoCache }
  catch { return {} }
})()

function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

// Laufende Anfragen deduplizieren — verhindert Doppelabfragen für denselben Ort
const pending = new Map<string, Promise<GeoPos | null>>()

export async function geocodeCity(city: string): Promise<GeoPos | null> {
  const key = city.trim().toLowerCase()
  if (key in cache) return cache[key]
  if (pending.has(key)) return pending.get(key)!

  const req = fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Germany')}&format=json&limit=1`,
    { headers: { 'User-Agent': 'DMRDashboard/1.0 (https://github.com/knicker112/DMRDashboard)' } }
  )
    .then(r => r.json() as Promise<Array<{ lat: string; lon: string }>>)
    .then(data => {
      const pos = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
      cache[key] = pos
      saveCache()
      return pos
    })
    .catch(() => {
      cache[key] = null
      return null
    })
    .finally(() => pending.delete(key))

  pending.set(key, req)
  return req
}

export function useGeocodeCity(city: string | null): GeoPos | null {
  const [pos, setPos] = useState<GeoPos | null>(() => {
    if (!city) return null
    const key = city.trim().toLowerCase()
    return cache[key] ?? null
  })

  useEffect(() => {
    if (!city) { setPos(null); return }
    const key = city.trim().toLowerCase()
    if (key in cache) { setPos(cache[key]); return }
    geocodeCity(city).then(setPos)
  }, [city])

  return pos
}
