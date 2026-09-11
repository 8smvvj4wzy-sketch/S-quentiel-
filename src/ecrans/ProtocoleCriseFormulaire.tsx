import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db, definirCriseProfil, listerSequences } from '../db'
import type { Profil, ProtocoleCrise, Sequence } from '../types'
import { SelecteurRegles } from '../composants/SelecteurRegles'

/**
 * Réglage du protocole crise (lot 11) : quelles règles rappeler, et quel
 * séquentiel ouvrir ensuite. Se fait une fois par profil, dans Paramétrage —
 * le bouton crise lui-même est utilisable par le jeune comme par
 * l'éducateur, mais sa préparation reste un geste d'adulte.
 */
export function ProtocoleCriseFormulaire() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const [sequences, setSequences] = useState<Sequence[]>([])

  const recharger = useCallback(async () => {
    if (!profilId) return
    setProfil((await db.profils.get(profilId)) ?? null)
  }, [profilId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  useEffect(() => {
    void listerSequences().then(setSequences)
  }, [])

  if (profil === undefined) return null
  if (profil === null) {
    return (
      <div className="ecran contenu vide">
        <p>Profil introuvable.</p>
        <Link to="/parametrage" className="bouton">
          Retour
        </Link>
      </div>
    )
  }

  const crise: ProtocoleCrise = profil.crise ?? { regleIds: [], groupeRegleIds: [] }

  function enregistrer(patch: Partial<ProtocoleCrise>) {
    if (!profilId) return
    void definirCriseProfil(profilId, patch).then(recharger)
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/parametrage" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Protocole crise — {profil.initiales}</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '32rem' }}>
        <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 18 }}>
          Un bouton rouge, visible en permanence sur les écrans de {profil.initiales}, rappelle
          d'un appui les règles choisies ici, puis enchaîne sur le séquentiel choisi. Tant que rien
          n'est réglé ci-dessous, le bouton ne s'affiche pas.
        </p>

        <span className="etiquette">Règles à rappeler</span>
        <SelecteurRegles
          regleIds={crise.regleIds}
          groupeIds={crise.groupeRegleIds}
          surChangement={(regleIds, groupeRegleIds) => enregistrer({ regleIds, groupeRegleIds })}
        />

        <label className="etiquette" htmlFor="sequence-crise">
          Séquentiel à ouvrir ensuite (facultatif)
        </label>
        <select
          id="sequence-crise"
          className="champ"
          value={crise.sequenceId ?? ''}
          onChange={(e) => enregistrer({ sequenceId: e.target.value || undefined })}
        >
          <option value="">Aucun — le rappel de règles se referme simplement</option>
          {sequences.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
