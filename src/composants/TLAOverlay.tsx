import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { creneauEtActivite, db, listerPagesTLA, pageTLA as chargerPageTLA, picto as chargerPicto } from '../db'
import type { PageTLA, Picto, Profil } from '../types'
import { useAppuiLong } from '../lib/useAppuiLong'
import { useObjectUrl } from '../lib/useObjectUrl'
import { parler } from '../lib/voix'

type Props = {
  profilId: string
  surFermeture: () => void
}

/** Extrait l'id de créneau courant depuis l'URL, pour retrouver l'activité en cours. */
function creneauDepuisChemin(pathname: string, search: string): string | undefined {
  const viaCreneauEcran = pathname.match(/^\/profil\/[^/]+\/creneau\/([^/]+)/)
  if (viaCreneauEcran) return viaCreneauEcran[1]
  const viaSequentiel = pathname.match(/^\/profil\/[^/]+\/sequentiel\//)
  if (viaSequentiel) return new URLSearchParams(search).get('creneau') ?? undefined
  return undefined
}

function VignetteGrille({ picto, taille, surAppui }: { picto: Picto; taille: number; surAppui: () => void }) {
  const url = useObjectUrl(picto.image)
  return (
    <button
      type="button"
      className="bouton"
      onClick={surAppui}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: taille,
        padding: 4,
      }}
    >
      {url && <img src={url} alt="" style={{ maxWidth: '75%', maxHeight: '65%' }} />}
      <span style={{ fontSize: 14, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {picto.libelleAffiche}
      </span>
    </button>
  )
}

/**
 * Tableau de langage assisté (SPEC §4.5) : noyau fixe + page contextuelle,
 * bandeau de phrase, effacement simple (dernier picto) et total (appui
 * long). S'ouvre en recouvrement : l'écran en dessous ne perd jamais son
 * état, puisqu'il reste monté (voir BoutonFlottantTLA, rendu hors des
 * routes).
 */
export function TLAOverlay({ profilId, surFermeture }: Props) {
  const location = useLocation()
  const [profil, setProfil] = useState<Profil | null>(null)
  const [pageNoyau, setPageNoyau] = useState<PageTLA | null>(null)
  const [pagesDisponibles, setPagesDisponibles] = useState<PageTLA[]>([])
  const [pageContextuelleId, setPageContextuelleId] = useState<string>('')
  const [pageContextuelle, setPageContextuelle] = useState<PageTLA | null>(null)
  const [phrase, setPhrase] = useState<Picto[]>([])

  useEffect(() => {
    void db.profils.get(profilId).then((p) => setProfil(p ?? null))
  }, [profilId])

  useEffect(() => {
    if (!profil) return
    if (profil.pageTLAnoyau) void chargerPageTLA(profil.pageTLAnoyau).then((p) => setPageNoyau(p ?? null))
    void listerPagesTLA().then((toutes) => setPagesDisponibles(toutes.filter((p) => profil.pagesTLA.includes(p.id))))
  }, [profil])

  // Détermine la page contextuelle par défaut : celle de l'activité en
  // cours si elle en a une, sinon la première page disponible du profil.
  useEffect(() => {
    if (!profil) return
    const creneauId = creneauDepuisChemin(location.pathname, location.search)
    async function determiner() {
      if (creneauId) {
        const r = await creneauEtActivite(profilId, creneauId)
        if (r?.activite.tlaContexteId) {
          setPageContextuelleId(r.activite.tlaContexteId)
          return
        }
      }
      setPageContextuelleId(profil!.pagesTLA[0] ?? '')
    }
    void determiner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profil, location.pathname, location.search, profilId])

  useEffect(() => {
    if (pageContextuelleId) void chargerPageTLA(pageContextuelleId).then((p) => setPageContextuelle(p ?? null))
    else setPageContextuelle(null)
  }, [pageContextuelleId])

  const [pictosNoyau, setPictosNoyau] = useState<Picto[]>([])
  const [pictosContexte, setPictosContexte] = useState<Picto[]>([])

  useEffect(() => {
    void Promise.all((pageNoyau?.pictoIds ?? []).map((id) => chargerPicto(id))).then((liste) =>
      setPictosNoyau(liste.filter((p): p is Picto => Boolean(p))),
    )
  }, [pageNoyau])

  useEffect(() => {
    void Promise.all((pageContextuelle?.pictoIds ?? []).map((id) => chargerPicto(id))).then((liste) =>
      setPictosContexte(liste.filter((p): p is Picto => Boolean(p))),
    )
  }, [pageContextuelle])

  const { progression: progressionEffacer, liaisons: liaisonsEffacer } = useAppuiLong(() => setPhrase([]))

  function ajouter(picto: Picto) {
    setPhrase((p) => [...p, picto])
    if (profil?.vocal.actif && profil.vocal.auTap) {
      parler(picto.libelleParle, { voixURI: profil.vocal.voixURI, vitesse: profil.vocal.vitesse })
    }
  }

  // Appui court : retire le dernier picto. Appui long (useAppuiLong) : tout
  // efface déjà via son propre déclenchement ; si les deux se chevauchent,
  // retirer le dernier élément d'un bandeau déjà vidé ne fait rien.
  function effacerDernier() {
    setPhrase((p) => p.slice(0, -1))
  }

  function direLaPhrase() {
    if (!profil) return
    parler(phrase.map((p) => p.libelleParle).join(', '), { voixURI: profil.vocal.voixURI, vitesse: profil.vocal.vitesse })
  }

  if (!profil) return null

  const colonnesContexte = Math.max(1, profil.grilleTLA.colonnes - 1)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tableau de communication"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'var(--fond)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="barre">
        <button type="button" className="bouton" onClick={surFermeture}>
          Fermer
        </button>
        <span className="barre__titre">Je veux dire…</span>
        {pagesDisponibles.length > 1 && (
          <select
            className="champ"
            style={{ maxWidth: '12rem' }}
            value={pageContextuelleId}
            onChange={(e) => setPageContextuelleId(e.target.value)}
            aria-label="Choisir une page"
          >
            {pagesDisponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Bandeau de phrase */}
      <div
        className="ligne"
        style={{
          minHeight: 72,
          padding: 'var(--pas)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--bordure)',
          overflowX: 'auto',
          flexWrap: 'nowrap',
        }}
      >
        {phrase.length === 0 ? (
          <span style={{ color: 'var(--texte-secondaire)' }}>Toucher des pictos pour composer une phrase.</span>
        ) : (
          phrase.map((p, i) => (
            <span key={i} style={{ fontSize: 20, whiteSpace: 'nowrap' }}>
              {p.libelleAffiche}
              {i < phrase.length - 1 ? ' · ' : ''}
            </span>
          ))
        )}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="bouton"
          disabled={phrase.length === 0}
          onClick={effacerDernier}
          {...liaisonsEffacer}
          style={{ opacity: progressionEffacer > 0 ? 1 - progressionEffacer * 0.5 : 1 }}
        >
          Effacer
        </button>
        {profil.vocal.actif && profil.vocal.aLaValidation && (
          <button type="button" className="bouton bouton--accent" disabled={phrase.length === 0} onClick={direLaPhrase}>
            Parler
          </button>
        )}
      </div>

      {/* Grille : noyau + page contextuelle */}
      <div className="ligne" style={{ flex: 1, alignItems: 'stretch', gap: 0 }}>
        <div
          className="pile"
          style={{
            width: '18%',
            minWidth: 120,
            gap: 4,
            padding: 4,
            borderRight: '2px solid var(--bordure)',
            overflowY: 'auto',
          }}
        >
          {pictosNoyau.map((p) => (
            <VignetteGrille key={p.id} picto={p} taille={72} surAppui={() => ajouter(p)} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${colonnesContexte}, 1fr)`,
            gap: 4,
            padding: 4,
            overflowY: 'auto',
            alignContent: 'start',
          }}
        >
          {pictosContexte.length === 0 ? (
            <p style={{ margin: 4, color: 'var(--texte-secondaire)' }}>Aucun picto sur cette page.</p>
          ) : (
            pictosContexte.map((p) => <VignetteGrille key={p.id} picto={p} taille={96} surAppui={() => ajouter(p)} />)
          )}
        </div>
      </div>
    </div>
  )
}
