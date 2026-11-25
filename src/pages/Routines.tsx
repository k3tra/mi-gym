// Historial de rutinas: la activa arriba y las anteriores archivadas
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { formatDate } from '../lib/week'
import { LinkButton, PageTitle } from '../components/ui'

export default function Routines() {
  const routines = useLiveQuery(() => db.routines.orderBy('createdAt').reverse().toArray(), [])

  return (
    <div className="flex flex-col gap-3">
      <PageTitle>Rutinas</PageTitle>
      <LinkButton to="/rutinas/nueva" variant="primary" big>
        + Cargar nueva rutina
      </LinkButton>

      {routines?.length === 0 && <p className="mt-4 text-center text-zinc-400">Todavía no cargaste ninguna rutina.</p>}

      {routines?.map((r) => (
        <Link
          key={r.id}
          to={`/rutinas/${r.id}`}
          className={`flex items-center justify-between rounded-2xl border p-4 ${r.status === 'active' ? 'border-lime-400 bg-lime-400/10' : 'border-zinc-800 bg-zinc-900'}`}
        >
          <div>
            <div className="font-bold">
              Rutina {r.number ?? '(sin número)'}
              {r.status === 'active' && <span className="ml-2 text-xs font-semibold text-lime-400">ACTIVA</span>}
            </div>
            <div className="text-sm text-zinc-400">
              {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.days.length} días
            </div>
          </div>
          <span className="text-2xl text-zinc-500">›</span>
        </Link>
      ))}
    </div>
  )
}
