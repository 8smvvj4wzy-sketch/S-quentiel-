import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { creneauEtActivite, marquerCreneauFait, picto as chargerPicto } from '../db'
import { useObjectUrl } from '../lib/useObjectUrl'
import type { Activite, CreneauEDT, Picto } from '../types'

/**
 * Point d'entrée unique depuis l'EDT (SPEC §4.2) : redirige vers le
 * séquentiel de l'activité si elle en a une, sinon affiche son picto en
 * plein écran.
 */
export function VueCreneau() {
  const { profilId, creneauId } = useParams<{ profilId: string; creneauId: string }>()
  const [resultat, setResultat] = useState<
    { creneau: CreneauEDT; activite: Activite } | null | undefined
  >(undefined)
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)
  const naviguer = useNavigate()

  useEffect(() => {
    if (!profilId || !creneauId) return
    void creneauEtActivite(profilId, creneauId).then((r) => setResultat(r ?? null))
  }, [profilId, creneauId])

  useEffect(() => {
    if (resultat) void chargerPicto(resultat.activite.pictoId).then((p) => setPicto(p ?? null))
  }, [resultat])

  if (resultat === undefined) return null
  if (resultat === null || !profilId) {
    return (
      <div className="ecran contenu vide">
        <p>Ce créneau n'existe plus.</p>
      </div>
    )
  }

  if (resultat.activite.sequenceId) {
    return (
      <Navigate
        to={`/profil/${profilId}/sequentiel/${resultat.activite.sequenceId}?creneau=${resultat.creneau.id}`}
        replace
      />
    )
  }

  async function terminer() {
    if (!profilId || !creneauId) return
    await marquerCreneauFait(profilId, creneauId)
    naviguer(`/profil/${profilId}`)
  }

  return (
    <div
      className="ecran"
      style={{ alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--pas) * 3)' }}
    >
      {url && <img src={url} alt="" style={{ width: 280, height: 280, objectFit: 'contain' }} />}
      <p style={{ fontSize: 'var(--titre-etape)', fontWeight: 700, margin: 0 }}>{resultat.activite.nom}</p>
      <button
        type="button"
        className="bouton bouton--accent"
        style={{ minHeight: 'var(--cible-jeune)', fontSize: 24, padding: '0 40px' }}
        onClick={() => void terminer()}
      >
        Fait
      </button>
    </div>
  )
}
