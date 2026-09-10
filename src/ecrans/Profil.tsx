import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  activite as chargerActivite,
  creneauEstFait,
  db,
  lireCochage,
  listerRegles,
  picto as chargerPicto,
  sequence as chargerSequence,
} from '../db'
import { calculerEtats, jourActuel, type EtatCreneau } from '../lib/edt'
import { useObjectUrl } from '../lib/useObjectUrl'
import type { Activite, CreneauEDT, Picto, Profil as TypeProfil, Regle } from '../types'
import { RegleOverlay } from '../composants/RegleOverlay'

type LigneEDT = { creneau: CreneauEDT; activite: Activite; etat: EtatCreneau }

async function estFait(profilId: string, creneau: CreneauEDT, activite: Activite): Promise<boolean> {
  if (activite.sequenceId) {
    const seq = await chargerSequence(activite.sequenceId)
    if (!seq || seq.etapes.length === 0) return false
    const cochage = await lireCochage(profilId, creneau.id)
    const faites = new Set(cochage?.etapesFaites ?? [])
    return seq.etapes.every((e) => faites.has(e.id))
  }
  return creneauEstFait(profilId, creneau.id)
}

function TuileCreneau({ ligne, surAppui }: { ligne: LigneEDT; surAppui: () => void }) {
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)
  useEffect(() => {
    void chargerPicto(ligne.activite.pictoId).then((p) => setPicto(p ?? null))
  }, [ligne.activite.pictoId])

  const { etat } = ligne
  const bordure = etat === 'en_cours' ? 'var(--en-cours)' : etat === 'passe' ? 'var(--fait)' : 'var(--bordure)'

  return (
    <button
      type="button"
      className="bouton"
      onClick={surAppui}
      style={{
        minHeight: 'var(--cible-jeune)',
        justifyContent: 'flex-start',
        gap: 'calc(var(--pas) * 1.5)',
        borderColor: bordure,
        borderWidth: etat === 'en_cours' ? 3 : 2,
        opacity: etat === 'passe' ? 0.65 : 1,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--fond)',
        }}
      >
        {url && <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
      </span>
      <span style={{ fontSize: 22, fontWeight: etat === 'en_cours' ? 700 : 400, flex: 1, textAlign: 'left' }}>
        {ligne.activite.nom}
      </span>
      {etat === 'passe' && (
        <span aria-hidden="true" style={{ color: 'var(--fait)', fontSize: 24, fontWeight: 700 }}>
          ✓
        </span>
      )}
    </button>
  )
}

/**
 * SPEC §4.2 — Emploi du temps du jour, vue jeune. Un appui sur n'importe
 * quel créneau l'ouvre, quel que soit son état : c'est l'éducateur qui
 * pilote, pas l'app.
 */
export function Profil() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<TypeProfil | null | undefined>(undefined)
  const [lignes, setLignes] = useState<LigneEDT[] | null>(null)
  const [reglesJournee, setReglesJournee] = useState<Regle[]>([])
  const [regleOuverte, setRegleOuverte] = useState<string | null>(null)
  const naviguer = useNavigate()

  const recharger = useCallback(async () => {
    if (!profilId) return
    const p = (await db.profils.get(profilId)) ?? null
    setProfil(p)
    if (!p) return

    const toutesLesRegles = await listerRegles()
    setReglesJournee(toutesLesRegles.filter((r) => p.reglesJournee.includes(r.id)))

    const jour = jourActuel()
    const creneaux = [...p.edt[jour]].sort((a, b) => a.ordre - b.ordre)
    const avecActivite = (
      await Promise.all(
        creneaux.map(async (creneau) => {
          const act = await chargerActivite(creneau.activiteId)
          return act ? { creneau, activite: act } : null
        }),
      )
    ).filter((x): x is { creneau: CreneauEDT; activite: Activite } => x !== null)

    const faits = new Set<string>()
    for (const { creneau, activite } of avecActivite) {
      if (await estFait(profilId, creneau, activite)) faits.add(creneau.id)
    }
    const etats = calculerEtats(
      avecActivite.map((x) => x.creneau),
      faits,
    )
    setLignes(avecActivite.map((x) => ({ ...x, etat: etats.get(x.creneau.id) ?? 'a_venir' })))
  }, [profilId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  if (profil === undefined) return null

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">{profil ? profil.initiales : 'Profil introuvable'}</h1>
      </div>

      {reglesJournee.length > 0 && (
        <div
          className="ligne"
          style={{
            padding: 'var(--pas)',
            background: 'var(--surface)',
            borderBottom: '2px solid var(--en-cours)',
            flexWrap: 'wrap',
          }}
        >
          {reglesJournee.map((r) => (
            <button
              key={r.id}
              type="button"
              className="bouton"
              style={{ minHeight: 'var(--cible)', fontSize: 16 }}
              onClick={() => setRegleOuverte(r.id)}
            >
              {r.texte}
            </button>
          ))}
        </div>
      )}

      <div className="contenu pile">
        {!lignes || lignes.length === 0 ? (
          <div className="vide">
            <p>Aucune activité pour l'instant.</p>
            <p>Un adulte peut préparer la journée depuis l'espace éducateur.</p>
          </div>
        ) : (
          lignes.map((ligne) => (
            <TuileCreneau
              key={ligne.creneau.id}
              ligne={ligne}
              surAppui={() => naviguer(`/profil/${profilId}/creneau/${ligne.creneau.id}`)}
            />
          ))
        )}
      </div>

      {regleOuverte && <RegleOverlay regleId={regleOuverte} surFermeture={() => setRegleOuverte(null)} />}
    </div>
  )
}
