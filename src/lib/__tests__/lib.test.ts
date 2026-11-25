import { describe, expect, it } from 'vitest'
import type { SetLog } from '../../types'
import { exerciseKey, findLastTime, similarity } from '../exerciseMatch'
import { expandSets } from '../sessions'
import { currentWeek } from '../week'
import { parseScheme } from '../../parser/parseScheme'

const log = (p: Partial<SetLog>): SetLog => ({
  sessionId: 1,
  routineId: 1,
  exerciseId: 'x',
  exerciseKey: exerciseKey(p.exerciseName ?? 'Press inclinado hammer'),
  exerciseName: 'Press inclinado hammer',
  week: 1,
  setIndex: 0,
  doneAt: 1,
  ...p,
})

describe('exerciseMatch', () => {
  it('reconoce nombres parecidos', () => {
    expect(similarity('Press inclinado hammer', 'Press inclinado en Hammer')).toBe(1)
    expect(similarity('Press inclinado hammer', 'Press plano libre')).toBeLessThan(0.5)
  })

  it('devuelve el peso más alto de la última sesión', () => {
    const logs = [
      log({ sessionId: 1, weightKg: 30, doneAt: 100 }),
      log({ sessionId: 2, weightKg: 35, reps: 10, doneAt: 200 }),
      log({ sessionId: 2, weightKg: 37.5, reps: 10, doneAt: 210, setIndex: 1 }),
      log({ sessionId: 3, exerciseName: 'Press plano libre', exerciseKey: exerciseKey('Press plano libre'), weightKg: 80, doneAt: 300 }),
    ]
    expect(findLastTime(logs, 'Press inclinado hammer')?.weightKg).toBe(37.5)
    expect(findLastTime(logs, 'PRESS INCLINADO EN HAMMER')?.weightKg).toBe(37.5)
    expect(findLastTime(logs, 'Press inclinado hammer', 2)?.weightKg).toBe(30)
    expect(findLastTime(logs, 'Sentadilla')).toBeUndefined()
  })
})

describe('expandSets', () => {
  it('2x15/4x12 son 6 series, 2 de aproximación', () => {
    const sets = expandSets(parseScheme('2x15/4x12')!)
    expect(sets).toHaveLength(6)
    expect(sets.filter((s) => s.warmup)).toHaveLength(2)
    expect(sets[5]).toEqual({ index: 5, warmup: false, reps: 12, seconds: undefined })
  })
})

describe('currentWeek', () => {
  const r = { startDate: '2026-11-19', weeksCount: 4 }
  it('calcula la semana según la fecha de inicio', () => {
    expect(currentWeek(r, new Date(2026, 10, 19))).toBe(1)
    expect(currentWeek(r, new Date(2026, 10, 25))).toBe(1)
    expect(currentWeek(r, new Date(2026, 10, 26))).toBe(2)
    expect(currentWeek(r, new Date(2026, 11, 17))).toBe(4)
    expect(currentWeek(r, new Date(2027, 0, 30))).toBe(4)
    expect(currentWeek(r, new Date(2026, 9, 1))).toBe(1)
  })
})

describe('fasting', () => {
  it('calcula transcurrido, restante y fin', async () => {
    const { fastProgress, fastLabel, HOUR_MS } = await import('../fasting')
    const start = new Date(2026, 10, 25, 20, 0).getTime()
    const f = { startAt: start, targetHours: 16 }
    const p = fastProgress(f, start + 4 * HOUR_MS)
    expect(p.elapsedMs).toBe(4 * HOUR_MS)
    expect(p.remainingMs).toBe(12 * HOUR_MS)
    expect(p.progress).toBe(0.25)
    expect(p.reached).toBe(false)
    expect(new Date(p.endsAt).getHours()).toBe(12)
    expect(fastProgress(f, start + 17 * HOUR_MS).reached).toBe(true)
    expect(fastProgress({ ...f, endedAt: start + 10 * HOUR_MS }, start + 50 * HOUR_MS).elapsedMs).toBe(10 * HOUR_MS)
    expect(fastLabel(16)).toBe('16:8')
    expect(fastLabel(13)).toBe('13:11')
    expect(fastLabel(36)).toBe('36 h')
  })
})
