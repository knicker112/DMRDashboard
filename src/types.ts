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
  Event: 'Session-Start' | 'Session-Stop'
  SessionID: string
  ContextID: number
  SourceID: number
  SourceCall: string
  SourceName: string
  DestinationID: number
  DestinationCall: string
  Slot: number
  Start: number
  Stop: number
  TalkerAlias: string
  LinkTypeName: string
}

export interface RadioIdUser {
  id: number
  callsign: string
  fname: string
  surname: string
  city: string
  country: string
}
