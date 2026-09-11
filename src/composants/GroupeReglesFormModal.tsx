import { useEffect, useState } from 'react'
import { creerGroupeRegles, listerRegles, modifierGroupeRegles } from '../db'
import type { GroupeRegles, Regle } from '../types'

type Props = {
  groupeInitial?: GroupeRegles
  surValidation: () => void
  surFermeture: () => void
}

/**
 * Un ensemble : un nom, et les règles qui vont avec. « Le calme » = mains
 * calmes + pieds calmes + bouche silencieuse, rappelées ensemble.
 */
export function GroupeReglesFormModal({ groupeInitial, surValidation, surFermeture }: Props) {
  const [nom, setNom] = useState(groupeInitial?.nom ?? '')
  const [regleIds, setRegleIds] = useState<string[]>(groupeInitial?.regleIds ?? [])
  const [regles, setRegles] = useState<Regle[]>([])

  useEffect(() => {
    void listerRegles().then(setRegles)
  }, [])

  const valide = nom.trim().length > 0 && regleIds.length > 0

  async function valider() {
    if (groupeInitial) await modifierGroupeRegles(groupeInitial.id, { nom: nom.trim(), regleIds })
    else await creerGroupeRegles(nom, regleIds)
    surValidation()
  }

  function basculer(id: string) {
    setRegleIds((actuel) => (actuel.includes(id) ? actuel.filter((x) => x !== id) : [...actuel, id]))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={groupeInitial ? "Modifier l'ensemble" : 'Créer un ensemble'}
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
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: 22 }}>{groupeInitial ? "Modifier l'ensemble" : 'Créer un ensemble'}</h2>

        <label className="etiquette" htmlFor="nom-groupe">
          Nom de l'ensemble
        </label>
        <input
          id="nom-groupe"
          className="champ"
          value={nom}
          placeholder="Ex. : Le calme"
          onChange={(e) => setNom(e.target.value)}
        />

        <span className="etiquette">Règles de cet ensemble</span>
        {regles.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Aucune règle pour l'instant. En créer une d'abord.
          </p>
        ) : (
          <div className="pile" style={{ gap: 4 }}>
            {regles.map((r) => (
              <label
                key={r.id}
                className="ligne"
                style={{ minHeight: 'var(--cible)', cursor: 'pointer', fontSize: 18 }}
              >
                <input
                  type="checkbox"
                  checked={regleIds.includes(r.id)}
                  onChange={() => basculer(r.id)}
                  style={{ width: 24, height: 24 }}
                />
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.texte}</span>
              </label>
            ))}
          </div>
        )}

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
          <button
            type="button"
            className="bouton bouton--accent"
            disabled={!valide}
            onClick={() => void valider()}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}
