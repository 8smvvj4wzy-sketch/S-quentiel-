import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ajouterEtape,
  definirUneEtapeALaFois,
  modifierEtape,
  renommerSequence,
  reordonnerEtapes,
  sequence as chargerSequence,
  supprimerEtape,
} from '../db'
import type { Etape, Picto, Sequence } from '../types'
import { picto as chargerPicto } from '../db'
import { EtapeFormModal } from '../composants/EtapeFormModal'
import { useGlisserDeposer } from '../lib/useGlisserDeposer'
import { useObjectUrl } from '../lib/useObjectUrl'

function LigneEtape({ etape, poignee }: { etape: Etape; poignee: object }) {
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)
  useEffect(() => {
    if (etape.pictoId) void chargerPicto(etape.pictoId).then((p) => setPicto(p ?? null))
    else setPicto(null)
  }, [etape.pictoId])

  return (
    <div className="ligne" {...poignee} style={{ ...(poignee as { style?: object }).style, flex: 1 }}>
      <span aria-hidden="true" style={{ fontSize: 20, color: 'var(--texte-secondaire)' }}>
        ⠿
      </span>
      {url && <img src={url} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />}
      <span>{etape.texte ?? picto?.libelleAffiche ?? '…'}</span>
    </div>
  )
}

/** Éditeur d'étapes : picto et/ou texte, réordonnancement (ROADMAP lot 2). */
export function EditeurSequence() {
  const { profilId, sequenceId } = useParams<{ profilId: string; sequenceId: string }>()
  const [seq, setSeq] = useState<Sequence | null | undefined>(undefined)
  const [nom, setNom] = useState('')
  const [modalEtape, setModalEtape] = useState<'nouvelle' | Etape | null>(null)
  const naviguer = useNavigate()

  const recharger = useCallback(async () => {
    if (!sequenceId) return
    const s = await chargerSequence(sequenceId)
    setSeq(s ?? null)
    if (s) setNom(s.nom)
  }, [sequenceId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  const { liste, poignee } = useGlisserDeposer(seq?.etapes ?? [], (ordre) => {
    if (sequenceId) void reordonnerEtapes(sequenceId, ordre).then(recharger)
  })

  if (seq === undefined) return null
  if (seq === null) {
    return (
      <div className="ecran">
        <div className="contenu vide">
          <p>Séquence introuvable.</p>
          <Link to={`/profil/${profilId}/sequentiels`} className="bouton">
            Retour aux séquentiels
          </Link>
        </div>
      </div>
    )
  }

  async function validerEtape(donnees: { pictoId?: string; texte?: string }) {
    if (!sequenceId) return
    if (modalEtape && modalEtape !== 'nouvelle') {
      await modifierEtape(sequenceId, modalEtape.id, donnees)
    } else {
      await ajouterEtape(sequenceId, donnees)
    }
    setModalEtape(null)
    await recharger()
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}/sequentiels`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">{seq.nom}</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '36rem' }}>
        <label className="etiquette" htmlFor="nom-sequence">
          Nom de la séquence
        </label>
        <input
          id="nom-sequence"
          className="champ"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onBlur={() => {
            if (sequenceId && nom.trim() && nom.trim() !== seq.nom) void renommerSequence(sequenceId, nom).then(recharger)
          }}
        />

        <label className="ligne" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={seq.uneEtapeALaFois ?? false}
            onChange={(e) => {
              if (sequenceId) void definirUneEtapeALaFois(sequenceId, e.target.checked).then(recharger)
            }}
            style={{ width: 24, height: 24 }}
          />
          Afficher une étape à la fois (plein écran)
        </label>

        <h2 style={{ fontSize: 20 }}>Étapes</h2>

        {liste.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Aucune étape pour l'instant. Appuyer sur « + Ajouter une étape ».
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {liste.map((etape) => (
              <li
                key={etape.id}
                className="ligne"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--pas)',
                  background: 'var(--surface)',
                  border: '1px solid var(--bordure)',
                  borderRadius: 'var(--rayon)',
                }}
              >
                <LigneEtape etape={etape} poignee={poignee(etape.id)} />
                <span className="ligne">
                  <button type="button" className="bouton" onClick={() => setModalEtape(etape)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="bouton bouton--danger"
                    onClick={() => sequenceId && void supprimerEtape(sequenceId, etape.id).then(recharger)}
                  >
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="ligne">
          <button type="button" className="bouton" onClick={() => setModalEtape('nouvelle')}>
            + Ajouter une étape
          </button>
          <button
            type="button"
            className="bouton bouton--accent"
            disabled={liste.length === 0}
            onClick={() => naviguer(`/profil/${profilId}/sequentiel/${sequenceId}`)}
          >
            Lancer
          </button>
        </div>
      </div>

      {modalEtape && (
        <EtapeFormModal
          etapeInitiale={modalEtape === 'nouvelle' ? undefined : modalEtape}
          surValidation={(d) => void validerEtape(d)}
          surFermeture={() => setModalEtape(null)}
        />
      )}

    </div>
  )
}
