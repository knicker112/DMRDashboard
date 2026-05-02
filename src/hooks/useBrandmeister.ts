import { useEffect, useReducer } from 'react'
import type { BrandmeisterEvent, DashboardState, SlotState, HistoryEntry } from '../types'

const HISTORY_MAX = 20
const BM_WS_URL = 'wss://api.brandmeister.network/lh'

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
          dmrId: action.event.RadioID,
          callsign: action.event.Callsign,
          name: null,
          location: action.event.City && action.event.Country
            ? `${action.event.City}, ${action.event.Country}`
            : action.event.Country || null,
          talkgroup: action.event.TargetID,
          startedAt: new Date(action.event.Start * 1000),
        } satisfies SlotState,
      }
    }

    case 'CALL_END': {
      const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
      const currentSlot = state[slotKey]
      if (!currentSlot.active || !currentSlot.callsign) return state

      const entry: HistoryEntry = {
        id: `${action.event.RadioID}-${action.event.Stop}`,
        callsign: currentSlot.callsign,
        name: currentSlot.name,
        location: currentSlot.location,
        talkgroup: action.event.TargetID,
        slot: action.slot,
        startedAt: currentSlot.startedAt ?? new Date(action.event.Start * 1000),
        endedAt: new Date(action.event.Stop * 1000),
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
    const ws = new WebSocket(`${BM_WS_URL}?id=${hotspotId}`)

    ws.onopen = () => dispatch({ type: 'CONNECTED' })
    ws.onclose = () => dispatch({ type: 'DISCONNECTED' })
    ws.onerror = () => dispatch({ type: 'DISCONNECTED' })

    ws.onmessage = (event: MessageEvent<string>) => {
      let bm: BrandmeisterEvent
      try {
        bm = JSON.parse(event.data) as BrandmeisterEvent
      } catch {
        return
      }

      if (bm.Event !== 'Session') return

      const slot: 1 | 2 = bm.Slot === 0 ? 1 : 2

      if (bm.Stop === 0) {
        dispatch({ type: 'CALL_START', slot, event: bm })
      } else {
        dispatch({ type: 'CALL_END', slot, event: bm })
      }
    }

    return () => ws.close()
  }, [hotspotId])

  return { state, dispatch }
}
