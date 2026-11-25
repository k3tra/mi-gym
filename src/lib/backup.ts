// Copia de seguridad: exportar / importar todos los datos en un archivo .json.
// Importante porque los datos viven solo en este celular.
import { db } from '../db/db'
import { getSettings, updateSettings, type Settings } from './settings'

interface Backup {
  app: 'mi-gym'
  version: 1
  exportedAt: string
  settings: Settings
  routines: unknown[]
  sessions: unknown[]
  setLogs: unknown[]
  fasts: unknown[]
}

export async function exportBackup(): Promise<void> {
  const data: Backup = {
    app: 'mi-gym',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    routines: await db.routines.toArray(),
    sessions: await db.sessions.toArray(),
    setLogs: await db.setLogs.toArray(),
    fasts: await db.fasts.toArray(),
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mi-gym-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Reemplaza TODOS los datos por los del archivo. Tira error si el archivo no es válido. */
export async function importBackup(file: File): Promise<void> {
  const data = JSON.parse(await file.text()) as Partial<Backup>
  if (data.app !== 'mi-gym' || !Array.isArray(data.routines) || !Array.isArray(data.setLogs)) {
    throw new Error('Ese archivo no es un backup de Mi Gym.')
  }
  await db.transaction('rw', [db.routines, db.sessions, db.setLogs, db.fasts], async () => {
    await Promise.all([db.routines.clear(), db.sessions.clear(), db.setLogs.clear(), db.fasts.clear()])
    await db.routines.bulkAdd(data.routines as never[])
    await db.sessions.bulkAdd((data.sessions ?? []) as never[])
    await db.setLogs.bulkAdd(data.setLogs as never[])
    await db.fasts.bulkAdd((data.fasts ?? []) as never[])
  })
  if (data.settings) updateSettings(data.settings)
}
