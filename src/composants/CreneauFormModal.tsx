import { useEffect, useState } from 'react'
import { ajouterCreneau, creerActivite, listerSequences, picto as chargerPicto } from '../db'
import type { Activite, JourSemaine, Picto, Sequence } from '../types'
import { ChoisirActiviteModal } from './ChoisirActiviteModal'
import { ChoisirPictoModal } from './ChoisirPictoModal'
import { SelecteurRegles } from './SelecteurRegles'
import { SuggestionsPicto } from './SuggestionsPicto'
import { TuilePicto } from './TuilePicto'

type Props = {
  profilId: string
  jour: JourSemaine
  surValidation: () => void
  surFermeture: () => void
}

/**
 * Ajout d'un créneau en un seul geste (ROADMAP lot 9) : nom, picto et
 * séquence facultative créent l'activité en coulisse — l'éducateur ne voit
 * qu'un seul formulaire, plus besoin de passer par un écran séparé. « Réutiliser
 * une activité existante » reste possible pour ne pas redéfinir un « Goûter »
 * déjà créé pour un autre jour.
 */
export function CreneauFormModal({ profilId, jour, surValidation, surFermeture }: Props) {
  const [nom, setNom] = useState('')
  const [pictoId, setPictoId] = useState<string | undefined>(undefined)
  const [pictoChoisi, setPictoChoisi] = useState<Picto | null>(null)
  const [sequenceId, setSequenceId] = useState('')
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [heureDebut, setHeureDebut] = useState('')
  const [regleIds, setRegleIds] = useState<string[]>([])
  const [groupeRegleIds, setGroupeRegleIds] = useState<string[]>([])
  const [choixPictoOuvert, setChoixPictoOuvert] = useState(false)
  const [choixActiviteOuvert, setChoixActiviteOuvert] = useState(false)

  useEffect(() => {
    void listerSequences().then(setSequences)
  }, [])

  useEffect(() => {
    if (pictoId) void chargerPicto(pictoId).then((p) => setPictoChoisi(p ?? null))
  }, [pictoId])

  const valide = nom.trim().length > 0 && Boolean(pictoId)

  /** Le picto propose un nom, il ne l'impose pas : « biscuit » devient
   *  « gâteau » d'une correction, sans rien retaper. */
  function retenirPicto(p: Picto) {
    setPictoId(p.id)
    setPictoChoisi(p)
    setNom((actuel) => (actuel.trim() ? actuel : p.libelleAffiche))
  }

  async function valider() {
    if (!pictoId) return
    const activite = await creerActivite({
      nom: nom.trim(),
      pictoId,
      sequenceId: sequenceId || undefined,
      regleIds,
      groupeRegleIds,
    })
    await ajouterCreneau(profilId, jour, activite.id, heureDebut || undefined)
    surValidation()
  }

  async function reutiliser(activite: Activite) {
    await ajouterCreneau(profilId, jour, activite.id, heureDebut || undefined)
    surValidation()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un créneau"
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
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Ajouter un créneau</h2>

        <label className="etiquette" htmlFor="nom-creneau">
          Nom de l'activité
        </label>
        <input
          id="nom-creneau"
          className="champ"
          value={nom}
          placeholder="Ex. : Goûter"
          onChange={(e) => setNom(e.target.value)}
        />

        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          Le nom peut être différent du picto : picto « biscuit », nom « gâteau ».
        </p>

        <SuggestionsPicto libelle={nom} pictoRetenuId={pictoId} surChoix={retenirPicto} />

        <div className="ligne">
          {pictoChoisi ? (
            <TuilePicto image={pictoChoisi.image} libelle={pictoChoisi.libelleAffiche} surAppui={() => setChoixPictoOuvert(true)} />
          ) : (
            <button type="button" className="bouton" onClick={() => setChoixPictoOuvert(true)}>
              Choisir un picto
            </button>
          )}
        </div>

        <label className="etiquette" htmlFor="sequence-creneau">
          Séquence rattachée (facultatif)
        </label>
        <select id="sequence-creneau" className="champ" value={sequenceId} onChange={(e) => setSequenceId(e.target.value)}>
          <option value="">Aucune — vue plein écran du picto</option>
          {sequences.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>

        <span className="etiquette">Règles à rappeler pendant l'activité (facultatif)</span>
        <SelecteurRegles
          regleIds={regleIds}
          groupeIds={groupeRegleIds}
          surChangement={(r, g) => {
            setRegleIds(r)
            setGroupeRegleIds(g)
          }}
        />

        <label className="etiquette" htmlFor="heure-creneau">
          Heure de début (facultatif)
        </label>
        <input
          id="heure-creneau"
          type="time"
          className="champ"
          value={heureDebut}
          onChange={(e) => setHeureDebut(e.target.value)}
        />

        <button type="button" className="bouton--discret" style={{ width: 'fit-content' }} onClick={() => setChoixActiviteOuvert(true)}>
          Réutiliser une activité existante
        </button>

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
          <button type="button" className="bouton bouton--accent" disabled={!valide} onClick={() => void valider()}>
            Ajouter
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

      {choixActiviteOuvert && (
        <ChoisirActiviteModal surFermeture={() => setChoixActiviteOuvert(false)} surChoix={(a) => void reutiliser(a)} />
      )}
    </div>
  )
}
