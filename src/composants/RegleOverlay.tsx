import { useEffect, useState } from 'react'
import { picto as chargerPicto, regle as chargerRegle } from '../db'
import { useObjectUrl } from '../lib/useObjectUrl'
import type { Picto, Regle } from '../types'

type Props = {
  regleId: string
  surFermeture: () => void
}

/**
 * Affichage plein écran d'une règle (SPEC §4.4). Recouvrement, comme le
 * TLA : l'écran en dessous ne se démonte jamais.
 */
export function RegleOverlay({ regleId, surFermeture }: Props) {
  const [regle, setRegle] = useState<Regle | null>(null)
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)

  useEffect(() => {
    void chargerRegle(regleId).then((r) => setRegle(r ?? null))
  }, [regleId])

  useEffect(() => {
    if (regle?.pictoId) void chargerPicto(regle.pictoId).then((p) => setPicto(p ?? null))
  }, [regle])

  if (!regle) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Règle"
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
      }}
    >
      {url && <img src={url} alt="" style={{ width: 220, height: 220, objectFit: 'contain' }} />}
      <p style={{ fontSize: 'var(--titre-etape)', fontWeight: 700, textAlign: 'center', margin: 0, maxWidth: '40rem' }}>
        {regle.texte}
      </p>
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
