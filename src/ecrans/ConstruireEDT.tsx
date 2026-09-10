import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  activite as chargerActivite,
  ajouterCreneau,
  db,
  definirReglesJournee,
  listerRegles,
  modifierHeureCreneau,
  reordonnerCreneaux,
  supprimerCreneau,
} from '../db'
import { JOURS_SEMAINE, type Activite, type CreneauEDT, type JourSemaine, type Profil, type Regle } from '../types'
import { ChoisirActiviteModal } from '../composants/ChoisirActiviteModal'
import { jourActuel } from '../lib/edt'
import { useGlisserDeposer } from '../lib/useGlisserDeposer'

const LIBELLES_JOUR: Record<JourSemaine, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
}

function LigneCreneau({
  creneau,
  poignee,
  onHeure,
  onSupprimer,
}: {
  creneau: CreneauEDT
  poignee: object
  onHeure: (heure: string) => void
  onSupprimer: () => void
}) {
  const [activite, setActivite] = useState<Activite | null>(null)
  useEffect(() => {
    void chargerActivite(creneau.activiteId).then((a) => setActivite(a ?? null))
  }, [creneau.activiteId])

  return (
    <li
      className="ligne"
      style={{
        justifyContent: 'space-between',
        padding: 'var(--pas)',
        background: 'var(--surface)',
        border: '1px solid var(--bordure)',
        borderRadius: 'var(--rayon)',
      }}
    >
      <div className="ligne" {...poignee} style={{ ...(poignee as { style?: object }).style, flex: 1 }}>
        <span aria-hidden="true" style={{ fontSize: 20, color: 'var(--texte-secondaire)' }}>
          ⠿
        </span>
        <span style={{ fontWeight: 700 }}>{activite?.nom ?? '…'}</span>
      </div>
      <input
        type="time"
        className="champ"
        style={{ width: '9rem' }}
        value={creneau.heureDebut ?? ''}
        aria-label="Heure de début (facultative)"
        onChange={(e) => onHeure(e.target.value)}
      />
      <button type="button" className="bouton bouton--danger" onClick={onSupprimer}>
        Retirer
      </button>
    </li>
  )
}

/** Construction de l'EDT par profil et par jour de semaine (SPEC §4.6). */
export function ConstruireEDT() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  // Le jour du jour, pas lundi : la vue jeune lit edt[jourActuel()], donc
  // partir sur lundi rangeait silencieusement les créneaux dans un jour que
  // personne ne regardait.
  const [jour, setJour] = useState<JourSemaine>(jourActuel())
  const [choixActiviteOuvert, setChoixActiviteOuvert] = useState(false)
  const [regles, setRegles] = useState<Regle[]>([])

  const recharger = useCallback(async () => {
    if (!profilId) return
    setProfil((await db.profils.get(profilId)) ?? null)
  }, [profilId])

  useEffect(() => {
    void recharger()
  }, [recharger])

  useEffect(() => {
    void listerRegles().then(setRegles)
  }, [])

  const creneauxJour = profil?.edt[jour] ?? []

  const { liste, poignee } = useGlisserDeposer(creneauxJour, (ordre) => {
    if (profilId) void reordonnerCreneaux(profilId, jour, ordre).then(recharger)
  })

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

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/educateur" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Emploi du temps — {profil.initiales}</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <h2 style={{ fontSize: 20 }}>Règles de la journée</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          Affichées en bandeau permanent au-dessus de l'emploi du temps du jeune.
        </p>
        {regles.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Aucune règle créée. Aller dans « Bibliothèque de règles ».
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {regles.map((r) => (
              <li key={r.id}>
                <label className="ligne" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={profil.reglesJournee.includes(r.id)}
                    onChange={() => {
                      if (!profilId) return
                      const suivantes = profil.reglesJournee.includes(r.id)
                        ? profil.reglesJournee.filter((id) => id !== r.id)
                        : [...profil.reglesJournee, r.id]
                      void definirReglesJournee(profilId, suivantes).then(recharger)
                    }}
                    style={{ width: 24, height: 24 }}
                  />
                  {r.texte}
                </label>
              </li>
            ))}
          </ul>
        )}

        <h2 style={{ fontSize: 20 }}>Jour</h2>
        <div className="ligne" style={{ flexWrap: 'wrap' }}>
          {JOURS_SEMAINE.map((j) => (
            <button
              key={j}
              type="button"
              className="bouton"
              style={{ borderColor: jour === j ? 'var(--accent)' : undefined, fontWeight: jour === j ? 700 : undefined }}
              onClick={() => setJour(j)}
            >
              {LIBELLES_JOUR[j]}
            </button>
          ))}
        </div>

        {liste.length === 0 ? (
          <div className="vide">
            <p>Aucun créneau ce jour-là. Appuyer sur « + Ajouter un créneau ».</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {liste.map((c) => (
              <LigneCreneau
                key={c.id}
                creneau={c}
                poignee={poignee(c.id)}
                onHeure={(heure) => {
                  if (profilId) void modifierHeureCreneau(profilId, jour, c.id, heure || undefined).then(recharger)
                }}
                onSupprimer={() => {
                  if (profilId) void supprimerCreneau(profilId, jour, c.id).then(recharger)
                }}
              />
            ))}
          </ul>
        )}

        <button type="button" className="bouton bouton--accent" style={{ width: 'fit-content' }} onClick={() => setChoixActiviteOuvert(true)}>
          + Ajouter un créneau
        </button>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          L'heure de début est facultative : sans heure, l'emploi du temps est une simple suite
          d'activités, et le créneau « en cours » avance à mesure qu'elles sont faites.
        </p>
      </div>

      {choixActiviteOuvert && (
        <ChoisirActiviteModal
          surFermeture={() => setChoixActiviteOuvert(false)}
          surChoix={(a) => {
            setChoixActiviteOuvert(false)
            if (profilId) void ajouterCreneau(profilId, jour, a.id).then(recharger)
          }}
        />
      )}
    </div>
  )
}
