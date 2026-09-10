/**
 * Modèle de données — conforme à SPEC.md §2.
 *
 * Portée : pictos, séquences, activités, règles et pages TLA sont communs à
 * l'établissement. EDT, configuration TLA, réglages vocaux et état de cochage
 * sont propres à chaque profil.
 */

export type JourSemaine =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche'

export const JOURS_SEMAINE: JourSemaine[] = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
]

export type SourcePicto = 'arasaac' | 'photo' | 'composite'

export type Picto = {
  id: string
  source: SourcePicto
  image: Blob /** PNG rendu, quelle que soit la source */
  parts?: string[] /** ids des pictos composants, si composite */
  libelleAffiche: string /** ce qui est écrit sous le picto */
  libelleParle: string /** ce que prononce la synthèse vocale */
  tags: string[] /** pour la recherche */
}

export type Etape = {
  id: string
  pictoId?: string /** picto et/ou texte, au moins l'un des deux */
  texte?: string
}

export type Sequence = {
  id: string
  nom: string
  etapes: Etape[]
  /** Affichage « une étape à la fois » (plein écran) — SPEC §4.3 */
  uneEtapeALaFois?: boolean
}

export type Regle = {
  id: string
  pictoId?: string
  texte: string
}

export type Activite = {
  id: string
  nom: string
  pictoId: string
  sequenceId?: string /** facultatif */
  regleIds: string[]
  tlaContexteId?: string /** page TLA à charger pendant cette activité */
}

export type CreneauEDT = {
  id: string
  activiteId: string
  heureDebut?: string /** facultatif, un EDT peut être une simple suite */
  ordre: number
}

export type PageTLA = {
  id: string
  nom: string /** « Cuisine », « Récréation »… */
  pictoIds: string[]
}

export type GrilleTLA = {
  /** 3 à 8 */
  colonnes: number
  /** 2 à 6 */
  lignes: number
}

export type ReglagesVocal = {
  actif: boolean
  auTap: boolean
  aLaValidation: boolean
  voixURI?: string
  /** 0.5 à 1.5 */
  vitesse: number
}

export type Profil = {
  id: string
  /** Initiales ou prénom court. Jamais de nom de famille. */
  initiales: string
  edt: Record<JourSemaine, CreneauEDT[]>
  grilleTLA: GrilleTLA
  pageTLAnoyau: string /** page de vocabulaire noyau, toujours visible */
  pagesTLA: string[]
  reglesJournee: string[]
  vocal: ReglagesVocal
}

export type EtatCochage = {
  profilId: string
  creneauId: string
  etapesFaites: string[] /** ids d'étapes cochées */
}

/**
 * Réglages de la tablette. Une seule ligne, id fixe « unique ».
 * Le PIN n'est pas un secret cryptographique : il empêche un jeune d'entrer
 * dans l'espace éducateur, rien de plus. Il est tout de même stocké haché
 * pour ne pas traîner en clair dans IndexedDB.
 */
export type ReglagesTablette = {
  id: 'unique'
  pinHash?: string
  /** Version du schéma de configuration, pour l'export / import JSON. */
  versionConfig: number
}

export const LIMITES = {
  grilleTLA: { colonnesMin: 3, colonnesMax: 8, lignesMin: 2, lignesMax: 6 },
  vitesseVocale: { min: 0.5, max: 1.5 },
  /** Retour automatique en mode jeune après 5 min sans interaction — SPEC §5 */
  inactiviteEducateurMs: 5 * 60 * 1000,
  /** Appui long pour ouvrir l'espace éducateur — SPEC §4.6 */
  appuiLongMs: 3000,
} as const

export function edtVide(): Record<JourSemaine, CreneauEDT[]> {
  return {
    lundi: [],
    mardi: [],
    mercredi: [],
    jeudi: [],
    vendredi: [],
    samedi: [],
    dimanche: [],
  }
}
