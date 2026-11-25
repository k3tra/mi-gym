import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseRoutineText, PAGE_BREAK } from '../parseRoutineText'
import { formatScheme, parseScheme } from '../parseScheme'
import { pdfDataToText } from '../pdfToText'

// Fragmento de la Rutina 02 (sin datos personales), con los cortes de línea del PDF
const RUTINA_02 = `NUMERO DE RUTINA: 2
FECHA DE INICIO: 19/11/2026
RUTINA VALIDA HASTA EL 19/12/2026
DIA 1: ABDOMEN/PECHO/TRICEPS SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
CORTOS EN BANCO DECLINADO CON DISCO 4X20
ELEVACION DE PIERNAS EN PARALELAS 4X25
APERTURA INCLINADA CON MANCUERNAS 2X15/4X12
PRESS INCLINADO HAMMER 4X10 5X10 6X10 4X10
PRESS PLANO LIBRE 4X10
APERTURA PLANA CON MANCUERNAS 4X12
EXTENSION DE TRICEPS EN POLEA ALTA CON
BARRA T
4X12
FRANCES TRAS NUCA CON BARRA T EN
POLEA ALTA
4X10
FRANCES TRAS NUCA CON BARRA W
ACOSTADO
4X10
DIA 2: HOMBROS/BICEPS SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
REMO PARA POSTERIORES CON
MANCUERNAS
2X15/4X10
PRESS DE HOMBROS HAMMER 4X10 5X10 6X10 4X10
ELEVACION FRONTAL ALTERNADO CON
MANCUERNAS
4X10
VUELOS LATERALES EN POLEA BAJA CON
ESTIBO
4X10
CURL DE BICEPS CON BARRA W DE PIE 4X10
CURL DE BICEPS EN SCOTT STERLING
UNILATERAL
4X10
CURL MARTILLO DE PIE CON MANCUERNAS 4X10
DIA 3: CUADRICEPS/GEMELOS SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
CORTOS EN BANCO DECLINADO CON DISCO 4X20
ELEVACION DE PIERNAS EN PARALELAS 4X25
SILLON DE CUADRICEPS 2X14/4X12
NOMBRE APELLIDO
PROFE : X
4 DIAS A LA SEMANA
RECOMPOSICION
www.gimnasio.ar Ig: gimnasio rutinas@gimnasio.ar
${PAGE_BREAK}
SENTADILLA EN V.SQUAT PIES ANCHO DE
HOMBROS
4X10
SENTADILLA EN SMITH PIES ANCHO DE
HOMBROS
4X10
PRENSA 45° PIES ANCHO DE HOMBROS 4X10 5X10 6X10 4X10
ESTOCADAS ESTATICAS CON MANCUERNAS 3X10
GEMELOS EN STERLING 3X15
DIA 4: ESPALDA/FEMORAL SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
DORSAL STERLING 2X145/4X10 5X10 6X10 4X10
REMO HAMMER AGARRE PRONO 4X10
REMO HAMMER CONVERGENTE AGARRE
NEUTRO UNILATERAL
4X10
REMO EN POLEA BAJA AGARRE NEUTRO CON
TRIANGULO ERGONOMICO
4X10
CAMILLA DE FEMORAL 4X10
SILLON DE FEMORAL 4X10
FEMORAL A 1 PIERNA STERLING 4X10`

describe('parseScheme', () => {
  it('entiende series simples, aproximación y tiempo', () => {
    expect(parseScheme('4X10')).toEqual({ groups: [{ sets: 4, reps: 10 }] })
    expect(parseScheme('2X15/4X12')).toEqual({ groups: [{ sets: 2, reps: 15, warmup: true }, { sets: 4, reps: 12 }] })
    expect(parseScheme('3x45s')).toEqual({ groups: [{ sets: 3, seconds: 45 }] })
    expect(parseScheme('3 x 1min')).toEqual({ groups: [{ sets: 3, seconds: 60 }] })
    expect(parseScheme('3 series de 12')).toEqual({ groups: [{ sets: 3, reps: 12 }] })
    expect(parseScheme('nada')).toBeNull()
  })
})

describe('parseRoutineText con la Rutina 02', () => {
  const { routine, warnings } = parseRoutineText(RUTINA_02)

  it('lee número y fechas', () => {
    expect(routine.number).toBe(2)
    expect(routine.startDate).toBe('2026-11-19')
    expect(routine.endDate).toBe('2026-12-19')
    expect(routine.weeksCount).toBe(4)
  })

  it('arma 4 días con la cantidad correcta de ejercicios', () => {
    expect(routine.days.map((d) => d.title)).toEqual(['Día 1', 'Día 2', 'Día 3', 'Día 4'])
    expect(routine.days.map((d) => d.exercises.length)).toEqual([9, 7, 8, 7])
    expect(routine.days[0].muscleGroups).toBe('Abdomen/Pecho/Triceps')
  })

  it('junta nombres partidos en dos líneas', () => {
    const names = routine.days.flatMap((d) => d.exercises.map((e) => e.name))
    expect(names).toContain('Extension de triceps en polea alta con barra t')
    expect(names).toContain('Sentadilla en v.squat pies ancho de hombros')
    expect(names.some((n) => /recomposicion|apellido/i.test(n))).toBe(false)
  })

  it('lee la progresión por semana y repite la semana 1 si no hay más', () => {
    const press = routine.days[0].exercises.find((e) => e.name === 'Press inclinado hammer')!
    expect(press.weeks.map(formatScheme)).toEqual(['4x10', '5x10', '6x10', '4x10'])
    const plano = routine.days[0].exercises.find((e) => e.name === 'Press plano libre')!
    expect(plano.weeks.map(formatScheme)).toEqual(['4x10', '4x10', '4x10', '4x10'])
  })

  it('avisa del 2x145 raro', () => {
    expect(warnings.some((w) => w.includes('2x145'))).toBe(true)
  })
})

describe('parseRoutineText con formatos libres', () => {
  it('entiende peso, descanso, tiempo y días de la semana', () => {
    const { routine } = parseRoutineText(`Lunes - Pecho
Press banca 4x10
Sentadilla 3 x 12 - 60kg
Plancha 3x45s
Remo 4x10 descanso 90s (agarre cerrado)`)
    expect(routine.days[0].title).toBe('Lunes')
    expect(routine.days[0].muscleGroups).toBe('Pecho')
    const [banca, sentadilla, plancha, remo] = routine.days[0].exercises
    expect(banca.name).toBe('Press banca')
    expect(sentadilla.weightKg).toBe(60)
    expect(plancha.weeks[0].groups[0].seconds).toBe(45)
    expect(remo.restSec).toBe(90)
    expect(remo.notes).toBe('agarre cerrado')
  })
})

// Prueba con el PDF real si está en la carpeta del proyecto (no se sube a ningún lado)
const root = join(__dirname, '../../..')
const pdfName = existsSync(root) ? readdirSync(root).find((f) => f.toLowerCase().endsWith('.pdf')) : undefined

describe.skipIf(!pdfName)('PDF real de la carpeta', () => {
  it('lee el PDF del gimnasio', async () => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const text = await pdfDataToText(new Uint8Array(readFileSync(join(root, pdfName!))), pdfjs)
    const { routine } = parseRoutineText(text, pdfName)
    expect(routine.days.length).toBe(4)
    expect(routine.days.map((d) => d.exercises.length)).toEqual([9, 7, 8, 7])
    expect(routine.startDate).toBe('2026-11-19')
    expect(routine.endDate).toBe('2026-12-19')
  }, 30000)
})
