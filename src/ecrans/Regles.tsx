import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listerGroupesRegles, listerRegles, supprimerGroupeRegles, supprimerRegle } from '../db'
import type { GroupeRegles, Regle } from '../types'
import { GroupeReglesFormModal } from '../composants/GroupeReglesFormModal'
import { RegleFormModal } from '../composants/RegleFormModal'
import { RegleOverlay } from '../composants/RegleOverlay'

type ASupprimer = { genre: 'regle'; regle: Regle } | { genre: 'groupe'; groupe: GroupeRegles }

const ligneListe = {
  justifyContent: 'space-between',
  padding: 'var(--pas)',
  background: 'var(--surface)',
  border: '1px solid var(--bordure)',
  borderRadius: 'var(--rayon)',
} as const

/**
 * Bibliothèque de règles (ROADMAP lot 5), et depuis le lot 10 les
 * **ensembles** : plusieurs règles qui vont ensemble et se rappellent d'un
 * seul appui. Appuyer sur un nom l'affiche en plein écran, tout de suite.
 */
export function Regles() {
  const { profilId } = useParams<{ profilId: string }>()
  const [regles, setRegles] = useState<Regle[]>([])
  const [groupes, setGroupes] = useState<GroupeRegles[]>([])
  const [modalRegle, setModalRegle] = useState<'nouvelle' | Regle | null>(null)
  const [modalGroupe, setModalGroupe] = useState<'nouveau' | GroupeRegles | null>(null)
  const [aSupprimer, setASupprimer] = useState<ASupprimer | null>(null)
  const [apercu, setApercu] = useState<string[] | null>(null)

  const recharger = useCallback(async () => {
    setRegles(await listerRegles())
    setGroupes(await listerGroupesRegles())
  }, [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  async function confirmerSuppression() {
    if (!aSupprimer) return
    if (aSupprimer.genre === 'regle') await supprimerRegle(aSupprimer.regle.id)
    else await supprimerGroupeRegles(aSupprimer.groupe.id)
    setASupprimer(null)
    await recharger()
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Règles</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <div className="ligne">
          <button type="button" className="bouton bouton--accent" onClick={() => setModalRegle('nouvelle')}>
            + Créer une règle
          </button>
          <button
            type="button"
            className="bouton"
            disabled={regles.length === 0}
            onClick={() => setModalGroupe('nouveau')}
          >
            + Créer un ensemble
          </button>
        </div>

        {groupes.length > 0 && (
          <>
            <h2 style={{ fontSize: 20 }}>Ensembles</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
              {groupes.map((g) => (
                <li key={g.id} className="ligne" style={ligneListe}>
                  <button
                    type="button"
                    className="bouton--discret"
                    style={{ flex: 1, textAlign: 'left', minWidth: 0, color: 'var(--texte)', fontWeight: 700 }}
                    onClick={() => setApercu(g.regleIds)}
                  >
                    {g.nom}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>
                      ({g.regleIds.length} règle{g.regleIds.length > 1 ? 's' : ''})
                    </span>
                  </button>
                  <span className="ligne">
                    <button type="button" className="bouton" onClick={() => setModalGroupe(g)}>
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      onClick={() => setASupprimer({ genre: 'groupe', groupe: g })}
                    >
                      Supprimer
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 style={{ fontSize: 20 }}>Règles</h2>
        {regles.length === 0 ? (
          <div className="vide">
            <p>Aucune règle pour l'instant. Appuyer sur « + Créer une règle ».</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {regles.map((r) => (
              <li key={r.id} className="ligne" style={ligneListe}>
                <button
                  type="button"
                  className="bouton--discret"
                  style={{ flex: 1, textAlign: 'left', minWidth: 0, color: 'var(--texte)', fontWeight: 700 }}
                  onClick={() => setApercu([r.id])}
                >
                  {r.texte}
                </button>
                <span className="ligne">
                  <button type="button" className="bouton" onClick={() => setModalRegle(r)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="bouton bouton--danger"
                    onClick={() => setASupprimer({ genre: 'regle', regle: r })}
                  >
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 16 }}>
          Appuyer sur le nom d'une règle ou d'un ensemble pour l'afficher en plein écran.
        </p>
      </div>

      {modalRegle && (
        <RegleFormModal
          regleInitiale={modalRegle === 'nouvelle' ? undefined : modalRegle}
          surFermeture={() => setModalRegle(null)}
          surValidation={() => {
            setModalRegle(null)
            void recharger()
          }}
        />
      )}

      {modalGroupe && (
        <GroupeReglesFormModal
          groupeInitial={modalGroupe === 'nouveau' ? undefined : modalGroupe}
          surFermeture={() => setModalGroupe(null)}
          surValidation={() => {
            setModalGroupe(null)
            void recharger()
          }}
        />
      )}

      {apercu && <RegleOverlay regleIds={apercu} surFermeture={() => setApercu(null)} />}

      {aSupprimer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
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
              maxWidth: '28rem',
            }}
          >
            {aSupprimer.genre === 'regle' ? (
              <>
                <h2 style={{ fontSize: 22 }}>Supprimer cette règle ?</h2>
                <p style={{ margin: 0 }}>« {aSupprimer.regle.texte} »</p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 22 }}>Supprimer « {aSupprimer.groupe.nom} » ?</h2>
                <p style={{ margin: 0 }}>Les règles de l'ensemble sont conservées.</p>
              </>
            )}
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button type="button" className="bouton bouton--danger" onClick={() => void confirmerSuppression()}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
