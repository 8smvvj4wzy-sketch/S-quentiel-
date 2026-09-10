import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db, definirGrilleTLA, definirPageNoyau, definirPagesContextuelles, listerPagesTLA } from '../db'
import { LIMITES, type PageTLA, type Profil } from '../types'

/** Configuration de la grille TLA par profil : noyau + pages contextuelles (SPEC §4.5). */
export function ConfigurationTLA() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const [pages, setPages] = useState<PageTLA[]>([])

  const recharger = useCallback(async () => {
    if (!profilId) return
    setProfil((await db.profils.get(profilId)) ?? null)
    setPages(await listerPagesTLA())
  }, [profilId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  if (profil === undefined) return null
  if (profil === null) {
    return (
      <div className="ecran contenu vide">
        <p>Profil introuvable.</p>
        <Link to={`/profil/${profilId}/tla`} className="bouton">
          Retour
        </Link>
      </div>
    )
  }

  function basculerPageContextuelle(pageId: string) {
    if (!profilId || !profil) return
    const actuelles = profil.pagesTLA
    const suivantes = actuelles.includes(pageId) ? actuelles.filter((id) => id !== pageId) : [...actuelles, pageId]
    void definirPagesContextuelles(profilId, suivantes).then(recharger)
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}/tla`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">TLA — {profil.initiales}</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '36rem' }}>
        <h2 style={{ fontSize: 20 }}>Taille de la grille</h2>
        <div className="ligne">
          <label className="etiquette" htmlFor="colonnes-tla" style={{ margin: 0 }}>
            Colonnes
          </label>
          <select
            id="colonnes-tla"
            className="champ"
            style={{ maxWidth: '6rem' }}
            value={profil.grilleTLA.colonnes}
            onChange={(e) => {
              if (profilId) void definirGrilleTLA(profilId, Number(e.target.value), profil.grilleTLA.lignes).then(recharger)
            }}
          >
            {Array.from(
              { length: LIMITES.grilleTLA.colonnesMax - LIMITES.grilleTLA.colonnesMin + 1 },
              (_, i) => LIMITES.grilleTLA.colonnesMin + i,
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className="etiquette" htmlFor="lignes-tla" style={{ margin: 0 }}>
            Lignes
          </label>
          <select
            id="lignes-tla"
            className="champ"
            style={{ maxWidth: '6rem' }}
            value={profil.grilleTLA.lignes}
            onChange={(e) => {
              if (profilId) void definirGrilleTLA(profilId, profil.grilleTLA.colonnes, Number(e.target.value)).then(recharger)
            }}
          >
            {Array.from(
              { length: LIMITES.grilleTLA.lignesMax - LIMITES.grilleTLA.lignesMin + 1 },
              (_, i) => LIMITES.grilleTLA.lignesMin + i,
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <h2 style={{ fontSize: 20 }}>Page noyau (toujours visible)</h2>
        <select
          className="champ"
          value={profil.pageTLAnoyau}
          onChange={(e) => {
            if (profilId) void definirPageNoyau(profilId, e.target.value).then(recharger)
          }}
        >
          <option value="">Aucune choisie</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>

        <h2 style={{ fontSize: 20 }}>Pages contextuelles disponibles</h2>
        {pages.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Aucune page créée. Aller dans « Pages du tableau de communication ».
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {pages.map((p) => (
              <li key={p.id}>
                <label className="ligne" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={profil.pagesTLA.includes(p.id)}
                    onChange={() => basculerPageContextuelle(p.id)}
                    style={{ width: 24, height: 24 }}
                  />
                  {p.nom}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
