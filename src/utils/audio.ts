export interface AudioChannelConfig {
  enabled: boolean
  volume: number           // 0.0–1.0
  preset?: string          // Preset-Ton-ID; 'beep' wenn nicht gesetzt
  customDataUrl?: string   // Base64-Data-URL der eigenen Audiodatei
  customFileName?: string  // Dateiname zur Anzeige
}

export const defaultAudioRx: AudioChannelConfig = { enabled: true,  volume: 0.7, preset: 'beep' }
export const defaultAudioTx: AudioChannelConfig = { enabled: false, volume: 0.5, preset: 'beep' }

// ── Preset-Definitionen ─────────────────────────────────────────────────────

type PresetFn = (ctx: AudioContext, volume: number) => void

function note(ctx: AudioContext, freq: number, start: number, duration: number, vol: number, type: OscillatorType = 'sine') {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol * 0.3, start + 0.005)
  gain.gain.setValueAtTime(vol * 0.3, start + duration - 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration + 0.01)
}

const presetFns: Record<string, PresetFn> = {
  // Einfacher Piepton (Standard)
  beep: (ctx, vol) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol * 0.25, ctx.currentTime + 0.01)
    gain.gain.setValueAtTime(vol * 0.25, ctx.currentTime + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.36)
    osc.onended = () => ctx.close()
  },

  // Roger Beep: klassischer PTT-Ton (drei absteigende Töne)
  roger: (ctx, vol) => {
    const t = ctx.currentTime
    note(ctx, 1200, t + 0.00, 0.1, vol)
    note(ctx, 900,  t + 0.10, 0.1, vol)
    note(ctx, 600,  t + 0.20, 0.12, vol)
    setTimeout(() => ctx.close(), 600)
  },

  // Doppelton: zwei kurze Pieptöne
  double: (ctx, vol) => {
    const t = ctx.currentTime
    note(ctx, 880, t + 0.00, 0.09, vol)
    note(ctx, 880, t + 0.14, 0.09, vol)
    setTimeout(() => ctx.close(), 500)
  },

  // Dreiton: drei aufsteigende Töne (C–E–G)
  triple: (ctx, vol) => {
    const t = ctx.currentTime
    note(ctx, 523, t + 0.00, 0.08, vol)
    note(ctx, 659, t + 0.11, 0.08, vol)
    note(ctx, 784, t + 0.22, 0.10, vol)
    setTimeout(() => ctx.close(), 600)
  },

  // Sweep: aufsteigender Frequenz-Sweep
  sweep: (ctx, vol) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    const t = ctx.currentTime
    osc.frequency.setValueAtTime(300, t)
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.35)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol * 0.25, t + 0.02)
    gain.gain.setValueAtTime(vol * 0.25, t + 0.30)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38)
    osc.start(t); osc.stop(t + 0.39)
    osc.onended = () => ctx.close()
  },

  // Alarm: schneller Wechsel-Ton
  alarm: (ctx, vol) => {
    const t = ctx.currentTime
    const freqs = [880, 1100, 880, 1100]
    freqs.forEach((f, i) => note(ctx, f, t + i * 0.07, 0.06, vol, 'square'))
    setTimeout(() => ctx.close(), 600)
  },

  // Funk-Rauschen: kurzes weißes Rauschen (Scanner-Stil)
  noise: (ctx, vol) => {
    const bufSize = ctx.sampleRate * 0.18
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4
    const src  = ctx.createBufferSource()
    const gain = ctx.createGain()
    const t = ctx.currentTime
    src.buffer = buf
    src.connect(gain); gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.01)
    gain.gain.setValueAtTime(vol * 0.5, t + 0.14)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20)
    src.start(t)
    setTimeout(() => ctx.close(), 400)
  },
}

export interface AudioPreset { id: string; label: string }

export const AUDIO_PRESETS: AudioPreset[] = [
  { id: 'beep',   label: 'Piepton (Standard)' },
  { id: 'roger',  label: 'Roger Beep (3-Ton)' },
  { id: 'double', label: 'Doppelton' },
  { id: 'triple', label: 'Dreiton (aufsteigend)' },
  { id: 'sweep',  label: 'Sweep (aufsteigend)' },
  { id: 'alarm',  label: 'Alarm (pulsierend)' },
  { id: 'noise',  label: 'Funk-Rauschen' },
]

// ── Wiedergabe ───────────────────────────────────────────────────────────────

export function playAudio(cfg: AudioChannelConfig) {
  if (!cfg.enabled) return

  if (cfg.customDataUrl) {
    const audio = new Audio(cfg.customDataUrl)
    audio.volume = cfg.volume
    audio.play().catch(() => {})
    return
  }

  try {
    const ctx = new AudioContext()
    const fn = presetFns[cfg.preset ?? 'beep'] ?? presetFns.beep
    fn(ctx, cfg.volume)
  } catch {}
}
