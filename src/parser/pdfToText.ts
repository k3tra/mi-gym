// Saca el texto de un PDF usando pdf.js (de Mozilla), página por página.
import { PAGE_BREAK } from './parseRoutineText'

interface TextItem {
  str: string
  transform: number[]
  width: number
  hasEOL?: boolean
}

/** Junta los pedacitos de texto de pdf.js en líneas (en el orden en que vienen en el PDF). */
export function itemsToLines(items: unknown[]): string[] {
  const lines: string[] = []
  let cur = ''
  let lastY: number | null = null
  let lastEndX = 0
  const push = () => {
    if (cur.trim()) lines.push(cur.replace(/\s+/g, ' ').trim())
    cur = ''
  }
  for (const raw of items) {
    if (!raw || typeof raw !== 'object' || !('str' in raw)) continue
    const it = raw as TextItem
    const x = it.transform[4]
    const y = it.transform[5]
    if (lastY !== null && Math.abs(y - lastY) > 2) push()
    if (cur && x - lastEndX > 1 && !cur.endsWith(' ') && !it.str.startsWith(' ')) cur += ' '
    cur += it.str
    lastY = y
    lastEndX = x + it.width
    if (it.hasEOL) {
      push()
      lastY = null
    }
  }
  push()
  return lines
}

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs')

/** Lee todas las páginas y devuelve el texto, con una marca entre páginas. */
export async function pdfDataToText(data: Uint8Array, pdfjs: PdfJs): Promise<string> {
  const task = pdfjs.getDocument({ data })
  const doc = await task.promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    pages.push(itemsToLines(content.items).join('\n'))
  }
  await task.destroy()
  return pages.join(`\n${PAGE_BREAK}\n`)
}

/** Versión para el navegador: recibe el archivo que elegiste en la pantalla. */
export async function readPdfFile(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const data = new Uint8Array(await file.arrayBuffer())
  return pdfDataToText(data, pdfjs)
}
