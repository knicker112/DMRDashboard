import type { HistoryEntry } from '../types'

interface HistoryRowProps {
  entry: HistoryEntry
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function HistoryRow({ entry }: HistoryRowProps) {
  const isPrivate = entry.callType === 'private'

  const destination = isPrivate
    ? (entry.talkgroupName ?? `DMR ${entry.talkgroup}`)
    : (entry.talkgroupName ?? `TG ${entry.talkgroup}`)

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-slate-400 font-bold shrink-0 text-base">
          TS{entry.slot}
        </span>
        <span className="text-white font-bold shrink-0 text-lg tracking-wide">{entry.callsign}</span>
        <span className="text-slate-500 shrink-0">→</span>
        <span className={`shrink-0 text-base font-semibold ${isPrivate ? 'text-sky-300' : 'text-amber-300'}`}>
          {destination}
        </span>
        {entry.name && (
          <span className="text-slate-300 truncate text-base">{entry.name}</span>
        )}
        {entry.location && (
          <span className="text-slate-400 truncate text-base">{entry.location}</span>
        )}
      </div>
      <span className="text-slate-400 text-sm shrink-0 ml-4">{formatTime(entry.endedAt)}</span>
    </div>
  )
}
