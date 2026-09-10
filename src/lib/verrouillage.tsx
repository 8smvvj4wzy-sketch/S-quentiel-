import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { LIMITES } from '../types'

export type Mode = 'jeune' | 'educateur'

type Verrouillage = {
  mode: Mode
  /** Passe en mode éducateur. Le PIN a déjà été vérifié par l'appelant. */
  ouvrirEducateur: () => void
  revenirModeJeune: () => void
  /** Repousse le retour automatique. À appeler sur toute interaction. */
  signalerActivite: () => void
}

const Contexte = createContext<Verrouillage | null>(null)

/**
 * Mode jeune par défaut au démarrage (SPEC §5). Retour automatique en mode
 * jeune après 5 minutes sans interaction dans l'espace éducateur.
 */
export function FournisseurVerrouillage({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('jeune')
  const minuterie = useRef<number | null>(null)

  const annulerMinuterie = useCallback(() => {
    if (minuterie.current !== null) {
      window.clearTimeout(minuterie.current)
      minuterie.current = null
    }
  }, [])

  const revenirModeJeune = useCallback(() => {
    annulerMinuterie()
    setMode('jeune')
  }, [annulerMinuterie])

  const signalerActivite = useCallback(() => {
    if (mode !== 'educateur') return
    annulerMinuterie()
    minuterie.current = window.setTimeout(() => {
      setMode('jeune')
      minuterie.current = null
    }, LIMITES.inactiviteEducateurMs)
  }, [mode, annulerMinuterie])

  const ouvrirEducateur = useCallback(() => {
    setMode('educateur')
  }, [])

  // Arme la minuterie dès l'entrée dans l'espace éducateur, puis à chaque
  // interaction réelle sur la page.
  useEffect(() => {
    if (mode !== 'educateur') {
      annulerMinuterie()
      return
    }
    signalerActivite()
    const evenements: (keyof WindowEventMap)[] = ['pointerdown', 'keydown']
    for (const nom of evenements) window.addEventListener(nom, signalerActivite)
    return () => {
      for (const nom of evenements) window.removeEventListener(nom, signalerActivite)
    }
  }, [mode, signalerActivite, annulerMinuterie])

  useEffect(() => annulerMinuterie, [annulerMinuterie])

  const valeur = useMemo<Verrouillage>(
    () => ({ mode, ouvrirEducateur, revenirModeJeune, signalerActivite }),
    [mode, ouvrirEducateur, revenirModeJeune, signalerActivite],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useVerrouillage(): Verrouillage {
  const valeur = useContext(Contexte)
  if (!valeur) throw new Error('useVerrouillage hors de FournisseurVerrouillage')
  return valeur
}
