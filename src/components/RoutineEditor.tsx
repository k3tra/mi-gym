// Vista previa editable: corregir, agregar, borrar y reordenar antes de guardar
import { useState } from 'react'
import type { Routine } from '../types'
import { type Draft, type DraftDay, type DraftExercise, emptyDay, emptyExercise, fromDraft } from '../lib/draft'
import { parseScheme, schemeLooksOdd } from '../parser/parseScheme'
import { Button, Card } from './ui'

type RoutineData = Omit<Routine, 'id' | 'status' | 'createdAt'>

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

/** Color del borde según si las series se entienden */
function schemeClass(text: string): string {
  if (!text.trim()) return ''
  const s = parseScheme(text)
  if (!s) return '!border-red-500'
  if (schemeLooksOdd(s)) return '!border-amber-400 !bg-amber-400/10'
  return ''
}

export default function RoutineEditor({
  initial,
  warnings = [],
  saveLabel,
  onSave,
}: {
  initial: Draft
  warnings?: string[]
  saveLabel: string
  onSave: (r: RoutineData) => Promise<void>
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const setDays = (fn: (days: DraftDay[]) => DraftDay[]) => setDraft((d) => ({ ...d, days: fn(d.days) }))
  const setDay = (dayId: string, patch: Partial<DraftDay>) =>
    setDays((days) => days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)))
  const setExercises = (dayId: string, fn: (ex: DraftExercise[]) => DraftExercise[]) =>
    setDays((days) => days.map((d) => (d.id === dayId ? { ...d, exercises: fn(d.exercises) } : d)))
  const setExercise = (dayId: string, exId: string, patch: Partial<DraftExercise>) =>
    setExercises(dayId, (exs) => exs.map((e) => (e.id === exId ? { ...e, ...patch } : e)))

  const changeWeeks = (n: number) => {
    const count = Math.min(Math.max(n, 1), 8)
    setDraft((d) => ({
      ...d,
      weeksCount: count,
      days: d.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((e) => ({
          ...e,
          weeks: Array.from({ length: count }, (_, i) => e.weeks[i] ?? ''),
        })),
      })),
    }))
  }

  const save = async () => {
    const { routine, errors } = fromDraft(draft)
    setErrors(errors)
    if (!routine) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    try {
      await onSave(routine)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {(errors.length > 0 || warnings.length > 0) && (
        <Card className={errors.length ? 'border-red-500/50' : 'border-amber-400/40'}>
          <ul className="flex flex-col gap-1 text-sm">
            {errors.map((e) => (
              <li key={e} className="text-red-300">
                ✕ {e}
              </li>
            ))}
            {warnings.map((w) => (
              <li key={w} className="text-amber-300">
                ⚠ {w}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm text-zinc-400">
            Número de rutina
            <input
              className="input mt-1"
              inputMode="numeric"
              value={draft.number}
              onChange={(e) => setDraft({ ...draft, number: e.target.value })}
              placeholder="Ej: 3"
            />
          </label>
          <label className="text-sm text-zinc-400">
            Empieza
            <input
              type="date"
              className="input mt-1"
              value={draft.startDate}
              onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-400">
            Vence
            <input
              type="date"
              className="input mt-1"
              value={draft.endDate}
              onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
            />
          </label>
          <div className="col-span-2 flex items-center justify-between text-sm text-zinc-400">
            Semanas de progresión
            <div className="flex items-center gap-2">
              <Button onClick={() => changeWeeks(draft.weeksCount - 1)} aria-label="Menos semanas">
                −
              </Button>
              <span className="w-6 text-center text-lg font-bold text-zinc-100">{draft.weeksCount}</span>
              <Button onClick={() => changeWeeks(draft.weeksCount + 1)} aria-label="Más semanas">
                +
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-sm text-zinc-400">
        Series en formato <b>4x10</b>, con aproximación <b>2x15/4x12</b> o por tiempo <b>3x45s</b>. Si dejás una semana
        vacía, se repite la anterior. En <span className="text-amber-300">amarillo</span> lo que parece raro.
      </p>

      {draft.days.map((day, di) => (
        <Card key={day.id} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="input w-28 font-bold"
              value={day.title}
              onChange={(e) => setDay(day.id, { title: e.target.value })}
              aria-label="Nombre del día"
            />
            <input
              className="input"
              value={day.muscleGroups}
              onChange={(e) => setDay(day.id, { muscleGroups: e.target.value })}
              placeholder="Grupos musculares"
              aria-label="Grupos musculares"
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setDays((d) => move(d, di, -1))} disabled={di === 0}>
              ↑ Día
            </Button>
            <Button
              className="flex-1"
              onClick={() => setDays((d) => move(d, di, 1))}
              disabled={di === draft.days.length - 1}
            >
              ↓ Día
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => setDays((d) => d.filter((x) => x.id !== day.id))}>
              ✕ Día
            </Button>
          </div>

          {day.exercises.map((ex, ei) => (
            <div key={ex.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex gap-2">
                <span className="pt-2.5 text-sm text-zinc-500">{ei + 1}.</span>
                <input
                  className="input font-semibold"
                  value={ex.name}
                  onChange={(e) => setExercise(day.id, ex.id, { name: e.target.value })}
                  placeholder="Nombre del ejercicio"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {ex.weeks.map((w, wi) => (
                  <label key={wi} className="text-center text-[11px] text-zinc-500">
                    S{wi + 1}
                    <input
                      className={`input mt-0.5 px-1.5 text-center text-sm ${schemeClass(w)}`}
                      value={w}
                      onChange={(e) => {
                        const weeks = [...ex.weeks]
                        weeks[wi] = e.target.value
                        setExercise(day.id, ex.id, { weeks })
                      }}
                      placeholder={wi === 0 ? '4x10' : '='}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <input
                  className="input text-sm"
                  inputMode="decimal"
                  value={ex.weight}
                  onChange={(e) => setExercise(day.id, ex.id, { weight: e.target.value })}
                  placeholder="Peso kg"
                />
                <input
                  className="input text-sm"
                  inputMode="numeric"
                  value={ex.rest}
                  onChange={(e) => setExercise(day.id, ex.id, { rest: e.target.value })}
                  placeholder="Desc. seg"
                />
                <input
                  className="input text-sm"
                  value={ex.notes}
                  onChange={(e) => setExercise(day.id, ex.id, { notes: e.target.value })}
                  placeholder="Notas"
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                <Button className="flex-1" onClick={() => setExercises(day.id, (x) => move(x, ei, -1))} disabled={ei === 0}>
                  ↑
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setExercises(day.id, (x) => move(x, ei, 1))}
                  disabled={ei === day.exercises.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => setExercises(day.id, (x) => x.filter((e) => e.id !== ex.id))}
                >
                  Borrar
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={() => setExercises(day.id, (x) => [...x, emptyExercise(draft.weeksCount)])}>
            + Agregar ejercicio
          </Button>
        </Card>
      ))}

      <Button onClick={() => setDays((d) => [...d, emptyDay(d.length + 1, draft.weeksCount)])}>+ Agregar día</Button>

      <div className="sticky bottom-20 z-20 pt-2">
        <Button variant="primary" big className="w-full shadow-lg shadow-black/50" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : saveLabel}
        </Button>
      </div>
    </div>
  )
}
