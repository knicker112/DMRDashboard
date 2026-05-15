import { useEffect, useMemo, useRef } from 'react'
import { useBrandmeister } from '../hooks/useBrandmeister'
import { useRadioId } from '../hooks/useRadioId'
import { useCallsigns } from '../hooks/useCallsigns'
import { useSubscribedTGs } from '../hooks/useSubscribedTGs'
import { useHotspotOnline } from '../hooks/useHotspotOnline'
import { useAprs } from '../hooks/useAprs'
import { useReverseGeo } from '../hooks/useReverseGeo'
import { fetchTgName, lookupTgName, applyCustomTgNames } from '../hooks/useTalkgroups'
import { SlotCard } from './SlotCard'
import { SubscribedTGs } from './SubscribedTGs'
import { haversineKm } from '../utils/geo'
import type { HotspotConfig, AppConfig } from '../hooks/useConfig'

const HOTSPOT_COLORS = [
  { panel: 'border-sky-500',    label: 'text-sky-400',    entry: 'border-l-sky-500'    },
  { panel: 'border-violet-500', label: 'text-violet-400', entry: 'border-l-violet-500' },
  { panel: 'border-amber-500',  label: 'text-amber-400',  entry: 'border-l-amber-500'  },
  { panel: 'border-emerald-500',label: 'text-emerald-400',entry: 'border-l-emerald-500'},
] as const

interface Props {
  hotspot: HotspotConfig
  config: AppConfig
  hotspotIndex?: number
  compact?: boolean
  aprsStationsRef?: (stations: { callsign: string; pos: { lat: number; lng: number; lastSeen: Date; comment: string }; slot: 1 | 2 }[]) => void
}

