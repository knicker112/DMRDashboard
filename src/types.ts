export interface SlotState {
  active: boolean
  direction: 'tx' | 'rx' | null  // tx = eigener Hotspot sendet, rx = eingehend
  callType: 'group' | 'private' | null
  dmrId: number | null
  callsign: string | null
  name: string | null
  location: string | null
  talkgroup: number | null
  talkgroupName: string | null
  destName: string | null       // Name der Gegenstelle (bei Privatruf)
  destRidCity: string | null    // Stadt der Gegenstelle aus RadioID
  startedAt: Date | null
}

export interface TalkgroupEntry {
  talkgroup: number
  callsign: string
  type: number  // 1 = statisch, 0 = dynamisch
  slot: number
}

export interface HistoryEntry {
  id: string
  callsign: string
  name: string | null
  location: string | null
  talkgroup: number
  talkgroupName: string | null
  destName: string | null
  destLocation?: string | null   // APRS-Ort des Ziels (per Patch gesetzt)
  destRidCity: string | null     // RadioID-Stadt des Ziels (beim Rufende gesetzt)
  callType: 'group' | 'private'
  direction: 'tx' | 'rx' | null
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
  Event: 'Session-Start' | 'Session-Stop' | 'Session-Update'
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
