// Ayuno intermitente: elegir tipo, empezar, ver el progreso e historial
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { PRESETS, changeFastStart, endFast, fastLabel, fastProgress, getActiveFast, startFast, toLocalInput } from '../lib/fasting'
import { askNotificationPermission, canNotify } from '../lib/notify'
import { unlockAudio } from '../lib/sound'
import { useNow } from '../hooks/useNow'
import { dayTime, durationText, hhmmss, shortDate } from '../lib/time'
import type { Fast } from '../types'
import ProgressRing from '../components/ProgressRing'
import { Button, Card, PageTitle } from '../components/ui'

function ActiveFast({ fast }: { fast: Fast }) {
  const now = useNow(1000)
  const p = fastProgress(fast, now)
  const [editing, setEditing] = useState(false)
  const [newStart, setNewStart] = useState(toLocalInput(fast.startAt))
  const [confirmEnd, setConfirmEnd] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-semibold">Ayuno {fastLabel(fast.targetHours)}</span>
      </div>

      <ProgressRing progress={p.progress} size={290} color={p.reached ? 'stroke-emerald-400' : 'stroke-lime-400'}>
        <div className="text-sm text-zinc-400">{p.reached ? '¡Objetivo cumplido! 🎉' : 'Transcurrido'}</div>
        <div className="text-5xl font-black tabular-nums">{hhmmss(p.elapsedMs)}</div>
        <div className="mt-1 text-sm text-zinc-400">
          {p.reached ? `+${durationText(p.elapsedMs - p.targetMs)} extra` : `Faltan ${hhmmss(p.remainingMs)}`}
        </div>
        <div className="mt-1 text-xs text-zinc-500">{Math.floor(p.progress * 100)}%</div>
      </ProgressRing>

      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3 text-center">
          <div className="text-xs text-zinc-400">Empezó</div>
          <div className="font-semibold">{dayTime(fast.startAt, now)}</div>
        </Card>
        <Card className="!p-3 text-center">
          <div className="text-xs text-zinc-400">Termina</div>
          <div className="font-semibold">{dayTime(p.endsAt, now)}</div>
        </Card>
      </div>

      {editing ? (
        <Card className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">
            Hora en que empezaste
            <input
              type="datetime-local"
              className="input mt-1"
              value={newStart}
              max={toLocalInput(now)}
              onChange={(e) => setNewStart(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                const ts = new Date(newStart).getTime()
                if (Number.isFinite(ts)) void changeFastStart(fast.id!, ts)
                setEditing(false)
              }}
            >
              Guardar
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="ghost" onClick={() => setEditing(true)}>
          ✏️ Cambiar hora de inicio
        </Button>
      )}

      {confirmEnd && !p.reached ? (
        <Card className="flex flex-col gap-2 border-amber-400/40">
          <p className="text-sm">Todavía faltan {durationText(p.remainingMs)}. ¿Terminar igual?</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setConfirmEnd(false)}>
              Seguir ayunando
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => void endFast(fast.id!)}>
              Terminar
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          big
          variant={p.reached ? 'primary' : 'secondary'}
          onClick={() => (p.reached ? void endFast(fast.id!) : setConfirmEnd(true))}
        >
          {p.reached ? 'Terminar ayuno ✓' : 'Terminar ayuno'}
        </Button>
      )}
    </div>
  )
}

