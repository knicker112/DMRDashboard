# DMR Dashboard – Installation unter Linux / Raspberry Pi

## Welche Datei ist die richtige?

| System | Datei |
|---|---|
| Linux PC / Linux Mint (64-bit) | `DMR-Dashboard-x.x.x-x64.AppImage` |
| Raspberry Pi 4 / Pi 5 / Zero 2 W (64-bit OS) | `DMR-Dashboard-x.x.x-arm64.AppImage` |
| Raspberry Pi 2 / Pi 3 (32-bit OS) | `DMR-Dashboard-x.x.x-armv7l.AppImage` |

> **Raspberry Pi 3:** Wenn du ein 64-bit Betriebssystem (z.B. Raspberry Pi OS 64-bit) verwendest, nimm die `arm64`-Version. Bei 32-bit OS die `armv7l`-Version.

---

## Erster Start (einmalig)

### Schritt 1 — libfuse2 installieren (nur Linux Mint / Ubuntu)

AppImage-Dateien benötigen `libfuse2`. Auf neueren Systemen muss es einmalig nachinstalliert werden:

```bash
sudo apt install libfuse2
```

> Auf Raspberry Pi OS ist libfuse2 in der Regel bereits vorhanden.

### Schritt 2 — Datei ausführbar machen

```bash
chmod +x DMR-Dashboard-*.AppImage
```

### Schritt 3 — Starten

```bash
./DMR-Dashboard-*.AppImage
```

Oder einfach im Dateimanager **doppelklicken** (wenn AppImages als ausführbar markiert sind).

---

## Updates

Das Programm prüft **beim Start und stündlich** automatisch ob ein Update verfügbar ist. Wenn ja, erscheint ein grüner Banner oben im Fenster. Einfach draufklicken — die App aktualisiert sich selbst.

---

## Probleme?

**App startet nicht:**
```bash
./DMR-Dashboard-*.AppImage --no-sandbox
```

**Weißer Bildschirm:**
```bash
./DMR-Dashboard-*.AppImage --no-sandbox --disable-gpu
```

**Fehler melden:** Einstellungen → Über → Bug/Idee auf GitHub melden
