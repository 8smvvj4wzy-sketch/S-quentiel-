import { useState } from 'react'
import { creerPictoComposite } from '../db'
import { DISPOSITIONS_COMPOSITE, type DispositionComposite } from '../lib/image'
import type { Picto } from '../types'
import { TuilePicto } from './TuilePicto'

type Props = {
  bibliotheque: Picto[]
  surFermeture: () => void
  surCreation: () => void
}

/** Générateur de picto composite : 2 à 4 pictos, 3 dispositions (SPEC §3.3). */
export function GenerateurCompositeModal({ bibliotheque, surFermeture, surCreation }: Props) {
  const [selection, setSelection] = useState<string[]>([])
  const [disposition, setDisposition] = useState<DispositionComposite>('cote-a-cote')
  const [libelle, setLibelle] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const infosDisposition = DISPOSITIONS_COMPOSITE.find((d) => d.id === disposition)!

  function basculer(id: string) {
    setSelection((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id)
      if (s.length >= infosDisposition.max) return s
      return [...s, id]
    })
  }

  async function valider() {
    if (selection.length < 2) return
    setEnCours(true)
    setErreur(null)
    try {
      await creerPictoComposite(selection, disposition, libelle.trim() || 'Picto composite')
      surCreation()
    } catch {
      setErreur('Impossible de créer ce picto composite.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Créer un picto composite"
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
          maxWidth: '34rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Créer un picto composite</h2>
        <p style={{ margin: 0 }}>
          Combiner {infosDisposition.max === 2 ? '2' : `2 à ${infosDisposition.max}`} pictos de la
          bibliothèque pour représenter une notion générique.
        </p>

        <div className="ligne">
          {DISPOSITIONS_COMPOSITE.map((d) => (
            <button
              key={d.id}
              type="button"
              className="bouton"
              style={{
                borderColor: disposition === d.id ? 'var(--accent)' : undefined,
                fontWeight: disposition === d.id ? 700 : undefined,
              }}
              onClick={() => {
                setDisposition(d.id)
                setSelection((s) => s.slice(0, d.max))
              }}
            >
              {d.nom}
            </button>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          {selection.length} / {infosDisposition.max} sélectionnés
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: 4,
            maxHeight: 260,
            overflowY: 'auto',
            border: '1px solid var(--bordure)',
            padding: 4,
          }}
        >
          {bibliotheque.map((p) => {
            const rang = selection.indexOf(p.id)
            return (
              <div key={p.id} style={{ position: 'relative' }}>
                <TuilePicto
                  image={p.image}
                  libelle={p.libelleAffiche}
                  surAppui={() => basculer(p.id)}
                  discret={rang === -1 && selection.length >= infosDisposition.max}
                />
                {rang !== -1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: 'var(--texte-sur-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {rang + 1}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <label className="etiquette" htmlFor="libelle-composite">
          Libellé du picto composite
        </label>
        <input
          id="libelle-composite"
          className="champ"
          value={libelle}
          placeholder="Ex. : Tâches fonctionnelles"
          onChange={(e) => setLibelle(e.target.value)}
        />

        {erreur && <p style={{ color: 'var(--alerte)', margin: 0 }}>{erreur}</p>}

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
          <button
            type="button"
            className="bouton bouton--accent"
            disabled={selection.length < 2 || enCours}
            onClick={() => void valider()}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
