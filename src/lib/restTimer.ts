// Temporizador de descanso. Guarda la HORA en que termina (endsAt), no un contador,
// así sigue bien aunque se apague la pantalla o cierres la app. Se guarda en localStorage.
import { useSyncExternalStore } from 'react'

export type RestState =
  | { status: 'idle' }
  | { status: 'running'; endsAt: number; totalMs: number; label: string }
  | { status: 'paused'; remainingMs: number; totalMs: number; label: string }
  | { status: 'done'; finishedAt: number; label: string }

const KEY = 'gym-rest-timer'
const listeners = new Set<() => void>()

function read(): RestState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RestState | null
    return s ?? { status: 'idle' }
  } catch {
    return { status: 'idle' }
  }
}

let state: RestState = read()

function set(next: RestState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // sin almacenamiento: funciona igual mientras la app esté abierta
  }
  listeners.forEach((l) => l())
}

export function getRest(): RestState {
  return state
}

export function useRest(): RestState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getRest,
  )
}

/** Tiempo que falta en milisegundos (0 si no está corriendo). */
export function remainingMs(s: RestState, now = Date.now()): number {
  if (s.status === 'running') return Math.max(0, s.endsAt - now)
  if (s.status === 'paused') return s.remainingMs
  return 0
}

export function startRest(seconds: number, label: string): void {
  const ms = Math.max(1, seconds) * 1000
  set({ status: 'running', endsAt: Date.now() + ms, totalMs: ms, label })
}

/** +15 / -15 segundos */
export function addRest(seconds: number): void {
  const s = state
  const delta = seconds * 1000
  if (s.status === 'running') {
    const endsAt = Math.max(Date.now() + 1000, s.endsAt + delta)
    set({ ...s, endsAt, totalMs: Math.max(s.totalMs + delta, endsAt - Date.now()) })
  } else if (s.status === 'paused') {
    const remaining = Math.max(1000, s.remainingMs + delta)
    set({ ...s, remainingMs: remaining, totalMs: Math.max(s.totalMs + delta, remaining) })
  }
}

export function togglePause(): void {
  const s = state
  if (s.status === 'running') set({ status: 'paused', remainingMs: Math.max(0, s.endsAt - Date.now()), totalMs: s.totalMs, label: s.label })
  else if (s.status === 'paused') set({ status: 'running', endsAt: Date.now() + s.remainingMs, totalMs: s.totalMs, label: s.label })
}

export function markDone(): void {
  const s = state
  if (s.status === 'running') set({ status: 'done', finishedAt: s.endsAt, label: s.label })
}

export function closeRest(): void {
  set({ status: 'idle' })
}
