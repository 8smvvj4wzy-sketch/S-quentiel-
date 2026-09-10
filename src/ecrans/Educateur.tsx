import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { creerProfil, listerProfils, renommerProfil, supprimerProfil } from '../db'
import { useVerrouillage } from '../lib/verrouillage'
import type { Profil } from '../types'

/**
 * SPEC §4.6 — Espace éducateur. Gestion des profils et accès à la
 * bibliothèque de pictos ; les autres rubriques arrivent avec leurs lots
 * (ROADMAP). Registre éducateur : on parle à l'adulte.
 */
export function Educateur() {
  const [profils, setProfils] = useState<Profil[]>([])
  const [nouveau, setNouveau] = useState('')
  const [aSupprimer, setASupprimer] = useState<Profil | null>(null)
  const { revenirModeJeune } = useVerrouillage()
  const naviguer = useNavigate()

  const recharger = useCallback(async () => setProfils(await listerProfils()), [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  async function ajouter() {
    const initiales = nouveau.trim()
    if (!initiales) return
    await creerProfil(initiales)
    setNouveau('')
    await recharger()
  }

  async function renommer(profil: Profil) {
    const saisi = window.prompt('Initiales ou prénom court', profil.initiales)
    if (saisi === null) return
    const initiales = saisi.trim()
    if (!initiales) return
    await renommerProfil(profil.id, initiales)
    await recharger()
  }

  async function confirmerSuppression(profil: Profil) {
    await supprimerProfil(profil.id)
    setASupprimer(null)
    await recharger()
  }

  function quitter() {
    revenirModeJeune()
    naviguer('/')
  }

  return (
    <div className="ecran">
      <div className="barre">
        <h1 className="barre__titre">Espace éducateur</h1>
        <button type="button" className="bouton" onClick={quitter}>
          Quitter
        </button>
      </div>

      <div className="contenu pile" style={{ maxWidth: '44rem' }}>
        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Profils</h2>

          <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 18 }}>
            Initiales ou prénom court uniquement. Ne pas saisir de nom de famille ni
            d'information médicale.
          </p>

          <div className="ligne">
            <input
              className="champ"
              style={{ flex: 1, minWidth: '12rem' }}
              value={nouveau}
              maxLength={12}
              placeholder="Ex. : L.M."
              aria-label="Initiales du nouveau profil"
              onChange={(e) => setNouveau(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void ajouter()
              }}
            />
            <button
              type="button"
              className="bouton bouton--accent"
              disabled={!nouveau.trim()}
              onClick={() => void ajouter()}
            >
              Créer le profil
            </button>
          </div>

          {profils.length === 0 ? (
            <div className="vide">
              <p>Aucun profil pour l'instant. Saisir des initiales puis « Créer le profil ».</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
              {profils.map((profil) => (
                <li
                  key={profil.id}
                  className="ligne"
                  style={{
                    justifyContent: 'space-between',
                    padding: 'var(--pas)',
                    background: 'var(--surface)',
                    border: '1px solid var(--bordure)',
                    borderRadius: 'var(--rayon)',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{profil.initiales}</span>
                  <span className="ligne">
                    <button type="button" className="bouton" onClick={() => void renommer(profil)}>
                      Renommer
                    </button>
                    <button
                      type="button"
                      className="bouton bouton--danger"
                      onClick={() => setASupprimer(profil)}
                    >
                      Supprimer
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Pictos</h2>
          <Link to="/educateur/bibliotheque" className="bouton" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
            Ouvrir la bibliothèque de pictos
          </Link>
        </section>

        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Reste à venir</h2>
          <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 18 }}>
            Séquences, activités et règles, emploi du temps, configuration du TLA, réglages
            vocaux et export JSON arrivent avec les lots suivants.
          </p>
        </section>
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
            <h2 style={{ fontSize: 22 }}>Supprimer le profil {aSupprimer.initiales} ?</h2>
            <p style={{ margin: 0 }}>
              Son emploi du temps, sa configuration TLA et ses cochages seront effacés.
              Les séquences et les pictos, communs à l'établissement, sont conservés.
            </p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="bouton bouton--danger"
                onClick={() => void confirmerSuppression(aSupprimer)}
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
