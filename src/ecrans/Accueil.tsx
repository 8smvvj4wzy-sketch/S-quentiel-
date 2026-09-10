import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listerProfils } from '../db'
import type { Profil } from '../types'

/**
 * SPEC §4.1 — Liste des profils, grande vignette. Registre jeune.
 * L'accès éducateur se fait par le coin haut-droit, pas par un bouton visible.
 */
export function Accueil() {
  const [profils, setProfils] = useState<Profil[] | null>(null)

  useEffect(() => {
    void listerProfils().then(setProfils)
  }, [])

  return (
    <div className="ecran">
      <div className="barre">
        <h1 className="barre__titre">Qui utilise la tablette&nbsp;?</h1>
      </div>

      <div className="contenu">
        {profils === null ? null : profils.length === 0 ? (
          <div className="vide">
            <p>Aucun profil pour l'instant.</p>
            <p>
              Un adulte peut en créer un : appui long de 3&nbsp;secondes sur le coin
              en haut à droite de l'écran.
            </p>
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 'calc(var(--pas) * 2)',
            }}
          >
            {profils.map((profil) => (
              <li key={profil.id}>
                <Link
                  to={`/profil/${profil.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--pas)',
                    minHeight: 160,
                    padding: 'calc(var(--pas) * 2)',
                    background: 'var(--surface)',
                    border: '2px solid var(--bordure)',
                    borderRadius: 'var(--rayon)',
                    color: 'var(--texte)',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 'var(--cible-jeune)',
                      height: 'var(--cible-jeune)',
                      background: 'var(--fond)',
                      border: '2px solid var(--bordure)',
                      borderRadius: 'var(--rayon)',
                      fontSize: 36,
                      fontWeight: 700,
                    }}
                  >
                    {profil.initiales.slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{profil.initiales}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="barre" style={{ borderBottom: 'none', borderTop: '1px solid var(--bordure)' }}>
        <span style={{ flex: 1 }} />
        <Link to="/a-propos" className="bouton--discret" style={{ lineHeight: '64px' }}>
          À propos
        </Link>
      </div>
    </div>
  )
}
