import { useRef, useState } from 'react'
import { creerPictoDepuisPhoto } from '../db'
import { recadrerCarreEtCompresser } from '../lib/image'
import { useObjectUrl } from '../lib/useObjectUrl'

type Props = {
  surFermeture: () => void
  surImportReussi: () => void
}

/**
 * Import photo (galerie ou appareil photo), recadrage carré centré et
 * compression 512 px avant stockage (SPEC §3.2).
 */
export function ImporterPhotoModal({ surFermeture, surImportReussi }: Props) {
  const [apercu, setApercu] = useState<Blob | null>(null)
  const [libelle, setLibelle] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const entree = useRef<HTMLInputElement>(null)
  const urlApercu = useObjectUrl(apercu ?? undefined)

  async function fichierChoisi(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    try {
      setApercu(await recadrerCarreEtCompresser(fichier))
    } catch {
      setErreur("Cette image n'a pas pu être lue.")
    }
  }

  async function valider() {
    if (!apercu) return
    setEnCours(true)
    await creerPictoDepuisPhoto(apercu, libelle.trim() || 'Photo')
    setEnCours(false)
    surImportReussi()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importer une photo"
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
          borderRadius: 'var(--rayon)',
          padding: 'calc(var(--pas) * 3)',
          maxWidth: '26rem',
          width: '100%',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Importer une photo</h2>

        {!apercu ? (
          <>
            <p style={{ margin: 0 }}>
              Choisir une photo depuis la galerie ou prendre une photo. Elle sera recadrée en
              carré et réduite à 512 px.
            </p>
            <input
              ref={entree}
              type="file"
              accept="image/*"
              className="champ"
              onChange={(e) => void fichierChoisi(e.target.files?.[0])}
            />
            {erreur && <p style={{ color: 'var(--alerte)', margin: 0 }}>{erreur}</p>}
          </>
        ) : (
          <>
            <div className="ligne" style={{ justifyContent: 'center' }}>
              <span
                style={{
                  width: 160,
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--fond)',
                  border: '1px solid var(--bordure)',
                }}
              >
                {urlApercu && <img src={urlApercu} alt="" style={{ width: '100%', height: '100%' }} />}
              </span>
            </div>
            <label className="etiquette" htmlFor="libelle-photo">
              Libellé
            </label>
            <input
              id="libelle-photo"
              className="champ"
              value={libelle}
              placeholder="Ex. : Papa"
              onChange={(e) => setLibelle(e.target.value)}
            />
          </>
        )}

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
          {apercu && (
            <button
              type="button"
              className="bouton"
              onClick={() => {
                setApercu(null)
                if (entree.current) entree.current.value = ''
              }}
            >
              Reprendre
            </button>
          )}
          {apercu && (
            <button type="button" className="bouton bouton--accent" disabled={enCours} onClick={() => void valider()}>
              Ajouter à la bibliothèque
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
