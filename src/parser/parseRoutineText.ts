// Convierte el texto de una rutina (pegado o sacado de un PDF/foto) en una rutina estructurada.
// No conoce ningún ejercicio: solo busca patrones ("DIA 1:", "SEMANA 1", "4x10", fechas).
import type { Day, Exercise, ParseResult, SetScheme } from '../types'
import { newId } from '../lib/id'
import { prettyName, titleCase } from '../lib/text'
import { findSchemes, formatScheme, parseScheme, schemeLooksOdd } from './parseScheme'

/** Marca que pone el lector de PDF entre páginas. */
export const PAGE_BREAK = '<<<PAGINA>>>'

const DAY_RE = /^d[ií]a\s*(\d{1,2})\b\s*[:.\-–]?\s*(.*)$/i
const WEEKDAY_RE = /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b\s*[:.\-–]?\s*(.*)$/i
const SEMANA_RE = /semana\s*\d+/gi
const DATE = String.raw`(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})`

const WEIGHT_RE = /(\d+(?:[.,]\d+)?)\s*kg\b/i
const REST_RE = /(?:descanso|desc\.?|pausa|rest)\s*:?\s*(\d+)\s*(min|m|segundos|seg|s|"|')?/i
const REST_AFTER_RE = /(\d+)\s*(min|m|segundos|seg|s|"|')\s*(?:de\s+)?(?:descanso|pausa)/i

function toISO(d: string, m: string, y: string): string {
  const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10)
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function findDate(text: string, labels: string): string | null {
  const m = new RegExp(`(?:${labels})\\s*:?\\s*${DATE}`, 'i').exec(text)
  return m ? toISO(m[1], m[2], m[3]) : null
}

function parseHeader(text: string, fileName = '') {
  const numMatch =
    /n[uú]mero\s+de\s+rutina\s*:?\s*(\d{1,3})\b/i.exec(text) ??
    /rutina[^\d\n]*?(\d{1,3})(?![\d/.-])/i.exec(fileName)
  const startLabels = String.raw`fecha\s+de\s+inicio|comienza\s+el|comienza|desde\s+el|desde`
  const endLabels = String.raw`v[aá]lida\s+hasta\s+el|v[aá]lida\s+hasta|hasta\s+el|hasta|vence\s+el|vence|vencimiento`
  return {
    number: numMatch ? parseInt(numMatch[1], 10) : null,
    startDate: findDate(text, startLabels) ?? findDate(fileName, startLabels),
    endDate: findDate(text, endLabels) ?? findDate(fileName, endLabels),
  }
}

/** Líneas que no son ejercicios: pie de página, mails, datos personales "ETIQUETA: valor". */
function isJunk(line: string): boolean {
  if (/www\.|https?:|@|\big:/i.test(line)) return true
  if (line.includes(':')) return true
  if (/^(semana\s*\d+\s*)+$/i.test(line)) return true
  return false
}

/** Un nombre que termina en "con", "de", "en"... está cortado: sigue en la línea de abajo */
const CONNECTOR_END = /\b(con|de|del|en|a|al|y|la|el|los|las|para|por|sin|sobre|tras)$/i

function cleanName(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–:.,•*·]+/, '')
    .replace(/^\d{1,2}[.)]\s+/, '') // "1. Press banca" / "1) Press banca"
    .replace(/[\s\-–—:.,]+$/, '')
    .trim()
}

export interface ParseOptions {
  /**
   * true para texto sacado de una FOTO (OCR): ahí las series quedan en la primera línea
   * del nombre, así que las líneas sueltas de abajo son la continuación del ejercicio anterior.
   */
  seriesOnFirstLine?: boolean
}

