// Lista de días de una rutina; el que te toca aparece destacado
import { Link } from 'react-router-dom'
import type { Routine } from '../types'

export default function DayList({ routine, highlightId }: { routine: Routine; highlightId?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {routine.days.map((d) => {
        const isNext = d.id === highlightId
        return (
          <Link
            key={d.id}
            to={`/rutinas/${routine.id}/dia/${d.id}`}
            className={`flex items-center justify-between rounded-2xl border p-4 ${isNext ? 'border-lime-400 bg-lime-400/10' : 'border-zinc-800 bg-zinc-900'}`}
          >
            <div>
              <div className="font-bold">
                {d.title}
                {isNext && <span className="ml-2 text-xs font-semibold text-lime-400">TE TOCA</span>}
              </div>
              <div className="text-sm text-zinc-400">
                {d.muscleGroups || 'Sin grupo muscular'} · {d.exercises.length} ejercicios
              </div>
            </div>
            <span className="text-2xl text-zinc-500">›</span>
          </Link>
        )
      })}
    </div>
  )
}
