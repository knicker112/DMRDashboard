import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBrandmeister } from '../hooks/useBrandmeister'
import type { BrandmeisterEvent } from '../types'

class MockWebSocket {
  static instance: MockWebSocket
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  onopen: (() => void) | null = null
  onerror: ((e: Event) => void) | null = null
  readyState = WebSocket.CONNECTING

  constructor(url: string) {
    this.url = url
    MockWebSocket.instance = this
  }

  close() { this.readyState = WebSocket.CLOSED }

  simulateOpen() {
    this.readyState = WebSocket.OPEN
    this.onopen?.()
  }

  simulateMessage(data: BrandmeisterEvent) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }
}

vi.stubGlobal('WebSocket', MockWebSocket)

const baseEvent: BrandmeisterEvent = {
  Event: 'Session',
  Stop: 0,
  RadioID: 2641234,
  Callsign: 'DL1XYZ',
  TargetID: 262,
  TargetName: 'Germany',
  Slot: 0,
  City: 'München',
  Country: 'Germany',
  Start: 1714000000,
}

describe('useBrandmeister', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('startet mit leerem State', () => {
    const { result } = renderHook(() => useBrandmeister('264474201'))
    expect(result.current.state.slot1.active).toBe(false)
    expect(result.current.state.slot2.active).toBe(false)
    expect(result.current.state.history).toHaveLength(0)
    expect(result.current.state.connected).toBe(false)
  })

  it('setzt connected auf true wenn WS geöffnet wird', () => {
    const { result } = renderHook(() => useBrandmeister('264474201'))
    act(() => MockWebSocket.instance.simulateOpen())
    expect(result.current.state.connected).toBe(true)
  })

  it('aktiviert Slot 1 (Slot 0) bei CALL_START', () => {
    const { result } = renderHook(() => useBrandmeister('264474201'))
    act(() => MockWebSocket.instance.simulateOpen())
    act(() => MockWebSocket.instance.simulateMessage({ ...baseEvent, Slot: 0 }))
    expect(result.current.state.slot1.active).toBe(true)
    expect(result.current.state.slot1.callsign).toBe('DL1XYZ')
    expect(result.current.state.slot1.talkgroup).toBe(262)
  })

  it('aktiviert Slot 2 (Slot 1) bei CALL_START', () => {
    const { result } = renderHook(() => useBrandmeister('264474201'))
    act(() => MockWebSocket.instance.simulateOpen())
    act(() => MockWebSocket.instance.simulateMessage({ ...baseEvent, Slot: 1, Callsign: 'DO2ABC' }))
    expect(result.current.state.slot2.active).toBe(true)
    expect(result.current.state.slot2.callsign).toBe('DO2ABC')
  })

  it('deaktiviert Slot und fügt History-Eintrag hinzu bei CALL_END', () => {
    const { result } = renderHook(() => useBrandmeister('264474201'))
    act(() => MockWebSocket.instance.simulateOpen())
    act(() => MockWebSocket.instance.simulateMessage({ ...baseEvent, Slot: 0, Stop: 0 }))
    act(() => MockWebSocket.instance.simulateMessage({ ...baseEvent, Slot: 0, Stop: 1714000060 }))
    expect(result.current.state.slot1.active).toBe(false)
    expect(result.current.state.history).toHaveLength(1)
    expect(result.current.state.history[0].callsign).toBe('DL1XYZ')
    expect(result.current.state.history[0].slot).toBe(1)
  })

  it('begrenzt History auf 20 Einträge', () => {
    const { result } = renderHook(() => useBrandmeister('264474201'))
    act(() => MockWebSocket.instance.simulateOpen())
    for (let i = 0; i < 25; i++) {
      act(() => MockWebSocket.instance.simulateMessage({ ...baseEvent, Stop: 0, RadioID: 2640000 + i }))
      act(() => MockWebSocket.instance.simulateMessage({ ...baseEvent, Stop: 1714000060, RadioID: 2640000 + i }))
    }
    expect(result.current.state.history.length).toBeLessThanOrEqual(20)
  })
})
