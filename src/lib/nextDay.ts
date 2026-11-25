// Qué día te toca: el siguiente al último que completaste en la rutina activa.
import type { Routine, Session } from '../types'

export function nextDayId(routine: Routine, lastFinished?: Session): string | undefined {
  const days = routine.days
  if (days.length === 0) return undefined
  if (!lastFinished) return days[0].id
  const idx = days.findIndex((d) => d.id === lastFinished.dayId)
  return days[(idx + 1) % days.length].id
}
