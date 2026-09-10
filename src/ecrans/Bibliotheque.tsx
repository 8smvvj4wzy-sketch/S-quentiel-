import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenirPictoCatalogue, rechercherPictosLocaux } from '../db'
import {
  catalogueDisponible,
  rechercherCatalogue,
  urlImageCatalogue,
  type EntreeCatalogue,
} from '../lib/arasaac'
import type { Picto } from '../types'
import { TuilePicto } from '../composants/TuilePicto'
import { DetailPictoModal } from '../composants/DetailPictoModal'
import { ImporterPhotoModal } from '../composants/ImporterPhotoModal'
import { GenerateurCompositeModal } from '../composants/GenerateurCompositeModal'
import { ImporterZipModal } from '../composants/ImporterZipModal'

type Onglet = 'bibliotheque' | 'catalogue'
type Modal = 'photo' | 'composite' | 'zip' | null

/**
 * Écran bibliothèque : recherche et aperçu des pictos (ROADMAP lot 1, revu
 * au lot 6 — le filtre par catégorie a sauté, ARASAAC en expose plus de 300
 * qui ne veulent rien dire pour un éducateur ; la recherche les remplace).
 * Vit dans l'espace éducateur — c'est l'adulte qui prépare les pictos que le
 * jeune retrouvera ensuite dans les séquentiels, l'EDT et le TLA.
 */
export function Bibliotheque() {
  const [onglet, setOnglet] = useState<Onglet>('bibliotheque')
  const [recherche, setRecherche] = useState('')
  const [catalogueOk, setCatalogueOk] = useState(true)

  const [bibliotheque, setBibliotheque] = useState<Picto[]>([])
  const [resultatsCatalogue, setResultatsCatalogue] = useState<EntreeCatalogue[]>([])

  const [pictoOuvert, setPictoOuvert] = useState<Picto | null>(null)
  const [enObtention, setEnObtention] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [message, setMessage] = useState<string | null>(null)

  const idsCatalogueObtenus = useMemo(() => {
    const ids = new Set<string>()
    for (const p of bibliotheque) {
      if (p.source === 'arasaac') ids.add(p.id.replace(/^arasaac-/, ''))
    }
    return ids
  }, [bibliotheque])

  const rechargerBibliotheque = useCallback(async () => {
    setBibliotheque(await rechercherPictosLocaux(recherche))
  }, [recherche])

  useEffect(() => {
    void rechargerBibliotheque()
  }, [rechargerBibliotheque])

  useEffect(() => {
    void catalogueDisponible().then(setCatalogueOk)
  }, [])

  useEffect(() => {
    if (onglet !== 'catalogue') return
    void rechercherCatalogue({ recherche, idsExclus: idsCatalogueObtenus }).then(setResultatsCatalogue)
  }, [onglet, recherche, idsCatalogueObtenus])

  async function obtenir(entree: EntreeCatalogue) {
    setEnObtention(entree.id)
    try {
      const picto = await obtenirPictoCatalogue(entree)
      await rechargerBibliotheque()
      setPictoOuvert(picto)
    } catch {
      setMessage(`Impossible de récupérer le picto « ${entree.libelle} ».`)
    } finally {
      setEnObtention(null)
    }
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/parametrage" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Bibliothèque de pictos</h1>
      </div>

      <div className="contenu pile">
        <div className="ligne">
          <input
            className="champ"
            style={{ flex: 1, minWidth: '12rem' }}
            placeholder="Rechercher un picto…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher un picto"
          />
        </div>

        <div className="ligne">
          <button
            type="button"
            className="bouton"
            style={{ borderColor: onglet === 'bibliotheque' ? 'var(--accent)' : undefined, fontWeight: onglet === 'bibliotheque' ? 700 : undefined }}
            onClick={() => setOnglet('bibliotheque')}
          >
            Ma bibliothèque ({bibliotheque.length})
          </button>
          <button
            type="button"
            className="bouton"
            style={{ borderColor: onglet === 'catalogue' ? 'var(--accent)' : undefined, fontWeight: onglet === 'catalogue' ? 700 : undefined }}
            onClick={() => setOnglet('catalogue')}
            disabled={!catalogueOk}
          >
            Catalogue ARASAAC
          </button>
        </div>

        {!catalogueOk && (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Le pack ARASAAC n'a pas encore été construit pour ce dépôt (voir README « Pack
            ARASAAC »). L'import photo et le générateur composite restent disponibles.
          </p>
        )}

        {message && <p style={{ color: 'var(--alerte)', margin: 0 }}>{message}</p>}

        {onglet === 'bibliotheque' ? (
          bibliotheque.length === 0 ? (
            <div className="vide">
              <p>Aucun picto pour l'instant.</p>
              <p>
                Prendre un picto dans le catalogue ARASAAC, importer une photo, ou combiner des
                pictos existants avec le générateur composite.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                gap: 8,
              }}
            >
              {bibliotheque.map((p) => (
                <TuilePicto
                  key={p.id}
                  image={p.image}
                  libelle={p.libelleAffiche}
                  surAppui={() => setPictoOuvert(p)}
                />
              ))}
            </div>
          )
        ) : resultatsCatalogue.length === 0 ? (
          <div className="vide">
            <p>Aucun résultat dans le catalogue ARASAAC.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: 8,
            }}
          >
            {resultatsCatalogue.map((e) => (
              <TuilePicto
                key={e.id}
                image={urlImageCatalogue(e.id)}
                libelle={e.libelle}
                surAppui={() => void obtenir(e)}
                enCours={enObtention === e.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="barre" style={{ borderBottom: 'none', borderTop: '1px solid var(--bordure)' }}>
        <button type="button" className="bouton" onClick={() => setModal('photo')}>
          Importer une photo
        </button>
        <button
          type="button"
          className="bouton"
          disabled={bibliotheque.length < 2}
          onClick={() => setModal('composite')}
        >
          Créer un picto composite
        </button>
        <button type="button" className="bouton" onClick={() => setModal('zip')}>
          Importer un pack ZIP
        </button>
      </div>

      {pictoOuvert && (
        <DetailPictoModal
          picto={pictoOuvert}
          surFermeture={() => setPictoOuvert(null)}
          surModification={() => {
            setPictoOuvert(null)
            void rechargerBibliotheque()
          }}
        />
      )}

      {modal === 'photo' && (
        <ImporterPhotoModal
          surFermeture={() => setModal(null)}
          surImportReussi={() => {
            setModal(null)
            void rechargerBibliotheque()
          }}
        />
      )}

      {modal === 'composite' && (
        <GenerateurCompositeModal
          bibliotheque={bibliotheque}
          surFermeture={() => setModal(null)}
          surCreation={() => {
            setModal(null)
            void rechargerBibliotheque()
          }}
        />
      )}

      {modal === 'zip' && (
        <ImporterZipModal
          surFermeture={() => setModal(null)}
          surImportReussi={(nb) => {
            setModal(null)
            setMessage(`${nb} picto(s) importé(s).`)
            void rechargerBibliotheque()
          }}
        />
      )}
    </div>
  )
}
