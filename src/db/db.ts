// Base de datos local del celular (IndexedDB), usando la librería Dexie.
// Todo queda guardado en el dispositivo: no hay servidor.
import Dexie, { type EntityTable } from 'dexie'
import type { Fast, Routine, Session, SetLog } from '../types'

class GymDB extends Dexie {
  routines!: EntityTable<Routine, 'id'>
  sessions!: EntityTable<Session, 'id'>
  setLogs!: EntityTable<SetLog, 'id'>
  fasts!: EntityTable<Fast, 'id'>

  constructor() {
    super('gym-app')
    // Solo se listan los campos por los que se busca. Si cambiás esto, subí el número de versión.
    this.version(1).stores({
      routines: '++id, status, createdAt',
      sessions: '++id, routineId, startedAt, finishedAt',
      setLogs: '++id, sessionId, routineId, exerciseKey, doneAt',
      fasts: '++id, startAt',
    })
  }
}

export const db = new GymDB()

type RoutineData = Omit<Routine, 'id' | 'status' | 'createdAt'>

/** Guarda una rutina nueva como activa y archiva la anterior (nunca se borra). */
export async function saveAsActiveRoutine(data: RoutineData): Promise<number> {
  return db.transaction('rw', db.routines, async () => {
    await db.routines.where('status').equals('active').modify({ status: 'archived' })
    return (await db.routines.add({ ...data, status: 'active', createdAt: Date.now() })) as number
  })
}

/** Corrige una rutina ya guardada (mantiene si es activa o archivada). */
export async function updateRoutine(id: number, data: RoutineData): Promise<void> {
  await db.routines.update(id, data)
}

/** Vuelve a activar una rutina archivada. */
export async function activateRoutine(id: number): Promise<void> {
  await db.transaction('rw', db.routines, async () => {
    await db.routines.where('status').equals('active').modify({ status: 'archived' })
    await db.routines.update(id, { status: 'active' })
  })
}
