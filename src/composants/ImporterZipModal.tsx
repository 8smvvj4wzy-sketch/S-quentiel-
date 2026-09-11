import { useState } from 'react'
import { importerPictosDepuisZip } from '../db'
import { extraireImagesDuZip } from '../lib/zip'

type Props = {
  surFermeture: () => void
  surImportReussi: (nb: number) => void
}

/** Import d'un pack ARASAAC complémentaire par ZIP (SPEC §3.1). */
export function ImporterZipModal({ surFermeture, surImportReussi }: Props) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function fichierChoisi(fichier: File | undefined) {
    if (!fichier) return
    setEnCours(true)
    setErreur(null)
    try {
      const images = await extraireImagesDuZip(fichier)
      if (images.length === 0) {
        setErreur("Aucune image (PNG ou JPG) trouvée dans ce fichier.")
        return
      }
      const { importes } = await importerPictosDepuisZip(images)
      surImportReussi(importes)
    } catch {
      setErreur("Ce fichier n'a pas pu être lu comme une archive ZIP.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importer un pack ZIP"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(28, 28, 30, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--pas) * 2)',
      }}
    >
      <div
        className="pile"
        style={{
          background: 'var(--surface)',
          border: '2px solid var(--bordure-forte)',
          borderRadius: 'var(--rayon-grand)',
          padding: 'calc(var(--pas) * 3)',
          maxWidth: '26rem',
          width: '100%',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Importer un pack ARASAAC complémentaire</h2>
        <p style={{ margin: 0 }}>
          Choisir un fichier ZIP contenant des images PNG ou JPG. Chaque image devient un
          picto, avec son nom de fichier comme libellé de départ — modifiable ensuite.
        </p>
        <input
          type="file"
          accept=".zip"
          className="champ"
          disabled={enCours}
          onChange={(e) => void fichierChoisi(e.target.files?.[0])}
        />
        {enCours && <p style={{ margin: 0 }}>Import en cours…</p>}
        {erreur && <p style={{ color: 'var(--alerte)', margin: 0 }}>{erreur}</p>}

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
