// Detalle de una rutina (activa o vieja): sus días y opciones
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { activateRoutine, db } from '../db/db'
import { formatDate } from '../lib/week'
import DayList from '../components/DayList'
import SessionHistory from '../components/SessionHistory'
import { Button, LinkButton, PageTitle } from '../components/ui'

export default function RoutineDetail() {
  const { id } = useParams()
  const routine = useLiveQuery(async () => (await db.routines.get(Number(id))) ?? null, [id])

  if (routine === undefined) return null
  if (!routine) return <PageTitle back="/rutinas">No encontré esa rutina</PageTitle>

  return (
    <div className="flex flex-col gap-3">
      <PageTitle back="/rutinas">Rutina {routine.number ?? ''}</PageTitle>
      <p className="-mt-3 text-sm text-zinc-400">
        {formatDate(routine.startDate)} → {formatDate(routine.endDate)} · {routine.weeksCount} semanas
        {routine.status === 'archived' && ' · archivada'}
      </p>
      <DayList routine={routine} />
      <h2 className="mt-3 text-lg font-semibold text-zinc-300">Entrenamientos</h2>
      <SessionHistory routine={routine} />
      <LinkButton to={`/rutinas/${routine.id}/editar`}>✏️ Editar rutina</LinkButton>
      {routine.status === 'archived' && (
        <Button variant="ghost" onClick={() => activateRoutine(routine.id!)}>
          Volver a usar esta rutina
        </Button>
      )}
    </div>
  )
}
