# DMR Dashboard — Design Spec

**Datum:** 2026-05-01  
**Projekt:** Amateurfunk DMR Hotspot Dashboard  
**Hotspot-ID:** 264474201

---

## Ziel

Eine schöne, schlanke Echtzeit-Visualisierung der Aktivität auf einem privaten BrandMeister-DMR-Hotspot. Anzeige von Rufzeichen, Name, Talkgroup und Standort pro Zeitschlitz. Später eingebettet in Home Assistant via iFrame-Card.

---

## Architektur

```
BrandMeister WebSocket
wss://api.brandmeister.network/lh?id=264474201
        │
        ▼
  React App (Vite + TypeScript)
  ├── useBrandmeister — WS-Verbindung, Slot-State, History
  ├── useRadioId      — RadioID.net Lookup + sessionStorage-Cache
  └── Build-Output → /home/christian/dmr-dashboard/dist/
              ▼
     Home Assistant /config/www/dmr-dashboard/
     → http://homeassistant.local:8123/local/dmr-dashboard/
```

**Datensquellen:**
- Live-Aktivität: `wss://api.brandmeister.network/lh?id=264474201`
- Name + Standort: `https://www.radioid.net/api/dmr/user/?id={dmrid}` (CORS-offen)

---

## Layout (Variante A — Kompakt)

```
┌─────────────────────────────────────────────┐
│  ◉ DMR HOTSPOT · 264474201                  │
├────────────────────┬────────────────────────┤
│  SLOT 1            │  SLOT 2                │
│  ● DL1XYZ          │  ○ — leer —            │
│  Max Mustermann    │                        │
│  TG 262 · München  │                        │
│  vor 2s            │                        │
├────────────────────┴────────────────────────┤
│  LETZTE AKTIVITÄT                           │
│  DO2ABC · TG 262 · Hamburg          12:34   │
│  DL5QRS · TG 9   · Berlin           12:31   │
│  OE3WWW · TG 2328 · Wien            12:28   │
└─────────────────────────────────────────────┘
```

- Beide Slots nebeneinander (2-spaltig)
- Aktiver Slot: grüner Puls-Indikator, volle Daten
- Idle-Slot: grauer Indikator, gedimmt
- History: max. 20 Einträge, neueste zuerst

---

## Komponenten

```
src/
├── App.tsx                  # Root, WS-Verbindungsaufbau
├── hooks/
│   ├── useBrandmeister.ts   # WS + Slot-State + History (useReducer)
│   └── useRadioId.ts        # RadioID.net Lookup + sessionStorage-Cache
├── components/
│   ├── SlotCard.tsx         # Slot-Anzeige (aktiv / idle)
│   ├── HistoryRow.tsx       # Eine Zeile in der History
│   └── StatusDot.tsx        # Animierter Puls-Indikator
└── main.tsx
```

---

## State-Modell

```typescript
interface SlotState {
  active: boolean;
  callsign: string | null;
  name: string | null;
  location: string | null;
  talkgroup: number | null;
  talkgroupName: string | null;
  startedAt: Date | null;
}

interface HistoryEntry {
  callsign: string;
  name: string | null;
  location: string | null;
  talkgroup: number;
  slot: 1 | 2;
  startedAt: Date;
  endedAt: Date;
}

interface DashboardState {
  slot1: SlotState;
  slot2: SlotState;
  history: HistoryEntry[];   // max. 20
  connected: boolean;
}
```

**BrandMeister-Events:**
- `CALL_START` → Slot aktivieren, RadioID.net-Lookup triggern
- `CALL_END` → Slot zurücksetzen, Eintrag in History

---

## Styling

- **Framework:** Tailwind CSS
- **Farbschema:** Dark Mode fest (kein Toggle)
  - Hintergrund: `#0f172a` (slate-950)
  - Karten: `#1e293b` (slate-800)
  - Aktiv-Akzent: `#22c55e` (green-500)
  - TG-Farbe: `#fbbf24` (amber-400)
  - Text primär: `#f1f5f9` (slate-100)
  - Text sekundär: `#94a3b8` (slate-400)
- **Schriftart:** JetBrains Mono (Google Fonts)
- **Kein Inline-Hardcoding** — alle Farben als Tailwind-Klassen

---

## HA-Integration

```yaml
# Lovelace config (configuration.yaml oder UI)
type: iframe
url: /local/dmr-dashboard/index.html
aspect_ratio: 60%
```

Deploy:
```bash
npm run build
cp -r dist/* /config/www/dmr-dashboard/
```

---

## Nicht in Scope

- Historische Statistiken / Graphen
- Authentifizierung
- Konfigurationsseite im UI
- TG-Namen-Datenbank (TG-Nummer reicht)
- Push-Benachrichtigungen
