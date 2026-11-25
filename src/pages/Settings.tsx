// Ajustes: descanso por defecto, sonido, vibración y copia de seguridad
import { useRef, useState } from 'react'
import { updateSettings, useSettings } from '../lib/settings'
import { alertDone, unlockAudio } from '../lib/sound'
import { exportBackup, importBackup } from '../lib/backup'
import { restLabel } from '../lib/time'
import { getApiKey, setApiKey } from '../parser/claudeParser'
import { Button, Card, PageTitle } from '../components/ui'

const REST_OPTIONS = [30, 45, 60, 90, 120, 180]

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex min-h-12 w-full items-center justify-between text-left">
      <span className="font-medium">{label}</span>
      <span className={`flex h-8 w-14 items-center rounded-full p-1 transition ${checked ? 'bg-lime-400' : 'bg-zinc-700'}`}>
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? 'translate-x-6' : ''}`} />
      </span>
    </button>
  )
}

/** Clave opcional de la API de Claude para "Mejorar con IA" al cargar una rutina */
function AiCard() {
  const [key, setKey] = useState(getApiKey)
  const [saved, setSaved] = useState(!!getApiKey())
  return (
    <Card>
      <h2 className="font-semibold">✨ IA para leer rutinas (opcional)</h2>
      <p className="mb-3 text-sm text-zinc-400">
        Si cargás una clave de la API de Claude, al importar una rutina aparece el botón “Mejorar con IA”. El texto (y la
        foto, si subiste una) se envía a Anthropic solo cuando tocás ese botón. Tiene costo según tu cuenta. La clave queda
        guardada únicamente en este celular.
      </p>
      <input
        className="input font-mono text-sm"
        type="password"
        autoComplete="off"
        placeholder="sk-ant-..."
        value={key}
        onChange={(e) => {
          setKey(e.target.value)
          setSaved(false)
        }}
      />
      <div className="mt-2 flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            setApiKey(key)
            setSaved(!!key.trim())
          }}
        >
          {saved ? '✓ Guardada' : 'Guardar clave'}
        </Button>
        {saved && (
          <Button
            variant="danger"
            onClick={() => {
              setApiKey('')
              setKey('')
              setSaved(false)
            }}
          >
            Borrar
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function Settings() {
  const s = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Ajustes</PageTitle>

      <Card>
        <h2 className="font-semibold">Descanso por defecto</h2>
        <p className="mb-3 text-sm text-zinc-400">Se usa cuando el ejercicio no trae su propio descanso.</p>
        <div className="grid grid-cols-3 gap-2">
          {REST_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => updateSettings({ defaultRestSec: sec })}
              className={`min-h-12 rounded-xl font-semibold ${s.defaultRestSec === sec ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800'}`}
            >
              {restLabel(sec)}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
          Otro (segundos):
          <input
            className="input w-24"
            inputMode="numeric"
            defaultValue={REST_OPTIONS.includes(s.defaultRestSec) ? '' : s.defaultRestSec}
            onBlur={(e) => {
              const n = parseInt(e.target.value, 10)
              if (n > 0 && n <= 1800) updateSettings({ defaultRestSec: n })
            }}
          />
        </label>
      </Card>

      <Card>
        <h2 className="font-semibold">Aviso al terminar el descanso</h2>
        <Toggle label="🔔 Sonido" checked={s.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Toggle label="📳 Vibración" checked={s.vibrate} onChange={(v) => updateSettings({ vibrate: v })} />
        <p className="text-xs text-zinc-500">La vibración funciona en Android. En iPhone, Safari no la permite.</p>
        <Button
          className="mt-3 w-full"
          onClick={() => {
            unlockAudio()
            alertDone()
          }}
        >
          Probar aviso
        </Button>
      </Card>

      <AiCard />

      <Card>
        <h2 className="font-semibold">Copia de seguridad</h2>
        <p className="mb-3 text-sm text-zinc-400">
          Tus datos están solo en este celular. Descargá un backup de vez en cuando (o antes de cambiar de celular).
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() =>
              exportBackup()
                .then(() => setMsg('✓ Backup descargado.'))
                .catch(() => setMsg('No pude generar el backup.'))
            }
          >
            ⬇ Descargar backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              setPendingFile(e.target.files?.[0] ?? null)
              setMsg('')
              e.target.value = ''
            }}
          />
          {!pendingFile ? (
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              ⬆ Restaurar desde un backup
            </Button>
          ) : (
            <div className="rounded-xl border border-red-500/40 p-3">
              <p className="mb-2 text-sm">
                Esto <b>reemplaza todos tus datos</b> por los de “{pendingFile.name}”. ¿Seguro?
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setPendingFile(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() =>
                    importBackup(pendingFile)
                      .then(() => setMsg('✓ Datos restaurados.'))
                      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : 'No pude leer el archivo.'))
                      .finally(() => setPendingFile(null))
                  }
                >
                  Sí, restaurar
                </Button>
              </div>
            </div>
          )}
          {msg && <p className="text-sm text-zinc-300">{msg}</p>}
        </div>
      </Card>
    </div>
  )
}
