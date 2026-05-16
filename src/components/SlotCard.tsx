import { useState, useEffect, useRef } from 'react'
import type { SlotState } from '../types'
import type { AudioChannelConfig } from '../utils/audio'
import { playAudio } from '../utils/audio'
import { formatDistance } from '../utils/geo'
import { callsignToCountry } from '../utils/callsignCountry'

interface SlotCardProps {
  slot: 1 | 2
  state: SlotState
  distanceKm?: number | null
  distanceApprox?: boolean
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

export function SlotCard({ slot, state, distanceKm, distanceApprox, destCity, destDistanceKm, destName, audioRx, audioTx }: SlotCardProps) {
  const isPrivate = state.callType === 'private'
  const c = colorScheme(state)
  const duration = useElapsed(state.startedAt)
  const directionLabel = state.direction === 'tx' ? 'TX' : state.direction === 'rx' ? 'RX' : null
  const callerCountry = state.callsign ? callsignToCountry(state.callsign) : null
  const destCountry = (isPrivate && state.talkgroupName) ? callsignToCountry(state.talkgroupName) : null

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
          {/* Caller → Destination — Grid: beide Spalten gleich groß und bündig */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-3">

            {/* Linke Spalte: Sender */}
            <div className="flex flex-col leading-tight">
              <span className="text-4xl font-black text-white tracking-wide leading-none flex items-baseline gap-2">
                {callerCountry && <span className="text-3xl">{callerCountry.flag}</span>}
                {state.callsign}
              </span>
              {state.name && (
                <span className="text-base text-slate-200 mt-1">{state.name}</span>
              )}
              {(state.location || callerCountry || distanceKm != null) && (
                <span className="text-sm text-slate-400 mt-0.5">
                  {state.location ?? ''}
                  {state.location && callerCountry ? ' · ' : ''}
                  {callerCountry ? <span className="text-slate-500">{callerCountry.name}</span> : null}
                  {(state.location || callerCountry) && distanceKm != null ? ' · ' : ''}
                  {distanceKm != null ? `${distanceApprox ? '~' : ''}${formatDistance(distanceKm)}` : ''}
                </span>
              )}
            </div>

            {/* Pfeil */}
            <span className="text-3xl text-slate-400 font-light pt-1">→</span>

            {/* Rechte Spalte: Ziel */}
            {isPrivate ? (
              <div className="flex flex-col leading-tight">
                <span className="text-4xl font-black text-sky-300 tracking-wide leading-none flex items-baseline gap-2">
                  {destCountry && <span className="text-3xl">{destCountry.flag}</span>}
                  {state.talkgroupName ?? `DMR ${state.talkgroup}`}
                </span>
                {destName && (
                  <span className="text-base text-slate-200 mt-1">{destName}</span>
                )}
                {(destCity || destCountry || destDistanceKm != null) && (
                  <span className="text-sm text-slate-400 mt-0.5">
                    {destCity ?? ''}
                    {destCity && destCountry ? ' · ' : ''}
                    {destCountry ? <span className="text-slate-500">{destCountry.name}</span> : null}
                    {(destCity || destCountry) && destDistanceKm != null ? ' · ' : ''}
                    {destDistanceKm != null ? formatDistance(destDistanceKm) : ''}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="text-4xl font-black text-amber-300 leading-none">
                  {state.talkgroupName ?? `TG ${state.talkgroup}`}
                </span>
                {state.talkgroupName && state.talkgroup && (
                  <span className="text-sm text-slate-400 mt-1">TG {state.talkgroup}</span>
                )}
              </div>
            )}
          </div>

          {/* Dauer + Entfernung */}
          <div className="flex items-center gap-4 mt-auto">
            {duration && (
              <span className="text-slate-300 text-base font-mono">{duration}</span>
            )}
            {isPrivate && distanceKm != null && (
              <span className="text-cyan-400 text-base font-semibold">
                📡 {distanceApprox ? '~' : ''}{formatDistance(distanceKm)}
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
