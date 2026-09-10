import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cocherEtape, decocherEtape, lireCochage, sequence as chargerSequence, picto as chargerPicto } from '../db'
import { useVerrouillage } from '../lib/verrouillage'
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

/**
 * Vue jeune du séquentiel (SPEC §4.3). Accessible soit via l'emploi du temps
 * (lot 3, `?creneau=<id du créneau>`), soit en prévisualisation directe
 * depuis l'éditeur de séquence — dans ce cas `creneauId` vaut l'id de la
 * séquence elle-même, pour que le cochage ait tout de même un repère stable.
 *
 * La lecture vocale des étapes (SPEC §6) arrive avec les réglages vocaux du
 * lot 4 : elle dépend d'une UI de configuration qui n'existe pas encore.
 */
export function VueSequentiel() {
  const { profilId, sequenceId } = useParams<{ profilId: string; sequenceId: string }>()
  const [searchParams] = useSearchParams()
  const creneauId = searchParams.get('creneau') ?? sequenceId ?? ''
  const naviguer = useNavigate()
  const { mode } = useVerrouillage()

  const [seq, setSeq] = useState<Sequence | null | undefined>(undefined)
  const [cochage, setCochage] = useState<EtatCochage | undefined>(undefined)

  const recharger = useCallback(async () => {
    if (!sequenceId || !profilId) return
    setSeq((await chargerSequence(sequenceId)) ?? null)
    setCochage(await lireCochage(profilId, creneauId))
  }, [sequenceId, profilId, creneauId])

  useEffect(() => {
    void recharger()
  }, [recharger])

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
      // En mode jeune, une étape cochée ne se décoche pas (SPEC §4.3, §5).
      if (mode !== 'educateur') return
      await decocherEtape(profilId, creneauId, etape.id)
    } else {
      await cocherEtape(profilId, creneauId, etape.id)
    }
    await recharger()
  }

  function retour() {
    naviguer(`/profil/${profilId}`)
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
        <button
          type="button"
          className="bouton bouton--accent"
          style={{ minHeight: 'var(--cible-jeune)', fontSize: 24, padding: '0 32px' }}
          onClick={retour}
        >
          Retour
        </button>
      </div>
    )
  }

  if (seq.uneEtapeALaFois) {
    const etapeCourante = seq.etapes.find((e) => !etapesFaites.has(e.id))!
    const indice = seq.etapes.indexOf(etapeCourante)
    return (
      <div className="ecran">
        <div className="barre">
          {mode === 'educateur' && (
            <Link to={`/educateur/sequences/${sequenceId}`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
              Quitter l'aperçu
            </Link>
          )}
          <span className="barre__titre">{seq.nom}</span>
          <span style={{ color: 'var(--texte-secondaire)' }}>
            Étape {indice + 1} sur {seq.etapes.length}
          </span>
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
          {etapeCourante.texte && (
            <p style={{ fontSize: 'var(--titre-etape)', fontWeight: 700, textAlign: 'center', margin: 0 }}>
              {etapeCourante.texte}
            </p>
          )}
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
        {mode === 'educateur' && (
          <Link to={`/educateur/sequences/${sequenceId}`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
            Quitter l'aperçu
          </Link>
        )}
        <span className="barre__titre">{seq.nom}</span>
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
              <span style={{ fontSize: 22, fontWeight: enCours ? 700 : 400 }}>{etape.texte}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
