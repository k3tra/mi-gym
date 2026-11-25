// Lo que hiciste en una rutina: sesiones terminadas con los pesos de cada ejercicio
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Routine, SetLog } from '../types'
import { shortDate } from '../lib/time'
import { Card } from './ui'

function summarize(logs: SetLog[]): { name: string; text: string }[] {
  const byExercise = new Map<string, SetLog[]>()
  for (const l of [...logs].sort((a, b) => a.doneAt - b.doneAt)) {
    byExercise.set(l.exerciseName, [...(byExercise.get(l.exerciseName) ?? []), l])
  }
  return [...byExercise.entries()].map(([name, ls]) => {
    const weights = ls.filter((l) => l.weightKg !== undefined).map((l) => l.weightKg)
    return {
      name,
      text: `${ls.length} series${weights.length ? ` · ${weights.join(' / ')} kg` : ''}`,
    }
  })
}

export default function SessionHistory({ routine }: { routine: Routine }) {
  const [open, setOpen] = useState<number | null>(null)
  const data = useLiveQuery(async () => {
    const sessions = (await db.sessions.where('routineId').equals(routine.id!).toArray())
      .filter((s) => s.finishedAt)
      .sort((a, b) => b.startedAt - a.startedAt)
    const logs = await db.setLogs.where('routineId').equals(routine.id!).toArray()
    return sessions.map((s) => ({ s, logs: logs.filter((l) => l.sessionId === s.id) }))
  }, [routine.id])

  if (!data) return null
  if (data.length === 0) return <p className="text-sm text-zinc-500">Todavía no hay entrenamientos registrados en esta rutina.</p>

  return (
    <div className="flex flex-col gap-2">
      {data.map(({ s, logs }) => {
        const day = routine.days.find((d) => d.id === s.dayId)
        const isOpen = open === s.id
        return (
          <Card key={s.id} className="!p-0">
            <button onClick={() => setOpen(isOpen ? null : s.id!)} className="flex w-full items-center justify-between p-4 text-left">
              <div>
                <div className="font-semibold">
                  {shortDate(s.startedAt)} · {day?.title ?? 'Día'}
                </div>
                <div className="text-sm text-zinc-400">
                  Semana {s.week} · {logs.length} series
                </div>
              </div>
              <span className="text-xl text-zinc-500">{isOpen ? '⌃' : '⌄'}</span>
            </button>
            {isOpen && (
              <ul className="flex flex-col gap-1 border-t border-zinc-800 px-4 py-3 text-sm">
                {summarize(logs).map((r) => (
                  <li key={r.name}>
                    <span className="text-zinc-200">{r.name}</span>
                    <span className="text-zinc-400"> — {r.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )
      })}
    </div>
  )
}
