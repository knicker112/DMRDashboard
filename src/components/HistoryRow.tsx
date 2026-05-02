import type { HistoryEntry } from '../types'

interface HistoryRowProps {
  entry: HistoryEntry
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function HistoryRow({ entry }: HistoryRowProps) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-800 last:border-0 text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-slate-400 font-medium shrink-0 text-xs">
          TS{entry.slot}
        </span>
        <span className="text-slate-200 font-bold shrink-0">{entry.callsign}</span>
        {entry.name && (
          <span className="text-slate-400 truncate hidden sm:block">{entry.name}</span>
        )}
        <span className="text-amber-400 shrink-0">TG {entry.talkgroup}</span>
        {entry.location && (
          <span className="text-slate-500 truncate hidden md:block">{entry.location}</span>
        )}
      </div>
      <span className="text-slate-600 text-xs shrink-0 ml-2">{formatTime(entry.endedAt)}</span>
    </div>
  )
}
