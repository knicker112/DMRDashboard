import { useCallback, useRef, useEffect } from 'react'
import type { RadioIdUser } from '../types'

interface LocalEntry { c: string; n: string; l: string }

const CACHE_PREFIX = 'radioid_'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

// Globaler In-Memory-Cache — geteilt zwischen allen Hook-Instanzen
const memCache = new Map<number, RadioIdUser>()
let localDbLoaded = false

async function loadLocalDb() {
  if (localDbLoaded) return
  localDbLoaded = true
  try {
    const r = await fetch('./radioid.json')
    if (!r.ok) return
    const data: Record<string, LocalEntry> = await r.json()
    for (const [id, e] of Object.entries(data)) {
      memCache.set(Number(id), {
        id: Number(id),
        callsign: e.c,
        fname: e.n,
        surname: '',
        city: e.l,
        country: '',
      })
    }
    console.log(`[RadioID] ${memCache.size} Einträge aus lokaler DB geladen`)
  } catch (err) {
    console.warn('[RadioID] Lokale DB nicht verfügbar, nutze API-Fallback', err)
  }
}

// Sofort laden
loadLocalDb()

function readStorage(dmrId: number): RadioIdUser | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${dmrId}`)
    if (!raw) return null
    const entry: { user: RadioIdUser; savedAt: number } = JSON.parse(raw)
    if (Date.now() - entry.savedAt > TTL_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${dmrId}`)
      return null
    }
    return entry.user
  } catch { return null }
}

function writeStorage(user: RadioIdUser): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${user.id}`, JSON.stringify({ user, savedAt: Date.now() }))
  } catch {}
}

const inflight = new Map<number, Promise<RadioIdUser | null>>()

export function useRadioId() {
  const ref = useRef(memCache)

  // Sicherstellen dass lokale DB geladen ist
  useEffect(() => { loadLocalDb() }, [])

  const lookup = useCallback((dmrId: number): RadioIdUser | null => {
    return ref.current.get(dmrId) ?? null
  }, [])

  const fetchUser = useCallback(async (dmrId: number): Promise<RadioIdUser | null> => {
    // 1. In-Memory-Cache (inkl. lokaler DB)
    const cached = ref.current.get(dmrId)
    if (cached) return cached

    // 2. localStorage (vorherige API-Ergebnisse)
    const stored = readStorage(dmrId)
    if (stored) { memCache.set(dmrId, stored); return stored }

    // 3. RadioID.net API als Fallback (für IDs außerhalb D/A/CH)
    const running = inflight.get(dmrId)
    if (running) return running

    const request = fetch(`https://www.radioid.net/api/dmr/user/?id=${dmrId}`)
      .then(r => r.json())
      .then((data: { count: number; results: RadioIdUser[] }) => {
        if (data.count > 0 && data.results[0]) {
          const user = data.results[0]
          memCache.set(dmrId, user)
          writeStorage(user)
          return user
        }
        return null
      })
      .catch(() => null)
      .finally(() => inflight.delete(dmrId))

    inflight.set(dmrId, request)
    return request
  }, [])

  return { lookup, fetchUser }
}
