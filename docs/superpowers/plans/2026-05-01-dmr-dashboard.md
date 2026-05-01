# DMR Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine Echtzeit-Visualisierung der Aktivität auf einem BrandMeister-DMR-Hotspot als React-App, einbettbar in Home Assistant via iFrame.

**Architecture:** Die App verbindet sich direkt im Browser per WebSocket mit der BrandMeister Last-Heard-API und zeigt beide Zeitschlitze sowie eine History an. Namen und Standorte werden per RadioID.net-API nachgeschlagen und in sessionStorage gecacht.

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind CSS 3, Vitest, @testing-library/react

---

## Dateistruktur

```
dmr-dashboard/
├── src/
│   ├── types.ts                        # Shared TypeScript-Interfaces
│   ├── main.tsx                        # Einstiegspunkt
│   ├── App.tsx                         # Root-Komponente, WS-Aufbau
│   ├── hooks/
│   │   ├── useBrandmeister.ts          # WS-Verbindung + Slot-State + History
│   │   └── useRadioId.ts               # RadioID.net Lookup + Cache
│   └── components/
│       ├── StatusDot.tsx               # Puls-Indikator (aktiv/idle)
│       ├── SlotCard.tsx                # Ein Zeitschlitz
│       └── HistoryRow.tsx              # Eine History-Zeile
├── src/test/
│   ├── useRadioId.test.ts
│   ├── useBrandmeister.test.ts
│   └── SlotCard.test.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

### Task 1: Projekt aufsetzen

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`

- [ ] **Schritt 1: Vite-Projekt initialisieren**

```bash
cd /home/christian/dmr-dashboard
npm create vite@latest . -- --template react-ts
```

Wenn gefragt, ob bestehende Dateien überschrieben werden sollen: nur `index.html`, `src/` überschreiben.

- [ ] **Schritt 2: Abhängigkeiten installieren**

```bash
npm install
npm install -D tailwindcss postcss autoprefixer @tailwindcss/vite
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Schritt 3: Tailwind initialisieren**

```bash
npx tailwindcss init -p
```

- [ ] **Schritt 4: `tailwind.config.js` anpassen**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Schritt 5: `vite.config.ts` schreiben**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Schritt 6: `src/test/setup.ts` anlegen**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Schritt 7: `index.html` schreiben**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DMR Dashboard · 264474201</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Schritt 8: `src/main.tsx` schreiben**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Schritt 9: `src/index.css` schreiben**

```css
@import "tailwindcss";

body {
  font-family: 'JetBrains Mono', monospace;
  background-color: #0f172a;
  color: #f1f5f9;
  margin: 0;
}
```

- [ ] **Schritt 10: Dev-Server starten und prüfen**

```bash
npm run dev
```

Erwartetes Ergebnis: Vite-Startseite lädt unter http://localhost:5173 ohne Fehler.

- [ ] **Schritt 11: Committen**

```bash
git add -A
git commit -m "feat: Vite+React+Tailwind Projektgerüst aufsetzen"
```

---

### Task 2: TypeScript-Interfaces definieren

**Files:**
- Create: `src/types.ts`

- [ ] **Schritt 1: `src/types.ts` schreiben**

```ts
export interface SlotState {
  active: boolean
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
```

- [ ] **Schritt 2: TypeScript-Check ausführen**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Committen**

```bash
git add src/types.ts
git commit -m "feat: TypeScript-Interfaces für Slots, History und BM-Events"
```

---

### Task 3: `useRadioId` Hook

**Files:**
- Create: `src/hooks/useRadioId.ts`
- Create: `src/test/useRadioId.test.ts`

- [ ] **Schritt 1: Test schreiben**

```ts
// src/test/useRadioId.test.ts
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
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
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
    const fetchSpy = vi.spyOn(global, 'fetch')

