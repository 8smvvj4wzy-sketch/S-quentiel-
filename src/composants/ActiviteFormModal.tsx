import { useEffect, useState } from 'react'
import {
  creerActivite,
  definirReglesActivite,
  listerPagesTLA,
  listerRegles,
  listerSequences,
  modifierActivite,
  picto as chargerPicto,
} from '../db'
import type { Activite, PageTLA, Picto, Regle, Sequence } from '../types'
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
  const [tlaContexteId, setTlaContexteId] = useState(activiteInitiale?.tlaContexteId ?? '')
  const [pagesTLA, setPagesTLA] = useState<PageTLA[]>([])
  const [regleIds, setRegleIds] = useState<string[]>(activiteInitiale?.regleIds ?? [])
  const [regles, setRegles] = useState<Regle[]>([])
  const [choixPictoOuvert, setChoixPictoOuvert] = useState(false)

  useEffect(() => {
    void listerSequences().then(setSequences)
    void listerPagesTLA().then(setPagesTLA)
    void listerRegles().then(setRegles)
  }, [])

  useEffect(() => {
    if (pictoId) void chargerPicto(pictoId).then((p) => setPictoChoisi(p ?? null))
  }, [pictoId])

  const valide = nom.trim().length > 0 && Boolean(pictoId)

  async function valider() {
    if (!pictoId) return
    const donnees = {
      nom: nom.trim(),
      pictoId,
      sequenceId: sequenceId || undefined,
      tlaContexteId: tlaContexteId || undefined,
    }
    const id = activiteInitiale
      ? await modifierActivite(activiteInitiale.id, donnees).then(() => activiteInitiale.id)
      : await creerActivite(donnees).then((a) => a.id)
    await definirReglesActivite(id, regleIds)
    surValidation()
  }

  function basculerRegle(id: string) {
    setRegleIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
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

        <label className="etiquette" htmlFor="tla-activite">
          Page TLA rattachée (facultatif)
        </label>
        <select
          id="tla-activite"
          className="champ"
          value={tlaContexteId}
          onChange={(e) => setTlaContexteId(e.target.value)}
        >
          <option value="">Aucune — le TLA garde la page choisie par défaut</option>
          {pagesTLA.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>

        {regles.length > 0 && (
          <>
            <label className="etiquette">Règles rattachées (facultatif)</label>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
              {regles.map((r) => (
                <li key={r.id}>
                  <label className="ligne" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={regleIds.includes(r.id)}
                      onChange={() => basculerRegle(r.id)}
                      style={{ width: 24, height: 24 }}
                    />
                    {r.texte}
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

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
