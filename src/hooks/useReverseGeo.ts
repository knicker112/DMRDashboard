import { useState, useEffect } from 'react'

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
}

// Cache: gerundete Koordinaten (0.1° ≈ 11 km) → Ortsname
const cache = new Map<string, string | null>()

function key(lat: number, lng: number) {
  return `${Math.round(lat * 10) / 10},${Math.round(lng * 10) / 10}`
}

export function useReverseGeo(lat: number | null, lng: number | null): string | null {
  const [city, setCity] = useState<string | null>(null)

  useEffect(() => {
    if (lat === null || lng === null) { setCity(null); return }

    const k = key(lat, lng)
    if (cache.has(k)) { setCity(cache.get(k) ?? null); return }

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'DMR-Dashboard/1.0' } }
    )
      .then(r => r.json())
      .then((data: { address?: NominatimAddress }) => {
        const a = data.address
        const name = a?.city ?? a?.town ?? a?.village ?? a?.municipality ?? a?.county ?? a?.state ?? a?.country ?? null
        cache.set(k, name)
        setCity(name)
      })
      .catch(() => { cache.set(k, null); setCity(null) })
  }, [lat, lng])

  return city
}
