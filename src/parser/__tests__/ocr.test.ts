import { describe, expect, it } from 'vitest'
import { fixOcrText } from '../imageToText'
import { parseRoutineText } from '../parseRoutineText'

describe('fixOcrText', () => {
  it('corrige letras leídas como números en las series', () => {
    expect(fixOcrText('PRESS PLANO LIBRE 4X1O')).toBe('PRESS PLANO LIBRE 4x10')
    expect(fixOcrText('REMO 3 x l2')).toBe('REMO 3x12')
    expect(fixOcrText('APERTURA 2X15|4X12')).toBe('APERTURA 2x15/4x12')
  })
  it('el texto corregido se interpreta bien', () => {
    const { routine } = parseRoutineText(fixOcrText('DIA 1: PECHO\nPRESS PLANO LIBRE 4X1O\nAPERTURA 2X15|4X12'))
    expect(routine.days[0].exercises.map((e) => e.name)).toEqual(['Press plano libre', 'Apertura'])
  })
})

describe('rutina leída de una foto', () => {
  // Así salió el OCR de una foto real (sin datos personales)
  const OCR = `NUMERO DE RUTINA: 2
FECHA DE INICIO: 19/11/2026
DIA 1: ABDOMEN/PECHO/TRICEPS SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
CORTOS EN BANCO DECLINADO CON DISCO 4x20
ELEVACION DE PIERNAS EN PARALELAS 4xX25
a APERTURA INCLINADA CON MANCUERNAS — 2x15/4x12
PRESS INCLINADO HAMMER ax10 5x10 6x10 ax10
PRESS PLANO LIBRE ax10
APERTURA PLANA CON MANCUERNAS 4xX12
EXTENSION DE TRICEPS EN POLEA ALTA CON ax12
BARRA T
FRANCES TRAS NUCA CON BARRA T EN ax10
POLEA ALTA
FRANCES TRAS NUCA CON BARRA W ax10
ACOSTADO
DIA 2: HOMBROS/BICEPS SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
PRESS DE HOMBROS HAMMER ax10 5x10 6x10 ax10`

  it('corrige y arma los ejercicios', () => {
    const { routine } = parseRoutineText(fixOcrText(OCR), undefined, { seriesOnFirstLine: true })
    const d1 = routine.days[0].exercises
    expect(d1.map((e) => e.name)).toEqual([
      'Cortos en banco declinado con disco',
      'Elevacion de piernas en paralelas',
      'Apertura inclinada con mancuernas',
      'Press inclinado hammer',
      'Press plano libre',
      'Apertura plana con mancuernas',
      'Extension de triceps en polea alta con barra t',
      'Frances tras nuca con barra t en polea alta',
      'Frances tras nuca con barra w acostado',
    ])
    expect(d1[1].weeks[0].groups[0].reps).toBe(25)
    expect(d1[3].weeks.map((w) => w.groups[0].sets)).toEqual([4, 5, 6, 4])
    expect(routine.days[1].exercises[0].name).toBe('Press de hombros hammer')
  })
})
