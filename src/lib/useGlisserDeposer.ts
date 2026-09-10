import { useRef, useState } from 'react'

/**
 * Réordonnancement tactile d'une liste verticale, sans dépendance externe.
 * `onDepot` reçoit le nouvel ordre au relâchement (glisser-déposer, SPEC
 * §4.6 « réordonnancement par glisser-déposer »).
 */
export function useGlisserDeposer<T extends { id: string }>(
  items: T[],
  onDepot: (items: T[]) => void,
) {
  const [ordreProvisoire, setOrdreProvisoire] = useState<T[] | null>(null)
  const [idEnGlisse, setIdEnGlisse] = useState<string | null>(null)
  const lignes = useRef(new Map<string, HTMLElement>())

  const liste = ordreProvisoire ?? items

  function enregistrerLigne(id: string, el: HTMLElement | null) {
    if (el) lignes.current.set(id, el)
    else lignes.current.delete(id)
  }

  function positionSurvolee(y: number, courant: T[]): number {
    for (let i = 0; i < courant.length; i++) {
      const el = lignes.current.get(courant[i].id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (y < rect.top + rect.height / 2) return i
    }
    return courant.length - 1
  }

  function poignee(id: string) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault()
        setIdEnGlisse(id)
        setOrdreProvisoire(items)
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (idEnGlisse !== id) return
        setOrdreProvisoire((courant) => {
          const base = courant ?? items
          const depuis = base.findIndex((x) => x.id === id)
          const vers = positionSurvolee(e.clientY, base)
          if (depuis === -1 || depuis === vers) return base
          const copie = base.slice()
          const [retire] = copie.splice(depuis, 1)
          copie.splice(vers, 0, retire)
          return copie
        })
      },
      onPointerUp: () => {
        if (ordreProvisoire) onDepot(ordreProvisoire)
        setIdEnGlisse(null)
        setOrdreProvisoire(null)
      },
      onPointerCancel: () => {
        setIdEnGlisse(null)
        setOrdreProvisoire(null)
      },
      style: { touchAction: 'none' as const, cursor: 'grab' },
    }
  }

  return { liste, poignee, enregistrerLigne, idEnGlisse }
}
