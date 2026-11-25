// Pantalla "Hoy": rutina activa, semana actual y qué día te toca
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { currentWeek, daysLeft, formatDate } from '../lib/week'
import { nextDayId } from '../lib/nextDay'
import DayList from '../components/DayList'
import FastCard from '../components/FastCard'
import { Card, LinkButton } from '../components/ui'

export default function Home() {
  // null = no hay rutina activa; undefined = todavía cargando
  const routine = useLiveQuery(async () => (await db.routines.where('status').equals('active').first()) ?? null, [])
  const lastSession = useLiveQuery(
    async () =>
      routine?.id === undefined
        ? undefined
        : (await db.sessions.where('routineId').equals(routine.id).filter((s) => !!s.finishedAt).sortBy('finishedAt')).at(-1),
    [routine?.id],
  )

  if (routine === undefined) return null

  if (!routine) {
    return (
      <div className="flex min-h-[70dvh] flex-col justify-center gap-6 text-center">
        <div className="text-6xl">🏋️</div>
        <div>
          <h1 className="text-3xl font-bold">¡Bienvenido!</h1>
          <p className="mt-2 text-zinc-400">Cargá tu rutina para empezar. Podés subir el PDF del gimnasio o pegar el texto.</p>
        </div>
        <LinkButton to="/rutinas/nueva" variant="primary" big>
          Cargar mi rutina
        </LinkButton>
      </div>
    )
  }

  const week = currentWeek(routine)
  const left = daysLeft(routine)
  const nextId = nextDayId(routine, lastSession)
  const next = routine.days.find((d) => d.id === nextId)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Rutina {routine.number ?? ''}</h1>
          <span className="rounded-full bg-lime-400/15 px-3 py-1 text-sm font-semibold text-lime-300">
            Semana {week} de {routine.weeksCount}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          {formatDate(routine.startDate, false)} → {formatDate(routine.endDate, false)}
          {left !== null && left >= 0 && ` · faltan ${left} días`}
        </p>
        {left !== null && left < 0 && (
          <p className="mt-2 text-sm font-semibold text-amber-300">
            ⚠ Esta rutina venció. Cuando tengas la nueva, cargala desde Rutinas.
          </p>
        )}
      </Card>

      {next && (
        <LinkButton to={`/rutinas/${routine.id}/dia/${next.id}`} variant="primary" big className="flex-col !py-4">
          <span className="text-sm font-medium opacity-80">Hoy te toca</span>
          <span className="text-xl">
            {next.title}
            {next.muscleGroups && ` · ${next.muscleGroups}`}
          </span>
        </LinkButton>
      )}

      <FastCard />

      <h2 className="mt-2 text-lg font-semibold text-zinc-300">Todos los días</h2>
      <DayList routine={routine} highlightId={nextId} />
    </div>
  )
}
