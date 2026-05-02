import { useEffect, useReducer } from 'react'
import { io, Socket } from 'socket.io-client'
import type { BrandmeisterEvent, DashboardState, SlotState, HistoryEntry } from '../types'

const HISTORY_MAX = 20
const BM_URL = 'https://api.brandmeister.network'
const BM_PATH = '/lh'

const emptySlot: SlotState = {
  active: false,
  dmrId: null,
  callsign: null,
  name: null,
  location: null,
  talkgroup: null,
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
  | { type: 'CALL_START'; slot: 1 | 2; event: BrandmeisterEvent }
  | { type: 'CALL_END'; slot: 1 | 2; event: BrandmeisterEvent }
  | { type: 'SET_USER'; slot: 1 | 2; name: string; location: string }

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: true }

    case 'DISCONNECTED':
      return { ...state, connected: false, slot1: { ...emptySlot }, slot2: { ...emptySlot } }

    case 'CALL_START': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      return {
        ...state,
        [slotKey]: {
          active: true,
          dmrId: action.event.SourceID,
          callsign: action.event.SourceCall || null,
          name: action.event.SourceName || null,
          location: null,
          talkgroup: action.event.DestinationID,
          startedAt: new Date(action.event.Start * 1000),
        } satisfies SlotState,
      }
    }

    case 'CALL_END': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      const currentSlot = state[slotKey]

      const callsign = currentSlot.callsign ?? action.event.SourceCall
      if (!callsign) return state

      const entry: HistoryEntry = {
        id: `${action.event.SourceID}-${action.event.Stop || action.event.Start}`,
        callsign,
        name: currentSlot.name ?? (action.event.SourceName || null),
        location: currentSlot.location,
        talkgroup: action.event.DestinationID,
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
      return {
        ...state,
        [slotKey]: { ...state[slotKey], name: action.name, location: action.location },
      }
    }

    default:
      return state
  }
}

export function useBrandmeister(hotspotId: string) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const socket: Socket = io(BM_URL, {
      path: BM_PATH,
      transports: ['websocket'],
    })

    socket.on('connect', () => dispatch({ type: 'CONNECTED' }))
    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }))
    socket.on('connect_error', () => dispatch({ type: 'DISCONNECTED' }))

    socket.on('mqtt', (data: { topic: string; payload: string }) => {
      if (data.topic !== 'LH') return

      let bm: BrandmeisterEvent
      try {
        bm = JSON.parse(data.payload) as BrandmeisterEvent
      } catch {
        return
      }

      // Nur Events für unseren Hotspot verarbeiten
      if (bm.ContextID !== Number(hotspotId)) return

      const slot: 1 | 2 = bm.Slot === 0 ? 1 : 2

      if (bm.Event === 'Session-Start') {
        dispatch({ type: 'CALL_START', slot, event: bm })
      } else if (bm.Event === 'Session-Stop') {
        dispatch({ type: 'CALL_END', slot, event: bm })
      }
    })

    return () => { socket.disconnect() }
  }, [hotspotId])

  return { state, dispatch }
}
