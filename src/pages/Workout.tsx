// Pantalla de entrenamiento de un día: marcar series, anotar pesos, progreso y descanso
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { currentWeek } from '../lib/week'
import { expandSets, findOpenSession, finishSession, logSet, startSession, type PlannedSet } from '../lib/sessions'
import { findLastTime } from '../lib/exerciseMatch'
import { closeRest, startRest } from '../lib/restTimer'
import { unlockAudio } from '../lib/sound'
import { useSettings } from '../lib/settings'
import type { Exercise, SetLog } from '../types'
import ExerciseCard from '../components/ExerciseCard'
import { Button, PageTitle } from '../components/ui'

export default function Workout() {
  const { id, dayId } = useParams()
  const navigate = useNavigate()
  const settings = useSettings()
  const [pickedWeek, setPickedWeek] = useState<number | null>(null)
  // Evita crear dos sesiones si tocás dos series muy rápido
  const sessionPromise = useRef<Promise<number> | null>(null)
  useEffect(() => {
    sessionPromise.current = null
  }, [id, dayId])

  // null = no existe; undefined = cargando
  const routine = useLiveQuery(async () => (await db.routines.get(Number(id))) ?? null, [id])
  const session = useLiveQuery(
    async () => (routine?.id !== undefined && dayId ? ((await findOpenSession(routine.id, dayId)) ?? null) : null),
    [routine?.id, dayId],
  )
  const logs = useLiveQuery(
    async () => (session?.id !== undefined ? db.setLogs.where('sessionId').equals(session.id).toArray() : []),
    [session?.id],
  )
  const history = useLiveQuery(() => db.setLogs.toArray(), [])

  if (routine === undefined || session === undefined || logs === undefined || history === undefined) return null
  const day = routine?.days.find((d) => d.id === dayId)
  if (!routine || !day) return <PageTitle back="/">No encontré ese día</PageTitle>

  const week = session?.week ?? pickedWeek ?? currentWeek(routine)
  const schemeOf = (ex: Exercise) => ex.weeks[week - 1] ?? ex.weeks[0]
  const plan = day.exercises.map((ex) => ({ ex, sets: expandSets(schemeOf(ex)) }))
  const total = plan.reduce((n, p) => n + p.sets.length, 0)
  const done = logs.length
  const allDone = total > 0 && done >= total

  const ensureSession = (): Promise<number> => {
    if (session?.id !== undefined) return Promise.resolve(session.id)
    sessionPromise.current ??= startSession(routine.id!, day.id, week)
    return sessionPromise.current
  }

  /** Lo que sigue después de esta serie, para mostrarlo en el descanso */
  const nextLabel = (ex: Exercise, set: PlannedSet): string => {
    const isDone = (e: Exercise, i: number) =>
      logs.some((l) => l.exerciseId === e.id && l.setIndex === i) || (e.id === ex.id && i === set.index)
    // Buscar desde el ejercicio actual hacia adelante, y después volver al principio
    const start = plan.findIndex((p) => p.ex.id === ex.id)
    const ordered = [...plan.slice(start), ...plan.slice(0, start)]
    for (const p of ordered) {
      const pending = p.sets.filter((s) => !isDone(p.ex, s.index))
      if (pending.length === 0) continue
      if (p.ex.id === ex.id) return `Sigue: ${p.ex.name} (quedan ${pending.length})`
      return `Sigue: ${p.ex.name}`
    }
    return 'Última serie del día'
  }

  const toggle = async (ex: Exercise, set: PlannedSet, weightKg?: number) => {
    unlockAudio()
    const existing = logs.find((l) => l.exerciseId === ex.id && l.setIndex === set.index)
    if (existing) {
      await db.setLogs.delete(existing.id!)
      return
    }
    const sessionId = await ensureSession()
    await logSet({ sessionId, routineId: routine.id!, exercise: ex, week, set, weightKg })
    if (done + 1 >= total) closeRest()
    else startRest(ex.restSec ?? settings.defaultRestSec, nextLabel(ex, set))
  }

  const editWeight = (log: SetLog, weightKg?: number) => db.setLogs.update(log.id!, { weightKg })

  const changeWeek = (n: number) => {
    if (session?.id !== undefined) void db.sessions.update(session.id, { week: n })
    else setPickedWeek(n)
  }

  const finish = async () => {
    const sid = session?.id ?? (await sessionPromise.current)
    if (sid !== undefined && sid !== null) await finishSession(sid)
    sessionPromise.current = null
    closeRest()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <PageTitle back={routine.status === 'active' ? '/' : `/rutinas/${routine.id}`}>{day.title}</PageTitle>
        {day.muscleGroups && <p className="-mt-3 mb-1 text-zinc-400">{day.muscleGroups}</p>}
      </div>

      {routine.weeksCount > 1 && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${routine.weeksCount}, minmax(0, 1fr))` }}>
          {Array.from({ length: routine.weeksCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => changeWeek(n)}
              className={`min-h-11 rounded-xl text-sm font-semibold ${n === week ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}
            >
              Sem {n}
            </button>
          ))}
        </div>
      )}

      {/* Progreso del día: queda pegado arriba al bajar */}
      <div className="sticky top-0 z-20 -mx-4 bg-zinc-950/95 px-4 py-2 backdrop-blur">
        <div className="mb-1 flex justify-between text-sm">
          <span className="font-semibold">{allDone ? '¡Día completo! 🎉' : 'Progreso del día'}</span>
          <span className="text-zinc-400">
            {done}/{total} series
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      {plan.map(({ ex }, i) => (
        <ExerciseCard
          key={`${ex.id}-${week}`}
          exercise={ex}
          number={i + 1}
          scheme={schemeOf(ex)}
          logs={logs.filter((l) => l.exerciseId === ex.id)}
          lastTime={findLastTime(history, ex.name, session?.id)}
          defaultRestSec={settings.defaultRestSec}
          onToggle={(set, w) => void toggle(ex, set, w)}
          onWeightEdit={(log, w) => void editWeight(log, w)}
        />
      ))}

      {(session || done > 0) && (
        <Button big variant={allDone ? 'primary' : 'secondary'} className="mt-2" onClick={() => void finish()}>
          {allDone ? 'Terminar entrenamiento ✓' : 'Terminar el día (aunque falten series)'}
        </Button>
      )}
      {/* Espacio para que la barra del descanso minimizado no tape el último botón */}
      <div className="h-20" aria-hidden />
    </div>
  )
}
