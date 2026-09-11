import { useEffect, useState } from 'react'
import { picto as chargerPicto } from '../db'
import type { Etape, Picto } from '../types'
import { ChoisirPictoModal } from './ChoisirPictoModal'
import { SuggestionsPicto } from './SuggestionsPicto'
import { TuilePicto } from './TuilePicto'

type Props = {
  etapeInitiale?: Etape
  surValidation: (donnees: { pictoId?: string; texte?: string }) => void
  surFermeture: () => void
}

/** Étape : picto et/ou texte, au moins l'un des deux (SPEC §2). */
export function EtapeFormModal({ etapeInitiale, surValidation, surFermeture }: Props) {
  const [pictoId, setPictoId] = useState(etapeInitiale?.pictoId)
  const [pictoChoisi, setPictoChoisi] = useState<Picto | null>(null)
  const [texte, setTexte] = useState(etapeInitiale?.texte ?? '')
  const [choixPictoOuvert, setChoixPictoOuvert] = useState(false)

  useEffect(() => {
    if (pictoId) void chargerPicto(pictoId).then((p) => setPictoChoisi(p ?? null))
  }, [pictoId])

  /**
   * Un picto choisi donne un point de départ au nom, jamais un verrou : le
   * picto ARASAAC dit « biscuit », l'éducateur écrit « gâteau ». On ne
   * remplit que si le champ est vide, pour ne jamais écraser ce qui est tapé.
   */
  function retenirPicto(p: Picto) {
    setPictoId(p.id)
    setPictoChoisi(p)
    setTexte((actuel) => (actuel.trim() ? actuel : p.libelleAffiche))
  }

  const valide = Boolean(pictoId) || texte.trim().length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={etapeInitiale ? "Modifier l'étape" : 'Ajouter une étape'}
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
          maxWidth: '26rem',
          width: '100%',
        }}
      >
        <h2 style={{ fontSize: 22 }}>{etapeInitiale ? "Modifier l'étape" : 'Ajouter une étape'}</h2>

        <label className="etiquette" htmlFor="texte-etape">
          Nom de l'étape
        </label>
        <input
          id="texte-etape"
          className="champ"
          value={texte}
          placeholder="Ex. : Ranger la vaisselle"
          onChange={(e) => setTexte(e.target.value)}
        />
        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          Le nom peut être différent du picto : picto « biscuit », nom « gâteau ».
        </p>

        <SuggestionsPicto libelle={texte} pictoRetenuId={pictoId} surChoix={retenirPicto} />

        <div className="ligne">
          {pictoChoisi ? (
            <TuilePicto image={pictoChoisi.image} libelle={pictoChoisi.libelleAffiche} surAppui={() => setChoixPictoOuvert(true)} />
          ) : (
            <button type="button" className="bouton" onClick={() => setChoixPictoOuvert(true)}>
              Choisir un picto
            </button>
          )}
          {pictoId && (
            <button
              type="button"
              className="bouton--discret"
              onClick={() => {
                setPictoId(undefined)
                setPictoChoisi(null)
              }}
            >
              Retirer le picto
            </button>
          )}
        </div>

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
          <button
            type="button"
            className="bouton bouton--accent"
            disabled={!valide}
            onClick={() => surValidation({ pictoId, texte: texte.trim() || undefined })}
          >
            Valider
          </button>
        </div>
      </div>

      {choixPictoOuvert && (
        <ChoisirPictoModal
          surFermeture={() => setChoixPictoOuvert(false)}
          surChoix={(p) => {
            retenirPicto(p)
            setChoixPictoOuvert(false)
          }}
        />
      )}
    </div>
  )
}
