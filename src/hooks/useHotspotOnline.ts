import { useEffect, useState } from 'react'

export function useHotspotOnline(hotspotId: string): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const r = await fetch(`https://api.brandmeister.network/v2/device/${hotspotId}`)
        if (cancelled) return
        if (!r.ok) { setOnline(false); return }
        const data = await r.json()
        if (typeof data?.status === 'number') {
          setOnline(data.status > 0)
        } else if (data?.last_seen) {
          const lastSeen = new Date(data.last_seen + ' UTC').getTime()
          setOnline(Date.now() - lastSeen < 5 * 60 * 1000)
        }
      } catch { /* API nicht erreichbar */ }
    }

    check()
    const id = setInterval(check, 10_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [hotspotId])

  return online
}
