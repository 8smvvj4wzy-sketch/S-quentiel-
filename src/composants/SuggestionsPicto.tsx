import { useEffect, useState } from 'react'
import { obtenirPictoCatalogue, rechercherPictosLocaux } from '../db'
import { rechercherCatalogue, urlImageCatalogue, type EntreeCatalogue } from '../lib/arasaac'
import { useDebounce } from '../lib/useDebounce'
import type { Picto } from '../types'
import { TuilePicto } from './TuilePicto'

type Props = {
  /** Le texte en cours de frappe. */
  libelle: string
  /** Picto déjà retenu, pour ne pas le reproposer. */
  pictoRetenuId?: string
  surChoix: (picto: Picto) => void
}

type Proposition =
  | { genre: 'bibliotheque'; picto: Picto }
  | { genre: 'catalogue'; entree: EntreeCatalogue }

const NOMBRE = 6

/**
 * Bande de pictos proposés au fil de la saisie d'un libellé (ROADMAP lot 7).
 * On ne demande rien à l'utilisateur : il tape « gâteau », les pictos
 * correspondants apparaissent, il en touche un ou les ignore.
 */
export function SuggestionsPicto({ libelle, pictoRetenuId, surChoix }: Props) {
  const requete = useDebounce(libelle.trim())
  const [propositions, setPropositions] = useState<Proposition[]>([])
  const [enCours, setEnCours] = useState<string | null>(null)

  useEffect(() => {
    if (requete.length < 2) {
      setPropositions([])
      return
    }
    let annule = false

    async function chercher() {
      const locaux = (await rechercherPictosLocaux(requete)).filter((p) => p.id !== pictoRetenuId)
      const dejaLa = new Set(
        locaux.filter((p) => p.source === 'arasaac').map((p) => p.id.replace(/^arasaac-/, '')),
      )
      const restant = NOMBRE - Math.min(locaux.length, NOMBRE)
      const entrees =
        restant > 0
          ? await rechercherCatalogue({ recherche: requete, idsExclus: dejaLa, limite: restant })
          : []
      if (annule) return
      setPropositions([
        ...locaux.slice(0, NOMBRE).map((picto) => ({ genre: 'bibliotheque' as const, picto })),
        ...entrees.map((entree) => ({ genre: 'catalogue' as const, entree })),
      ])
    }

    void chercher()
    return () => {
      annule = true
    }
  }, [requete, pictoRetenuId])

  if (propositions.length === 0) return null

  async function choisirEntree(entree: EntreeCatalogue) {
    setEnCours(entree.id)
    try {
      surChoix(await obtenirPictoCatalogue(entree))
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="pile" style={{ gap: 4 }}>
      <span style={{ fontSize: 14, color: 'var(--texte-secondaire)' }}>Pictos proposés</span>
      <div className="ligne" style={{ overflowX: 'auto', flexWrap: 'nowrap', gap: 4 }}>
        {propositions.map((p) =>
          p.genre === 'bibliotheque' ? (
            <TuilePicto
              key={p.picto.id}
              image={p.picto.image}
              libelle={p.picto.libelleAffiche}
              surAppui={() => surChoix(p.picto)}
            />
          ) : (
            <TuilePicto
              key={p.entree.id}
              image={urlImageCatalogue(p.entree.id)}
              libelle={p.entree.libelle}
              surAppui={() => void choisirEntree(p.entree)}
              enCours={enCours === p.entree.id}
            />
          ),
        )}
      </div>
    </div>
  )
}
