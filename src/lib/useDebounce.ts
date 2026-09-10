import { useEffect, useState } from 'react'

/**
 * Renvoie `valeur` après `delaiMs` sans changement. Le catalogue ARASAAC
 * compte plus de 13 000 entrées : sans ça, on le reparcourt à chaque frappe.
 */
export function useDebounce<T>(valeur: T, delaiMs = 150): T {
  const [retardee, setRetardee] = useState(valeur)

  useEffect(() => {
    const minuterie = setTimeout(() => setRetardee(valeur), delaiMs)
    return () => clearTimeout(minuterie)
  }, [valeur, delaiMs])

  return retardee
}