    const { result } = renderHook(() => useRadioId())
    await act(async () => {
      await result.current.fetchUser(9999)
    })

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Schritt 2: Test ausführen und sicherstellen, dass er fehlschlägt**

```bash
npx vitest run src/test/useRadioId.test.ts
```

Erwartetes Ergebnis: FAIL – Modul nicht gefunden.

- [ ] **Schritt 3: `src/hooks/useRadioId.ts` implementieren**

```ts
import { useCallback, useRef } from 'react'
import type { RadioIdUser } from '../types'

const CACHE_PREFIX = 'radioid_'

function readCache(dmrId: number): RadioIdUser | null {
  const raw = sessionStorage.getItem(`${CACHE_PREFIX}${dmrId}`)
  return raw ? (JSON.parse(raw) as RadioIdUser) : null
}

function writeCache(user: RadioIdUser): void {
  sessionStorage.setItem(`${CACHE_PREFIX}${user.id}`, JSON.stringify(user))
}

export function useRadioId() {
  const memCache = useRef<Map<number, RadioIdUser>>(new Map())

  // Beim ersten Aufruf sessionStorage in memCache laden
  if (memCache.current.size === 0) {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        const user = readCache(Number(key.slice(CACHE_PREFIX.length)))
        if (user) memCache.current.set(user.id, user)
      }
    }
  }

  const lookup = useCallback((dmrId: number): RadioIdUser | null => {
    return memCache.current.get(dmrId) ?? null
  }, [])

  const fetchUser = useCallback(async (dmrId: number): Promise<void> => {
    if (memCache.current.has(dmrId)) return

    try {
      const res = await fetch(`https://www.radioid.net/api/dmr/user/?id=${dmrId}`)
      if (!res.ok) return
      const data = await res.json() as { count: number; results: RadioIdUser[] }
      if (data.count > 0 && data.results[0]) {
        const user = data.results[0]
        memCache.current.set(dmrId, user)
        writeCache(user)
      }
    } catch {
      // Netzwerkfehler ignorieren — fehlende Namen sind kein Fehler
    }
  }, [])

  return { lookup, fetchUser }
}
```

- [ ] **Schritt 4: Tests ausführen**

```bash
npx vitest run src/test/useRadioId.test.ts
```

Erwartetes Ergebnis: 4 Tests bestanden.

- [ ] **Schritt 5: Committen**

```bash
git add src/hooks/useRadioId.ts src/test/useRadioId.test.ts
git commit -m "feat: useRadioId Hook mit RadioID.net-Lookup und sessionStorage-Cache"
```

---

### Task 4: `useBrandmeister` Hook

**Files:**
- Create: `src/hooks/useBrandmeister.ts`
- Create: `src/test/useBrandmeister.test.ts`

- [ ] **Schritt 1: Test schreiben**

```ts
// src/test/useBrandmeister.test.ts
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
```

- [ ] **Schritt 2: Test ausführen – sicherstellen, dass er fehlschlägt**

```bash
npx vitest run src/test/useBrandmeister.test.ts
```

Erwartetes Ergebnis: FAIL – Modul nicht gefunden.

- [ ] **Schritt 3: `src/hooks/useBrandmeister.ts` implementieren**

```ts
import { useEffect, useReducer } from 'react'
import type { BrandmeisterEvent, DashboardState, SlotState, HistoryEntry } from '../types'

const HISTORY_MAX = 20
const BM_WS_URL = 'wss://api.brandmeister.network/lh'

const emptySlot: SlotState = {
  active: false,
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
```

- [ ] **Schritt 4: Tests ausführen**

```bash
npx vitest run src/test/useBrandmeister.test.ts
```

Erwartetes Ergebnis: 6 Tests bestanden.

- [ ] **Schritt 5: Committen**

```bash
git add src/hooks/useBrandmeister.ts src/test/useBrandmeister.test.ts
git commit -m "feat: useBrandmeister Hook mit WS-Verbindung, Slot-State und History"
```

---

### Task 5: `StatusDot` Komponente

**Files:**
- Create: `src/components/StatusDot.tsx`

- [ ] **Schritt 1: `src/components/StatusDot.tsx` schreiben**

```tsx
interface StatusDotProps {
  active: boolean
}

export function StatusDot({ active }: StatusDotProps) {
  if (active) {
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
    )
  }
  return <span className="inline-flex rounded-full h-3 w-3 bg-slate-600" />
}
```

- [ ] **Schritt 2: Dev-Server prüfen – keine TypeScript-Fehler**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Committen**

```bash
git add src/components/StatusDot.tsx
git commit -m "feat: StatusDot Puls-Indikator Komponente"
```

---

### Task 6: `HistoryRow` Komponente

**Files:**
- Create: `src/components/HistoryRow.tsx`

- [ ] **Schritt 1: `src/components/HistoryRow.tsx` schreiben**

```tsx
import type { HistoryEntry } from '../types'

