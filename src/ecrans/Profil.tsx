import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../db'
import type { Profil as TypeProfil } from '../types'

/**
 * Emplacement de l'emploi du temps (SPEC §4.2), construit au lot 3.
 * Registre jeune.
 */
export function Profil() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<TypeProfil | null | undefined>(undefined)

  useEffect(() => {
    if (!profilId) return
    void db.profils.get(profilId).then((p) => setProfil(p ?? null))
  }, [profilId])

  if (profil === undefined) return null

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">{profil ? profil.initiales : 'Profil introuvable'}</h1>
      </div>

      <div className="contenu">
        <div className="vide">
          <p>Aucune activité prévue pour l'instant.</p>
          <p>Un adulte peut préparer la journée depuis l'espace éducateur.</p>
        </div>
      </div>
    </div>
  )
}
