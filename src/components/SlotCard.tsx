import { useState, useEffect, useRef } from 'react'
import type { SlotState } from '../types'
import type { AudioChannelConfig } from '../utils/audio'
import { playAudio } from '../utils/audio'
import { formatDistance } from '../utils/geo'

interface SlotCardProps {
  slot: 1 | 2
  state: SlotState
  distanceKm?: number | null
  destCity?: string | null
  destDistanceKm?: number | null
  destName?: string | null
  audioRx: AudioChannelConfig
  audioTx: AudioChannelConfig
}

function useElapsed(startedAt: Date | null): string {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (!startedAt) { setDisplay(''); return }

    function update() {
      const secs = Math.floor((Date.now() - startedAt!.getTime()) / 1000)
      if (secs < 0) { setDisplay('0s'); return }
      if (secs < 60) setDisplay(`${secs}s`)
      else { const m = Math.floor(secs / 60); setDisplay(`${m}m ${secs % 60}s`) }
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return display
}

function colorScheme(state: SlotState) {
  if (!state.active) return {
    border: 'border-slate-600',
    bg: 'bg-slate-800',
    shadow: '',
    dot: 'bg-slate-500',
    label: 'text-slate-400',
    ping: 'bg-slate-400',
  }
  // TX = gelb (eigener Hotspot sendet)
  if (state.direction === 'tx') return {
    border: 'border-yellow-400',
    bg: 'bg-slate-700',
    shadow: 'shadow-[0_0_40px_rgba(250,204,21,0.4)]',
    dot: 'bg-yellow-400',
    label: 'text-yellow-300',
    ping: 'bg-yellow-400',
  }
  // RX = rot (eingehender Ruf)
  if (state.direction === 'rx') return {
    border: 'border-red-400',
    bg: 'bg-slate-700',
    shadow: 'shadow-[0_0_40px_rgba(248,113,113,0.4)]',
    dot: 'bg-red-400',
    label: 'text-red-300',
    ping: 'bg-red-400',
  }
  // Gruppenruf ohne direction = grün (bidirektional möglich)
  return {
    border: 'border-green-400',
    bg: 'bg-slate-700',
    shadow: 'shadow-[0_0_40px_rgba(74,222,128,0.45)]',
    dot: 'bg-green-400',
    label: 'text-green-300',
    ping: 'bg-green-400',
  }
}

export function SlotCard({ slot, state, distanceKm, destCity, destDistanceKm, destName, audioRx, audioTx }: SlotCardProps) {
  const isPrivate = state.callType === 'private'
  const c = colorScheme(state)
  const duration = useElapsed(state.startedAt)
  const directionLabel = state.direction === 'tx' ? 'TX' : state.direction === 'rx' ? 'RX' : null

  const prevActiveRef = useRef(false)
  useEffect(() => {
    const was = prevActiveRef.current
    prevActiveRef.current = state.active
    if (!was && state.active) {
      if (state.direction === 'rx') playAudio(audioRx)
      if (state.direction === 'tx') playAudio(audioTx)
    }
  }, [state.active, state.direction, audioRx, audioTx])

  return (
    <div className={`relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500 border-2 ${c.bg} ${c.border} ${c.shadow}`}>

      {/* Header: Slot-Label + Indikator + Badges */}
      <div className="flex items-center gap-3">
        {state.active ? (
          <span className="relative flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.ping}`} />
            <span className={`relative inline-flex rounded-full h-4 w-4 ${c.dot}`} />
          </span>
        ) : (
          <span className={`inline-flex rounded-full h-4 w-4 ${c.dot}`} />
        )}
        <span className={`text-sm font-bold tracking-[0.3em] ${c.label}`}>SLOT {slot}</span>

        {state.active && (
          <div className="ml-auto flex items-center gap-2">
            {directionLabel && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                state.direction === 'tx'
                  ? 'bg-yellow-900/70 text-yellow-300 border-yellow-700'
                  : 'bg-red-900/70 text-red-300 border-red-700'
              }`}>
                {directionLabel}
              </span>
            )}
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              isPrivate ? 'bg-sky-900/70 text-sky-300 border-sky-700' : 'bg-green-900/70 text-green-300 border-green-700'
            }`}>
              {isPrivate ? 'PRIVAT' : 'GRUPPE'}
            </span>
          </div>
        )}
      </div>

      {state.active ? (
        <>
          {/* Caller → Destination */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col leading-tight">
              <span className="text-5xl font-black text-white tracking-wide leading-none">
                {state.callsign}
              </span>
              {!isPrivate && (state.location || distanceKm != null) && (
                <span className="text-sm text-slate-400 mt-1">
                  {state.location ?? ''}
                  {state.location && distanceKm != null ? ' · ' : ''}
                  {distanceKm != null ? formatDistance(distanceKm) : ''}
                </span>
              )}
            </div>
            <span className="text-4xl text-slate-400 font-light">→</span>
            {isPrivate ? (
              <div className="flex flex-col leading-tight">
                <span className="text-5xl font-black text-sky-300 tracking-wide leading-none">
                  {state.talkgroupName ?? `DMR ${state.talkgroup}`}
                </span>
                {destName && (
                  <span className="text-lg text-slate-200 mt-0.5">{destName}</span>
                )}
                {(destCity || destDistanceKm != null) && (
                  <span className="text-sm text-slate-400 mt-0.5">
                    {destCity ?? ''}
                    {destCity && destDistanceKm != null ? ' · ' : ''}
                    {destDistanceKm != null ? formatDistance(destDistanceKm) : ''}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="text-3xl font-bold text-amber-300 leading-none">
                  {state.talkgroupName ?? `TG ${state.talkgroup}`}
                </span>
                {state.talkgroupName && (
                  <span className="text-lg text-slate-400 mt-1">TG {state.talkgroup}</span>
                )}
              </div>
            )}
          </div>

          {/* Name + Ort */}
          <div className="flex flex-col gap-1">
            {state.name && <div className="text-xl text-slate-100 font-medium">{state.name}</div>}
            {isPrivate && state.location && <div className="text-lg text-slate-300">{state.location}</div>}
          </div>

          {/* Dauer + Entfernung */}
          <div className="flex items-center gap-4 mt-auto">
            {duration && (
              <span className="text-slate-300 text-base font-mono">{duration}</span>
            )}
            {isPrivate && distanceKm != null && (
              <span className="text-cyan-400 text-base font-semibold">
                📡 {formatDistance(distanceKm)}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
            </span>
            <span className="text-slate-500 text-sm font-bold tracking-widest">BEREIT</span>
          </div>
          <div className="text-slate-600 text-sm">Wartet auf Aktivität…</div>
        </div>
      )}
    </div>
  )
}
