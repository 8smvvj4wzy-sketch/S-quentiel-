import { useEffect, useState } from 'react'
import { creerRegle, modifierRegle, picto as chargerPicto } from '../db'
import type { Picto, Regle } from '../types'
import { ChoisirPictoModal } from './ChoisirPictoModal'
import { SuggestionsPicto } from './SuggestionsPicto'
import { TuilePicto } from './TuilePicto'

type Props = {
  regleInitiale?: Regle
  surValidation: () => void
  surFermeture: () => void
}

/** Rappel de règle : un texte, un picto facultatif (SPEC §2, §4.4). */
export function RegleFormModal({ regleInitiale, surValidation, surFermeture }: Props) {
  const [texte, setTexte] = useState(regleInitiale?.texte ?? '')
  const [pictoId, setPictoId] = useState(regleInitiale?.pictoId)
  const [pictoChoisi, setPictoChoisi] = useState<Picto | null>(null)
  const [choixPictoOuvert, setChoixPictoOuvert] = useState(false)

  useEffect(() => {
    if (pictoId) void chargerPicto(pictoId).then((p) => setPictoChoisi(p ?? null))
  }, [pictoId])

  const valide = texte.trim().length > 0

  async function valider() {
    const donnees = { texte: texte.trim(), pictoId }
    if (regleInitiale) await modifierRegle(regleInitiale.id, donnees)
    else await creerRegle(donnees)
    surValidation()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={regleInitiale ? 'Modifier la règle' : 'Créer une règle'}
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
        <h2 style={{ fontSize: 22 }}>{regleInitiale ? 'Modifier la règle' : 'Créer une règle'}</h2>

        <label className="etiquette" htmlFor="texte-regle">
          Texte de la règle
        </label>
        <input
          id="texte-regle"
          className="champ"
          value={texte}
          placeholder="Ex. : On chuchote dans le couloir"
          onChange={(e) => setTexte(e.target.value)}
        />

        <SuggestionsPicto
          libelle={texte}
          pictoRetenuId={pictoId}
          surChoix={(p) => {
            setPictoId(p.id)
            setPictoChoisi(p)
          }}
        />

        <div className="ligne">
          {pictoChoisi ? (
            <TuilePicto image={pictoChoisi.image} libelle={pictoChoisi.libelleAffiche} surAppui={() => setChoixPictoOuvert(true)} />
          ) : (
            <button type="button" className="bouton" onClick={() => setChoixPictoOuvert(true)}>
              Choisir un picto (facultatif)
            </button>
          )}
          {pictoId && (
            <button type="button" className="bouton--discret" onClick={() => { setPictoId(undefined); setPictoChoisi(null) }}>
              Retirer le picto
            </button>
          )}
        </div>

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
