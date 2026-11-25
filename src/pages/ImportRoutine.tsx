// Cargar nueva rutina: PDF, foto(s), archivo de texto o texto pegado -> vista previa -> guardar
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAsActiveRoutine } from '../db/db'
import { parseRoutineText } from '../parser/parseRoutineText'
import { readPdfFile } from '../parser/pdfToText'
import { readImageFiles } from '../parser/imageToText'
import { getApiKey, parseWithClaude } from '../parser/claudeParser'
import { type Draft, emptyDay, toDraft } from '../lib/draft'
import RoutineEditor from '../components/RoutineEditor'
import { Button, Card, PageTitle } from '../components/ui'

interface Source {
  text: string
  fileName?: string
  image?: File
  /** true si el texto viene de una foto (OCR) */
  ocr?: boolean
}

export default function ImportRoutine() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [source, setSource] = useState<Source | null>(null)
  const [preview, setPreview] = useState<{ draft: Draft; warnings: string[]; version: number } | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  const interpret = (src: Source) => {
    const { routine, warnings } = parseRoutineText(src.text, src.fileName, { seriesOnFirstLine: src.ocr })
    setSource(src)
    setText(src.text)
    setPreview((p) => ({ draft: toDraft(routine), warnings, version: (p?.version ?? 0) + 1 }))
  }

  const onFiles = async (files: File[]) => {
    if (files.length === 0) return
    setError('')
    const first = files[0]
    const name = first.name.toLowerCase()
    try {
      if (first.type === 'application/pdf' || name.endsWith('.pdf')) {
        setBusy('Leyendo el PDF…')
        interpret({ text: await readPdfFile(first), fileName: first.name })
      } else if (first.type.startsWith('image/')) {
        setBusy('Leyendo la foto… 0%')
        const ocr = await readImageFiles(files, (p) => setBusy(`Leyendo la foto… ${p}%`))
        interpret({ text: ocr, fileName: first.name, image: files.length === 1 ? first : undefined, ocr: true })
      } else if (first.type.startsWith('text/') || name.endsWith('.txt')) {
        interpret({ text: await first.text(), fileName: first.name })
      } else {
        setError('Ese tipo de archivo no lo entiendo. Usá PDF, foto o .txt.')
      }
    } catch (e) {
      console.error(e)
      setError(
        first.type.startsWith('image/')
          ? 'No pude leer la foto. La primera vez necesita internet para bajar el idioma español.'
          : 'No pude leer el archivo. Probá de nuevo o pegá el texto abajo.',
      )
    } finally {
      setBusy('')
    }
  }

  const improveWithAI = async () => {
    if (!source) return
    setError('')
    setBusy('Consultando a Claude…')
    try {
      const { routine, warnings } = await parseWithClaude(source.text, source.image, source.fileName)
      setPreview((p) => ({ draft: toDraft(routine), warnings, version: (p?.version ?? 0) + 1 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo usar la IA.')
    } finally {
      setBusy('')
    }
  }

  const fileInputs = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf,text/plain,.txt,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void onFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void onFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
    </>
  )

  if (preview) {
    return (
      <div>
        <PageTitle>Revisá la rutina</PageTitle>
        <p className="-mt-2 mb-4 text-sm text-zinc-400">Así la entendí. Corregí lo que esté mal y guardala.</p>

        <div className="mb-4 flex flex-col gap-2">
          {getApiKey() && (
            <Button onClick={() => void improveWithAI()} disabled={!!busy}>
              {busy || '✨ Mejorar con IA (Claude)'}
            </Button>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button onClick={() => setShowRaw(!showRaw)} className="min-h-11 text-left text-sm text-zinc-400">
            {showRaw ? '▾' : '▸'} Ver / corregir el texto leído
          </button>
          {showRaw && (
            <Card className="flex flex-col gap-2">
              <textarea className="input min-h-48 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
              <Button onClick={() => interpret({ ...(source ?? {}), text })}>Volver a interpretar</Button>
            </Card>
          )}
        </div>

        <RoutineEditor
          key={preview.version}
          initial={preview.draft}
          warnings={preview.warnings}
          saveLabel="Guardar como rutina activa"
          onSave={async (r) => {
            await saveAsActiveRoutine(r)
            navigate('/')
          }}
        />
        <Button
          variant="ghost"
          className="mt-3 w-full"
          onClick={() => {
            setPreview(null)
            setSource(null)
          }}
        >
          ‹ Volver a cargar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageTitle back="/rutinas">Cargar nueva rutina</PageTitle>
      {fileInputs}

      <Button variant="primary" big onClick={() => fileRef.current?.click()} disabled={!!busy}>
        {busy || '📄 Subir PDF o foto'}
      </Button>
      <Button big onClick={() => photoRef.current?.click()} disabled={!!busy}>
        📷 Sacar foto a la rutina
      </Button>
      <p className="-mt-2 text-xs text-zinc-500">
        El PDF es lo más preciso. Con fotos: buena luz, sin sombras y la hoja derecha. Podés elegir varias fotos (una por
        página).
      </p>
      {error && <p className="text-sm text-red-300">{error}</p>}

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">O pegá el texto</h2>
        <textarea
          className="input min-h-48 font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Día 1: Pecho\nPress banca 4x10\nSentadilla 3 x 12 - 60kg\nPlancha 3x45s'}
        />
        <Button onClick={() => interpret({ text })} disabled={!text.trim()}>
          Interpretar texto
        </Button>
      </Card>

      <Button
        variant="ghost"
        onClick={() =>
          setPreview({
            draft: { number: '', startDate: '', endDate: '', weeksCount: 1, days: [emptyDay(1, 1)] },
            warnings: [],
            version: 1,
          })
        }
      >
        Cargarla a mano
      </Button>
    </div>
  )
}
