import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ajouterEtape,
  cocherEtape,
  decocherEtape,
  lireCochage,
  modifierEtape,
  reinitialiserCochage,
  reordonnerEtapes,
  sequence as chargerSequence,
  picto as chargerPicto,
  supprimerEtape,
} from '../db'
import { EtapeFormModal } from '../composants/EtapeFormModal'
import { useGlisserDeposer } from '../lib/useGlisserDeposer'
import { useNomEtape } from '../lib/useNomEtape'
import { useObjectUrl } from '../lib/useObjectUrl'
import type { Etape, EtatCochage, Picto, Sequence } from '../types'

function ImagePictoEtape({ pictoId, taille }: { pictoId: string | undefined; taille: number }) {
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)
  useEffect(() => {
    if (pictoId) void chargerPicto(pictoId).then((p) => setPicto(p ?? null))
  }, [pictoId])
  if (!url) return null
  return <img src={url} alt="" style={{ width: taille, height: taille, objectFit: 'contain' }} />
}

/** Le nom d'une étape, qui passe à la ligne au lieu d'être rogné. */
function NomEtape({ etape, style }: { etape: Etape; style?: React.CSSProperties }) {
  const nom = useNomEtape(etape)
  return <span style={{ minWidth: 0, overflowWrap: 'anywhere', ...style }}>{nom}</span>
}

function LigneEtapeEdition({
  etape,
  poignee,
  surModifier,
  surSupprimer,
}: {
  etape: Etape
  poignee: object
  surModifier: () => void
  surSupprimer: () => void
}) {
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)
  useEffect(() => {
    if (etape.pictoId) void chargerPicto(etape.pictoId).then((p) => setPicto(p ?? null))
    else setPicto(null)
  }, [etape.pictoId])

  return (
    <li
      className="ligne"
      style={{
        justifyContent: 'space-between',
        padding: 'var(--pas)',
        background: 'var(--surface)',
        border: '1px solid var(--bordure)',
        borderRadius: 'var(--rayon)',
      }}
    >
      <div className="ligne" {...poignee} style={{ ...(poignee as { style?: object }).style, flex: 1 }}>
        <span aria-hidden="true" style={{ fontSize: 20, color: 'var(--texte-secondaire)' }}>
          ⠿
        </span>
        {url && <img src={url} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />}
        <NomEtape etape={etape} />
      </div>
      <span className="ligne">
        <button type="button" className="bouton" onClick={surModifier}>
          Modifier
        </button>
        <button type="button" className="bouton bouton--danger" onClick={surSupprimer}>
          Supprimer
        </button>
      </span>
    </li>
  )
}

/**
 * Vue jeune du séquentiel (SPEC §4.3). Accessible soit via l'emploi du temps
 * (`?creneau=<id du créneau>`), soit lancé directement depuis l'écran
 * Séquentiels — dans ce cas `creneauId` vaut l'id de la séquence elle-même,
 * pour que le cochage ait tout de même un repère stable.
 *
 * Depuis le lot 9, un bouton « Modifier » bascule dans un mode édition en
 * place (ajouter, modifier, supprimer, réordonner des étapes) : sur le
 * terrain, on réadapte une séquence pendant qu'on la fait, pas après.
 *
 * La lecture vocale des étapes (SPEC §6) arrive avec les réglages vocaux du
 * lot 4 : elle dépend d'une UI de configuration qui n'existe pas encore.
 */
