import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRadioId } from '../hooks/useRadioId'

describe('useRadioId', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('gibt null zurück bevor ein Lookup durchgeführt wurde', () => {
    const { result } = renderHook(() => useRadioId())
    expect(result.current.lookup(0)).toBeNull()
  })

  it('ruft RadioID.net ab und cached das Ergebnis', async () => {
    const mockUser = {
      count: 1,
      results: [{
        id: 2641234,
        callsign: 'DL1XYZ',
        fname: 'Max',
        surname: 'Mustermann',
        city: 'München',
        country: 'Germany',
      }],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    } as Response)

    const { result } = renderHook(() => useRadioId())

    await act(async () => {
      await result.current.fetchUser(2641234)
    })

    expect(result.current.lookup(2641234)).toEqual({
      id: 2641234,
      callsign: 'DL1XYZ',
      fname: 'Max',
      surname: 'Mustermann',
      city: 'München',
      country: 'Germany',
    })
  })

  it('liest Cache aus sessionStorage beim initialisieren', async () => {
    const cached = { id: 9999, callsign: 'DO2ABC', fname: 'Anna', surname: 'Test', city: 'Berlin', country: 'Germany' }
    sessionStorage.setItem('radioid_9999', JSON.stringify(cached))

    const { result } = renderHook(() => useRadioId())

    expect(result.current.lookup(9999)).toEqual(cached)
  })

  it('ruft fetch nicht erneut auf wenn ID bereits im Cache ist', async () => {
    const cached = { id: 9999, callsign: 'DO2ABC', fname: 'Anna', surname: 'Test', city: 'Berlin', country: 'Germany' }
    sessionStorage.setItem('radioid_9999', JSON.stringify(cached))
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() => useRadioId())
    await act(async () => {
      await result.current.fetchUser(9999)
    })

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
