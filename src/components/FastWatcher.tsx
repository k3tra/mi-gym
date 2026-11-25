// Vigila el ayuno en curso desde cualquier pantalla y avisa (sonido, vibración,
// notificación) cuando se cumple el objetivo. No muestra nada en pantalla.
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { fastLabel, fastProgress, getActiveFast } from '../lib/fasting'
import { useNow } from '../hooks/useNow'
import { alertDone } from '../lib/sound'
import { notify } from '../lib/notify'

export default function FastWatcher() {
  const fast = useLiveQuery(getActiveFast, [])
  const pending = !!fast && !fast.notifiedAt
  const now = useNow(1000, pending)

  useEffect(() => {
    if (!fast || fast.notifiedAt) return
    const p = fastProgress(fast, now)
    if (!p.reached) return
    // Solo hacer ruido si se cumplió recién (si abriste la app horas después, la pantalla ya lo muestra)
    if (Date.now() - p.endsAt < 2 * 60 * 1000) {
      alertDone()
      void notify('¡Ayuno cumplido! 🎉', `Completaste tu ayuno ${fastLabel(fast.targetHours)}.`)
    }
    void db.fasts.update(fast.id!, { notifiedAt: Date.now() })
  }, [fast, now])

  return null
}
