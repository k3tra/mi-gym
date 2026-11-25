// Formatos de tiempo para mostrar en pantalla

/** 95000 ms -> "1:35" */
export function mmss(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 5400000 ms -> "1:30:00" */
export function hhmmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/** timestamp -> "14:05" */
export function clock(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** timestamp -> "hoy 14:05", "mañana 06:00", "ayer 20:00" o "lun 24/11 20:00" */
export function dayTime(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(d) - startOf(new Date(now))) / 86400000)
  const prefix =
    diffDays === 0
      ? 'hoy'
      : diffDays === 1
        ? 'mañana'
        : diffDays === -1
          ? 'ayer'
          : d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  return `${prefix} ${clock(ts)}`
}

/** 5400000 ms -> "1 h 30 min" */
export function durationText(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** timestamp -> "19/11" */
export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

/** segundos -> "90 s" / "2 min" / "1:30 min" */
export function restLabel(sec: number): string {
  if (sec < 60) return `${sec} s`
  if (sec % 60 === 0) return `${sec / 60} min`
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')} min`
}