interface HistoryRowProps {
  entry: HistoryEntry
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function HistoryRow({ entry }: HistoryRowProps) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-800 last:border-0 text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-slate-400 font-medium shrink-0 text-xs">
          TS{entry.slot}
        </span>
        <span className="text-slate-200 font-bold shrink-0">{entry.callsign}</span>
        {entry.name && (
          <span className="text-slate-400 truncate hidden sm:block">{entry.name}</span>
        )}
        <span className="text-amber-400 shrink-0">TG {entry.talkgroup}</span>
        {entry.location && (
          <span className="text-slate-500 truncate hidden md:block">{entry.location}</span>
        )}
      </div>
      <span className="text-slate-600 text-xs shrink-0 ml-2">{formatTime(entry.endedAt)}</span>
    </div>
  )
}
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Committen**

```bash
git add src/components/HistoryRow.tsx
git commit -m "feat: HistoryRow Komponente für abgeschlossene Calls"
```

---

### Task 7: `SlotCard` Komponente + Test

**Files:**
- Create: `src/components/SlotCard.tsx`
- Create: `src/test/SlotCard.test.tsx`

- [ ] **Schritt 1: Test schreiben**

```tsx
// src/test/SlotCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SlotCard } from '../components/SlotCard'
import type { SlotState } from '../types'

const idleSlot: SlotState = {
  active: false,
  callsign: null,
  name: null,
  location: null,
  talkgroup: null,
  startedAt: null,
}

const activeSlot: SlotState = {
  active: true,
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
```

- [ ] **Schritt 2: Test ausführen – sicherstellen, dass er fehlschlägt**

```bash
npx vitest run src/test/SlotCard.test.tsx
```

Erwartetes Ergebnis: FAIL – Modul nicht gefunden.

- [ ] **Schritt 3: `src/components/SlotCard.tsx` implementieren**

