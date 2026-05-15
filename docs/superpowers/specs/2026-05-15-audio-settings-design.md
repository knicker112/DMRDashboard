# Audio-Einstellungen — Design-Spec

**Datum:** 2026-05-15  
**Status:** Genehmigt

---

## Ziel

Nutzer können Töne bei eingehenden (RX) und ausgehenden (TX) Rufen konfigurieren:
- Ton aktivieren / deaktivieren
- Lautstärke einstellen
- Eigene Audiodatei hochladen (oder Standard-Ton nutzen)
- Vorschau abspielen

---

## Architektur

### Datenspeicherung

Audio-Einstellungen werden in `AppConfig` in `useConfig.ts` ergänzt:

```ts
interface AudioChannelConfig {
  enabled: boolean
  volume: number          // 0.0 – 1.0
  customDataUrl?: string  // Base64-Data-URL der eigenen Audiodatei
  customFileName?: string // Dateiname zur Anzeige im UI
}

interface AppConfig {
  // ... bestehende Felder ...
  audioRx: AudioChannelConfig
  audioTx: AudioChannelConfig
}
```

**Standardwerte:**
- `audioRx`: `{ enabled: true, volume: 0.7 }`
- `audioTx`: `{ enabled: false, volume: 0.5 }`

Migration in `migrate()`: fehlende Audio-Felder werden mit Standardwerten aufgefüllt (bestehende Nutzer bekommen automatisch den RX-Ton wie bisher).

### Audio-Wiedergabe

Neuer Hook `useAudio.ts` (oder Utility `playAudio.ts`):

```ts
function playAudio(cfg: AudioChannelConfig, fallbackBeep: () => void) {
  if (!cfg.enabled) return
  if (cfg.customDataUrl) {
    const a = new Audio(cfg.customDataUrl)
    a.volume = cfg.volume
    a.play().catch(() => {})
  } else {
    // bestehende playRxBeep-Logik mit Lautstärke
    fallbackBeep()
  }
}
```

`SlotCard.tsx` erhält die Audio-Config als Props und ruft `playAudio` beim Aktivieren eines Slots auf.

### Datei-Upload

In `SetupScreen.tsx` (Audio-Tab):
- `<input type="file" accept="audio/*">` — versteckt, per Button getriggert
- `FileReader.readAsDataURL()` liest die Datei als Base64
- Wird in `AppConfig.audioRx.customDataUrl` / `audioTx.customDataUrl` gespeichert
- Dateigröße-Warnung wenn > 500 KB (localStorage-Limit beachten)

---

## UI — Audio-Tab im Einstellungs-Screen

### Tab-Navigation

`SetupScreen.tsx` bekommt eine Tab-Leiste:

```
[ Hotspots ]  [ Station ]  [ 🔊 Audio ]  [ TG-Namen ]
```

Aktueller Tab wird per `useState<Tab>` verwaltet. Bestehende Felder bleiben unverändert.

### Audio-Tab-Inhalt

Zwei identisch aufgebaute Abschnitte — **RX** (rot) und **TX** (gelb):

```
┌─ RX — EINGEHENDE RUFE ──────────────────────────────┐
│  Ton aktiviert          [ Toggle an/aus ]            │
│  Lautstärke             [────●─────────] 70%         │
│  Ton-Datei   [Standard-Ton (Piepton)] [📂] [▶]       │
└──────────────────────────────────────────────────────┘

┌─ TX — AUSGEHENDE RUFE ──────────────────────────────┐
│  Ton aktiviert          [ Toggle aus   ]             │
│  Lautstärke  (ausgegraut wenn deaktiviert)           │
│  Ton-Datei   (ausgegraut wenn deaktiviert)           │
└──────────────────────────────────────────────────────┘
```

- Toggle aus → Lautstärke + Datei-Zeile werden ausgegraut (`opacity-40`, `pointer-events-none`)
- `▶`-Button spielt den aktuell konfigurierten Ton sofort ab
- Dateiname wird nach Upload angezeigt; "✕"-Button entfernt die eigene Datei (zurück zu Standard)

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/hooks/useConfig.ts` | `AudioChannelConfig` + `audioRx`/`audioTx` in `AppConfig`; Migration; Standardwerte |
| `src/components/SetupScreen.tsx` | Tab-Navigation + Audio-Tab mit Toggle, Slider, File-Upload, Preview |
| `src/components/SlotCard.tsx` | `playRxBeep` → `playAudio(cfg)`; Props für RX/TX-Config |
| `src/App.tsx` | Audio-Config aus `useConfig` an `SlotCard` weiterreichen |
| `src/utils/audio.ts` | Neue Datei: `playAudio(cfg, type)` Utility |

---

## Nicht in Scope

- Systembenachrichtigungen (Electron Notification API) — separates Feature
- Mehrere Ton-Presets zur Auswahl — kann später ergänzt werden
- Ton beim Rufende — nicht gefordert
