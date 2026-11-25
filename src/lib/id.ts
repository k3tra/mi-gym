// crypto.randomUUID no funciona al entrar por http://IP (contexto no seguro), así que usamos esto.
export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
