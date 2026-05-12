import { useEffect, useReducer, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { BrandmeisterEvent, DashboardState, SlotState, HistoryEntry } from '../types'

const HISTORY_MAX = 20
const BM_URL = 'https://api.brandmeister.network'
const BM_PATH = '/lh'

// Rufzeichen-Muster: 1-3 Buchstaben/Ziffern, Ziffer, 1-4 Buchstaben (z.B. DO2EF, DL1ABC, OE5XYZ)
const CALLSIGN_RE = /^[A-Z0-9]{1,3}\d[A-Z]{1,4}$/i

function detectCallType(destinationId: number, destinationCall: string): 'group' | 'private' {
  // Persönliche DMR-IDs: 7-stellig (DE: 262xxxx); ab 100.000 = kein Standard-TG mehr
  if (destinationId >= 100_000) return 'private'
  // DestinationCall sieht aus wie ein Rufzeichen → Privatruf
  if (destinationCall && CALLSIGN_RE.test(destinationCall.trim())) return 'private'
  return 'group'
}

const emptySlot: SlotState = {
  active: false,
  direction: null,
  callType: null,
  dmrId: null,
  callsign: null,
  name: null,
  location: null,
  talkgroup: null,
  talkgroupName: null,
  destName: null,
  destRidCity: null,
  startedAt: null,
}

const initialState: DashboardState = {
  slot1: { ...emptySlot },
  slot2: { ...emptySlot },
  history: [],
  connected: false,
}

type Action =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'CALL_START'; slot: 1 | 2; event: BrandmeisterEvent; direction: 'tx' | 'rx' }
  | { type: 'CALL_START_LAZY'; slot: 1 | 2; event: BrandmeisterEvent; direction: 'tx' | 'rx' }
  | { type: 'CALL_END'; slot: 1 | 2; event: BrandmeisterEvent }
  | { type: 'SET_USER'; slot: 1 | 2; name: string; location: string; callsign?: string }
  | { type: 'SET_DESTINATION_CALLSIGN'; slot: 1 | 2; callsign: string }
  | { type: 'PATCH_HISTORY'; talkgroup: number; talkgroupName: string }
  | { type: 'PATCH_HISTORY_SOURCE'; talkgroup: number; sourceDmrId: number; callsign: string; name: string; location: string }
  | { type: 'PATCH_HISTORY_DEST_LOCATION'; id: string; destLocation: string }
  | { type: 'SET_DESTINATION_INFO'; slot: 1 | 2; callsign: string; name: string | null; city: string | null }

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: true }

    case 'DISCONNECTED':
      return { ...state, connected: false, slot1: { ...emptySlot }, slot2: { ...emptySlot } }

    case 'CALL_START': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      const callType = detectCallType(action.event.DestinationID, action.event.DestinationCall)
      return {
        ...state,
        [slotKey]: {
          active: true,
          direction: action.direction,
          callType,
          dmrId: action.event.SourceID,
          callsign: action.event.SourceCall || null,
          name: action.event.SourceName || null,
          location: null,
          talkgroup: action.event.DestinationID,
          talkgroupName: action.event.DestinationCall || null,
          destName: null,
          destRidCity: null,
          startedAt: new Date(action.event.Start * 1000),
        } satisfies SlotState,
      }
    }

    case 'CALL_START_LAZY': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      if (state[slotKey].active) return state  // Slot läuft bereits, ignorieren
      const callType = detectCallType(action.event.DestinationID, action.event.DestinationCall)
      return {
        ...state,
        [slotKey]: {
          active: true,
          direction: action.direction,
          callType,
          dmrId: action.event.SourceID,
          callsign: action.event.SourceCall || null,
          name: action.event.SourceName || null,
          location: null,
          talkgroup: action.event.DestinationID,
          talkgroupName: action.event.DestinationCall || null,
          destName: null,
          destRidCity: null,
          startedAt: new Date(action.event.Start * 1000),
        } satisfies SlotState,
      }
    }

    case 'CALL_END': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      const currentSlot = state[slotKey]

      // Slot bereits inaktiv (Duplikat-Stop) → einfach leeren, kein neuer History-Eintrag
      if (!currentSlot.active) return { ...state, [slotKey]: { ...emptySlot } }

      const callsign = currentSlot.callsign ?? action.event.SourceCall

      // Kein Rufzeichen bekannt → Slot leeren, aber keinen unvollständigen History-Eintrag
      if (!callsign) return { ...state, [slotKey]: { ...emptySlot } }

      const entryId = `${action.event.SourceID}-${action.event.Stop || action.event.Start}`

      // Duplikat-Eintrag verhindern (BM sendet mehrere Session-Stop pro Ruf)
      if (state.history.some(e => e.id === entryId)) {
        return { ...state, [slotKey]: { ...emptySlot } }
      }

      const entry: HistoryEntry = {
        id: entryId,
        callsign,
        name: currentSlot.name ?? (action.event.SourceName || null),
        location: currentSlot.location,
        talkgroup: action.event.DestinationID,
        talkgroupName: currentSlot.talkgroupName ?? (action.event.DestinationCall || null),
        destName: currentSlot.destName,
        destRidCity: currentSlot.destRidCity,
        callType: currentSlot.callType ?? 'group',
        direction: currentSlot.direction,
        slot: action.slot,
        startedAt: currentSlot.startedAt ?? new Date(action.event.Start * 1000),
        endedAt: new Date((action.event.Stop || action.event.Start) * 1000),
      }

      return {
        ...state,
        [slotKey]: { ...emptySlot },
        history: [entry, ...state.history].slice(0, HISTORY_MAX),
      }
    }

    case 'SET_USER': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      const patch: Partial<SlotState> = { name: action.name, location: action.location }
      if (action.callsign) patch.callsign = action.callsign
      return {
        ...state,
        [slotKey]: { ...state[slotKey], ...patch },
      }
    }

    case 'SET_DESTINATION_CALLSIGN': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      return {
        ...state,
        [slotKey]: { ...state[slotKey], talkgroupName: action.callsign },
      }
    }

    // Nachträgliche Aktualisierung: Ziel-Rufzeichen in History-Einträgen ergänzen
    case 'PATCH_HISTORY': {
      return {
        ...state,
        history: state.history.map(e =>
          e.talkgroup === action.talkgroup && (!e.talkgroupName || /^\d+$/.test(e.talkgroupName))
            ? { ...e, talkgroupName: action.talkgroupName }
            : e
        ),
      }
    }

    // Nachträgliche Aktualisierung: Quellinformationen in History-Einträgen ergänzen
    case 'PATCH_HISTORY_SOURCE': {
      return {
        ...state,
        history: state.history.map(e =>
          e.talkgroup === action.talkgroup && !e.name
            ? { ...e, callsign: action.callsign, name: action.name, location: action.location }
            : e
        ),
      }
    }

    case 'SET_DESTINATION_INFO': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      return {
        ...state,
        [slotKey]: {
          ...state[slotKey],
          talkgroupName: action.callsign,
          destName: action.name,
          destRidCity: action.city,
        },
      }
    }

    case 'PATCH_HISTORY_DEST_LOCATION': {
      return {
        ...state,
        history: state.history.map(e =>
          e.id === action.id ? { ...e, destLocation: action.destLocation } : e
        ),
      }
    }

    default:
      return state
  }
}

