// Tipos de datos de toda la app.

/** Un bloque de series: "4x10" = 4 series de 10 reps. "3x45s" = 3 series de 45 segundos. */
export interface SetGroup {
  sets: number
  reps?: number
  seconds?: number
  /** true si son series de aproximación (ej: el "2x15" de "2x15/4x12") */
  warmup?: boolean
}

/** Lo que hay que hacer en una semana: uno o más bloques (aproximación + efectivas). */
export interface SetScheme {
  groups: SetGroup[]
}

export interface Exercise {
  id: string
  name: string
  /** Un esquema por semana (siempre tiene `weeksCount` elementos) */
  weeks: SetScheme[]
  weightKg?: number
  restSec?: number
  notes?: string
}

export interface Day {
  id: string
  /** Título corto: "Día 1", "Lunes" */
  title: string
  /** Grupos musculares: "Abdomen/Pecho/Triceps" */
  muscleGroups: string
  exercises: Exercise[]
}

export type RoutineStatus = 'active' | 'archived'

export interface Routine {
  id?: number
  /** Número de rutina del gimnasio (puede faltar) */
  number: number | null
  /** Fechas en formato "AAAA-MM-DD" */
  startDate: string | null
  endDate: string | null
  weeksCount: number
  days: Day[]
  status: RoutineStatus
  createdAt: number
}

/** Una vez que entrenaste un día (Etapa 2) */
export interface Session {
  id?: number
  routineId: number
  dayId: string
  week: number
  startedAt: number
  finishedAt?: number
}

/** Una serie hecha (Etapa 2) */
export interface SetLog {
  id?: number
  sessionId: number
  routineId: number
  exerciseId: string
  /** Nombre normalizado, para encontrar el mismo ejercicio en otras rutinas */
  exerciseKey: string
  exerciseName: string
  week: number
  setIndex: number
  reps?: number
  seconds?: number
  weightKg?: number
  doneAt: number
}

/** Un ayuno (Etapa 3) */
export interface Fast {
  id?: number
  startAt: number
  targetHours: number
  endedAt?: number
  /** Cuándo se avisó que se cumplió el objetivo (para no avisar dos veces) */
  notifiedAt?: number
}

/** Resultado del parser: la rutina + avisos para mostrar en la vista previa */
export interface ParseResult {
  routine: Omit<Routine, 'id' | 'status' | 'createdAt'>
  warnings: string[]
}
