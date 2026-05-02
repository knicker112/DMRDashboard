import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SlotCard } from '../components/SlotCard'
import type { SlotState } from '../types'

const idleSlot: SlotState = {
  active: false,
  dmrId: null,
  callsign: null,
  name: null,
  location: null,
  talkgroup: null,
  startedAt: null,
}

const activeSlot: SlotState = {
  active: true,
  dmrId: 2641234,
  callsign: 'DL1XYZ',
  name: 'Max Mustermann',
  location: 'München, Germany',
  talkgroup: 262,
  startedAt: new Date('2026-05-01T12:00:00'),
}

describe('SlotCard', () => {
  it('zeigt "leer" wenn Slot inaktiv ist', () => {
    render(<SlotCard slot={1} state={idleSlot} />)
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
  })

  it('zeigt Rufzeichen wenn Slot aktiv ist', () => {
    render(<SlotCard slot={1} state={activeSlot} />)
    expect(screen.getByText('DL1XYZ')).toBeInTheDocument()
  })

  it('zeigt Talkgroup an', () => {
    render(<SlotCard slot={1} state={activeSlot} />)
    expect(screen.getByText(/TG 262/)).toBeInTheDocument()
  })

  it('zeigt Name wenn vorhanden', () => {
    render(<SlotCard slot={1} state={activeSlot} />)
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
  })

  it('zeigt Slot-Nummer in der Überschrift', () => {
    render(<SlotCard slot={2} state={idleSlot} />)
    expect(screen.getByText(/SLOT 2/)).toBeInTheDocument()
  })
})
