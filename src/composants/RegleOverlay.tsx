import { useEffect, useState } from 'react'
import { picto as chargerPicto, regle as chargerRegle } from '../db'
import { useObjectUrl } from '../lib/useObjectUrl'
import type { Picto, Regle } from '../types'

type Props = {
  /** Une règle seule, ou toutes celles d'un ensemble : elles s'affichent ensemble. */
  regleIds: string[]
  surFermeture: () => void
}

function CarteRegle({
  regle,
  taillePicto,
  tailleTexte,
}: {
  regle: Regle
  taillePicto: number
  tailleTexte: string | number
}) {
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)

  useEffect(() => {
    if (regle.pictoId) void chargerPicto(regle.pictoId).then((p) => setPicto(p ?? null))
    else setPicto(null)
  }, [regle.pictoId])

  return (
    <div
      className="pile"
      style={{ alignItems: 'center', gap: 'var(--pas)', flex: '0 1 auto', minWidth: 0 }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{ width: taillePicto, height: taillePicto, objectFit: 'contain', maxWidth: '100%' }}
        />
      )}
      <p
        style={{
          fontSize: tailleTexte,
          fontWeight: 700,
          textAlign: 'center',
          margin: 0,
          maxWidth: '20rem',
          overflowWrap: 'anywhere',
        }}
      >
        {regle.texte}
      </p>
    </div>
  )
}

/**
 * Affichage plein écran d'une règle, ou d'un ensemble de règles (SPEC §4.4).
 * Recouvrement, comme le TLA : l'écran en dessous ne se démonte jamais. Les
 * règles d'un ensemble tiennent sur le même écran — « mains calmes », « pieds
 * calmes », « bouche silencieuse » se lisent d'un seul regard, sans défiler.
 */
export function RegleOverlay({ regleIds, surFermeture }: Props) {
  const [regles, setRegles] = useState<Regle[]>([])
  const cle = regleIds.join(',')

  useEffect(() => {
    let annule = false
    void Promise.all(cle ? cle.split(',').map((id) => chargerRegle(id)) : []).then((chargees) => {
      if (!annule) setRegles(chargees.filter((r): r is Regle => Boolean(r)))
    })
    return () => {
      annule = true
    }
  }, [cle])

  if (regles.length === 0) return null

  const taillePicto = regles.length === 1 ? 220 : regles.length <= 4 ? 160 : 120
  const tailleTexte = regles.length === 1 ? 'var(--titre-etape)' : regles.length <= 4 ? 24 : 20

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={regles.length > 1 ? 'Règles' : 'Règle'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'var(--fond)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'calc(var(--pas) * 3)',
        padding: 'calc(var(--pas) * 2)',
        overflowY: 'auto',
      }}
    >
      <div
        className="ligne"
        style={{
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 'calc(var(--pas) * 3)',
          flexWrap: 'wrap',
        }}
      >
        {regles.map((r) => (
          <CarteRegle key={r.id} regle={r} taillePicto={taillePicto} tailleTexte={tailleTexte} />
        ))}
      </div>
      <button
        type="button"
        className="bouton bouton--accent"
        style={{ minHeight: 'var(--cible-jeune)', fontSize: 24, padding: '0 40px' }}
        onClick={surFermeture}
      >
        Fermer
      </button>
    </div>
  )
}
