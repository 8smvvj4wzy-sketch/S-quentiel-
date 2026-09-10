import { useCallback, useEffect, useRef, useState } from 'react'
import { LIMITES } from '../types'

/**
 * Appui long de 3 secondes (SPEC §4.6). Volontairement peu découvrable, mais
 * rapide pour un adulte prévenu : la progression est renvoyée pour donner un
 * retour discret pendant l'appui.
 */
export function useAppuiLong(surDeclenchement: () => void, dureeMs = LIMITES.appuiLongMs) {
  const [progression, setProgression] = useState(0)
  const debut = useRef(0)
  const image = useRef<number | null>(null)
  const rappel = useRef(surDeclenchement)
  rappel.current = surDeclenchement

  const arreter = useCallback(() => {
    if (image.current !== null) cancelAnimationFrame(image.current)
    image.current = null
    setProgression(0)
  }, [])

  const boucle = useCallback(() => {
    const ecoule = performance.now() - debut.current
    const part = Math.min(1, ecoule / dureeMs)
    setProgression(part)
    if (part >= 1) {
      arreter()
      rappel.current()
      return
    }
    image.current = requestAnimationFrame(boucle)
  }, [dureeMs, arreter])

  const demarrer = useCallback(() => {
    if (image.current !== null) return
    debut.current = performance.now()
    image.current = requestAnimationFrame(boucle)
  }, [boucle])

  useEffect(() => arreter, [arreter])

  return {
    progression,
    liaisons: {
      onPointerDown: demarrer,
      onPointerUp: arreter,
      onPointerLeave: arreter,
      onPointerCancel: arreter,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  }
}
