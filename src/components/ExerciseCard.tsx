// Tarjeta de un ejercicio durante el entrenamiento: una fila por serie con peso y botón "Hecha"
import { useState } from 'react'
import type { Exercise, SetLog, SetScheme } from '../types'
import { expandSets, type PlannedSet } from '../lib/sessions'
import type { LastTime } from '../lib/exerciseMatch'
import { groupLabel } from '../parser/parseScheme'
import { restLabel, shortDate } from '../lib/time'
import { Card } from './ui'

function parseKg(s: string): number | undefined {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function targetText(s: PlannedSet): string {
  if (s.seconds !== undefined) return `${s.seconds} s`
  return `${s.reps ?? '?'} reps`
}

export default function ExerciseCard({
  exercise,
  number,
  scheme,
  logs,
  lastTime,
  defaultRestSec,
  onToggle,
  onWeightEdit,
}: {
  exercise: Exercise
  number: number
  scheme: SetScheme
  logs: SetLog[]
  lastTime?: LastTime
  defaultRestSec: number
  onToggle: (set: PlannedSet, weightKg?: number) => void
  onWeightEdit: (log: SetLog, weightKg?: number) => void
}) {
  const [weights, setWeights] = useState<Record<number, string>>({})
  const sets = expandSets(scheme)
  const work = scheme.groups.filter((g) => !g.warmup)
  const warmups = scheme.groups.filter((g) => g.warmup)
  const doneCount = sets.filter((s) => logs.some((l) => l.setIndex === s.index)).length
  const complete = doneCount === sets.length && sets.length > 0

  /** Peso sugerido: el de la serie anterior de hoy, o el de la última vez, o el de la rutina */
  const suggested = (index: number): number | undefined => {
    const prev = logs.filter((l) => l.setIndex < index && l.weightKg !== undefined).sort((a, b) => b.setIndex - a.setIndex)[0]
    return prev?.weightKg ?? lastTime?.weightKg ?? exercise.weightKg
  }

  let warmNo = 0
  let workNo = 0

  return (
    <Card className={complete ? 'border-lime-400/50' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm text-zinc-500">
            {number} · {doneCount}/{sets.length} series
          </div>
          <div className="text-lg leading-snug font-semibold">{exercise.name}</div>
        </div>
        {complete && <span className="text-2xl text-lime-400">✓</span>}
      </div>

      <div className="mt-1 text-4xl font-black tracking-tight text-lime-400">{work.map(groupLabel).join(' + ')}</div>
      {warmups.length > 0 && <div className="text-sm text-zinc-400">Aproximación: {warmups.map(groupLabel).join(' + ')}</div>}

      <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-300">
        {lastTime && (
          <span className="rounded-lg bg-lime-400/10 px-2 py-1 text-lime-300">
            La última vez: {lastTime.weightKg} kg
            {lastTime.reps !== undefined && ` × ${lastTime.reps}`} · {shortDate(lastTime.doneAt)}
            {lastTime.exerciseName.toLowerCase() !== exercise.name.toLowerCase() && ` (${lastTime.exerciseName})`}
          </span>
        )}
        {exercise.weightKg !== undefined && <span className="rounded-lg bg-zinc-800 px-2 py-1">Rutina: {exercise.weightKg} kg</span>}
        <span className="rounded-lg bg-zinc-800 px-2 py-1">⏱ {restLabel(exercise.restSec ?? defaultRestSec)}</span>
        {exercise.notes && <span className="rounded-lg bg-zinc-800 px-2 py-1">📝 {exercise.notes}</span>}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {sets.map((s) => {
          const log = logs.find((l) => l.setIndex === s.index)
          const done = !!log
          const label = s.warmup ? `Aprox. ${++warmNo}` : `Serie ${++workNo}`
          const sug = suggested(s.index)
          const value = weights[s.index] ?? (log?.weightKg !== undefined ? String(log.weightKg) : '')
          return (
            <div key={s.index} className="flex items-center gap-2">
              <div className="w-20 shrink-0 leading-tight">
                <div className={`font-semibold ${s.warmup ? 'text-zinc-400' : ''}`}>{label}</div>
                <div className="text-sm text-zinc-500">{targetText(s)}</div>
              </div>
              <div className="relative w-24 shrink-0">
                <input
                  className="input pr-8 text-center text-lg"
                  inputMode="decimal"
                  aria-label={`Peso ${label}`}
                  placeholder={sug !== undefined ? String(sug) : '—'}
                  value={value}
                  onChange={(e) => setWeights((w) => ({ ...w, [s.index]: e.target.value }))}
                  onBlur={() => {
                    if (log && weights[s.index] !== undefined) onWeightEdit(log, parseKg(weights[s.index]))
                  }}
                />
                <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-zinc-500">kg</span>
              </div>
              <button
                onClick={() => onToggle(s, value.trim() ? parseKg(value) : sug)}
                className={`min-h-12 flex-1 rounded-xl text-lg font-bold transition ${done ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-200 active:bg-zinc-700'}`}
              >
                {done ? '✓ Hecha' : 'Hecha'}
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
