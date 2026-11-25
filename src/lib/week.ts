// Fechas de la rutina: semana actual, días que faltan, formato argentino.
import type { Routine } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

/** "2026-11-19" -> fecha local a las 00:00 (sin problemas de zona horaria) */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Semana de la rutina que corresponde hoy (1 = la primera). */
export function currentWeek(r: Pick<Routine, 'startDate' | 'weeksCount'>, now = new Date()): number {
  if (!r.startDate) return 1
  const diff = Math.round((startOfToday(now).getTime() - parseISODate(r.startDate).getTime()) / DAY_MS)
  const week = Math.floor(diff / 7) + 1
  return Math.min(Math.max(week, 1), Math.max(r.weeksCount, 1))
}

/** Días que faltan para que venza (negativo si ya venció). null si no hay fecha. */
export function daysLeft(r: Pick<Routine, 'endDate'>, now = new Date()): number | null {
  if (!r.endDate) return null
  return Math.round((parseISODate(r.endDate).getTime() - startOfToday(now).getTime()) / DAY_MS)
}

/** "2026-11-19" -> "19/11/2026" (o "19/11" sin año) */
export function formatDate(iso: string | null, withYear = true): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`
}