```tsx
import type { SlotState } from '../types'
import { StatusDot } from './StatusDot'

interface SlotCardProps {
  slot: 1 | 2
  state: SlotState
}

function elapsed(start: Date): string {
  const secs = Math.floor((Date.now() - start.getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  return `${mins}m ${secs % 60}s`
}

export function SlotCard({ slot, state }: SlotCardProps) {
  return (
    <div
      className={`
        rounded-lg p-4 border-l-4 transition-all duration-300
        ${state.active
          ? 'bg-slate-800 border-green-500'
          : 'bg-slate-800/50 border-slate-700 opacity-60'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <StatusDot active={state.active} />
        <span className="text-xs text-slate-500 font-medium tracking-widest">
          SLOT {slot}
        </span>
      </div>

      {state.active ? (
        <div className="space-y-1">
          <div className="text-xl font-bold text-slate-100 tracking-wide">
            {state.callsign}
          </div>
          {state.name && (
            <div className="text-slate-400 text-sm">{state.name}</div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="bg-slate-900 text-amber-400 text-xs px-2 py-0.5 rounded font-medium">
              TG {state.talkgroup}
            </span>
            {state.location && (
              <span className="text-slate-500 text-xs">{state.location}</span>
            )}
          </div>
          {state.startedAt && (
            <div className="text-slate-600 text-xs mt-1">
              vor {elapsed(state.startedAt)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-600 text-sm">— leer —</div>
      )}
    </div>
  )
}
```

- [ ] **Schritt 4: Tests ausführen**

```bash
npx vitest run src/test/SlotCard.test.tsx
```

Erwartetes Ergebnis: 5 Tests bestanden.

- [ ] **Schritt 5: Committen**

```bash
git add src/components/SlotCard.tsx src/test/SlotCard.test.tsx
git commit -m "feat: SlotCard Komponente für Zeitschlitz-Anzeige"
```

---

### Task 8: `App.tsx` und RadioID-Integration

**Files:**
- Modify: `src/App.tsx`

- [ ] **Schritt 1: `src/App.tsx` schreiben**

```tsx
import { useEffect } from 'react'
import { useBrandmeister } from './hooks/useBrandmeister'
import { useRadioId } from './hooks/useRadioId'
import { SlotCard } from './components/SlotCard'
import { HistoryRow } from './components/HistoryRow'

const HOTSPOT_ID = '264474201'

export default function App() {
  const { state, dispatch } = useBrandmeister(HOTSPOT_ID)
  const { lookup, fetchUser } = useRadioId()

  // RadioID-Lookup bei neuem aktivem Call triggern
  useEffect(() => {
    async function resolveUser(slot: 1 | 2, dmrId: number | null) {
      if (!dmrId) return
      await fetchUser(dmrId)
      const user = lookup(dmrId)
      if (user) {
        dispatch({
          type: 'SET_USER',
          slot,
          name: `${user.fname} ${user.surname}`.trim(),
          location: user.city && user.country ? `${user.city}, ${user.country}` : user.country,
        })
      }
    }

    if (state.slot1.active && state.slot1.callsign && !state.slot1.name) {
      void resolveUser(1, state.slot1.talkgroup ? null : null)
    }
    if (state.slot2.active && state.slot2.callsign && !state.slot2.name) {
      void resolveUser(2, state.slot2.talkgroup ? null : null)
    }
  }, [state.slot1.active, state.slot1.callsign, state.slot2.active, state.slot2.callsign])

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-mono">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${state.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <h1 className="text-sky-400 text-sm font-bold tracking-widest">
              DMR HOTSPOT · {HOTSPOT_ID}
            </h1>
          </div>
          <span className="text-xs text-slate-600">
            {state.connected ? 'VERBUNDEN' : 'GETRENNT'}
          </span>
        </div>

        {/* Slots */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SlotCard slot={1} state={state.slot1} />
          <SlotCard slot={2} state={state.slot2} />
        </div>

        {/* History */}
        {state.history.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-medium tracking-widest mb-2">
              LETZTE AKTIVITÄT
            </div>
            {state.history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {!state.connected && (
          <div className="text-center text-slate-600 text-xs mt-8">
            Verbinde mit BrandMeister…
          </div>
        )}
      </div>
    </div>
  )
}
```

**Hinweis zu RadioID-Lookup:** Der Lookup benötigt die DMR-ID des Funkers, nicht die TG. BrandMeister sendet die `RadioID` im Event. Der `useBrandmeister`-Hook muss die `RadioID` in `SlotState` speichern. Passe dazu `types.ts` und den Hook an (nächster Schritt).

- [ ] **Schritt 2: `src/types.ts` um `dmrId` in SlotState erweitern**

```ts
export interface SlotState {
  active: boolean
  dmrId: number | null          // ← neu
  callsign: string | null
  name: string | null
  location: string | null
  talkgroup: number | null
  startedAt: Date | null
}
```

- [ ] **Schritt 3: `useBrandmeister.ts` — `dmrId` in CALL_START setzen**

Im `reducer`, `CALL_START`-Case `dmrId: action.event.RadioID` ergänzen:

```ts
case 'CALL_START': {
  const slotKey = action.slot === 1 ? 'slot1' : 'slot2'
  return {
    ...state,
    [slotKey]: {
      active: true,
      dmrId: action.event.RadioID,           // ← neu
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
```

Im `emptySlot` ebenfalls `dmrId: null` ergänzen:

```ts
const emptySlot: SlotState = {
  active: false,
  dmrId: null,
  callsign: null,
  name: null,
  location: null,
  talkgroup: null,
  startedAt: null,
}
```

- [ ] **Schritt 4: `App.tsx` — RadioID-Lookup mit `dmrId` korrigieren**

Den `useEffect` in `App.tsx` auf die echte `dmrId` umstellen:

```tsx
useEffect(() => {
  async function resolveUser(slot: 1 | 2, dmrId: number) {
    await fetchUser(dmrId)
    const user = lookup(dmrId)
    if (user) {
      dispatch({
        type: 'SET_USER',
        slot,
        name: `${user.fname} ${user.surname}`.trim(),
        location: user.city && user.country ? `${user.city}, ${user.country}` : user.country,
      })
    }
  }

  if (state.slot1.active && state.slot1.dmrId && !state.slot1.name) {
    void resolveUser(1, state.slot1.dmrId)
  }
  if (state.slot2.active && state.slot2.dmrId && !state.slot2.name) {
    void resolveUser(2, state.slot2.dmrId)
  }
}, [state.slot1.active, state.slot1.dmrId, state.slot2.active, state.slot2.dmrId])
```

- [ ] **Schritt 5: Alle Tests ausführen**

```bash
npx vitest run
```

Erwartetes Ergebnis: alle Tests bestanden. Bei Fehlern durch `dmrId`-Änderung: `useBrandmeister.test.ts` anpassen und `dmrId` in den Test-Events ergänzen.

- [ ] **Schritt 6: App im Browser prüfen**

```bash
npm run dev
```

Öffne http://localhost:5173 — Dashboard soll mit "Verbinde mit BrandMeister…" starten, dann Slots anzeigen.

- [ ] **Schritt 7: Committen**

```bash
git add src/App.tsx src/types.ts src/hooks/useBrandmeister.ts src/test/useBrandmeister.test.ts
git commit -m "feat: App-Komponente mit RadioID-Lookup und vollständigem Dashboard"
```

---

### Task 9: Build und HA-Deployment vorbereiten

**Files:**
- Create: `deploy-ha.sh`
- Create: `.gitignore`

- [ ] **Schritt 1: `.gitignore` anlegen**

```
node_modules/
dist/
.superpowers/
```

- [ ] **Schritt 2: Produktions-Build erstellen**

```bash
npm run build
```

Erwartetes Ergebnis: `dist/` Verzeichnis mit `index.html`, `assets/` — keine Fehler, keine TypeScript-Warnungen.

- [ ] **Schritt 3: `deploy-ha.sh` anlegen**

```bash
#!/usr/bin/env bash
# Deploy: npm run build vorher ausführen
set -e

HA_WWW="${HA_WWW_PATH:-/config/www/dmr-dashboard}"

if [ ! -d "dist" ]; then
  echo "dist/ nicht gefunden — erst 'npm run build' ausführen"
  exit 1
fi

echo "Deploye nach $HA_WWW ..."
mkdir -p "$HA_WWW"
cp -r dist/* "$HA_WWW/"
echo "Fertig. HA iFrame-Card URL: /local/dmr-dashboard/index.html"
```

```bash
chmod +x deploy-ha.sh
```

- [ ] **Schritt 4: Alle Tests ein letztes Mal ausführen**

```bash
npx vitest run
```

Erwartetes Ergebnis: alle Tests grün.

- [ ] **Schritt 5: Final-Commit**

```bash
git add .gitignore deploy-ha.sh
git commit -m "feat: Build-Config und HA-Deploy-Skript"
```

---

## HA-Integration (nach Deployment)

```yaml
# Lovelace → Dashboard → Karte hinzufügen → Manuell
type: iframe
url: /local/dmr-dashboard/index.html
aspect_ratio: 70%
```

Deployment-Pfad anpassen falls HA nicht lokal gemountet ist:
```bash
HA_WWW_PATH=/mnt/homeassistant/config/www/dmr-dashboard ./deploy-ha.sh
```
