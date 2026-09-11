import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  creerProfil,
  listerProfils,
  reinitialiserCochagesProfil,
  reinitialiserTousLesCochages,
  renommerProfil,
  supprimerProfil,
} from '../db'
import { useVerrouillage } from '../lib/verrouillage'
import type { Profil } from '../types'

/**
 * Écran Paramétrage (ROADMAP lot 8) — le seul endroit encore protégé par le
 * code PIN. Il ne contient plus que ce qu'on règle une fois : les profils,
 * la bibliothèque de pictos, les voix, l'export/import. Tout ce qui se
 * prépare ou se réadapte au quotidien — emploi du temps, séquentiels,
 * règles, TLA — est passé dans les quatre écrans du profil.
 *
 * Registre éducateur : on parle à l'adulte.
 */
export function Parametrage() {
  const [profils, setProfils] = useState<Profil[]>([])
  const [nouveau, setNouveau] = useState('')
  const [aSupprimer, setASupprimer] = useState<Profil | null>(null)
  const [aReinitialiser, setAReinitialiser] = useState<Profil | 'tout' | null>(null)
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

  async function confirmerReinitialisation() {
    if (aReinitialiser === 'tout') await reinitialiserTousLesCochages()
    else if (aReinitialiser) await reinitialiserCochagesProfil(aReinitialiser.id)
    setAReinitialiser(null)
  }

  function quitter() {
    revenirModeJeune()
    naviguer('/')
  }

  return (
    <div className="ecran">
      <div className="barre">
        <h1 className="barre__titre">Paramétrage</h1>
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
                    <Link to={`/parametrage/profils/${profil.id}/vocal`} className="bouton" style={{ textDecoration: 'none' }}>
                      Voix
                    </Link>
                    <button type="button" className="bouton" onClick={() => void renommer(profil)}>
                      Renommer
                    </button>
                    <button type="button" className="bouton" onClick={() => setAReinitialiser(profil)}>
                      Réinitialiser les cochages
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
          <Link to="/parametrage/bibliotheque" className="bouton" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
            Ouvrir la bibliothèque de pictos
          </Link>
          <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 18 }}>
            Pour poser un picto sur une étape ou une activité, inutile de passer par ici : la
            recherche des formulaires va directement chercher dans tout le catalogue ARASAAC.
          </p>
        </section>

        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Cochages</h2>
          <button type="button" className="bouton bouton--danger" style={{ width: 'fit-content' }} onClick={() => setAReinitialiser('tout')}>
            Réinitialiser tous les cochages (tous les profils)
          </button>
        </section>

        <section className="pile">
          <h2 style={{ fontSize: 22 }}>Configuration</h2>
          <div className="ligne">
            <Link to="/parametrage/export-import" className="bouton" style={{ textDecoration: 'none' }}>
              Export / import de la configuration
            </Link>
            <Link to="/a-propos" className="bouton" style={{ textDecoration: 'none' }}>
              À propos
            </Link>
          </div>
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
              borderRadius: 'var(--rayon-grand)',
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

      {aReinitialiser && (
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
            <h2 style={{ fontSize: 22 }}>
              {aReinitialiser === 'tout'
                ? 'Réinitialiser tous les cochages ?'
                : `Réinitialiser les cochages de ${aReinitialiser.initiales} ?`}
            </h2>
            <p style={{ margin: 0 }}>Toutes les étapes déjà cochées redeviennent à faire.</p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setAReinitialiser(null)}>
                Annuler
              </button>
              <button type="button" className="bouton bouton--danger" onClick={() => void confirmerReinitialisation()}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