export function parseRoutineText(text: string, fileName?: string, opts: ParseOptions = {}): ParseResult {
  const warnings: string[] = []
  const header = parseHeader(text, fileName)
  const days: Day[] = []
  let weeksCount = 1
  let pending: string[] = []
  let current: Day | null = null
  // Último ejercicio cuyo nombre quedó cortado (ej: foto con "EXTENSION ... CON 4x12" y abajo "BARRA T")
  let unfinished: { ex: Exercise; rawName: string } | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (!line) continue
    if (line === PAGE_BREAK) {
      // Lo que quedó suelto al final de una página (datos personales, pie) no es un ejercicio
      pending = []
      unfinished = null
      continue
    }

    // ¿Empieza un día nuevo? ("DIA 1: PECHO", "Día 2", "Lunes - Piernas")
    const numbered = DAY_RE.exec(line)
    const weekday = numbered ? null : WEEKDAY_RE.exec(line)
    if ((numbered || weekday) && findSchemes(line).length === 0) {
      pending = []
      unfinished = null
      const title = numbered ? `Día ${numbered[1]}` : titleCase(weekday![1])
      const rest = (numbered ?? weekday)![2] ?? ''
      const semanas = rest.match(SEMANA_RE)?.length ?? 0
      weeksCount = Math.max(weeksCount, semanas)
      const groups = rest.replace(SEMANA_RE, '').replace(/^[\s\-–:.]+|[\s\-–:.]+$/g, '').trim()
      current = { id: newId(), title, muscleGroups: groups ? titleCase(groups) : '', exercises: [] }
      days.push(current)
      continue
    }

    if (isJunk(line)) continue

    const schemes = findSchemes(line)
    if (schemes.length === 0) {
      // ¿Es la continuación del nombre del ejercicio anterior?
      if (unfinished && pending.length === 0) {
        unfinished.rawName = cleanName(`${unfinished.rawName} ${line}`)
        unfinished.ex.name = prettyName(unfinished.rawName)
        if (!opts.seriesOnFirstLine && !CONNECTOR_END.test(unfinished.rawName)) unfinished = null
        continue
      }
      unfinished = null
      // Puede ser parte del nombre de un ejercicio que sigue en la próxima línea
      pending.push(line)
      if (pending.length > 3) pending.shift()
      continue
    }

    const first = schemes[0]
    const last = schemes[schemes.length - 1]
    let namePart = line.slice(0, first.index)
    let extra = line.slice(last.index + last.text.length)

    // Peso: "Sentadilla 3 x 12 - 60kg" o "Press banca 60kg 4x10"
    let weightKg: number | undefined
    for (const where of ['name', 'extra'] as const) {
      const src = where === 'name' ? namePart : extra
      const w = WEIGHT_RE.exec(src)
      if (!w) continue
      weightKg = parseFloat(w[1].replace(',', '.'))
      if (where === 'name') namePart = namePart.replace(w[0], ' ')
      else extra = extra.replace(w[0], ' ')
    }

    // Descanso: "descanso 90s", "desc 2min", "60 seg de descanso"
    let restSec: number | undefined
    const rm = REST_RE.exec(extra) ?? REST_AFTER_RE.exec(extra)
    if (rm) {
      const unit = (rm[2] ?? 's').toLowerCase()
      restSec = parseInt(rm[1], 10) * (unit === 'min' || unit === 'm' || unit === "'" ? 60 : 1)
      extra = extra.replace(rm[0], ' ')
    }

    // Notas: lo que está entre paréntesis en el nombre o lo que sobra al final
    const notesParts: string[] = []
    namePart = namePart.replace(/\(([^)]*)\)/g, (_m, inside: string) => {
      notesParts.push(inside.trim())
      return ' '
    })
    const extraNote = extra
      .replace(/[()]/g, ' ')
      .replace(/^[\s\-–:.,@]+|[\s\-–:.,]+$/g, '')
      .trim()
    if (extraNote) notesParts.push(extraNote)

    const name = cleanName([...pending, namePart].join(' '))
    pending = []
    if (!name) {
      warnings.push(`No encontré el nombre del ejercicio en "${line}".`)
      continue
    }
    if (!current) {
      current = { id: newId(), title: 'Día 1', muscleGroups: '', exercises: [] }
      days.push(current)
    }

    const weeks = schemes.map((s) => parseScheme(s.text)).filter((s): s is SetScheme => s !== null)
    weeksCount = Math.max(weeksCount, weeks.length)
    const ex: Exercise = { id: newId(), name: prettyName(name), weeks }
    if (weightKg !== undefined) ex.weightKg = weightKg
    if (restSec !== undefined) ex.restSec = restSec
    const notes = notesParts.filter(Boolean).join(' · ')
    if (notes) ex.notes = notes
    current.exercises.push(ex)
    unfinished = opts.seriesOnFirstLine || CONNECTOR_END.test(name) ? { ex, rawName: name } : null
  }

  // Si una semana no aparece, vale la misma que la anterior
  for (const d of days) {
    for (const ex of d.exercises) {
      while (ex.weeks.length < weeksCount) {
        const prev = ex.weeks[ex.weeks.length - 1]
        ex.weeks.push({ groups: prev.groups.map((g) => ({ ...g })) })
      }
      const odd = ex.weeks.findIndex(schemeLooksOdd)
      if (odd >= 0) warnings.push(`Revisá "${ex.name}": "${formatScheme(ex.weeks[odd])}" parece raro.`)
    }
  }

  if (days.length === 0) warnings.push('No encontré ningún ejercicio. Probá pegando el texto o cargándolos a mano.')
  if (!header.startDate) warnings.push('No encontré la fecha de inicio: completala abajo.')
  if (!header.endDate) warnings.push('No encontré la fecha de vencimiento: completala abajo.')

  return {
    routine: { number: header.number, startDate: header.startDate, endDate: header.endDate, weeksCount, days },
    warnings,
  }
}
