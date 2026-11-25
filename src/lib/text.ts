/** Saca tildes y pasa a minúsculas: "Elevación" -> "elevacion" */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** "PRESS INCLINADO HAMMER" -> "Press inclinado hammer" (solo si venía todo en mayúsculas) */
export function prettyName(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t !== t.toUpperCase()) return t
  const lower = t.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** "ABDOMEN/PECHO/TRICEPS" -> "Abdomen/Pecho/Triceps" */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s/,-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    .trim()
}
