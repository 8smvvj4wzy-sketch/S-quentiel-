import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { creerSequence, dupliquerSequence, listerSequences, supprimerSequence } from '../db'
import type { Sequence } from '../types'

/**
 * Écran Séquentiels (ROADMAP lot 2, revu au lot 8) : créer, dupliquer,
 * supprimer, modifier — et surtout **lancer** une séquence directement, sans
 * passer par l'emploi du temps. Le cochage d'une séquence lancée seule est
 * suivi à part, sous l'id de la séquence.
 */
export function Sequences() {
  const { profilId } = useParams<{ profilId: string }>()
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [nouveau, setNouveau] = useState('')
  const [aSupprimer, setASupprimer] = useState<Sequence | null>(null)

  const recharger = useCallback(async () => setSequences(await listerSequences()), [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  async function creer() {
    const nom = nouveau.trim()
    if (!nom) return
    await creerSequence(nom)
    setNouveau('')
    await recharger()
  }

  async function dupliquer(id: string) {
    await dupliquerSequence(id)
    await recharger()
  }

  async function confirmerSuppression(id: string) {
    await supprimerSequence(id)
    setASupprimer(null)
    await recharger()
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Séquentiels</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <div className="ligne">
          <input
            className="champ"
            style={{ flex: 1, minWidth: '12rem' }}
            placeholder="Nom de la nouvelle séquence"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void creer()
            }}
            aria-label="Nom de la nouvelle séquence"
          />
          <button type="button" className="bouton bouton--accent" disabled={!nouveau.trim()} onClick={() => void creer()}>
            Créer
          </button>
        </div>

        {sequences.length === 0 ? (
          <div className="vide">
            <p>Aucune séquence pour l'instant.</p>
            <p>Saisir un nom puis « Créer » pour en écrire une.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {sequences.map((s) => (
              <li
                key={s.id}
                className="ligne"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--pas)',
                  background: 'var(--surface)',
                  border: '1px solid var(--bordure)',
                  borderRadius: 'var(--rayon)',
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {s.nom} <span style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>({s.etapes.length} étape{s.etapes.length > 1 ? 's' : ''})</span>
                </span>
                <span className="ligne">
                  {s.etapes.length > 0 && (
                    <Link
                      to={`/profil/${profilId}/sequentiel/${s.id}`}
                      className="bouton bouton--accent"
                      style={{ textDecoration: 'none' }}
                    >
                      Lancer
                    </Link>
                  )}
                  <Link
                    to={`/profil/${profilId}/sequentiels/${s.id}`}
                    className="bouton"
                    style={{ textDecoration: 'none' }}
                  >
                    Modifier
                  </Link>
                  <button type="button" className="bouton" onClick={() => void dupliquer(s.id)}>
                    Dupliquer
                  </button>
                  <button type="button" className="bouton bouton--danger" onClick={() => setASupprimer(s)}>
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
              borderRadius: 'var(--rayon)',
              padding: 'calc(var(--pas) * 3)',
              maxWidth: '28rem',
            }}
          >
            <h2 style={{ fontSize: 22 }}>Supprimer « {aSupprimer.nom} » ?</h2>
            <p style={{ margin: 0 }}>
              Les activités qui utilisent cette séquence n'en auront plus. Cette action est
              définitive.
            </p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button type="button" className="bouton bouton--danger" onClick={() => void confirmerSuppression(aSupprimer.id)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
