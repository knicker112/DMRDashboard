import { useEffect, useState } from 'react'
import type { TalkgroupEntry } from '../types'

async function fetchTgName(tgId: number): Promise<string> {
  try {
    const r = await fetch(`https://api.brandmeister.network/v2/talkgroup/${tgId}`)
    if (!r.ok) return String(tgId)
    const data = await r.json()
    return data?.Name ?? String(tgId)
  } catch {
    return String(tgId)
  }
}

export function useSubscribedTGs(hotspotId: string) {
  const [talkgroups, setTalkgroups] = useState<TalkgroupEntry[]>([])

  useEffect(() => {
    fetch(`https://api.brandmeister.network/v2/device/${hotspotId}/talkgroup/`)
      .then(r => r.json())
      .then(async (data: unknown[]) => {
        if (!Array.isArray(data)) return
        const entries: TalkgroupEntry[] = data.map((t: any) => ({
          talkgroup: Number(t.talkgroup),
          callsign: String(t.talkgroup),
          type: Number(t.type ?? 0),
          slot: Number(t.slot),
        }))
        setTalkgroups(entries)

        const named = await Promise.all(
          entries.map(async e => ({ ...e, callsign: await fetchTgName(e.talkgroup) }))
        )
        setTalkgroups(named)
      })
      .catch(() => {})
  }, [hotspotId])

  return talkgroups
}
