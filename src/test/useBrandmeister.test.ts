import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBrandmeister } from '../hooks/useBrandmeister'
import type { BrandmeisterEvent } from '../types'

// Socket.IO Mock
type SocketHandler = (...args: unknown[]) => void

class MockSocket {
  static instance: MockSocket
  private handlers: Record<string, SocketHandler[]> = {}

  constructor() {
    MockSocket.instance = this
  }

  on(event: string, handler: SocketHandler) {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event].push(handler)
    return this
  }

  disconnect() {}

  emit(event: string, ...args: unknown[]) {
    this.handlers[event]?.forEach(h => h(...args))
  }

  // Hilfsmethoden für Tests
  simulateConnect() { this.emit('connect') }
  simulateDisconnect() { this.emit('disconnect') }
  simulateBmEvent(event: BrandmeisterEvent) {
    this.emit('mqtt', { topic: 'LH', payload: JSON.stringify(event) })
  }
}

vi.mock('socket.io-client', () => ({
  io: () => new MockSocket(),
}))

const HOTSPOT_ID = '264474201'

const baseEvent: BrandmeisterEvent = {
  Event: 'Session-Start',
  SessionID: 'test-session-1',
  ContextID: 264474201,
  SourceID: 2641234,
  SourceCall: 'DL1XYZ',
  SourceName: 'Max Mustermann',
  DestinationID: 262,
  DestinationCall: 'Germany',
  Slot: 0,
  Start: 1714000000,
  Stop: 0,
  TalkerAlias: '',
  LinkTypeName: 'Hotspot',
}

describe('useBrandmeister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('startet mit leerem State', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    expect(result.current.state.slot1.active).toBe(false)
    expect(result.current.state.slot2.active).toBe(false)
    expect(result.current.state.history).toHaveLength(0)
    expect(result.current.state.connected).toBe(false)
  })

  it('setzt connected auf true bei connect-Event', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    act(() => MockSocket.instance.simulateConnect())
    expect(result.current.state.connected).toBe(true)
  })

  it('aktiviert Slot 1 (Slot 0) bei Session-Start', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    act(() => MockSocket.instance.simulateConnect())
    act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, Slot: 0 }))
    expect(result.current.state.slot1.active).toBe(true)
    expect(result.current.state.slot1.callsign).toBe('DL1XYZ')
    expect(result.current.state.slot1.talkgroup).toBe(262)
  })

  it('aktiviert Slot 2 (Slot 1) bei Session-Start', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    act(() => MockSocket.instance.simulateConnect())
    act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, Slot: 1, SourceCall: 'DO2ABC' }))
    expect(result.current.state.slot2.active).toBe(true)
    expect(result.current.state.slot2.callsign).toBe('DO2ABC')
  })

  it('ignoriert Events anderer Hotspots (anderer ContextID)', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    act(() => MockSocket.instance.simulateConnect())
    act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, ContextID: 9999999 }))
    expect(result.current.state.slot1.active).toBe(false)
  })

  it('deaktiviert Slot und fügt History-Eintrag hinzu bei Session-Stop', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    act(() => MockSocket.instance.simulateConnect())
    act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, Event: 'Session-Start', Slot: 0 }))
    act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, Event: 'Session-Stop', Slot: 0, Stop: 1714000060 }))
    expect(result.current.state.slot1.active).toBe(false)
    expect(result.current.state.history).toHaveLength(1)
    expect(result.current.state.history[0].callsign).toBe('DL1XYZ')
    expect(result.current.state.history[0].slot).toBe(1)
  })

  it('begrenzt History auf 20 Einträge', () => {
    const { result } = renderHook(() => useBrandmeister(HOTSPOT_ID))
    act(() => MockSocket.instance.simulateConnect())
    for (let i = 0; i < 25; i++) {
      act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, Event: 'Session-Start', SourceID: 2640000 + i }))
      act(() => MockSocket.instance.simulateBmEvent({ ...baseEvent, Event: 'Session-Stop', SourceID: 2640000 + i, Stop: 1714000060 }))
    }
    expect(result.current.state.history.length).toBeLessThanOrEqual(20)
  })
})
