import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SlotCard } from '../components/SlotCard'
import type { SlotState } from '../types'
import { defaultAudioRx, defaultAudioTx } from '../utils/audio'

const audioProps = { audioRx: defaultAudioRx, audioTx: defaultAudioTx }

const idleSlot: SlotState = {
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

const activeSlot: SlotState = {
  active: true,
  direction: 'rx',
  callType: 'group',
  dmrId: 2641234,
  callsign: 'DL1XYZ',
  name: 'Max Mustermann',
  location: 'München, Germany',
  talkgroup: 262,
  talkgroupName: 'Germany',
  destName: null,
  destRidCity: null,
  startedAt: new Date('2026-05-01T12:00:00'),
}

describe('SlotCard', () => {
  it('zeigt BEREIT wenn Slot inaktiv ist', () => {
    render(<SlotCard slot={1} state={idleSlot} {...audioProps} />)
    expect(screen.getByText('BEREIT')).toBeInTheDocument()
  })

  it('zeigt Rufzeichen wenn Slot aktiv ist', () => {
    render(<SlotCard slot={1} state={activeSlot} {...audioProps} />)
    expect(screen.getByText('DL1XYZ')).toBeInTheDocument()
  })

  it('zeigt Talkgroup an', () => {
    render(<SlotCard slot={1} state={activeSlot} {...audioProps} />)
    expect(screen.getByText(/TG 262/)).toBeInTheDocument()
  })

  it('zeigt Name wenn vorhanden', () => {
    render(<SlotCard slot={1} state={activeSlot} {...audioProps} />)
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
  })

  it('zeigt Slot-Nummer in der Überschrift', () => {
    render(<SlotCard slot={2} state={idleSlot} {...audioProps} />)
    expect(screen.getByText(/SLOT 2/)).toBeInTheDocument()
  })
})
