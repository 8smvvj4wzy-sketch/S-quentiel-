import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { creneauEtActivite, db, listerGroupesRegles, listerRegles } from '../db'
import { creneauDepuisChemin } from '../lib/contexteActivite'
import type { GroupeRegles, Regle } from '../types'
import { TLAOverlay } from './TLAOverlay'
import { RegleOverlay } from './RegleOverlay'

type Panneau = 'menu' | 'choix-regle' | 'tla' | null

/** Une entrée du choix : une règle seule ou un ensemble entier. */
type Rappel = { cle: string; libelle: string; regleIds: string[]; ensemble: boolean }

/**
 * Menu flottant présent sur tous les écrans d'un profil (SPEC §4.5) : accès
 * au TLA, et déclenchement d'un rappel de règle « à tout moment » (SPEC
 * §4.4). Rendu hors de <Routes> : ouvrir un panneau n'est jamais une
 * navigation, l'écran en dessous ne perd donc aucun état.
 */
export function BoutonFlottantMenu() {
  const location = useLocation()
  const [panneau, setPanneau] = useState<Panneau>(null)
  const [rappels, setRappels] = useState<Rappel[]>([])
  const [regleOuverte, setRegleOuverte] = useState<string[] | null>(null)

  const profilId = location.pathname.match(/^\/profil\/([^/]+)/)?.[1]

  useEffect(() => {
    if (!profilId) return
    async function charger() {
      const profil = await db.profils.get(profilId!)
      if (!profil) return
      const idsRegles = new Set(profil.reglesJournee)
      const idsGroupes = new Set(profil.groupesJournee ?? [])
      const creneauId = creneauDepuisChemin(location.pathname, location.search)
      if (creneauId) {
        const r = await creneauEtActivite(profilId!, creneauId)
        r?.activite.regleIds.forEach((id) => idsRegles.add(id))
        r?.activite.groupeRegleIds?.forEach((id) => idsGroupes.add(id))
      }
      const [toutes, tousLesGroupes] = await Promise.all([listerRegles(), listerGroupesRegles()])
      // Les ensembles d'abord : c'est le rappel le plus courant en atelier.
      setRappels([
        ...tousLesGroupes
          .filter((g: GroupeRegles) => idsGroupes.has(g.id))
          .map((g) => ({ cle: g.id, libelle: g.nom, regleIds: g.regleIds, ensemble: true })),
        ...toutes
          .filter((r: Regle) => idsRegles.has(r.id))
          .map((r) => ({ cle: r.id, libelle: r.texte, regleIds: [r.id], ensemble: false })),
      ])
    }
    void charger()
  }, [profilId, location.pathname, location.search])

  if (!profilId) return null

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
              borderRadius: 'var(--rayon-grand)',
              padding: 'calc(var(--pas) * 2)',
              marginBottom: 'calc(var(--cible-jeune) + var(--pas))',
              minWidth: '16rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="bouton bouton--accent" onClick={() => setPanneau('tla')}>
              Tableau de communication
            </button>
            {rappels.length > 0 && (
              <button
                type="button"
                className="bouton"
                onClick={() => {
                  if (rappels.length === 1) {
                    setRegleOuverte(rappels[0].regleIds)
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
              borderRadius: 'var(--rayon-grand)',
              padding: 'calc(var(--pas) * 3)',
              maxWidth: '24rem',
              width: '100%',
            }}
          >
            <h2 style={{ fontSize: 22 }}>Quelle règle ?</h2>
            {rappels.map((rappel) => (
              <button
                key={rappel.cle}
                type="button"
                className="bouton"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontWeight: rappel.ensemble ? 700 : 400,
                  overflowWrap: 'anywhere',
                }}
                onClick={() => {
                  setRegleOuverte(rappel.regleIds)
                  setPanneau(null)
                }}
              >
                {rappel.libelle}
              </button>
            ))}
            <button type="button" className="bouton" onClick={() => setPanneau(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {panneau === 'tla' && <TLAOverlay profilId={profilId} surFermeture={() => setPanneau(null)} />}
      {regleOuverte && <RegleOverlay regleIds={regleOuverte} surFermeture={() => setRegleOuverte(null)} />}
    </>
  )
}
