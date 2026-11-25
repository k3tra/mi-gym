// Editar una rutina ya guardada (usa el mismo editor que la vista previa)
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db, updateRoutine } from '../db/db'
import { toDraft } from '../lib/draft'
import RoutineEditor from '../components/RoutineEditor'
import { PageTitle } from '../components/ui'

export default function EditRoutine() {
  const { id } = useParams()
  const navigate = useNavigate()
  const routine = useLiveQuery(async () => (await db.routines.get(Number(id))) ?? null, [id])

  if (routine === undefined) return null
  if (!routine) return <PageTitle back="/rutinas">No encontré esa rutina</PageTitle>

  return (
    <div>
      <PageTitle back={`/rutinas/${routine.id}`}>Editar rutina {routine.number ?? ''}</PageTitle>
      <RoutineEditor
        initial={toDraft(routine)}
        saveLabel="Guardar cambios"
        onSave={async (r) => {
          await updateRoutine(routine.id!, r)
          navigate(`/rutinas/${routine.id}`)
        }}
      />
    </div>
  )
}
