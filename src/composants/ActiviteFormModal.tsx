import { useEffect, useState } from 'react'
import { creerActivite, listerSequences, modifierActivite, picto as chargerPicto } from '../db'
import type { Activite, Picto, Sequence } from '../types'
import { ChoisirPictoModal } from './ChoisirPictoModal'
import { TuilePicto } from './TuilePicto'

type Props = {
  activiteInitiale?: Activite
  surValidation: () => void
  surFermeture: () => void
}

/** Bibliothèque d'activités : nom, picto, séquence rattachée (SPEC §4.6). */
export function ActiviteFormModal({ activiteInitiale, surValidation, surFermeture }: Props) {
  const [nom, setNom] = useState(activiteInitiale?.nom ?? '')
  const [pictoId, setPictoId] = useState(activiteInitiale?.pictoId)
  const [pictoChoisi, setPictoChoisi] = useState<Picto | null>(null)
  const [sequenceId, setSequenceId] = useState(activiteInitiale?.sequenceId ?? '')
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [choixPictoOuvert, setChoixPictoOuvert] = useState(false)

  useEffect(() => {
    void listerSequences().then(setSequences)
  }, [])

  useEffect(() => {
    if (pictoId) void chargerPicto(pictoId).then((p) => setPictoChoisi(p ?? null))
  }, [pictoId])

  const valide = nom.trim().length > 0 && Boolean(pictoId)

  async function valider() {
    if (!pictoId) return
    const donnees = { nom: nom.trim(), pictoId, sequenceId: sequenceId || undefined }
    if (activiteInitiale) await modifierActivite(activiteInitiale.id, donnees)
    else await creerActivite(donnees)
    surValidation()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activiteInitiale ? "Modifier l'activité" : 'Créer une activité'}
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
          maxWidth: '26rem',
          width: '100%',
        }}
      >
        <h2 style={{ fontSize: 22 }}>{activiteInitiale ? "Modifier l'activité" : 'Créer une activité'}</h2>

        <label className="etiquette" htmlFor="nom-activite">
          Nom
        </label>
        <input id="nom-activite" className="champ" value={nom} placeholder="Ex. : Goûter" onChange={(e) => setNom(e.target.value)} />

        <div className="ligne">
          {pictoChoisi ? (
            <TuilePicto image={pictoChoisi.image} libelle={pictoChoisi.libelleAffiche} surAppui={() => setChoixPictoOuvert(true)} />
          ) : (
            <button type="button" className="bouton" onClick={() => setChoixPictoOuvert(true)}>
              Choisir un picto
            </button>
          )}
        </div>

        <label className="etiquette" htmlFor="sequence-activite">
          Séquence rattachée (facultatif)
        </label>
        <select
          id="sequence-activite"
          className="champ"
          value={sequenceId}
          onChange={(e) => setSequenceId(e.target.value)}
        >
          <option value="">Aucune — vue plein écran du picto</option>
          {sequences.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
          <button type="button" className="bouton bouton--accent" disabled={!valide} onClick={() => void valider()}>
            Valider
          </button>
        </div>
      </div>

      {choixPictoOuvert && (
        <ChoisirPictoModal
          surFermeture={() => setChoixPictoOuvert(false)}
          surChoix={(p) => {
            setPictoId(p.id)
            setPictoChoisi(p)
            setChoixPictoOuvert(false)
          }}
        />
      )}
    </div>
  )
}
