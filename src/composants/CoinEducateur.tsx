import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppuiLong } from '../lib/useAppuiLong'
import { useVerrouillage } from '../lib/verrouillage'
import { SaisiePin } from './SaisiePin'

/**
 * Zone d'appui long en haut à droite de l'écran (SPEC §4.6).
 * Invisible tant qu'on n'appuie pas : un liseré se remplit pendant les 3 s.
 */
export function CoinEducateur() {
  const [demandePin, setDemandePin] = useState(false)
  const { mode, ouvrirEducateur } = useVerrouillage()
  const naviguer = useNavigate()
  const { progression, liaisons } = useAppuiLong(() => setDemandePin(true))

  if (mode === 'educateur') return null

  return (
    <>
      <div
        {...liaisons}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'var(--cible)',
          height: 'var(--cible)',
          zIndex: 50,
          touchAction: 'none',
          borderTop: `4px solid var(--accent)`,
          borderRight: `4px solid var(--accent)`,
          opacity: progression,
        }}
      />
      {demandePin && (
        <SaisiePin
          surAnnulation={() => setDemandePin(false)}
          surSucces={() => {
            setDemandePin(false)
            ouvrirEducateur()
            naviguer('/educateur')
          }}
        />
      )}
    </>
  )
}
