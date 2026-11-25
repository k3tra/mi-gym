// Encontrar "el mismo ejercicio o uno parecido" en rutinas anteriores,
// aunque cambie un poco el nombre ("Press inclinado hammer" ≈ "Press inclinado en hammer").
import type { SetLog } from '../types'
import { normalize } from './text'

const STOP_WORDS = new Set(['de', 'del', 'con', 'en', 'la', 'el', 'los', 'las', 'a', 'al', 'y', 'e', 'o'])

/** Clave para guardar en la base: nombre sin tildes, en minúsculas */
export function exerciseKey(name: string): string {
  return normalize(name)
}

function tokens(name: string): Set<string> {
  return new Set(
    normalize(name)
      .split(/[^a-z0-9°]+/)
      .filter((t) => t && !STOP_WORDS.has(t)),
  )
}

/** Parecido entre 0 y 1 (palabras en común / palabras totales) */
export function similarity(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let common = 0
  for (const t of ta) if (tb.has(t)) common++
  return common / (ta.size + tb.size - common)
}

export interface LastTime {
  weightKg: number
  reps?: number
  seconds?: number
  doneAt: number
  exerciseName: string
}

/**
 * La última vez que hiciste este ejercicio (o uno parecido) con peso anotado.
 * Devuelve la serie más pesada de esa última sesión.
 */
export function findLastTime(logs: SetLog[], name: string, excludeSessionId?: number): LastTime | undefined {
  const key = exerciseKey(name)
  const withWeight = logs.filter((l) => l.weightKg !== undefined && l.sessionId !== excludeSessionId)
  let matches = withWeight.filter((l) => l.exerciseKey === key)
  if (matches.length === 0) {
    const similarKeys = new Set(
      [...new Set(withWeight.map((l) => l.exerciseKey))].filter((k) => similarity(k, key) >= 0.8),
    )
    matches = withWeight.filter((l) => similarKeys.has(l.exerciseKey))
  }
  if (matches.length === 0) return undefined
  const latest = matches.reduce((a, b) => (b.doneAt > a.doneAt ? b : a))
  const sameSession = matches.filter((l) => l.sessionId === latest.sessionId)
  const best = sameSession.reduce((a, b) => ((b.weightKg ?? 0) > (a.weightKg ?? 0) ? b : a))
  return {
    weightKg: best.weightKg!,
    reps: best.reps,
    seconds: best.seconds,
    doneAt: latest.doneAt,
    exerciseName: best.exerciseName,
  }
}