function StartFast() {
  const [hours, setHours] = useState(16)
  const [custom, setCustom] = useState('')
  const [earlier, setEarlier] = useState(false)
  const [startAt, setStartAt] = useState(() => toLocalInput(Date.now()))
  const target = custom !== '' ? parseFloat(custom.replace(',', '.')) : hours
  const valid = Number.isFinite(target) && target > 0 && target <= 168

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => {
          const selected = custom === '' && hours === p.hours
          return (
            <button
              key={p.label}
              onClick={() => {
                setHours(p.hours)
                setCustom('')
              }}
              className={`min-h-16 rounded-2xl font-bold ${selected ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800'}`}
            >
              <div className="text-xl">{p.label}</div>
              <div className={`text-xs font-medium ${selected ? 'text-zinc-800' : 'text-zinc-400'}`}>{p.hours} h ayuno</div>
            </button>
          )
        })}
        <label
          className={`flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 ${custom !== '' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800'}`}
        >
          <input
            className="w-full bg-transparent text-center text-xl font-bold outline-none placeholder:text-zinc-500"
            inputMode="decimal"
            placeholder="Otro"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            aria-label="Horas de ayuno personalizadas"
          />
          <span className="text-xs font-medium">horas</span>
        </label>
      </div>

      <button onClick={() => setEarlier(!earlier)} className="min-h-11 text-left text-sm text-zinc-400">
        {earlier ? '▾' : '▸'} Ya empecé antes (cargar la hora)
      </button>
      {earlier && (
        <input
          type="datetime-local"
          className="input"
          value={startAt}
          max={toLocalInput(Date.now())}
          onChange={(e) => setStartAt(e.target.value)}
        />
      )}

      <Button
        big
        variant="primary"
        disabled={!valid}
        onClick={() => {
          unlockAudio()
          const ts = earlier ? new Date(startAt).getTime() : Date.now()
          void startFast(target, Number.isFinite(ts) ? ts : Date.now())
        }}
      >
        Empezar ayuno {valid ? fastLabel(target) : ''}
      </Button>
    </div>
  )
}

function FastHistory() {
  const fasts = useLiveQuery(
    async () => (await db.fasts.filter((f) => !!f.endedAt).toArray()).sort((a, b) => b.startAt - a.startAt),
    [],
  )
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  if (!fasts || fasts.length === 0) return null
  const reached = fasts.filter((f) => fastProgress(f).reached).length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-300">Historial</h2>
        <span className="text-sm text-zinc-400">
          {reached}/{fasts.length} cumplidos
        </span>
      </div>
      {fasts.map((f) => {
        const p = fastProgress(f)
        return (
          <Card key={f.id} className="flex items-center gap-3 !p-3">
            <span className={`text-2xl ${p.reached ? '' : 'opacity-40'}`}>{p.reached ? '✅' : '⏹'}</span>
            <div className="flex-1">
              <div className="font-semibold">
                {shortDate(f.startAt)} · {fastLabel(f.targetHours)}
              </div>
              <div className="text-sm text-zinc-400">
                {durationText(p.elapsedMs)} de {f.targetHours} h
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${p.reached ? 'bg-emerald-400' : 'bg-zinc-500'}`}
                  style={{ width: `${p.progress * 100}%` }}
                />
              </div>
            </div>
            {confirmDelete === f.id ? (
              <Button variant="danger" onClick={() => void db.fasts.delete(f.id!)}>
                Borrar
              </Button>
            ) : (
              <button onClick={() => setConfirmDelete(f.id!)} className="min-h-11 px-2 text-xl text-zinc-500" aria-label="Borrar ayuno">
                ✕
              </button>
            )}
          </Card>
        )
      })}
    </div>
  )
}

export default function Fasting() {
  const active = useLiveQuery(getActiveFast, [])
  const [perm, setPerm] = useState<string>(() => (canNotify() ? Notification.permission : 'unsupported'))

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>Ayuno</PageTitle>
      {active === undefined ? null : active ? <ActiveFast fast={active} /> : <StartFast />}

      {perm === 'default' && (
        <Button variant="ghost" onClick={() => void askNotificationPermission().then((p) => setPerm(p))}>
          🔔 Activar notificaciones
        </Button>
      )}
      <p className="text-center text-xs text-zinc-500">
        El tiempo sigue contando aunque cierres la app. Si está abierta (o en segundo plano) te avisa con sonido al
        cumplir; si estaba cerrada, lo vas a ver al abrirla.
      </p>

      <FastHistory />
    </div>
  )
}
