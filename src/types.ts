export interface SlotState {
  active: boolean
  dmrId: number | null
  callsign: string | null
  name: string | null
  location: string | null
  talkgroup: number | null
  startedAt: Date | null
}

export interface HistoryEntry {
  id: string
  callsign: string
  name: string | null
  location: string | null
  talkgroup: number
  slot: 1 | 2
  startedAt: Date
  endedAt: Date
}

export interface DashboardState {
  slot1: SlotState
  slot2: SlotState
  history: HistoryEntry[]
  connected: boolean
}

export interface BrandmeisterEvent {
  Event: string
  Stop: number
  RadioID: number
  Callsign: string
  TargetID: number
  TargetName: string
  Slot: number
  City: string
  Country: string
  Start: number
  SessionID?: string
}

export interface RadioIdUser {
  id: number
  callsign: string
  fname: string
  surname: string
  city: string
  country: string
}
