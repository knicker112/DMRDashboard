export interface AudioChannelConfig {
  enabled: boolean
  volume: number           // 0.0–1.0
  customDataUrl?: string   // Base64-Data-URL der eigenen Audiodatei
  customFileName?: string  // Dateiname zur Anzeige
}

export const defaultAudioRx: AudioChannelConfig = { enabled: true,  volume: 0.7 }
export const defaultAudioTx: AudioChannelConfig = { enabled: false, volume: 0.5 }

function playBeep(volume: number) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume * 0.25, ctx.currentTime + 0.01)
    gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
    osc.onended = () => ctx.close()
  } catch {}
}

export function playAudio(cfg: AudioChannelConfig) {
  if (!cfg.enabled) return
  if (cfg.customDataUrl) {
    const audio = new Audio(cfg.customDataUrl)
    audio.volume = cfg.volume
    audio.play().catch(() => {})
  } else {
    playBeep(cfg.volume)
  }
}
