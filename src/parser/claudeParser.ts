// OPCIONAL: mejorar la interpretación de la rutina con la API de Claude.
// Solo se usa si cargaste tu propia clave en Ajustes y tocás "Mejorar con IA".
// Le pedimos a Claude que reescriba la rutina en el formato simple que entiende
// nuestro parser, así el resultado pasa por la misma vista previa editable.
import type Anthropic from '@anthropic-ai/sdk'
import { parseRoutineText } from './parseRoutineText'
import type { ParseResult } from '../types'

const KEY_STORAGE = 'gym-anthropic-key'

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(KEY_STORAGE, key.trim())
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // almacenamiento bloqueado
  }
}

const INSTRUCTIONS = `Sos un asistente que transcribe rutinas de gimnasio. Te paso una rutina (texto sacado de un PDF o una foto, puede tener errores de lectura).
Reescribila EXACTAMENTE en este formato de texto plano, sin explicaciones ni markdown:

NUMERO DE RUTINA: <número, si aparece>
FECHA DE INICIO: <dd/mm/aaaa, si aparece>
RUTINA VALIDA HASTA EL <dd/mm/aaaa, si aparece>
DIA 1: <GRUPOS MUSCULARES> SEMANA 1 SEMANA 2 SEMANA 3 SEMANA 4
<NOMBRE DEL EJERCICIO> <series semana 1> <series semana 2> ...
...

Reglas:
- Un ejercicio por línea, con el nombre completo en una sola línea.
- Series como 4x10. Aproximación + efectivas: 2x15/4x12. Por tiempo: 3x45s.
- Si solo hay una columna de series, poné una sola. Incluí "SEMANA n" en la línea del día solo si hay progresión por semanas.
- Si hay peso escribilo como "60kg" después de las series; descanso como "descanso 90s"; notas entre paréntesis.
- Corregí errores obvios de lectura (letras O por ceros, palabras cortadas) pero no inventes ejercicios.
- No incluyas datos personales (nombre, edad, peso corporal, mail, lesiones).`

/**
 * Manda el texto (y opcionalmente la foto) a Claude y devuelve la rutina interpretada.
 * Tira un Error con un mensaje en español si algo falla.
 */
export async function parseWithClaude(text: string, image?: File, fileName?: string): Promise<ParseResult> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Primero cargá tu clave de la API de Claude en Ajustes.')

  const { default: AnthropicClient } = await import('@anthropic-ai/sdk')
  // La clave es tuya y queda solo en este celular, por eso permitimos usarla desde el navegador.
  const client = new AnthropicClient({ apiKey, dangerouslyAllowBrowser: true })

  const content: Anthropic.Beta.BetaContentBlockParam[] = []
  if (image) {
    const data = await fileToBase64(image)
    const media = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(image.type) ? image.type : 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp'
    content.push({ type: 'image', source: { type: 'base64', media_type: media, data } })
  }
  content.push({ type: 'text', text: `Rutina a transcribir:\n\n${text || '(ver la imagen)'}` })

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low' },
      // Si el modelo principal se niega por un falso positivo, la API reintenta sola con otro modelo
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: INSTRUCTIONS,
      messages: [{ role: 'user', content }],
    })
    if (response.stop_reason === 'refusal') throw new Error('Claude no pudo procesar esta rutina. Probá con el parser normal.')
    const out = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
    const result = parseRoutineText(out, fileName)
    result.warnings.unshift('✨ Interpretada con IA: revisala igual antes de guardar.')
    return result
  } catch (e) {
    if (e instanceof Error && !(e instanceof AnthropicClient.APIError)) throw e
    if (e instanceof AnthropicClient.AuthenticationError) throw new Error('La clave de la API no es válida. Revisala en Ajustes.')
    if (e instanceof AnthropicClient.RateLimitError) throw new Error('Demasiados pedidos seguidos. Esperá un minuto y probá de nuevo.')
    if (e instanceof AnthropicClient.APIConnectionError) throw new Error('No hay conexión a internet.')
    if (e instanceof AnthropicClient.APIError) throw new Error(`Error de la API (${e.status ?? '?'}). Probá más tarde.`)
    throw new Error('No se pudo usar la IA.')
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error('No pude leer la imagen.'))
    reader.readAsDataURL(file)
  })
}
