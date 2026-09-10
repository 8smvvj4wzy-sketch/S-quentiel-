import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db, modifierReglagesVocaux } from '../db'
import { LIMITES, type Profil, type ReglagesVocal } from '../types'
import { parler, useVoixDisponibles, voixFrancaisesDisponibles } from '../lib/voix'

const PHRASE_TEST = "Bonjour, ceci est un essai de la voix."

/** Réglages vocaux par profil (SPEC §6). */
export function ReglagesVocaux() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const voix = useVoixDisponibles()

  const recharger = useCallback(async () => {
    if (!profilId) return
    setProfil((await db.profils.get(profilId)) ?? null)
  }, [profilId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  if (profil === undefined) return null
  if (profil === null) {
    return (
      <div className="ecran contenu vide">
        <p>Profil introuvable.</p>
        <Link to="/educateur" className="bouton">
          Retour
        </Link>
      </div>
    )
  }

  function enregistrer(patch: Partial<ReglagesVocal>) {
    if (!profilId || !profil) return
    void modifierReglagesVocaux(profilId, { ...profil.vocal, ...patch }).then(recharger)
  }

  const aucuneVoixFrancaise = voix.length > 0 && !voixFrancaisesDisponibles(voix)

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/educateur" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Réglages vocaux — {profil.initiales}</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '32rem' }}>
        <label className="ligne" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={profil.vocal.actif}
            onChange={(e) => enregistrer({ actif: e.target.checked })}
            style={{ width: 24, height: 24 }}
          />
          Vocal actif
        </label>

        <label className="ligne" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={profil.vocal.auTap}
            disabled={!profil.vocal.actif}
            onChange={(e) => enregistrer({ auTap: e.target.checked })}
            style={{ width: 24, height: 24 }}
          />
          Prononcer chaque picto au tap (TLA)
        </label>

        <label className="ligne" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={profil.vocal.aLaValidation}
            disabled={!profil.vocal.actif}
            onChange={(e) => enregistrer({ aLaValidation: e.target.checked })}
            style={{ width: 24, height: 24 }}
          />
          Lire la phrase complète au bouton « Parler » (TLA)
        </label>

        <label className="etiquette" htmlFor="voix">
          Voix
        </label>
        {voix.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Chargement des voix du système…</p>
        ) : (
          <select
            id="voix"
            className="champ"
            value={profil.vocal.voixURI ?? ''}
            onChange={(e) => enregistrer({ voixURI: e.target.value || undefined })}
          >
            <option value="">Voix par défaut du système</option>
            {voix.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}

        {aucuneVoixFrancaise && (
          <p style={{ margin: 0, color: 'var(--alerte)', fontWeight: 700 }}>
            Aucune voix française trouvée sur cette tablette. Aller dans Paramètres Android →
            Synthèse vocale → moteur Google → télécharger le français.
          </p>
        )}

        <label className="etiquette" htmlFor="vitesse">
          Vitesse ({profil.vocal.vitesse.toFixed(1)}×)
        </label>
        <input
          id="vitesse"
          type="range"
          min={LIMITES.vitesseVocale.min}
          max={LIMITES.vitesseVocale.max}
          step={0.1}
          value={profil.vocal.vitesse}
          onChange={(e) => enregistrer({ vitesse: Number(e.target.value) })}
          style={{ height: 44 }}
        />

        <button
          type="button"
          className="bouton bouton--accent"
          style={{ width: 'fit-content' }}
          onClick={() => parler(PHRASE_TEST, { voixURI: profil.vocal.voixURI, vitesse: profil.vocal.vitesse })}
        >
          Tester la voix
        </button>
      </div>
    </div>
  )
}
