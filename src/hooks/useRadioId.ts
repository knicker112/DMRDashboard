import { useCallback, useState } from 'react'
import type { RadioIdUser } from '../types'

const CACHE_PREFIX = 'radioid_'

function readCache(dmrId: number): RadioIdUser | null {
  const raw = sessionStorage.getItem(`${CACHE_PREFIX}${dmrId}`)
  return raw ? (JSON.parse(raw) as RadioIdUser) : null
}

function writeCache(user: RadioIdUser): void {
  sessionStorage.setItem(`${CACHE_PREFIX}${user.id}`, JSON.stringify(user))
}

export function useRadioId() {
  const [memCache] = useState<Map<number, RadioIdUser>>(() => {
    const map = new Map<number, RadioIdUser>()
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        const user = readCache(Number(key.slice(CACHE_PREFIX.length)))
        if (user) map.set(user.id, user)
      }
    }
    return map
  })

  const lookup = useCallback((dmrId: number): RadioIdUser | null => {
    return memCache.get(dmrId) ?? null
  }, [memCache])

  const fetchUser = useCallback(async (dmrId: number): Promise<void> => {
    if (memCache.has(dmrId)) return

    try {
      const res = await fetch(`https://www.radioid.net/api/dmr/user/?id=${dmrId}`)
      if (!res.ok) return
      const data = await res.json() as { count: number; results: RadioIdUser[] }
      if (data.count > 0 && data.results[0]) {
        const user = data.results[0]
        memCache.set(dmrId, user)
        writeCache(user)
      }
    } catch {
      // Netzwerkfehler ignorieren — fehlende Namen sind kein Fehler
    }
  }, [memCache])

  return { lookup, fetchUser }
}
