import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db, reglesDuGroupe } from '../db'
import { RegleOverlay } from './RegleOverlay'

/**
 * Bouton crise (lot 11) : rouge, en permanence sur les écrans du profil,
 * utilisable par le jeune comme par l'éducateur — appui simple, sans
 * confirmation, une crise est urgente. Ouvre le rappel de règles réglé pour
 * ce profil (Paramétrage → Crise), puis enchaîne sur le séquentiel choisi.
 *
 * Rendu hors de <Routes>, comme BoutonFlottantMenu : ouvrir le rappel n'est
 * jamais une navigation tant qu'on n'a pas atteint le séquentiel.
 */
export function BoutonCrise() {
  const location = useLocation()
  const naviguer = useNavigate()
  const [regleIds, setRegleIds] = useState<string[]>([])
  const [sequenceId, setSequenceId] = useState<string | undefined>(undefined)
  const [ouvert, setOuvert] = useState(false)

  const profilId = location.pathname.match(/^\/profil\/([^/]+)/)?.[1]

  useEffect(() => {
    if (!profilId) return
    async function charger() {
      const profil = await db.profils.get(profilId!)
      const crise = profil?.crise
      if (!crise) {
        setRegleIds([])
        setSequenceId(undefined)
        return
      }
      const desGroupes = (await Promise.all(crise.groupeRegleIds.map(reglesDuGroupe))).flat()
      const ids = new Set([...crise.regleIds, ...desGroupes.map((r) => r.id)])
      setRegleIds([...ids])
      setSequenceId(crise.sequenceId)
    }
    void charger()
  }, [profilId, location.pathname])

  // Rien à rappeler, rien à afficher : pas de bouton mort à l'écran.
  if (!profilId || (regleIds.length === 0 && !sequenceId)) return null

  function declencher() {
    if (regleIds.length > 0) {
      setOuvert(true)
    } else if (sequenceId) {
      naviguer(`/profil/${profilId}/sequentiel/${sequenceId}`)
    }
  }

  function surFermeture() {
    setOuvert(false)
    if (sequenceId) naviguer(`/profil/${profilId}/sequentiel/${sequenceId}`)
  }

  return (
    <>
      <button
        type="button"
        aria-label="Bouton crise"
        onClick={declencher}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 60,
          width: 'var(--cible-jeune)',
          height: 'var(--cible-jeune)',
          borderRadius: '50%',
          background: 'var(--alerte)',
          color: 'var(--texte-sur-accent)',
          border: 'none',
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        !
      </button>

      {ouvert && (
        <RegleOverlay
          regleIds={regleIds}
          surFermeture={surFermeture}
          labelFermeture={sequenceId ? 'Continuer' : 'Fermer'}
        />
      )}
    </>
  )
}
