// Sesiones de entrenamiento: cada vez que hacés un día se crea una, con sus series.
import { db } from '../db/db'
import type { Exercise, SetGroup, SetScheme } from '../types'
import { exerciseKey } from './exerciseMatch'

/** Una sesión sin terminar con más de estas horas se da por terminada */
const STALE_MS = 12 * 60 * 60 * 1000

export interface PlannedSet {
  index: number
  warmup: boolean
  reps?: number
  seconds?: number
}

/** "2x15/4x12" -> 6 series: 2 de aproximación + 4 efectivas */
export function expandSets(scheme: SetScheme): PlannedSet[] {
  const out: PlannedSet[] = []
  scheme.groups.forEach((g: SetGroup) => {
    for (let i = 0; i < g.sets; i++) out.push({ index: out.length, warmup: !!g.warmup, reps: g.reps, seconds: g.seconds })
  })
  return out
}

/** La sesión abierta de este día (si empezaste a entrenarlo y no lo terminaste) */
export async function findOpenSession(routineId: number, dayId: string) {
  const list = await db.sessions.where('routineId').equals(routineId).toArray()
  return list
    .filter((s) => s.dayId === dayId && !s.finishedAt && Date.now() - s.startedAt < STALE_MS)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
}

export async function startSession(routineId: number, dayId: string, week: number): Promise<number> {
  return (await db.sessions.add({ routineId, dayId, week, startedAt: Date.now() })) as number
}

export async function finishSession(sessionId: number): Promise<void> {
  await db.sessions.update(sessionId, { finishedAt: Date.now() })
}

/** Marca una serie como hecha */
export async function logSet(args: {
  sessionId: number
  routineId: number
  exercise: Exercise
  week: number
  set: PlannedSet
  weightKg?: number
}): Promise<void> {
  const { sessionId, routineId, exercise, week, set, weightKg } = args
  await db.setLogs.add({
    sessionId,
    routineId,
    exerciseId: exercise.id,
    exerciseKey: exerciseKey(exercise.name),
    exerciseName: exercise.name,
    week,
    setIndex: set.index,
    reps: set.reps,
    seconds: set.seconds,
    weightKg,
    doneAt: Date.now(),
  })
}

/**
 * Al abrir la app: las sesiones que quedaron abiertas hace más de 12 h
 * se cierran (si tenían series) o se borran (si estaban vacías).
 */
export async function closeStaleSessions(): Promise<void> {
  const open = await db.sessions.filter((s) => !s.finishedAt && Date.now() - s.startedAt >= STALE_MS).toArray()
  for (const s of open) {
    const logs = await db.setLogs.where('sessionId').equals(s.id!).toArray()
    if (logs.length === 0) await db.sessions.delete(s.id!)
    else await db.sessions.update(s.id!, { finishedAt: Math.max(...logs.map((l) => l.doneAt)) })
  }
}
