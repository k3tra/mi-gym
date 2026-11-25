// Temporizador de descanso: pantalla completa con número gigante (o barra chica si lo minimizás).
// Vive en App.tsx, así sigue visible aunque cambies de pantalla.
import { useEffect, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { addRest, closeRest, markDone, remainingMs, togglePause, useRest } from '../lib/restTimer'
import { alertDone } from '../lib/sound'
import { mmss } from '../lib/time'
import ProgressRing from './ProgressRing'
import { Button } from './ui'

/** Mantiene la pantalla prendida mientras corre el descanso (si el navegador lo permite) */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    navigator.wakeLock
      .request('screen')
      .then((l) => (lock = l))
      .catch(() => {})
    return () => {
      void lock?.release().catch(() => {})
    }
  }, [active])
}

export default function RestTimer() {
  const rest = useRest()
  const now = useNow(250, rest.status === 'running')
  const [minimized, setMinimized] = useState(false)
  const startKey = rest.status === 'running' || rest.status === 'paused' ? rest.totalMs + rest.label : ''

  useWakeLock(rest.status === 'running')

  // Cada descanso nuevo arranca en pantalla completa
  useEffect(() => setMinimized(false), [startKey])

  // Cuando llega a 0: sonido + vibración (solo si terminó recién, no horas atrás)
  useEffect(() => {
    if (rest.status === 'running' && now >= rest.endsAt) {
      if (Date.now() - rest.endsAt < 15000) alertDone()
      markDone()
    }
  }, [rest, now])

  // El cartel de "¡Listo!" se cierra solo
  useEffect(() => {
    if (rest.status !== 'done') return
    const id = setTimeout(closeRest, 5000)
    return () => clearTimeout(id)
  }, [rest.status])

  if (rest.status === 'idle') return null

  if (rest.status === 'done') {
    return (
      <button
        onClick={closeRest}
        className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-xl rounded-2xl bg-lime-400 p-5 text-center text-xl font-bold text-zinc-950 shadow-xl shadow-black/60"
      >
        ¡Descanso terminado! A darle 💪
      </button>
    )
  }

  const left = remainingMs(rest, now)
  const progress = rest.totalMs > 0 ? left / rest.totalMs : 0
  const paused = rest.status === 'paused'

  if (minimized) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 px-4">
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 pl-4 shadow-xl shadow-black/60">
          <button onClick={() => setMinimized(false)} className="flex flex-1 items-baseline gap-3 text-left">
            <span className={`text-3xl font-black tabular-nums ${paused ? 'text-zinc-400' : 'text-lime-400'}`}>{mmss(left)}</span>
            <span className="truncate text-sm text-zinc-400">Descanso</span>
          </button>
          <Button onClick={togglePause}>{paused ? '▶' : '⏸'}</Button>
          <Button onClick={closeRest}>Saltar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-zinc-950/97 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">Descanso</div>
            <div className="truncate font-semibold">{rest.label}</div>
          </div>
          <Button variant="ghost" className="shrink-0 whitespace-nowrap" onClick={() => setMinimized(true)}>
            Minimizar ⌄
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center py-4">
          <ProgressRing progress={progress} size={300} color={paused ? 'stroke-zinc-500' : 'stroke-lime-400'}>
            <div className={`text-8xl font-black tabular-nums ${paused ? 'text-zinc-400' : 'text-zinc-50'}`}>{mmss(left)}</div>
            {paused && <div className="mt-1 text-lg font-semibold text-zinc-400">En pausa</div>}
          </ProgressRing>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button big onClick={() => addRest(-15)}>
            −15 s
          </Button>
          <Button big onClick={() => addRest(15)}>
            +15 s
          </Button>
          <Button big onClick={togglePause}>
            {paused ? '▶ Seguir' : '⏸ Pausar'}
          </Button>
          <Button big variant="primary" onClick={closeRest}>
            Saltar ⏭
          </Button>
        </div>
      </div>
    </div>
  )
}
