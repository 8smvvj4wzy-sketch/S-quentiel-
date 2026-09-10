import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { creerPageTLA, listerPagesTLA, supprimerPageTLA } from '../db'
import type { PageTLA } from '../types'

/** Bibliothèque de pages TLA : noyau et pages contextuelles (SPEC §4.5). */
export function PagesTLA() {
  const { profilId } = useParams<{ profilId: string }>()
  const [pages, setPages] = useState<PageTLA[]>([])
  const [nouveau, setNouveau] = useState('')
  const [aSupprimer, setASupprimer] = useState<PageTLA | null>(null)

  const recharger = useCallback(async () => setPages(await listerPagesTLA()), [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  async function creer() {
    const nom = nouveau.trim()
    if (!nom) return
    await creerPageTLA(nom)
    setNouveau('')
    await recharger()
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}/tla`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Pages du tableau de communication</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
          Une page « noyau » (je veux, encore, fini…) reste toujours visible dans le TLA. Les
          autres pages sont contextuelles : rattachées à une activité, ou choisies dans les
          réglages TLA d'un profil.
        </p>

        <div className="ligne">
          <input
            className="champ"
            style={{ flex: 1, minWidth: '12rem' }}
            placeholder="Nom de la nouvelle page"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void creer()
            }}
            aria-label="Nom de la nouvelle page"
          />
          <button type="button" className="bouton bouton--accent" disabled={!nouveau.trim()} onClick={() => void creer()}>
            Créer
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="vide">
            <p>Aucune page pour l'instant. Saisir un nom puis « Créer ».</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {pages.map((p) => (
              <li
                key={p.id}
                className="ligne"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--pas)',
                  background: 'var(--surface)',
                  border: '1px solid var(--bordure)',
                  borderRadius: 'var(--rayon)',
                }}
              >
                <Link to={`/profil/${profilId}/tla/pages/${p.id}`} style={{ color: 'var(--texte)', textDecoration: 'none', fontWeight: 700 }}>
                  {p.nom} <span style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>({p.pictoIds.length} picto{p.pictoIds.length > 1 ? 's' : ''})</span>
                </Link>
                <button type="button" className="bouton bouton--danger" onClick={() => setASupprimer(p)}>
                  Supprimer
                </button>
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
              Les profils et activités qui l'utilisaient reviendront à la page par défaut du TLA.
            </p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="bouton bouton--danger"
                onClick={() => {
                  void supprimerPageTLA(aSupprimer.id).then(() => {
                    setASupprimer(null)
                    void recharger()
                  })
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
