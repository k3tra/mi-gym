// Ajustes del usuario, guardados en el celular (localStorage).
// useSettings() hace que la pantalla se actualice cuando cambian.
import { useSyncExternalStore } from 'react'

export interface Settings {
  /** Descanso por defecto en segundos (si el ejercicio no trae uno) */
  defaultRestSec: number
  sound: boolean
  vibrate: boolean
}

const KEY = 'gym-settings'
const DEFAULTS: Settings = { defaultRestSec: 90, sound: true, vibrate: true }
const listeners = new Set<() => void>()

function read(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

let current = read()

export function getSettings(): Settings {
  return current
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // modo incógnito o almacenamiento bloqueado: los ajustes duran hasta cerrar la app
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings)
}
