import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { creneauEtActivite, db, listerRegles } from '../db'
import { creneauDepuisChemin } from '../lib/contexteActivite'
import { useVerrouillage } from '../lib/verrouillage'
import type { Regle } from '../types'
import { TLAOverlay } from './TLAOverlay'
import { RegleOverlay } from './RegleOverlay'

type Panneau = 'menu' | 'choix-regle' | 'tla' | null

/**
 * Menu flottant présent sur tous les écrans d'un profil (SPEC §4.5) : accès
 * au TLA, et déclenchement d'un rappel de règle « à tout moment » (SPEC
 * §4.4). Rendu hors de <Routes>, comme <CoinEducateur> : ouvrir un panneau
 * n'est jamais une navigation, l'écran en dessous ne perd donc aucun état.
 */
export function BoutonFlottantMenu() {
  const location = useLocation()
  const { mode } = useVerrouillage()
  const [panneau, setPanneau] = useState<Panneau>(null)
  const [reglesDisponibles, setReglesDisponibles] = useState<Regle[]>([])
  const [regleOuverte, setRegleOuverte] = useState<string | null>(null)

  const profilId = location.pathname.match(/^\/profil\/([^/]+)/)?.[1]

  useEffect(() => {
    if (!profilId) return
    async function charger() {
      const profil = await db.profils.get(profilId!)
      if (!profil) return
      const ids = new Set(profil.reglesJournee)
      const creneauId = creneauDepuisChemin(location.pathname, location.search)
      if (creneauId) {
        const r = await creneauEtActivite(profilId!, creneauId)
        r?.activite.regleIds.forEach((id) => ids.add(id))
      }
      const toutes = await listerRegles()
      setReglesDisponibles(toutes.filter((r) => ids.has(r.id)))
    }
    void charger()
  }, [profilId, location.pathname, location.search])

  if (!profilId || mode === 'educateur') return null

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setPanneau('menu')}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 60,
          width: 'var(--cible-jeune)',
          height: 'var(--cible-jeune)',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--texte-sur-accent)',
          border: 'none',
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        ⁝
      </button>

      {panneau === 'menu' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(28, 28, 30, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: 'calc(var(--pas) * 2)',
          }}
          onClick={() => setPanneau(null)}
        >
          <div
            className="pile"
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--bordure-forte)',
              borderRadius: 'var(--rayon)',
              padding: 'calc(var(--pas) * 2)',
              marginBottom: 'calc(var(--cible-jeune) + var(--pas))',
              minWidth: '16rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="bouton bouton--accent" onClick={() => setPanneau('tla')}>
              Tableau de communication
            </button>
            {reglesDisponibles.length > 0 && (
              <button
                type="button"
                className="bouton"
                onClick={() => {
                  if (reglesDisponibles.length === 1) {
                    setRegleOuverte(reglesDisponibles[0].id)
                    setPanneau(null)
                  } else {
                    setPanneau('choix-regle')
                  }
                }}
              >
                Rappeler une règle
              </button>
            )}
          </div>
        </div>
      )}

      {panneau === 'choix-regle' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choisir une règle"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(28, 28, 30, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'calc(var(--pas) * 2)',
          }}
        >
          <div
            className="pile"
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--bordure-forte)',
              borderRadius: 'var(--rayon)',
              padding: 'calc(var(--pas) * 3)',
              maxWidth: '24rem',
              width: '100%',
            }}
          >
            <h2 style={{ fontSize: 22 }}>Quelle règle ?</h2>
            {reglesDisponibles.map((r) => (
              <button
                key={r.id}
                type="button"
                className="bouton"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => {
                  setRegleOuverte(r.id)
                  setPanneau(null)
                }}
              >
                {r.texte}
              </button>
            ))}
            <button type="button" className="bouton" onClick={() => setPanneau(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {panneau === 'tla' && <TLAOverlay profilId={profilId} surFermeture={() => setPanneau(null)} />}
      {regleOuverte && <RegleOverlay regleId={regleOuverte} surFermeture={() => setRegleOuverte(null)} />}
    </>
  )
}
