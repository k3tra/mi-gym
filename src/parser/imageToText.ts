// Leer el texto de una FOTO de la rutina (OCR) con Tesseract.js.
// Todo corre en el celular; solo la primera vez descarga el "diccionario" de español (~2 MB).
import { PAGE_BREAK } from './parseRoutineText'

/** Arregla errores típicos del OCR en las series: "4X1O" -> "4x10", "3xl2" -> "3x12" */
export function fixOcrText(text: string): string {
  const digitLike = (s: string) => s.replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/[Ss]/g, '5')
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        // letra suelta al principio por manchas o la marca de agua ("a APERTURA ...")
        .replace(/^[a-z]\s+(?=[A-ZÁÉÍÓÚÑ]{2})/, '')
        // "4" leído como "a" o "A" ("ax10" -> "4x10")
        .replace(/(^|\s)[aA]\s*[xX×]\s*(\d)/g, '$14x$2')
        // X repetida ("4xX25" -> "4x25")
        .replace(/(\d)\s*[xX×]\s*[xX×]\s*(\d)/g, '$1x$2')
        // separadores raros entre aproximación y series ("2X15|4X12", "2x15 \ 4x12")
        .replace(/(\d)\s*[|\\]\s*(\d+\s*[xX×])/g, '$1/$2')
        // "4 X 1O", "4x l2", "4*10"
        .replace(/\b([0-9OIl]{1,2})\s*[xX×*]\s*([0-9OoIlS]{1,3})\b/g, (_m, a: string, b: string) => `${digitLike(a)}x${digitLike(b)}`),
    )
    .join('\n')
}

export async function readImageFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('spa', undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100))
    },
  })
  try {
    const { data } = await worker.recognize(file)
    return fixOcrText(data.text)
  } finally {
    await worker.terminate()
  }
}

/** Varias fotos (una por página) -> un solo texto */
export async function readImageFiles(files: File[], onProgress?: (pct: number) => void): Promise<string> {
  const parts: string[] = []
  for (let i = 0; i < files.length; i++) {
    parts.push(await readImageFile(files[i], (p) => onProgress?.(Math.round(((i + p / 100) / files.length) * 100))))
  }
  return parts.join(`\n${PAGE_BREAK}\n`)
}
