import type { SlotState } from '../types'
import { StatusDot } from './StatusDot'

interface SlotCardProps {
  slot: 1 | 2
  state: SlotState
}

function elapsed(start: Date): string {
  const secs = Math.floor((Date.now() - start.getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  return `${mins}m ${secs % 60}s`
}

export function SlotCard({ slot, state }: SlotCardProps) {
  return (
    <div
      className={`
        rounded-lg p-4 border-l-4 transition-all duration-300
        ${state.active
          ? 'bg-slate-800 border-green-500'
          : 'bg-slate-800/50 border-slate-700 opacity-60'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <StatusDot active={state.active} />
        <span className="text-xs text-slate-500 font-medium tracking-widest">
          SLOT {slot}
        </span>
      </div>

      {state.active ? (
        <div className="space-y-1">
          <div className="text-xl font-bold text-slate-100 tracking-wide">
            {state.callsign}
          </div>
          {state.name && (
            <div className="text-slate-400 text-sm">{state.name}</div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="bg-slate-900 text-amber-400 text-xs px-2 py-0.5 rounded font-medium">
              TG {state.talkgroup}
            </span>
            {state.location && (
              <span className="text-slate-500 text-xs">{state.location}</span>
            )}
          </div>
          {state.startedAt && (
            <div className="text-slate-600 text-xs mt-1">
              vor {elapsed(state.startedAt)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-600 text-sm">— leer —</div>
      )}
    </div>
  )
}
