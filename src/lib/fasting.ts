// Ayuno intermitente. Se guarda la HORA DE INICIO, no un contador:
// el tiempo se calcula siempre con Date.now(), así sigue bien aunque apagues el celular.
import { db } from '../db/db'
import type { Fast } from '../types'

export const HOUR_MS = 60 * 60 * 1000

export const PRESETS = [
  { label: '12:12', hours: 12 },
  { label: '14:10', hours: 14 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
]

/** "16:8" o "36 h" si es personalizado */
export function fastLabel(hours: number): string {
  const preset = PRESETS.find((p) => p.hours === hours)
  if (preset) return preset.label
  return hours < 24 && Number.isInteger(hours) ? `${hours}:${24 - hours}` : `${hours} h`
}

export interface FastProgress {
  elapsedMs: number
  targetMs: number
  remainingMs: number
  endsAt: number
  /** 0 a 1 */
  progress: number
  reached: boolean
}

export function fastProgress(f: Fast, now = Date.now()): FastProgress {
  const end = f.endedAt ?? now
  const targetMs = f.targetHours * HOUR_MS
  const elapsedMs = Math.max(0, end - f.startAt)
  return {
    elapsedMs,
    targetMs,
    remainingMs: Math.max(0, targetMs - elapsedMs),
    endsAt: f.startAt + targetMs,
    progress: targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : 0,
    reached: elapsedMs >= targetMs,
  }
}

/** El ayuno en curso (sin terminar), si hay */
export async function getActiveFast(): Promise<Fast | null> {
  const open = await db.fasts.filter((f) => !f.endedAt).toArray()
  return open.sort((a, b) => b.startAt - a.startAt)[0] ?? null
}

export async function startFast(targetHours: number, startAt = Date.now()): Promise<void> {
  await db.transaction('rw', db.fasts, async () => {
    // Por las dudas, cerrar cualquier otro que haya quedado abierto
    const open = await db.fasts.filter((f) => !f.endedAt).toArray()
    for (const f of open) await db.fasts.update(f.id!, { endedAt: Date.now() })
    await db.fasts.add({ startAt: Math.min(startAt, Date.now()), targetHours })
  })
}

export async function endFast(id: number): Promise<void> {
  await db.fasts.update(id, { endedAt: Date.now() })
}

export async function changeFastStart(id: number, startAt: number): Promise<void> {
  // Si se mueve el inicio, se puede volver a avisar cuando se cumpla
  await db.fasts.update(id, { startAt: Math.min(startAt, Date.now()), notifiedAt: undefined })
}

/** timestamp -> "2026-11-25T08:30" (para <input type="datetime-local">) */
export function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
