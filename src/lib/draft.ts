// "Borrador" editable de una rutina: lo que usa la vista previa antes de guardar.
// Las series se editan como texto ("2x15/4x12") y se convierten al guardar.
import type { Day, Exercise, Routine } from '../types'
import { newId } from './id'
import { formatScheme, parseScheme } from '../parser/parseScheme'

export interface DraftExercise {
  id: string
  name: string
  weeks: string[]
  weight: string
  rest: string
  notes: string
}

export interface DraftDay {
  id: string
  title: string
  muscleGroups: string
  exercises: DraftExercise[]
}

export interface Draft {
  number: string
  startDate: string
  endDate: string
  weeksCount: number
  days: DraftDay[]
}

type RoutineData = Omit<Routine, 'id' | 'status' | 'createdAt'>

export function emptyExercise(weeksCount: number): DraftExercise {
  return { id: newId(), name: '', weeks: Array(weeksCount).fill(''), weight: '', rest: '', notes: '' }
}

export function emptyDay(n: number, weeksCount: number): DraftDay {
  return { id: newId(), title: `Día ${n}`, muscleGroups: '', exercises: [emptyExercise(weeksCount)] }
}

export function toDraft(r: RoutineData): Draft {
  return {
    number: r.number?.toString() ?? '',
    startDate: r.startDate ?? '',
    endDate: r.endDate ?? '',
    weeksCount: r.weeksCount,
    days: r.days.map((d) => ({
      id: d.id,
      title: d.title,
      muscleGroups: d.muscleGroups,
      exercises: d.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        weeks: e.weeks.map(formatScheme),
        weight: e.weightKg?.toString() ?? '',
        rest: e.restSec?.toString() ?? '',
        notes: e.notes ?? '',
      })),
    })),
  }
}

/** Convierte el borrador en rutina. Devuelve errores si algo no se puede entender. */
export function fromDraft(d: Draft): { routine?: RoutineData; errors: string[] } {
  const errors: string[] = []
  const days: Day[] = []
  for (const dd of d.days) {
    const exercises: Exercise[] = []
    for (const de of dd.exercises) {
      const name = de.name.trim()
      if (!name) {
        if (de.weeks.some((w) => w.trim())) errors.push(`${dd.title}: hay un ejercicio sin nombre.`)
        continue
      }
      const weeks = []
      for (let i = 0; i < d.weeksCount; i++) {
        // Semana vacía = igual que la anterior
        const txt = de.weeks[i]?.trim() || (i > 0 && weeks[i - 1] ? formatScheme(weeks[i - 1]) : '')
        const s = parseScheme(txt)
        if (!s) {
          errors.push(`${dd.title} · ${name}: no entiendo las series de la semana ${i + 1} ("${txt || 'vacío'}"). Usá el formato 4x10.`)
          break
        }
        weeks.push(s)
      }
      const ex: Exercise = { id: de.id, name, weeks }
      const w = parseFloat(de.weight.replace(',', '.'))
      if (!Number.isNaN(w)) ex.weightKg = w
      const r = parseInt(de.rest, 10)
      if (!Number.isNaN(r)) ex.restSec = r
      if (de.notes.trim()) ex.notes = de.notes.trim()
      exercises.push(ex)
    }
    days.push({ id: dd.id, title: dd.title.trim() || 'Día', muscleGroups: dd.muscleGroups.trim(), exercises })
  }
  if (days.length === 0 || days.every((x) => x.exercises.length === 0)) errors.push('La rutina no tiene ejercicios.')
  if (errors.length) return { errors }
  const num = parseInt(d.number, 10)
  return {
    errors,
    routine: {
      number: Number.isNaN(num) ? null : num,
      startDate: d.startDate || null,
      endDate: d.endDate || null,
      weeksCount: d.weeksCount,
      days,
    },
  }
}
