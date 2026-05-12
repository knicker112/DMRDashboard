const CACHE_PREFIX = 'tgname_'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

const memCache = new Map<number, string>()
const inflight = new Map<number, Promise<string | null>>()
let localDbLoaded = false

async function loadLocalDb() {
  if (localDbLoaded) return
  localDbLoaded = true
  try {
    const r = await fetch('./talkgroups.json')
    if (!r.ok) return
    const data: Record<string, string> = await r.json()
    let count = 0
    for (const [id, name] of Object.entries(data)) {
      if (name) { memCache.set(Number(id), name); count++ }
    }
    console.log(`[Talkgroups] ${count} TG-Namen aus lokaler DB geladen`)
  } catch {
    console.warn('[Talkgroups] Lokale DB nicht verfügbar, nutze API-Fallback')
  }
  // Manuelle Einträge haben Vorrang — nach der Haupt-DB laden
  try {
    const r = await fetch('./talkgroups-manual.json')
    if (!r.ok) return
    const manual: Record<string, string> = await r.json()
    for (const [id, name] of Object.entries(manual)) {
      if (name) memCache.set(Number(id), name)
    }
  } catch { /* optional, kein Fehler wenn nicht vorhanden */ }
}

loadLocalDb()

function readStorage(tgId: number): string | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${tgId}`)
    if (!raw) return null
    const { name, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > TTL_MS) { localStorage.removeItem(`${CACHE_PREFIX}${tgId}`); return null }
    return name
  } catch { return null }
}

function writeStorage(tgId: number, name: string) {
  try { localStorage.setItem(`${CACHE_PREFIX}${tgId}`, JSON.stringify({ name, savedAt: Date.now() })) } catch {}
}

// localStorage-Cache beim Modulstart einlesen
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  if (key?.startsWith(CACHE_PREFIX)) {
    const name = readStorage(Number(key.slice(CACHE_PREFIX.length)))
    if (name) memCache.set(Number(key.slice(CACHE_PREFIX.length)), name)
  }
}

export async function fetchTgName(tgId: number): Promise<string | null> {
  const cached = memCache.get(tgId)
  if (cached) return cached

  const stored = readStorage(tgId)
  if (stored) { memCache.set(tgId, stored); return stored }

  const running = inflight.get(tgId)
  if (running) return running

  const request = fetch(`https://api.brandmeister.network/v2/talkgroup/${tgId}`)
    .then(r => r.json())
    .then((data: { ID?: number; Name?: string }) => {
      if (data?.Name) {
        memCache.set(tgId, data.Name)
        writeStorage(tgId, data.Name)
        return data.Name
      }
      return null
    })
    .catch(() => null)
    .finally(() => inflight.delete(tgId))

  inflight.set(tgId, request)
  return request
}

export function lookupTgName(tgId: number): string | null {
  return memCache.get(tgId) ?? null
}

// Benutzerdefinierte TG-Namen in den Cache laden (überschreiben API-Daten)
export function applyCustomTgNames(names: Record<string, string>) {
  for (const [id, name] of Object.entries(names)) {
    if (name.trim()) memCache.set(Number(id), name.trim())
  }
}
