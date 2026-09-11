import { useEffect, useState } from 'react'
import { listerGroupesRegles, listerRegles } from '../db'
import type { GroupeRegles, Regle } from '../types'

type Props = {
  regleIds: string[]
  groupeIds: string[]
  surChangement: (regleIds: string[], groupeIds: string[]) => void
}

function bascule(liste: string[], id: string): string[] {
  return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]
}

/**
 * Choix des règles et des ensembles à rappeler — pour une activité comme pour
 * la journée d'un profil. Un ensemble compte pour une seule case : « mains
 * calmes, pieds calmes, bouche silencieuse » se coche d'un geste.
 */
export function SelecteurRegles({ regleIds, groupeIds, surChangement }: Props) {
  const [regles, setRegles] = useState<Regle[]>([])
  const [groupes, setGroupes] = useState<GroupeRegles[]>([])

  useEffect(() => {
    void listerRegles().then(setRegles)
    void listerGroupesRegles().then(setGroupes)
  }, [])

  if (regles.length === 0 && groupes.length === 0) {
    return (
      <p style={{ margin: 0, color: 'var(--texte-secondaire)', fontSize: 16 }}>
        Aucune règle pour l'instant. En créer depuis l'écran « Règles ».
      </p>
    )
  }

  return (
    <div className="pile" style={{ gap: 4 }}>
      {groupes.map((g) => (
        <label
          key={g.id}
          className="ligne"
          style={{ minHeight: 'var(--cible)', cursor: 'pointer', fontSize: 18 }}
        >
          <input
            type="checkbox"
            checked={groupeIds.includes(g.id)}
            onChange={() => surChangement(regleIds, bascule(groupeIds, g.id))}
            style={{ width: 24, height: 24 }}
          />
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            {g.nom}{' '}
            <span style={{ color: 'var(--texte-secondaire)' }}>
              ({g.regleIds.length} règle{g.regleIds.length > 1 ? 's' : ''})
            </span>
          </span>
        </label>
      ))}
      {regles.map((r) => (
        <label
          key={r.id}
          className="ligne"
          style={{ minHeight: 'var(--cible)', cursor: 'pointer', fontSize: 18 }}
        >
          <input
            type="checkbox"
            checked={regleIds.includes(r.id)}
            onChange={() => surChangement(bascule(regleIds, r.id), groupeIds)}
            style={{ width: 24, height: 24 }}
          />
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.texte}</span>
        </label>
      ))}
    </div>
  )
}
