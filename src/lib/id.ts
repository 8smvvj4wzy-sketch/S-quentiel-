/** Identifiants locaux. Pas de réseau, pas de collision en pratique. */
export function nouvelId(prefixe: string): string {
  const alea =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefixe}_${Date.now().toString(36)}${alea}`
}