export function HotspotPanel({ hotspot, config, hotspotIndex = 0, compact = false }: Props) {
  const color = HOTSPOT_COLORS[hotspotIndex % HOTSPOT_COLORS.length]
  const subscribedTGs = useSubscribedTGs(hotspot.id)
  const subscribedTgIds = useMemo(() => new Set(subscribedTGs.map(t => t.talkgroup)), [subscribedTGs])
  const hotspotOnline = useHotspotOnline(hotspot.id)

  // Abonnierte TG-Namen direkt in den TG-Cache laden
  useEffect(() => {
    if (subscribedTGs.length === 0) return
    const names: Record<string, string> = {}
    for (const tg of subscribedTGs) {
      if (tg.callsign) names[String(tg.talkgroup)] = tg.callsign
    }
    applyCustomTgNames(names)
  }, [subscribedTGs])
  const { state, dispatch } = useBrandmeister(hotspot.id, config.callsign, subscribedTgIds)
  const { lookup, fetchUser } = useRadioId()
  const { lookup: callsignLookup } = useCallsigns()

  // Rufzeichen aus RadioID-Cache auflösen falls Session-Start es noch leer hat
  const slot1Callsign = state.slot1.callsign ?? (state.slot1.dmrId ? lookup(state.slot1.dmrId)?.callsign ?? null : null)
  const slot2Callsign = state.slot2.callsign ?? (state.slot2.dmrId ? lookup(state.slot2.dmrId)?.callsign ?? null : null)

  const slot1Aprs = useAprs(state.slot1.active ? slot1Callsign : null, config.aprsApiKey)
  const slot2Aprs = useAprs(hotspot.slots === 2 && state.slot2.active ? slot2Callsign : null, config.aprsApiKey)

  const slot1Distance = slot1Aprs ? haversineKm(config.lat, config.lng, slot1Aprs.lat, slot1Aprs.lng) : null
  const slot2Distance = slot2Aprs ? haversineKm(config.lat, config.lng, slot2Aprs.lat, slot2Aprs.lng) : null

  // Aktueller Standort per Reverse-Geocoding aus APRS-Position (Vorrang vor RadioID-Stadt)
  const slot1GeoCity = useReverseGeo(slot1Aprs?.lat ?? null, slot1Aprs?.lng ?? null)
  const slot2GeoCity = useReverseGeo(slot2Aprs?.lat ?? null, slot2Aprs?.lng ?? null)

  // Ziel-APRS: Rufzeichen der Gegenstelle bei TX-Privatrufen (nur echter Callsign, keine reine Zahl)
  const hasRealCallsign = (s: string | null) => !!s && !/^\d+$/.test(s)
  const slot1DestCs = (state.slot1.active && state.slot1.direction === 'tx' && state.slot1.callType === 'private')
    ? (hasRealCallsign(state.slot1.talkgroupName) ? state.slot1.talkgroupName : null) : null
  const slot2DestCs = (state.slot2.active && state.slot2.direction === 'tx' && state.slot2.callType === 'private')
    ? (hasRealCallsign(state.slot2.talkgroupName) ? state.slot2.talkgroupName : null) : null

  const slot1DestAprs = useAprs(slot1DestCs, config.aprsApiKey)
  const slot2DestAprs = useAprs(slot2DestCs, config.aprsApiKey)
  const slot1DestCity = useReverseGeo(slot1DestAprs?.lat ?? null, slot1DestAprs?.lng ?? null)
  const slot2DestCity = useReverseGeo(slot2DestAprs?.lat ?? null, slot2DestAprs?.lng ?? null)
  const slot1DestDistance = slot1DestAprs ? haversineKm(config.lat, config.lng, slot1DestAprs.lat, slot1DestAprs.lng) : null
  const slot2DestDistance = slot2DestAprs ? haversineKm(config.lat, config.lng, slot2DestAprs.lat, slot2DestAprs.lng) : null

  // Letzten bekannten Ziel-Ort per Ref festhalten — slot1DestCity wird null sobald Slot inaktiv
  const slot1DestCityRef = useRef<string | null>(null)
  const slot2DestCityRef = useRef<string | null>(null)
  if (slot1DestCity !== null) slot1DestCityRef.current = slot1DestCity
  if (slot2DestCity !== null) slot2DestCityRef.current = slot2DestCity

  // Wenn Slot deaktiviert wird: destLocation in den History-Eintrag patchen
  useEffect(() => {
    if (!state.slot1.active && slot1DestCityRef.current && state.history.length > 0) {
      const latest = state.history[0]
      if (latest.slot === 1 && latest.callType === 'private' && latest.direction === 'tx' && !latest.destLocation) {
        dispatch({ type: 'PATCH_HISTORY_DEST_LOCATION', id: latest.id, destLocation: slot1DestCityRef.current })
      }
      slot1DestCityRef.current = null
    }
  }, [state.slot1.active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.slot2.active && slot2DestCityRef.current && state.history.length > 0) {
      const latest = state.history[0]
      if (latest.slot === 2 && latest.callType === 'private' && latest.direction === 'tx' && !latest.destLocation) {
        dispatch({ type: 'PATCH_HISTORY_DEST_LOCATION', id: latest.id, destLocation: slot2DestCityRef.current })
      }
      slot2DestCityRef.current = null
    }
  }, [state.slot2.active]) // eslint-disable-line react-hooks/exhaustive-deps

  // Synchroner Cache-Check: Rufzeichen und TG-Namen aus Cache einsetzen ohne auf useEffect zu warten
  function resolveSync(slot: typeof state.slot1, aprsCity: string | null) {
    if (!slot.active) return slot
    // Nur als echter Name gültig wenn nicht null und keine reine Zahl (= nur TG-ID)
    let tgName: string | null = null
    if (slot.talkgroupName && !/^\d+$/.test(slot.talkgroupName)) {
      tgName = slot.talkgroupName
    } else if (slot.talkgroup) {
      // TG-Datenbank zuerst — funktioniert für Gruppen und Dienste wie ECHO
      tgName = lookupTgName(slot.talkgroup) ?? null
      // Kein TG-Name gefunden und Privatruf → RadioID-Rufzeichen (persönliche ID)
      if (!tgName && slot.callType === 'private') tgName = lookup(slot.talkgroup)?.callsign ?? null
      if (!tgName) tgName = slot.talkgroupName
    }
    const cs = slot.callsign
      ?? (slot.dmrId ? lookup(slot.dmrId)?.callsign ?? null : null)
    const name = slot.name
      ?? (slot.dmrId ? lookup(slot.dmrId)?.fname ?? null : null)
    // APRS-Live-Standort hat Vorrang, danach RadioID-Stadt
    const location = aprsCity
      ?? slot.location
      ?? (slot.dmrId ? (lookup(slot.dmrId)?.city || lookup(slot.dmrId)?.country || null) : null)
    return { ...slot, talkgroupName: tgName, callsign: cs, name, location }
  }

  const slot1State = resolveSync(state.slot1, slot1GeoCity)
  const slot2State = resolveSync(state.slot2, slot2GeoCity)

  useEffect(() => {
    async function resolveUser(slot: 1 | 2, callsign: string | null, dmrId: number | null, talkgroup: number | null) {
      if (callsign) {
        const local = callsignLookup(callsign)
        if (local) {
          dispatch({ type: 'SET_USER', slot, name: local.firstName, location: local.city ?? '' })
          dispatch({ type: 'PATCH_HISTORY_SOURCE', talkgroup: talkgroup ?? 0, sourceDmrId: dmrId ?? 0, callsign, name: local.firstName, location: local.city ?? '' })
          return
        }
      }
      if (!dmrId) return
      const user = await fetchUser(dmrId)
      if (user) {
        dispatch({
          type: 'SET_USER',
          slot,
          name: user.fname,
          location: user.city || user.country || '',
          callsign: user.callsign || undefined,
        })
        dispatch({ type: 'PATCH_HISTORY_SOURCE', talkgroup: talkgroup ?? 0, sourceDmrId: dmrId, callsign: user.callsign, name: user.fname, location: user.city || user.country || '' })
      }
    }

    async function resolveDestination(slot: 1 | 2, dmrId: number) {
      const user = await fetchUser(dmrId)
      if (user) {
        dispatch({
          type: 'SET_DESTINATION_INFO',
          slot,
          callsign: user.callsign,
          name: user.fname || null,
          city: user.city || user.country || null,
        })
        dispatch({ type: 'PATCH_HISTORY', talkgroup: dmrId, talkgroupName: user.callsign })
      }
    }

    const s1 = state.slot1
    const s2 = state.slot2

    if (s1.active && (!s1.name || !s1.callsign)) void resolveUser(1, s1.callsign, s1.dmrId, s1.talkgroup)
    if (s2.active && (!s2.name || !s2.callsign)) void resolveUser(2, s2.callsign, s2.dmrId, s2.talkgroup)

    if (s1.active && s1.callType === 'private' && s1.talkgroup && !s1.talkgroupName)
      void resolveDestination(1, s1.talkgroup)
    if (s2.active && s2.callType === 'private' && s2.talkgroup && !s2.talkgroupName)
      void resolveDestination(2, s2.talkgroup)

    // Gruppenruf: TG-Name holen wenn null oder nur Ziffern (= rohe ID, kein echter Name)
    function needsTgName(tgName: string | null) {
      return !tgName || /^\d+$/.test(tgName)
    }
    if (s1.active && s1.callType === 'group' && s1.talkgroup && needsTgName(s1.talkgroupName))
      void fetchTgName(s1.talkgroup).then(name => {
        if (!name) return
        dispatch({ type: 'SET_DESTINATION_CALLSIGN', slot: 1, callsign: name })
        dispatch({ type: 'PATCH_HISTORY', talkgroup: s1.talkgroup!, talkgroupName: name })
      })
    if (s2.active && s2.callType === 'group' && s2.talkgroup && needsTgName(s2.talkgroupName))
      void fetchTgName(s2.talkgroup).then(name => {
        if (!name) return
        dispatch({ type: 'SET_DESTINATION_CALLSIGN', slot: 2, callsign: name })
        dispatch({ type: 'PATCH_HISTORY', talkgroup: s2.talkgroup!, talkgroupName: name })
      })
  }, [
    state.slot1.active, state.slot1.callsign, state.slot1.dmrId, state.slot1.name,
    state.slot1.callType, state.slot1.talkgroup, state.slot1.talkgroupName,
    state.slot2.active, state.slot2.callsign, state.slot2.dmrId, state.slot2.name,
    state.slot2.callType, state.slot2.talkgroup, state.slot2.talkgroupName,
    dispatch, fetchUser, lookup, callsignLookup,
  ])

  return (
    <div className="mb-8">
    <div className={`rounded-2xl border-2 p-5 ${color.panel}`}>
      {/* Hotspot-Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          hotspotOnline === true ? 'bg-green-500' :
          hotspotOnline === false ? 'bg-red-500' :
          'bg-yellow-500 animate-pulse'
        }`} />
        <span className={`text-sm font-bold tracking-widest ${color.label}`}>{hotspot.name.toUpperCase()}</span>
        <span className="text-slate-600 text-xs">· ID {hotspot.id}</span>
        <span className={`ml-auto text-xs font-bold ${
          hotspotOnline === true ? 'text-green-400' :
          hotspotOnline === false ? 'text-red-400' :
          'text-yellow-500'
        }`}>
          {hotspotOnline === true ? 'ONLINE' : hotspotOnline === false ? 'OFFLINE' : 'PRÜFE…'}
        </span>
      </div>

      {/* Slot-Cards oder Offline-Zustand */}
      {hotspotOnline === false ? (
        <div className="flex items-center justify-center py-8 gap-3 text-slate-600">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M3 3l18 18M8.464 8.464A5 5 0 006 12a5 5 0 002.464 3.536M5.636 5.636A9 9 0 003.515 12a9 9 0 002.121 6.364" />
          </svg>
          <span className="text-sm font-bold tracking-widest">OFFLINE</span>
        </div>
      ) : (() => {
        const d1City = slot1DestCity ?? slot1State.destRidCity ?? null
        const d2City = slot2DestCity ?? slot2State.destRidCity ?? null
        return hotspot.slots === 1 ? (
          <SlotCard slot={1} state={slot1State} distanceKm={slot1Distance}
            destCity={d1City} destDistanceKm={slot1DestDistance} destName={slot1State.destName ?? null}
            audioRx={config.audioRx} audioTx={config.audioTx} />
        ) : (
          <div className={compact ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-6'}>
            <SlotCard slot={1} state={slot1State} distanceKm={slot1Distance}
              destCity={d1City} destDistanceKm={slot1DestDistance} destName={slot1State.destName ?? null}
              audioRx={config.audioRx} audioTx={config.audioTx} />
            <SlotCard slot={2} state={slot2State} distanceKm={slot2Distance}
              destCity={d2City} destDistanceKm={slot2DestDistance} destName={slot2State.destName ?? null}
              audioRx={config.audioRx} audioTx={config.audioTx} />
          </div>
        )
      })()}

      <div className="mt-4">
        <SubscribedTGs talkgroups={subscribedTGs} />
      </div>
    </div>

      {/* Verlauf */}
      {state.history.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 mt-4">
          <div className="text-xs text-slate-400 font-bold tracking-widest mb-2">LETZTE AKTIVITÄT</div>
          {state.history.slice(0, compact ? 3 : 5).map(entry => {
            const now = new Date()
            const isToday = entry.startedAt.toDateString() === now.toDateString()
            const h = entry.startedAt.getHours().toString().padStart(2, '0')
            const m = entry.startedAt.getMinutes().toString().padStart(2, '0')
            const timeStr = isToday
              ? `${h}:${m}`
              : `${entry.startedAt.getDate().toString().padStart(2, '0')}.${(entry.startedAt.getMonth() + 1).toString().padStart(2, '0')}. ${h}:${m}`
            const destCity = entry.destLocation ?? entry.destRidCity ?? null
            const destLabel = entry.callType === 'private'
              ? (entry.talkgroupName ?? `DMR ${entry.talkgroup}`)
              : (entry.talkgroupName ?? `TG ${entry.talkgroup}`)
            const durSecs = Math.round((entry.endedAt.getTime() - entry.startedAt.getTime()) / 1000)
            const durStr = durSecs < 60 ? `${durSecs}s` : `${Math.floor(durSecs / 60)}m ${durSecs % 60}s`
            return (
              <div key={entry.id} className={`flex items-center gap-4 py-3 border-b border-slate-800 last:border-0 border-l-4 pl-3 ${color.entry}`}>
                {/* Zeit + Slot + Dauer */}
                <div className="flex flex-col items-end shrink-0 w-16">
                  <span className="text-slate-400 font-mono text-sm">{timeStr}</span>
                  <span className="text-slate-500 text-sm">TS{entry.slot}</span>
                  <span className="text-slate-500 font-mono text-sm">{durStr}</span>
                </div>

                {/* Sender */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white font-bold text-base leading-tight">{entry.callsign}</span>
                  {entry.name && <span className="text-slate-300 text-sm leading-tight truncate">{entry.name}</span>}
                  {entry.location && <span className="text-slate-400 text-sm leading-tight truncate">{entry.location}</span>}
                </div>

                {/* Pfeil */}
                <span className="text-slate-400 shrink-0 text-xl">→</span>

                {/* Empfänger */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`font-bold text-base leading-tight truncate ${entry.callType === 'private' ? 'text-sky-300' : 'text-amber-300'}`}>
                    {destLabel}
                  </span>
                  {entry.destName && <span className="text-slate-300 text-sm leading-tight truncate">{entry.destName}</span>}
                  {destCity && <span className="text-slate-400 text-sm leading-tight truncate">{destCity}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

