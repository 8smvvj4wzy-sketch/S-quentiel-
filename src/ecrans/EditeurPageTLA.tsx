import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ajouterPictoAPage,
  pageTLA as chargerPage,
  picto as chargerPicto,
  renommerPageTLA,
  reordonnerPictosPage,
  retirerPictoDePage,
} from '../db'
import type { PageTLA, Picto } from '../types'
import { ChoisirPictoModal } from '../composants/ChoisirPictoModal'
import { TuilePicto } from '../composants/TuilePicto'
import { useGlisserDeposer } from '../lib/useGlisserDeposer'

function VignettePictoPage({ id, surRetrait }: { id: string; surRetrait: () => void }) {
  const [picto, setPicto] = useState<Picto | null>(null)
  useEffect(() => {
    void chargerPicto(id).then((p) => setPicto(p ?? null))
  }, [id])
  if (!picto) return null
  return (
    <div style={{ position: 'relative' }}>
      <TuilePicto image={picto.image} libelle={picto.libelleAffiche} surAppui={() => {}} />
      <button
        type="button"
        className="bouton bouton--danger"
        onClick={surRetrait}
        style={{ position: 'absolute', top: -8, right: -8, minHeight: 32, padding: '0 8px', fontSize: 14 }}
        aria-label={`Retirer ${picto.libelleAffiche}`}
      >
        ✕
      </button>
    </div>
  )
}

/** Contenu d'une page TLA : ajouter, retirer, réordonner des pictos. */
export function EditeurPageTLA() {
  const { pageId } = useParams<{ pageId: string }>()
  const [page, setPage] = useState<PageTLA | null | undefined>(undefined)
  const [nom, setNom] = useState('')
  const [choixOuvert, setChoixOuvert] = useState(false)

  const recharger = useCallback(async () => {
    if (!pageId) return
    const p = (await chargerPage(pageId)) ?? null
    setPage(p)
    if (p) setNom(p.nom)
  }, [pageId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  const items = (page?.pictoIds ?? []).map((id) => ({ id }))
  const { liste, poignee } = useGlisserDeposer(items, (ordre) => {
    if (pageId) void reordonnerPictosPage(pageId, ordre.map((x) => x.id)).then(recharger)
  })

  if (page === undefined) return null
  if (page === null) {
    return (
      <div className="ecran contenu vide">
        <p>Page introuvable.</p>
        <Link to="/educateur/tla" className="bouton">
          Retour
        </Link>
      </div>
    )
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/educateur/tla" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">{page.nom}</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <label className="etiquette" htmlFor="nom-page">
          Nom de la page
        </label>
        <input
          id="nom-page"
          className="champ"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onBlur={() => {
            if (pageId && nom.trim() && nom.trim() !== page.nom) void renommerPageTLA(pageId, nom).then(recharger)
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 8,
          }}
        >
          {liste.map((item) => (
            <div key={item.id} {...poignee(item.id)}>
              <VignettePictoPage
                id={item.id}
                surRetrait={() => {
                  if (pageId) void retirerPictoDePage(pageId, item.id).then(recharger)
                }}
              />
            </div>
          ))}
        </div>

        <button type="button" className="bouton bouton--accent" style={{ width: 'fit-content' }} onClick={() => setChoixOuvert(true)}>
          + Ajouter un picto
        </button>
      </div>

      {choixOuvert && (
        <ChoisirPictoModal
          surFermeture={() => setChoixOuvert(false)}
          surChoix={(p) => {
            setChoixOuvert(false)
            if (pageId) void ajouterPictoAPage(pageId, p.id).then(recharger)
          }}
        />
      )}
    </div>
  )
}
