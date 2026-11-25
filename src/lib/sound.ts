// Sonido (bip con Web Audio, sin archivos) y vibración.
// Los navegadores solo dejan sonar audio después de que tocaste la pantalla:
// por eso llamamos a unlockAudio() cuando marcás una serie.
import { getSettings } from './settings'

let ctx: AudioContext | null = null

export function unlockAudio(): void {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // el navegador no soporta audio
  }
}

function beep(at: number, freq: number, duration: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.6, at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + duration + 0.05)
}

/** Aviso de "terminó": 3 bips + vibración (según los ajustes). */
export function alertDone(): void {
  const s = getSettings()
  if (s.sound) {
    unlockAudio()
    if (ctx) {
      const t = ctx.currentTime + 0.05
      beep(t, 880, 0.18)
      beep(t + 0.25, 880, 0.18)
      beep(t + 0.5, 1320, 0.4)
    }
  }
  if (s.vibrate && 'vibrate' in navigator) navigator.vibrate([300, 120, 300, 120, 500])
}
