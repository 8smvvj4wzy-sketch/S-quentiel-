import { useEffect, useState } from 'react'
import { definirPin, pinDefini, verifierPin } from '../db'

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<']

type Props = {
  surSucces: () => void
  surAnnulation: () => void
}

/**
 * Code PIN à 4 chiffres, défini au premier lancement (SPEC §4.6).
 * Registre éducateur : on parle à l'adulte.
 */
export function SaisiePin({ surSucces, surAnnulation }: Props) {
  const [premierLancement, setPremierLancement] = useState<boolean | null>(null)
  const [saisie, setSaisie] = useState('')
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    void pinDefini().then((defini) => setPremierLancement(!defini))
  }, [])

  if (premierLancement === null) return null

  async function valider(code: string) {
    setErreur(null)
    if (premierLancement) {
      if (confirmation === null) {
        setConfirmation(code)
        setSaisie('')
        return
      }
      if (confirmation !== code) {
        setConfirmation(null)
        setSaisie('')
        setErreur('Les deux codes sont différents. Recommencer.')
        return
      }
      await definirPin(code)
      surSucces()
      return
    }
    if (await verifierPin(code)) {
      surSucces()
      return
    }
    setSaisie('')
    setErreur('Code incorrect.')
  }

  function appuyer(touche: string) {
    if (touche === '') return
    if (touche === '<') {
      setSaisie((s) => s.slice(0, -1))
      return
    }
    const suite = (saisie + touche).slice(0, 4)
    setSaisie(suite)
    if (suite.length === 4) void valider(suite)
  }

  const titre = premierLancement
    ? confirmation === null
      ? 'Choisir un code à 4 chiffres'
      : 'Saisir à nouveau le même code'
    : 'Espace éducateur'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--fond)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'calc(var(--pas) * 2)',
        padding: 'calc(var(--pas) * 2)',
      }}
    >
      <h2 style={{ fontSize: 24 }}>{titre}</h2>

      <div className="ligne" aria-hidden="true" style={{ gap: 'calc(var(--pas) * 1.5)' }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid var(--bordure-forte)',
              background: i < saisie.length ? 'var(--accent)' : 'transparent',
            }}
          />
        ))}
      </div>

      <p style={{ minHeight: 28, margin: 0, color: 'var(--alerte)', fontWeight: 700 }}>
        {erreur ?? ''}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, var(--cible-jeune))',
          gap: 'var(--pas)',
        }}
      >
        {TOUCHES.map((touche, i) =>
          touche === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              className="bouton"
              style={{ height: 'var(--cible-jeune)', fontSize: 24 }}
              onClick={() => appuyer(touche)}
            >
              {touche === '<' ? '⌫' : touche}
            </button>
          ),
        )}
      </div>

      <button type="button" className="bouton--discret" onClick={surAnnulation}>
        Annuler
      </button>
    </div>
  )
}