export function useBrandmeister(hotspotId: string, ownCallsign?: string, subscribedTgIds?: Set<number>) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Ref hält immer die aktuellen abonnierten TGs ohne Socket-Reconnect bei Änderung
  const subscribedTgIdsRef = useRef<Set<number>>(new Set())
  subscribedTgIdsRef.current = subscribedTgIds ?? new Set()

  // Eigene DMR-ID — wird aus TX-Events gelernt für Incoming-Erkennung
  const ownDmrIdRef = useRef<number | null>(null)
  // SessionIDs bereits beendeter Rufe — verhindert, dass Session-Update nach Session-Stop den Slot neu aktiviert
  const stoppedSessions = useRef<Set<string>>(new Set())
  // Aus TX-Events gelernte TG-IDs — persistiert in localStorage, deckt dynamische TG-Nutzung ab
  const learnedTgKey = `dmr-learned-tgs-${hotspotId}`
  const learnedTgIds = useRef<Set<number>>(new Set(
    JSON.parse(localStorage.getItem(learnedTgKey) ?? '[]') as number[]
  ))

  useEffect(() => {
    const socket: Socket = io(BM_URL, {
      path: BM_PATH,
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket.emit('subscribe', { topic: 'LH' })
      dispatch({ type: 'CONNECTED' })
    })
    socket.on('disconnect', () => {
      stoppedSessions.current.clear()
      dispatch({ type: 'DISCONNECTED' })
    })
    socket.on('connect_error', () => dispatch({ type: 'DISCONNECTED' }))

    socket.on('mqtt', (data: { topic: string; payload: string }) => {
      if (data.topic !== 'LH') return

      let bm: BrandmeisterEvent
      try {
        bm = JSON.parse(data.payload) as BrandmeisterEvent
      } catch {
        return
      }

      const fromOwnHotspot = bm.ContextID === Number(hotspotId)
      // Abonnierte TGs sind immer Gruppenrufe — unabhängig von der ID-Größe
      const callType = subscribedTgIdsRef.current.has(bm.DestinationID)
        ? 'group'
        : detectCallType(bm.DestinationID, bm.DestinationCall)

      // Eigene DMR-ID und genutzte TGs aus TX-Ereignissen lernen
      if (fromOwnHotspot && bm.Event === 'Session-Start' && bm.SourceID > 0) {
        ownDmrIdRef.current = bm.SourceID
        // TG merken (auch dynamisch genutzte) damit eingehende Rufe erkannt werden
        if (bm.DestinationID > 0 && callType === 'group' && !learnedTgIds.current.has(bm.DestinationID)) {
          learnedTgIds.current.add(bm.DestinationID)
          localStorage.setItem(learnedTgKey, JSON.stringify([...learnedTgIds.current]))
        }
      }

      // Session-Start hat oft leere Callsigns — daher auch DestinationID prüfen
      const isIncomingPrivate = !fromOwnHotspot && callType === 'private' && (
        (!!ownCallsign && !!bm.DestinationCall && bm.DestinationCall.trim().toUpperCase() === ownCallsign.trim().toUpperCase()) ||
        (ownDmrIdRef.current !== null && bm.DestinationID === ownDmrIdRef.current)
      )

      // Gruppenruf als RX wenn TG statisch abonniert ODER aus TX-History bekannt (dynamic TGs)
      const isIncomingGroup = !fromOwnHotspot &&
        callType === 'group' &&
        (subscribedTgIdsRef.current.has(bm.DestinationID) || learnedTgIds.current.has(bm.DestinationID))

      if (!fromOwnHotspot && !isIncomingPrivate && !isIncomingGroup) return

      // BM LH verwendet 1-basierte Slot-Nummerierung (1=TS1, 2=TS2)
      const slot: 1 | 2 = bm.Slot === 1 ? 1 : 2
      const direction: 'tx' | 'rx' = fromOwnHotspot ? 'tx' : 'rx'

      if (bm.Event === 'Session-Start') {
        dispatch({ type: 'CALL_START', slot, event: bm, direction })
      } else if (bm.Event === 'Session-Stop') {
        // BM schickt beim Verbinden Catch-Up-Events für abgeschlossene Sessions — ignorieren
        if (bm.Stop > 0 && Date.now() / 1000 - bm.Stop > 60) return
        stoppedSessions.current.add(bm.SessionID)
        // Set-Größe begrenzen (Speicher)
        if (stoppedSessions.current.size > 200) {
          stoppedSessions.current.delete(stoppedSessions.current.values().next().value!)
        }
        dispatch({ type: 'CALL_END', slot, event: bm })
      } else if (bm.Event === 'Session-Update') {
        // Session-Update ignorieren wenn der Ruf bereits beendet wurde (verhindert Slot-Reaktivierung)
        if (stoppedSessions.current.has(bm.SessionID)) return
        // Fallback: Callsigns erst in Session-Update befüllt → Slot starten falls noch inaktiv
        dispatch({ type: 'CALL_START_LAZY', slot, event: bm, direction })
      }
    })

    return () => { socket.disconnect() }
  }, [hotspotId, ownCallsign])

  return { state, dispatch }
}
