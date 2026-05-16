import { useState, useRef } from 'react'
import type { AppConfig, HotspotConfig } from '../hooks/useConfig'
import type { AudioChannelConfig } from '../utils/audio'
import { defaultAudioRx, defaultAudioTx, playAudio, AUDIO_PRESETS } from '../utils/audio'
import { refreshCallsigns } from '../hooks/useCallsigns'
import type { useElectronUpdater } from '../hooks/useElectronUpdater'

interface Props {
  initial?: AppConfig
  onSave: (cfg: AppConfig) => void
  onCancel?: () => void
  electronUpdate?: ReturnType<typeof useElectronUpdater>
}

function emptyHotspot(index: number): HotspotConfig {
  return { id: '', name: `Hotspot ${index + 1}`, slots: 2 }
}

interface TgNameRow { id: string; name: string }

type Tab = 'hotspots' | 'station' | 'audio' | 'tgnames' | 'updates' | 'about'

export function SetupScreen({ initial, onSave, onCancel, electronUpdate }: Props) {
  const [hotspots, setHotspots] = useState<HotspotConfig[]>(
    initial?.hotspots ?? [emptyHotspot(0)]
  )
  const [callsign, setCallsign] = useState(initial?.callsign ?? '')
  const [lat, setLat] = useState(String(initial?.lat ?? ''))
  const [lng, setLng] = useState(String(initial?.lng ?? ''))
  const [aprsApiKey, setAprsApiKey] = useState(initial?.aprsApiKey ?? '')
  const [tgRows, setTgRows] = useState<TgNameRow[]>(
    Object.entries(initial?.customTgNames ?? {}).map(([id, name]) => ({ id, name }))
  )
  const [audioRx, setAudioRx] = useState<AudioChannelConfig>(
    initial?.audioRx ?? { ...defaultAudioRx }
  )
  const [audioTx, setAudioTx] = useState<AudioChannelConfig>(
    initial?.audioTx ?? { ...defaultAudioTx }
  )
  const [activeTab, setActiveTab] = useState<Tab>('hotspots')
  const [error, setError] = useState('')

  const rxFileRef = useRef<HTMLInputElement>(null)
  const txFileRef = useRef<HTMLInputElement>(null)

  type ActionState = 'idle' | 'loading' | 'ok' | 'error'
  const [updateCheckState, setUpdateCheckState] = useState<ActionState>('idle')
  const [callsignRefreshState, setCallsignRefreshState] = useState<ActionState>('idle')

  async function handleCheckForUpdates() {
    setUpdateCheckState('loading')
    try {
      await window.electronUpdater?.checkForUpdates?.()
      setUpdateCheckState('ok')
    } catch {
      setUpdateCheckState('error')
    }
    setTimeout(() => setUpdateCheckState('idle'), 4000)
  }

  async function handleRefreshCallsigns() {
    setCallsignRefreshState('loading')
    const ok = await refreshCallsigns()
    setCallsignRefreshState(ok ? 'ok' : 'error')
    setTimeout(() => setCallsignRefreshState('idle'), 4000)
  }

  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackBody, setFeedbackBody] = useState('')
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null)
  const [feedbackPreview, setFeedbackPreview] = useState<string | null>(null)
  const feedbackFileRef = useRef<HTMLInputElement | null>(null)

  function handleFeedbackFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFeedbackFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => setFeedbackPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFeedbackPreview(null)
    }
    e.target.value = ''
  }

  function handleOpenGitHubIssue() {
    const title = feedbackTitle.trim() || 'Bug/Feedback'
    let body = feedbackBody.trim()
    if (feedbackFile) {
      body += `\n\n---\n*Screenshot: **${feedbackFile.name}** — bitte unten im Issue anhängen (Drag & Drop oder Strg+V)*`
    }
    body += `\n\n---\n*DMR Dashboard v${__APP_VERSION__}*`
    const url = `https://github.com/knicker112/DMRDashboard/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=bug`
    window.open(url, '_blank', 'noopener')
  }

  function addTgRow() { setTgRows(prev => [...prev, { id: '', name: '' }]) }
  function removeTgRow(i: number) { setTgRows(prev => prev.filter((_, idx) => idx !== i)) }
  function updateTgRow(i: number, patch: Partial<TgNameRow>) {
    setTgRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  function updateHotspot(i: number, patch: Partial<HotspotConfig>) {
    setHotspots(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h))
  }

  function addHotspot() {
    setHotspots(prev => [...prev, emptyHotspot(prev.length)])
  }

  function removeHotspot(i: number) {
    setHotspots(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleAudioFile(channel: 'rx' | 'tx', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setError('Audio-Datei zu groß (max. 500 KB).')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (channel === 'rx') setAudioRx(prev => ({ ...prev, customDataUrl: dataUrl, customFileName: file.name }))
      else setAudioTx(prev => ({ ...prev, customDataUrl: dataUrl, customFileName: file.name }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removeAudioFile(channel: 'rx' | 'tx') {
    if (channel === 'rx') setAudioRx(prev => ({ enabled: prev.enabled, volume: prev.volume }))
    else setAudioTx(prev => ({ enabled: prev.enabled, volume: prev.volume }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hotspots.length === 0) { setError('Mindestens ein Hotspot erforderlich.'); return }
    for (const h of hotspots) {
      if (!h.id.trim()) { setError('Alle Hotspot-IDs müssen ausgefüllt sein.'); return }
    }
    if (!callsign.trim()) { setError('Rufzeichen ist erforderlich.'); return }
    const latN = lat.trim() ? parseFloat(lat) : 0
    const lngN = lng.trim() ? parseFloat(lng) : 0
    if ((lat.trim() || lng.trim()) && (isNaN(latN) || isNaN(lngN))) { setError('Koordinaten ungültig.'); return }
    const customTgNames: Record<string, string> = {}
    for (const row of tgRows) {
      const id = row.id.trim()
      const name = row.name.trim()
      if (id && name && /^\d+$/.test(id)) customTgNames[id] = name
    }
    onSave({
      hotspots: hotspots.map((h, i) => ({
        ...h,
        id: h.id.trim(),
        name: h.name.trim() || `Hotspot ${i + 1}`,
      })),
      callsign: callsign.trim().toUpperCase(),
      lat: latN,
      lng: lngN,
      aprsApiKey: aprsApiKey.trim(),
      customTgNames,
      audioRx,
      audioTx,
    })
  }

  const tabs: [Tab, string][] = [
    ['hotspots', 'Hotspots'],
    ['station',  'Station'],
    ['audio',    '🔊 Audio'],
    ['tgnames',  'TG-Namen'],
    ['updates',  '↑ Updates'],
    ['about',    'Über'],
  ]

  const showAll = !initial

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl border border-slate-700 p-8">
        <h1 className="text-sky-400 text-xl font-bold tracking-widest mb-2">DMR DASHBOARD</h1>
        <p className="text-slate-400 text-sm mb-6">
          {initial ? 'Einstellungen bearbeiten' : 'Einrichtung — einmalig konfigurieren'}
        </p>

        {/* Tab-Leiste — nur im Edit-Modus */}
        {!showAll && (
          <div className="flex gap-0 border-b border-slate-700 mb-6 -mx-1">
            {tabs.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold tracking-widest transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'text-sky-400 border-sky-400'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* HOTSPOTS */}
          {(showAll || activeTab === 'hotspots') && (
            <div>
              <div className="text-slate-300 text-xs font-bold tracking-widest mb-3">HOTSPOTS</div>
              <div className="flex flex-col gap-3">
                {hotspots.map((h, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs font-bold">HOTSPOT {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeHotspot(i)}
                        className="text-slate-600 hover:text-red-400 text-sm transition-colors"
                      >
                        ✕ Entfernen
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="BM-ID" hint="9-stellige Hotspot-ID">
                        <input
                          className="input"
                          value={h.id}
                          onChange={e => updateHotspot(i, { id: e.target.value })}
                          placeholder="123456789"
                          inputMode="numeric"
                        />
                      </Field>
                      <Field label="Name" hint="Leer = automatisch">
                        <input
                          className="input"
                          value={h.name}
                          onChange={e => updateHotspot(i, { name: e.target.value })}
                          placeholder={`Hotspot ${i + 1}`}
                        />
                      </Field>
                    </div>

                    <div>
                      <div className="text-slate-500 text-xs mb-1.5">ZEITSCHLITZE</div>
                      <div className="flex gap-2">
                        {([1, 2] as const).map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateHotspot(i, { slots: n })}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                              h.slots === n
                                ? 'bg-sky-700 text-sky-100 border border-sky-500'
                                : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            {n === 1 ? '1 Slot' : '2 Slots'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addHotspot}
                className="mt-3 w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-400 text-sm transition-colors"
              >
                + Hotspot hinzufügen
              </button>
            </div>
          )}

          {/* STATION */}
          {(showAll || activeTab === 'station') && (
            <div>
              <div className="text-slate-300 text-xs font-bold tracking-widest mb-3">EIGENE STATION</div>
              <div className="flex flex-col gap-3">
                <Field label="Rufzeichen" hint="Dein Amateurfunk-Rufzeichen">
                  <input
                    className="input"
                    value={callsign}
                    onChange={e => setCallsign(e.target.value.toUpperCase())}
                    placeholder="DO2EF"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Breitengrad" hint="Optional — für Kartenansicht">
                    <input className="input" value={lat} onChange={e => setLat(e.target.value)} placeholder="51.0268" inputMode="decimal" />
                  </Field>
                  <Field label="Längengrad" hint="Optional — für Kartenansicht">
                    <input className="input" value={lng} onChange={e => setLng(e.target.value)} placeholder="6.1184" inputMode="decimal" />
                  </Field>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">APRS.FI API-KEY</span>
                    <a
                      href="https://aprs.fi/account/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-500 hover:text-sky-300 text-xs transition-colors"
                    >
                      Key holen →
                    </a>
                  </div>
                  <input
                    className="input"
                    value={aprsApiKey}
                    onChange={e => setAprsApiKey(e.target.value)}
                    placeholder="12345.AbcDefGhij"
                  />
                  <p className="text-slate-600 text-xs">Für Live-Standortanzeige über APRS — wird benötigt wenn dein Gerät GPS-Daten über DMR sendet</p>
                </div>
              </div>
            </div>
          )}

          {/* AUDIO */}
          {(showAll || activeTab === 'audio') && (
            <div>
              <div className="text-slate-300 text-xs font-bold tracking-widest mb-3">AUDIO</div>
              <div className="flex flex-col gap-4">
                <AudioChannel
                  label="RX — EINGEHENDE RUFE"
                  color="text-red-400"
                  cfg={audioRx}
                  setCfg={setAudioRx}
                  fileRef={rxFileRef}
                  onFileChange={handleAudioFile}
                  onRemoveFile={removeAudioFile}
                  channel="rx"
                />
                <AudioChannel
                  label="TX — AUSGEHENDE RUFE"
                  color="text-yellow-400"
                  cfg={audioTx}
                  setCfg={setAudioTx}
                  fileRef={txFileRef}
                  onFileChange={handleAudioFile}
                  onRemoveFile={removeAudioFile}
                  channel="tx"
                />
              </div>
            </div>
          )}

          {/* UPDATES */}
          {activeTab === 'updates' && !showAll && (
            <div className="flex flex-col gap-5">
              <div className="text-slate-300 text-xs font-bold tracking-widest">UPDATES</div>

              {electronUpdate?.ready ? (
                <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-2">
                  <div className="text-slate-200 text-sm font-bold">Programm-Update</div>
                  <div className="text-slate-500 text-xs">Version {electronUpdate.version} wurde heruntergeladen.</div>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => electronUpdate.install()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      Jetzt neu starten & installieren
                    </button>
                    <span className="text-xs font-bold text-emerald-400">↑ Update bereit</span>
                  </div>
                </div>
              ) : electronUpdate?.downloading ? (
                <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-2">
                  <div className="text-slate-200 text-sm font-bold">Programm-Update</div>
                  <div className="text-slate-500 text-xs">Version {electronUpdate.version} wird heruntergeladen…</div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                    <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${electronUpdate.percent}%` }} />
                  </div>
                  <span className="text-xs text-sky-400">{Math.round(electronUpdate.percent)}%</span>
                </div>
              ) : (
                <UpdateAction
                  title="Programm-Update"
                  description="Prüft ob eine neue Version des Programms verfügbar ist."
                  buttonLabel="Auf Updates prüfen"
                  okLabel="✓ Kein Update verfügbar"
                  state={updateCheckState}
                  disabled={!window.electronUpdater}
                  disabledHint="Nur in der installierten App verfügbar"
                  onAction={handleCheckForUpdates}
                />
              )}

              <UpdateAction
                title="Rufzeichenliste"
                description="Lädt die aktuelle Rufzeichenliste von GitHub (BNetzA-Daten)."
                buttonLabel="Jetzt aktualisieren"
                state={callsignRefreshState}
                onAction={handleRefreshCallsigns}
              />
            </div>
          )}

          {/* ÜBER */}
          {activeTab === 'about' && !showAll && (
            <div className="flex flex-col gap-6">

              {/* Branding */}
              <div className="bg-slate-900 rounded-xl p-5 flex flex-col gap-2">
                <div className="text-sky-400 text-lg font-black tracking-widest">DMR DASHBOARD</div>
                <div className="text-slate-400 text-sm">Version {__APP_VERSION__}</div>
                <div className="mt-1 text-slate-300 text-sm font-medium">Entwickelt von Christian Schmitz DO2EF</div>
                <a
                  href="https://github.com/knicker112/DMRDashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 hover:text-sky-300 text-xs transition-colors mt-1 w-fit"
                >
                  github.com/knicker112/DMRDashboard →
                </a>
              </div>

              {/* Feedback / Bug melden */}
              <div className="flex flex-col gap-3">
                <div className="text-slate-300 text-xs font-bold tracking-widest">FEEDBACK & BUGS</div>

                <input
                  className="input"
                  placeholder="Titel (z.B. Slot zeigt falschen Rufzeichen)"
                  value={feedbackTitle}
                  onChange={e => setFeedbackTitle(e.target.value)}
                />

                <textarea
                  className="input resize-none h-28"
                  placeholder="Beschreibung — was ist passiert? Wie lässt sich der Fehler reproduzieren?"
                  value={feedbackBody}
                  onChange={e => setFeedbackBody(e.target.value)}
                />

                {/* Screenshot */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => feedbackFileRef.current?.click()}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    📷 Screenshot anhängen
                  </button>
                  {feedbackFile && (
                    <span className="text-slate-400 text-xs truncate flex-1">{feedbackFile.name}</span>
                  )}
                  {feedbackFile && (
                    <button
                      type="button"
                      onClick={() => { setFeedbackFile(null); setFeedbackPreview(null) }}
                      className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                    >✕</button>
                  )}
                </div>
                <input
                  ref={feedbackFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFeedbackFile}
                />

                {feedbackPreview && (
                  <div className="rounded-lg overflow-hidden border border-slate-700">
                    <img src={feedbackPreview} alt="Screenshot-Vorschau" className="w-full max-h-40 object-contain bg-slate-950" />
                    <p className="text-slate-600 text-xs p-2">Bild nach dem Öffnen des GitHub-Issues manuell einfügen (Strg+V / Drag & Drop)</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenGitHubIssue}
                  disabled={!feedbackTitle.trim() && !feedbackBody.trim()}
                  className="bg-sky-700 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
                >
                  Bug/Idee auf GitHub melden →
                </button>
                <p className="text-slate-600 text-xs">Öffnet ein neues Issue auf GitHub — vorausgefüllt mit deinem Text.</p>
              </div>

            </div>
          )}

          {/* TG-NAMEN */}
          {(showAll || activeTab === 'tgnames') && (
            <div>
              <div className="text-slate-300 text-xs font-bold tracking-widest mb-1">BENUTZERDEFINIERTE TG-NAMEN</div>
              <p className="text-slate-500 text-xs mb-3">Für TGs die nicht im BrandMeister-Register stehen</p>
              <div className="flex flex-col gap-2">
                {tgRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="input w-32 shrink-0"
                      value={row.id}
                      onChange={e => updateTgRow(i, { id: e.target.value.replace(/\D/g, '') })}
                      placeholder="TG-Nummer"
                      inputMode="numeric"
                    />
                    <input
                      className="input flex-1"
                      value={row.name}
                      onChange={e => updateTgRow(i, { name: e.target.value })}
                      placeholder="Name"
                    />
                    <button
                      type="button"
                      onClick={() => removeTgRow(i)}
                      className="text-slate-600 hover:text-red-400 text-sm transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTgRow}
                className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-400 text-sm transition-colors"
              >
                + TG-Name hinzufügen
              </button>
              <p className="text-slate-600 text-xs mt-2">
                Nur für Gruppenrufe · Beispiel: <span className="text-slate-500 font-mono">26291</span> → <span className="text-slate-500">NRW</span>
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg transition-colors">
              Speichern
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2.5 rounded-lg transition-colors">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function UpdateAction({
  title, description, buttonLabel, okLabel = '✓ Erfolgreich', state, disabled, disabledHint, onAction,
}: {
  title: string
  description: string
  buttonLabel: string
  okLabel?: string
  state: 'idle' | 'loading' | 'ok' | 'error'
  disabled?: boolean
  disabledHint?: string
  onAction: () => void
}) {
  const stateLabel =
    state === 'loading' ? '…' :
    state === 'ok'      ? okLabel :
    state === 'error'   ? '✕ Fehlgeschlagen' : null

  return (
    <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-2">
      <div className="text-slate-200 text-sm font-bold">{title}</div>
      <div className="text-slate-500 text-xs">{description}</div>
      {disabled && disabledHint && (
        <div className="text-slate-600 text-xs">{disabledHint}</div>
      )}
      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={onAction}
          disabled={disabled || state === 'loading'}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          {state === 'loading' ? 'Lädt…' : buttonLabel}
        </button>
        {stateLabel && state !== 'loading' && (
          <span className={`text-xs font-bold ${state === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {stateLabel}
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-300 text-xs font-bold tracking-widest">{label}</label>
      {children}
      <span className="text-slate-500 text-xs">{hint}</span>
    </div>
  )
}

function AudioChannel({
  label, color, cfg, setCfg, fileRef, onFileChange, onRemoveFile, channel,
}: {
  label: string
  color: string
  cfg: AudioChannelConfig
  setCfg: React.Dispatch<React.SetStateAction<AudioChannelConfig>>
  fileRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (channel: 'rx' | 'tx', e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (channel: 'rx' | 'tx') => void
  channel: 'rx' | 'tx'
}) {
  const disabled = !cfg.enabled

  return (
    <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-4">
      <div className={`text-xs font-bold tracking-widest ${color}`}>{label}</div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-slate-300 text-sm">Ton aktiviert</span>
        <button
          type="button"
          onClick={() => setCfg(prev => ({ ...prev, enabled: !prev.enabled }))}
          className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${cfg.enabled ? 'bg-green-600' : 'bg-slate-600'}`}
        >
          <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${cfg.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Lautstärke */}
      <div className={`flex items-center gap-3 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <span className="text-slate-300 text-sm w-24 shrink-0">Lautstärke</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(cfg.volume * 100)}
          onChange={e => setCfg(prev => ({ ...prev, volume: Number(e.target.value) / 100 }))}
          className="flex-1 accent-sky-400"
        />
        <span className={`text-sm font-bold w-10 text-right ${color}`}>{Math.round(cfg.volume * 100)}%</span>
      </div>

      {/* Preset-Auswahl */}
      <div className={`flex flex-col gap-2 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <span className="text-slate-300 text-sm">Ton auswählen</span>
        <div className="flex items-center gap-2">
          <select
            value={cfg.customFileName ? '__custom__' : (cfg.preset ?? 'beep')}
            onChange={e => {
              if (e.target.value !== '__custom__') {
                onRemoveFile(channel)
                setCfg(prev => ({ ...prev, preset: e.target.value }))
              }
            }}
            disabled={!!cfg.customFileName}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 text-xs disabled:opacity-60"
          >
            {AUDIO_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
            {cfg.customFileName && (
              <option value="__custom__">Eigene Datei: {cfg.customFileName}</option>
            )}
          </select>
          <button
            type="button"
            onClick={() => playAudio(cfg)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
            title="Vorschau abspielen"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Eigene Datei */}
      <div className={`flex flex-col gap-1 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <span className="text-slate-500 text-xs">EIGENE DATEI (optional)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            📂 Hochladen
          </button>
          {cfg.customFileName && (
            <>
              <span className="text-slate-400 text-xs truncate flex-1">{cfg.customFileName}</span>
              <button
                type="button"
                onClick={() => onRemoveFile(channel)}
                className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                title="Entfernen"
              >✕</button>
            </>
          )}
        </div>
        <span className="text-slate-600 text-xs">MP3, WAV, OGG · max. 500 KB · überschreibt Preset</span>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => onFileChange(channel, e)}
        />
      </div>
    </div>
  )
}