export function VueSequentiel() {
  const { profilId, sequenceId } = useParams<{ profilId: string; sequenceId: string }>()
  const [searchParams] = useSearchParams()
  const creneauId = searchParams.get('creneau') ?? sequenceId ?? ''
  const naviguer = useNavigate()

  const [seq, setSeq] = useState<Sequence | null | undefined>(undefined)
  const [cochage, setCochage] = useState<EtatCochage | undefined>(undefined)
  const [modeEdition, setModeEdition] = useState(false)
  const [modalEtape, setModalEtape] = useState<'nouvelle' | Etape | null>(null)

  const recharger = useCallback(async () => {
    if (!sequenceId || !profilId) return
    setSeq((await chargerSequence(sequenceId)) ?? null)
    setCochage(await lireCochage(profilId, creneauId))
  }, [sequenceId, profilId, creneauId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  const { liste, poignee } = useGlisserDeposer(seq?.etapes ?? [], (ordre) => {
    if (sequenceId) void reordonnerEtapes(sequenceId, ordre).then(recharger)
  })

  if (seq === undefined) return null
  if (seq === null || !profilId) {
    return (
      <div className="ecran contenu vide">
        <p>Séquence introuvable.</p>
      </div>
    )
  }

  const etapesFaites = new Set(cochage?.etapesFaites ?? [])
  const toutesFaites = seq.etapes.length > 0 && seq.etapes.every((e) => etapesFaites.has(e.id))

  async function basculer(etape: Etape) {
    if (!profilId) return
    if (etapesFaites.has(etape.id)) {
      // Décochage libre depuis le lot 8 : sur le terrain, on se trompe et il
      // faut pouvoir revenir en arrière tout de suite. (SPEC §4.3 et §5
      // l'interdisaient en mode jeune ; écart assumé.)
      await decocherEtape(profilId, creneauId, etape.id)
    } else {
      await cocherEtape(profilId, creneauId, etape.id)
    }
    await recharger()
  }

  function retour() {
    naviguer(`/profil/${profilId}`)
  }

  /** Un séquentiel fini n'est pas un cul-de-sac : en atelier, on le refait. */
  async function recommencer() {
    if (!profilId) return
    await reinitialiserCochage(profilId, creneauId)
    await recharger()
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

  if (modeEdition) {
    return (
      <div className="ecran">
        <div className="barre">
          <span className="barre__titre">{seq.nom}</span>
          <button type="button" className="bouton bouton--accent" onClick={() => setModeEdition(false)}>
            Terminé
          </button>
        </div>
        <div className="contenu pile">
          {liste.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
              Aucune étape pour l'instant. Appuyer sur « + Ajouter une étape ».
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
              {liste.map((etape) => (
                <LigneEtapeEdition
                  key={etape.id}
                  etape={etape}
                  poignee={poignee(etape.id)}
                  surModifier={() => setModalEtape(etape)}
                  surSupprimer={() => sequenceId && void supprimerEtape(sequenceId, etape.id).then(recharger)}
                />
              ))}
            </ul>
          )}
          <button type="button" className="bouton" style={{ width: 'fit-content' }} onClick={() => setModalEtape('nouvelle')}>
            + Ajouter une étape
          </button>
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

  if (toutesFaites) {
    return (
      <div
        className="ecran"
        style={{ alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--pas) * 3)' }}
      >
        <span aria-hidden="true" style={{ fontSize: 96, color: 'var(--fait)' }}>
          ✓
        </span>
        <h1 style={{ fontSize: 'var(--titre-etape)' }}>Fini !</h1>
        <div className="ligne" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="bouton bouton--accent"
            style={{ minHeight: 'var(--cible-jeune)', fontSize: 24, padding: '0 32px' }}
            onClick={() => void recommencer()}
          >
            Recommencer
          </button>
          <button
            type="button"
            className="bouton"
            style={{ minHeight: 'var(--cible-jeune)', fontSize: 24, padding: '0 32px' }}
            onClick={retour}
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (seq.uneEtapeALaFois) {
    const etapeCourante = seq.etapes.find((e) => !etapesFaites.has(e.id))!
    const indice = seq.etapes.indexOf(etapeCourante)
    return (
      <div className="ecran">
        <div className="barre">
          <span className="barre__titre">{seq.nom}</span>
          <span style={{ color: 'var(--texte-secondaire)' }}>
            Étape {indice + 1} sur {seq.etapes.length}
          </span>
          <button type="button" className="bouton" onClick={() => setModeEdition(true)}>
            Modifier
          </button>
        </div>
        <div
          className="contenu"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'calc(var(--pas) * 3)',
          }}
        >
          <ImagePictoEtape pictoId={etapeCourante.pictoId} taille={220} />
          <NomEtape
            etape={etapeCourante}
            style={{
              fontSize: 'var(--titre-etape)',
              fontWeight: 700,
              textAlign: 'center',
              maxWidth: '40rem',
            }}
          />
          <button
            type="button"
            className="bouton bouton--accent"
            style={{ minHeight: 'var(--cible-jeune)', fontSize: 24, padding: '0 40px' }}
            onClick={() => void basculer(etapeCourante)}
          >
            Fait
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ecran">
      <div className="barre">
        <span className="barre__titre">{seq.nom}</span>
        <button type="button" className="bouton" onClick={() => setModeEdition(true)}>
          Modifier
        </button>
      </div>
      <div className="contenu pile">
        {seq.etapes.map((etape) => {
          const faite = etapesFaites.has(etape.id)
          const enCours = !faite && seq.etapes.slice(0, seq.etapes.indexOf(etape)).every((e) => etapesFaites.has(e.id))
          return (
            <button
              key={etape.id}
              type="button"
              className="bouton"
              onClick={() => void basculer(etape)}
              style={{
                minHeight: 'var(--cible-jeune)',
                justifyContent: 'flex-start',
                gap: 'var(--pas)',
                background: faite ? 'var(--surface)' : 'var(--surface)',
                borderColor: faite ? 'var(--fait)' : enCours ? 'var(--en-cours)' : 'var(--bordure-forte)',
                borderWidth: enCours || faite ? 3 : 2,
                opacity: faite ? 0.75 : 1,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: `2px solid ${faite ? 'var(--fait)' : 'var(--bordure-forte)'}`,
                  color: 'var(--fait)',
                  fontWeight: 700,
                }}
              >
                {faite ? '✓' : ''}
              </span>
              <ImagePictoEtape pictoId={etape.pictoId} taille={56} />
              <NomEtape
                etape={etape}
                style={{ fontSize: 22, fontWeight: enCours ? 700 : 400, textAlign: 'left' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
