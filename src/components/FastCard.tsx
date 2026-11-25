// Tarjetita del ayuno en curso para la pantalla "Hoy"
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { fastLabel, fastProgress, getActiveFast } from '../lib/fasting'
import { useNow } from '../hooks/useNow'
import { hhmmss } from '../lib/time'

export default function FastCard() {
  const fast = useLiveQuery(getActiveFast, [])
  const now = useNow(1000, !!fast)
  if (!fast) return null
  const p = fastProgress(fast, now)

  return (
    <Link to="/ayuno" className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">⏳ Ayuno {fastLabel(fast.targetHours)}</span>
        <span className="font-mono text-lg font-bold tabular-nums">{hhmmss(p.elapsedMs)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${p.reached ? 'bg-emerald-400' : 'bg-lime-400'}`} style={{ width: `${p.progress * 100}%` }} />
      </div>
      <div className="mt-1 text-sm text-zinc-400">
        {p.reached ? '¡Objetivo cumplido! Tocá para terminarlo.' : `Faltan ${hhmmss(p.remainingMs)}`}
      </div>
    </Link>
  )
}
