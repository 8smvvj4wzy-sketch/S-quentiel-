import { JOURS_SEMAINE, type CreneauEDT, type JourSemaine } from '../types'

/** Jour de la semaine courant (JOURS_SEMAINE commence au lundi, Date.getDay() au dimanche). */
export function jourActuel(maintenant = new Date()): JourSemaine {
  return JOURS_SEMAINE[(maintenant.getDay() + 6) % 7]
}

export type EtatCreneau = 'passe' | 'en_cours' | 'a_venir'

/**
 * États des créneaux d'une journée (SPEC §4.2).
 *
 * Décision d'architecture (lot 3) : SPEC laisse `heureDebut` facultatif
 * (« un EDT peut être une simple suite »). Deux mécanismes coexistent :
 *  - un créneau avec heure : l'état vient de l'heure actuelle comparée aux
 *    heures de début de la journée (le dernier créneau atteint est
 *    « en cours », les précédents sont « passés »).
 *  - un créneau sans heure : l'état vient de l'achèvement manuel (le
 *    premier créneau non terminé, selon `faits`, est « en cours »).
 * `creneaux` doit déjà être trié par `ordre`.
 */
export function calculerEtats(
  creneaux: CreneauEDT[],
  faits: Set<string>,
  maintenant = new Date(),
): Map<string, EtatCreneau> {
  const etats = new Map<string, EtatCreneau>()
  const heureActuelle = `${String(maintenant.getHours()).padStart(2, '0')}:${String(
    maintenant.getMinutes(),
  ).padStart(2, '0')}`

  let dernierAtteint = -1
  creneaux.forEach((c, i) => {
    if (c.heureDebut && c.heureDebut <= heureActuelle) dernierAtteint = i
  })

  let enCoursTrouve = false
  for (let i = 0; i < creneaux.length; i++) {
    const c = creneaux[i]
    if (c.heureDebut) {
      if (i < dernierAtteint) etats.set(c.id, 'passe')
      else if (i === dernierAtteint) {
        etats.set(c.id, 'en_cours')
        enCoursTrouve = true
      } else etats.set(c.id, 'a_venir')
    } else if (enCoursTrouve) {
      etats.set(c.id, 'a_venir')
    } else if (faits.has(c.id)) {
      etats.set(c.id, 'passe')
    } else {
      etats.set(c.id, 'en_cours')
      enCoursTrouve = true
    }
  }
  return etats
}
