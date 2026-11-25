import type { SetGroup, SetScheme } from '../types'

// Un bloque de series: "4x10", "4 X 10", "3x45s", "3x45 seg", "3x1min", "4×12".
// La unidad solo cuenta si no sigue otra letra (así "4x10 sin pausa" no se lee como segundos).
const GROUP = String.raw`(\d{1,2})\s*[x×]\s*(\d{1,3})(?:\s*(segundos|segs|seg|s|min|"|')(?![a-z]))?`
// Un esquema completo: bloques separados por "/" o "+" ("2X15/4X12")
const SCHEME_RE = new RegExp(`${GROUP}(?:\s*[/+]\s*${GROUP})*`, 'gi')
const GROUP_RE = new RegExp(GROUP, 'gi')
// "3 series de 12"
const SERIES_DE_RE = /(\d{1,2})\s*series?\s*(?:de|x)\s*(\d{1,3})(?:\s*(segundos|seg|s|min)(?![a-z]))?/gi

function toGroup(sets: string, n: string, unit?: string): SetGroup {
  const num = parseInt(n, 10)
  const s = parseInt(sets, 10)
  const u = (unit ?? '').toLowerCase()
  if (u === 'min' || u === "'") return { sets: s, seconds: num * 60 }
  if (u) return { sets: s, seconds: num }
  return { sets: s, reps: num }
}

/** Convierte "2x15/4x12" en { groups: [2x15 (aprox.), 4x12] }. Devuelve null si no entiende. */
export function parseScheme(text: string): SetScheme | null {
  const groups: SetGroup[] = []
  for (const m of text.matchAll(GROUP_RE)) groups.push(toGroup(m[1], m[2], m[3]))
  if (groups.length === 0) {
    for (const m of text.matchAll(SERIES_DE_RE)) groups.push(toGroup(m[1], m[2], m[3]))
  }
  if (groups.length === 0) return null
  // Todos los bloques menos el último son de aproximación
  groups.forEach((g, i) => {
    if (i < groups.length - 1) g.warmup = true
  })
  return { groups }
}

/** Encuentra todos los esquemas dentro de una línea, con su posición. */
export function findSchemes(line: string): { text: string; index: number }[] {
  const out: { text: string; index: number }[] = []
  for (const m of line.matchAll(SCHEME_RE)) out.push({ text: m[0], index: m.index ?? 0 })
  if (out.length === 0) {
    for (const m of line.matchAll(SERIES_DE_RE)) out.push({ text: m[0], index: m.index ?? 0 })
  }
  return out
}

function groupText(g: SetGroup): string {
  if (g.seconds !== undefined) {
    return g.seconds >= 60 && g.seconds % 60 === 0 ? `${g.sets}x${g.seconds / 60}min` : `${g.sets}x${g.seconds}s`
  }
  return `${g.sets}x${g.reps ?? '?'}`
}

/** Para mostrar/editar: { groups } -> "2x15/4x12" */
export function formatScheme(s: SetScheme): string {
  return s.groups.map(groupText).join('/')
}

/** Texto de un bloque para mostrar grande: "4 × 10" o "3 × 45 s" */
export function groupLabel(g: SetGroup): string {
  if (g.seconds !== undefined) return `${g.sets} × ${g.seconds >= 60 && g.seconds % 60 === 0 ? `${g.seconds / 60} min` : `${g.seconds} s`}`
  return `${g.sets} × ${g.reps ?? '?'}`
}

/** Valores que probablemente sean un error de lectura o de tipeo (ej: 2x145). */
export function schemeLooksOdd(s: SetScheme): boolean {
  return s.groups.some(
    (g) =>
      g.sets < 1 ||
      g.sets > 10 ||
      (g.reps !== undefined && (g.reps < 1 || g.reps > 50)) ||
      (g.seconds !== undefined && g.seconds > 600),
  )
}
