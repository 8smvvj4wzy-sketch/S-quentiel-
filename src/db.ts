import Dexie, { type Table } from 'dexie'
import {
  edtVide,
  JOURS_SEMAINE,
  LIMITES,
  type Activite,
  type CreneauEDT,
  type Etape,
  type EtatCochage,
  type GroupeRegles,
  type JourSemaine,
  type PageTLA,
  type Picto,
  type Profil,
  type Regle,
  type ReglagesTablette,
  type Sequence,
} from './types'
import { nouvelId } from './lib/id'
import { urlImageCatalogue, type EntreeCatalogue } from './lib/arasaac'
import { normaliser } from './lib/texte'
import type { DispositionComposite } from './lib/image'
import { genererComposite } from './lib/image'

/**
 * Toutes les données restent dans la tablette (SPEC : pas de backend, pas de
 * synchronisation). Les images de pictos sont des Blobs, d'où IndexedDB.
 */
class BaseSequentiel extends Dexie {
  pictos!: Table<Picto, string>
  sequences!: Table<Sequence, string>
  activites!: Table<Activite, string>
  regles!: Table<Regle, string>
  groupesRegles!: Table<GroupeRegles, string>
  pagesTLA!: Table<PageTLA, string>
  profils!: Table<Profil, string>
  cochages!: Table<EtatCochage, [string, string]>
  reglages!: Table<ReglagesTablette, string>

  constructor() {
    super('sequentiel')
    this.version(1).stores({
      pictos: 'id, source, libelleAffiche, *tags',
      sequences: 'id, nom',
      activites: 'id, nom, sequenceId',
      regles: 'id',
      pagesTLA: 'id, nom',
      profils: 'id, initiales',
      cochages: '[profilId+creneauId], profilId',
      reglages: 'id',
    })
    // v2 : ajout des ensembles de règles. Ajout de table seulement, donc rien
    // à migrer — les tablettes déjà installées passent en v2 sans rien perdre.
    this.version(2).stores({
      groupesRegles: 'id, nom',
    })
  }
}

export const db = new BaseSequentiel()

/* --- Réglages de la tablette ------------------------------------------ */

const ID_REGLAGES = 'unique'

export async function lireReglages(): Promise<ReglagesTablette> {
  const existant = await db.reglages.get(ID_REGLAGES)
  if (existant) return existant
  const neuf: ReglagesTablette = { id: ID_REGLAGES, versionConfig: 1 }
  await db.reglages.put(neuf)
  return neuf
}

async function hacherPin(pin: string): Promise<string> {
  const octets = new TextEncoder().encode(`sequentiel:${pin}`)
  const empreinte = await crypto.subtle.digest('SHA-256', octets)
  return [...new Uint8Array(empreinte)]
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('')
}

export async function pinDefini(): Promise<boolean> {
  return Boolean((await lireReglages()).pinHash)
}

export async function definirPin(pin: string): Promise<void> {
  const reglages = await lireReglages()
  await db.reglages.put({ ...reglages, pinHash: await hacherPin(pin) })
}

export async function verifierPin(pin: string): Promise<boolean> {
  const reglages = await lireReglages()
  if (!reglages.pinHash) return false
  return reglages.pinHash === (await hacherPin(pin))
}

/* --- Profils ----------------------------------------------------------- */

export function profilNeuf(initiales: string): Profil {
  return {
    id: nouvelId('profil'),
    initiales: initiales.trim(),
    edt: edtVide(),
    grilleTLA: {
      colonnes: LIMITES.grilleTLA.colonnesMin + 1,
      lignes: LIMITES.grilleTLA.lignesMin + 1,
    },
    pageTLAnoyau: '',
    pagesTLA: [],
    reglesJournee: [],
    groupesJournee: [],
    vocal: {
      actif: true,
      auTap: true,
      aLaValidation: true,
      vitesse: 1,
    },
  }
}

export async function listerProfils(): Promise<Profil[]> {
  const profils = await db.profils.toArray()
  return profils.sort((a, b) =>
    a.initiales.localeCompare(b.initiales, 'fr', { sensitivity: 'base' }),
  )
}

export async function creerProfil(initiales: string): Promise<Profil> {
  const profil = profilNeuf(initiales)
  await db.profils.add(profil)
  return profil
}

export async function renommerProfil(id: string, initiales: string): Promise<void> {
  await db.profils.update(id, { initiales: initiales.trim() })
}

/** Supprime le profil et tout ce qui lui est propre (ses cochages). */
export async function supprimerProfil(id: string): Promise<void> {
  await db.transaction('rw', db.profils, db.cochages, async () => {
    await db.cochages.where('profilId').equals(id).delete()
    await db.profils.delete(id)
  })
}

/* --- Pictos -------------------------------------------------------------
 * Pictos, séquences, activités, règles et pages TLA sont communs à
 * l'établissement (SPEC §2, « Portée des données »).
 */

export async function listerPictos(): Promise<Picto[]> {
  const pictos = await db.pictos.toArray()
  return pictos.sort((a, b) => a.libelleAffiche.localeCompare(b.libelleAffiche, 'fr'))
}

export async function rechercherPictosLocaux(recherche: string): Promise<Picto[]> {
  const q = normaliser(recherche.trim())
  const pictos = await listerPictos()
  if (!q) return pictos
  return pictos.filter(
    (p) => normaliser(p.libelleAffiche).includes(q) || p.tags.some((t) => normaliser(t).includes(q)),
  )
}

export async function picto(id: string): Promise<Picto | undefined> {
  return db.pictos.get(id)
}

/** id déterministe pour un picto du catalogue : « obtenir » deux fois la
 *  même entrée renvoie donc toujours le même Picto, pas un doublon. */
function idPictoArasaac(idCatalogue: string): string {
  return `arasaac-${idCatalogue}`
}

/**
 * « Obtient » un picto du catalogue ARASAAC embarqué (SPEC §3.1) : copie son
 * image en Blob dans Dexie, pour que le picto vive ensuite comme n'importe
 * quel autre, indépendamment du fichier statique d'origine.
 */
export async function obtenirPictoCatalogue(entree: EntreeCatalogue): Promise<Picto> {
  const id = idPictoArasaac(entree.id)
  const existant = await db.pictos.get(id)
  if (existant) return existant

  const reponse = await fetch(urlImageCatalogue(entree.id))
  if (!reponse.ok) throw new Error(`Image introuvable pour le picto ${entree.id}`)
  const image = await reponse.blob()

  // Quelques libellés du catalogue traînent une espace en tête (« banquier »).
  const libelle = entree.libelle.trim()
  const nouveau: Picto = {
    id,
    source: 'arasaac',
    image,
    libelleAffiche: libelle,
    libelleParle: libelle,
    tags: [...new Set([libelle, ...entree.tags.map((t) => t.trim())])],
  }
  await db.pictos.add(nouveau)
  return nouveau
}

export async function creerPictoDepuisPhoto(image: Blob, libelle: string): Promise<Picto> {
  const nouveau: Picto = {
    id: nouvelId('picto'),
    source: 'photo',
    image,
    libelleAffiche: libelle,
    libelleParle: libelle,
    tags: libelle ? [libelle] : [],
  }
  await db.pictos.add(nouveau)
  return nouveau
}

/** Compose 2 à 4 pictos existants en un nouveau picto (SPEC §3.3). */
export async function creerPictoComposite(
  idsParties: string[],
  disposition: DispositionComposite,
  libelle: string,
): Promise<Picto> {
  const parties = await db.pictos.bulkGet(idsParties)
  const manquant = parties.findIndex((p) => !p)
  if (manquant !== -1) throw new Error(`Picto introuvable : ${idsParties[manquant]}`)

  const image = await genererComposite(
    parties.map((p) => p!.image),
    disposition,
  )

  const nouveau: Picto = {
    id: nouvelId('picto'),
    source: 'composite',
    image,
    parts: idsParties,
    libelleAffiche: libelle,
    libelleParle: libelle,
    tags: libelle ? [libelle] : [],
  }
  await db.pictos.add(nouveau)
  return nouveau
}

export async function modifierLibellesPicto(
  id: string,
  libelleAffiche: string,
  libelleParle: string,
): Promise<void> {
  await db.pictos.update(id, { libelleAffiche, libelleParle })
}

export async function supprimerPicto(id: string): Promise<void> {
  // Remarque : aucune vérification d'usage pour l'instant, car rien ne
  // référence encore un pictoId (séquences, activités et TLA arrivent aux
  // lots suivants). À réintroduire quand ces lots existeront.
  await db.pictos.delete(id)
}

/**
 * Importe un pack ARASAAC complémentaire depuis un fichier ZIP (SPEC §3.1).
 * Format attendu : des images (png/jpg) à la racine ou dans un dossier du
 * zip, nommées par un identifiant ; le nom de fichier sans extension sert de
 * libellé par défaut (remplaçable ensuite comme tout picto).
 */
export async function importerPictosDepuisZip(
  fichiers: { nom: string; contenu: Blob }[],
): Promise<{ importes: number; ignores: number }> {
  let importes = 0
  let ignores = 0
  for (const { nom, contenu } of fichiers) {
    const segments = nom.split('/')
    const nomFichier = segments[segments.length - 1]
    const libelle = nomFichier.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
    if (!libelle) {
      ignores++
      continue
    }
    await creerPictoDepuisPhoto(contenu, libelle)
    importes++
  }
  return { importes, ignores }
}

/* --- Séquences ------------------------------------------------------------
 * Communes à l'établissement (SPEC §2). Écrites une fois, rattachées à
 * plusieurs profils via leurs activités (lot 3).
 */

export async function listerSequences(): Promise<Sequence[]> {
  const sequences = await db.sequences.toArray()
  return sequences.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function sequence(id: string): Promise<Sequence | undefined> {
  return db.sequences.get(id)
}

export async function creerSequence(nom: string): Promise<Sequence> {
  const nouvelle: Sequence = { id: nouvelId('sequence'), nom: nom.trim() || 'Nouvelle séquence', etapes: [] }
  await db.sequences.add(nouvelle)
  return nouvelle
}

export async function dupliquerSequence(id: string): Promise<Sequence> {
  const originale = await db.sequences.get(id)
  if (!originale) throw new Error('Séquence introuvable')
  const copie: Sequence = {
    ...originale,
    id: nouvelId('sequence'),
    nom: `${originale.nom} (copie)`,
    etapes: originale.etapes.map((e) => ({ ...e, id: nouvelId('etape') })),
  }
  await db.sequences.add(copie)
  return copie
}

export async function renommerSequence(id: string, nom: string): Promise<void> {
  await db.sequences.update(id, { nom: nom.trim() || 'Séquence' })
}

/** Supprime la séquence. Reste à vérifier son usage par des activités
 *  (lot 3) une fois que ce lien existera concrètement. */
export async function supprimerSequence(id: string): Promise<void> {
  await db.sequences.delete(id)
}

export async function definirUneEtapeALaFois(id: string, valeur: boolean): Promise<void> {
  await db.sequences.update(id, { uneEtapeALaFois: valeur })
}

export async function ajouterEtape(
  sequenceId: string,
  etape: Omit<Etape, 'id'>,
): Promise<void> {
  const s = await db.sequences.get(sequenceId)
  if (!s) throw new Error('Séquence introuvable')
  const nouvelle: Etape = { ...etape, id: nouvelId('etape') }
  await db.sequences.update(sequenceId, { etapes: [...s.etapes, nouvelle] })
}

export async function modifierEtape(
  sequenceId: string,
  etapeId: string,
  patch: Partial<Omit<Etape, 'id'>>,
): Promise<void> {
  const s = await db.sequences.get(sequenceId)
  if (!s) throw new Error('Séquence introuvable')
  const etapes = s.etapes.map((e) => (e.id === etapeId ? { ...e, ...patch } : e))
  await db.sequences.update(sequenceId, { etapes })
}

export async function supprimerEtape(sequenceId: string, etapeId: string): Promise<void> {
  const s = await db.sequences.get(sequenceId)
  if (!s) throw new Error('Séquence introuvable')
  await db.sequences.update(sequenceId, { etapes: s.etapes.filter((e) => e.id !== etapeId) })
}

/** Remplace l'ordre complet des étapes (glisser-déposer dans l'éditeur). */
export async function reordonnerEtapes(sequenceId: string, etapes: Etape[]): Promise<void> {
  await db.sequences.update(sequenceId, { etapes })
}

/* --- Cochage ---------------------------------------------------------------
 * Propre à chaque profil et à chaque créneau (SPEC §2). Avant le lot 3
 * (emploi du temps), un éducateur peut prévisualiser une séquence
 * directement depuis sa bibliothèque : `creneauId` vaut alors l'id de la
 * séquence elle-même — voir Bibliotheque des séquences / vue jeune.
 */

export async function lireCochage(
  profilId: string,
  creneauId: string,
): Promise<EtatCochage | undefined> {
  return db.cochages.get([profilId, creneauId])
}

export async function cocherEtape(
  profilId: string,
  creneauId: string,
  etapeId: string,
): Promise<EtatCochage> {
  const existant = await db.cochages.get([profilId, creneauId])
  const etapesFaites = existant?.etapesFaites.includes(etapeId)
    ? existant.etapesFaites
    : [...(existant?.etapesFaites ?? []), etapeId]
  const nouveau: EtatCochage = { profilId, creneauId, etapesFaites }
  await db.cochages.put(nouveau)
  return nouveau
}

/** Décocher une étape reste une action d'éducateur (SPEC §5 : en mode jeune,
 *  impossible de décocher). */
export async function decocherEtape(
  profilId: string,
  creneauId: string,
  etapeId: string,
): Promise<void> {
  const existant = await db.cochages.get([profilId, creneauId])
  if (!existant) return
  await db.cochages.put({
    ...existant,
    etapesFaites: existant.etapesFaites.filter((id) => id !== etapeId),
  })
}

export async function reinitialiserCochage(profilId: string, creneauId: string): Promise<void> {
  await db.cochages.delete([profilId, creneauId])
}

/** Remise à zéro de tous les cochages d'un profil (espace éducateur). */
export async function reinitialiserCochagesProfil(profilId: string): Promise<void> {
  await db.cochages.where('profilId').equals(profilId).delete()
}

/** Remise à zéro de tous les cochages, tous profils confondus. */
export async function reinitialiserTousLesCochages(): Promise<void> {
  await db.cochages.clear()
}

/* --- Activités --------------------------------------------------------- */

export async function listerActivites(): Promise<Activite[]> {
  const activites = await db.activites.toArray()
  return activites.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function activite(id: string): Promise<Activite | undefined> {
  return db.activites.get(id)
}

export async function creerActivite(donnees: {
  nom: string
  pictoId: string
  sequenceId?: string
  tlaContexteId?: string
  regleIds?: string[]
  groupeRegleIds?: string[]
}): Promise<Activite> {
  const nouvelle: Activite = {
    id: nouvelId('activite'),
    nom: donnees.nom.trim() || 'Activité',
    pictoId: donnees.pictoId,
    sequenceId: donnees.sequenceId,
    tlaContexteId: donnees.tlaContexteId,
    regleIds: donnees.regleIds ?? [],
    groupeRegleIds: donnees.groupeRegleIds ?? [],
  }
  await db.activites.add(nouvelle)
  return nouvelle
}

export async function modifierActivite(
  id: string,
  patch: Partial<Pick<Activite, 'nom' | 'pictoId' | 'sequenceId' | 'tlaContexteId'>>,
): Promise<void> {
  await db.activites.update(id, patch)
}

/** Reste à vérifier l'usage dans un EDT une fois que ce lien sera consulté
 *  systématiquement (l'EDT référence l'activité par id ; un créneau orphelin
 *  est simplement ignoré à l'affichage). */
export async function supprimerActivite(id: string): Promise<void> {
  await db.activites.delete(id)
}

/* --- Emploi du temps -----------------------------------------------------
 * Propre à chaque profil (SPEC §2). Stocké directement sur le Profil,
 * `edt: Record<JourSemaine, CreneauEDT[]>`.
 */

export async function ajouterCreneau(
  profilId: string,
  jour: JourSemaine,
  activiteId: string,
  heureDebut?: string,
): Promise<void> {
  const profil = await db.profils.get(profilId)
  if (!profil) throw new Error('Profil introuvable')
  const jourCreneaux = profil.edt[jour]
  const creneau: CreneauEDT = {
    id: nouvelId('creneau'),
    activiteId,
    heureDebut,
    ordre: jourCreneaux.length,
  }
  await db.profils.update(profilId, { edt: { ...profil.edt, [jour]: [...jourCreneaux, creneau] } })
}

export async function supprimerCreneau(
  profilId: string,
  jour: JourSemaine,
  creneauId: string,
): Promise<void> {
  const profil = await db.profils.get(profilId)
  if (!profil) throw new Error('Profil introuvable')
  const restants = profil.edt[jour].filter((c) => c.id !== creneauId).map((c, i) => ({ ...c, ordre: i }))
  await db.profils.update(profilId, { edt: { ...profil.edt, [jour]: restants } })
}

/** Remplace l'ordre complet des créneaux d'un jour (glisser-déposer). */
export async function reordonnerCreneaux(
  profilId: string,
  jour: JourSemaine,
  creneaux: CreneauEDT[],
): Promise<void> {
  const profil = await db.profils.get(profilId)
  if (!profil) throw new Error('Profil introuvable')
  const reordonnes = creneaux.map((c, i) => ({ ...c, ordre: i }))
  await db.profils.update(profilId, { edt: { ...profil.edt, [jour]: reordonnes } })
}

export async function modifierHeureCreneau(
  profilId: string,
  jour: JourSemaine,
  creneauId: string,
  heureDebut: string | undefined,
): Promise<void> {
  const profil = await db.profils.get(profilId)
  if (!profil) throw new Error('Profil introuvable')
  const jourCreneaux = profil.edt[jour].map((c) => (c.id === creneauId ? { ...c, heureDebut } : c))
  await db.profils.update(profilId, { edt: { ...profil.edt, [jour]: jourCreneaux } })
}

/**
 * Copie les créneaux d'un jour vers un autre (nouveaux ids, même activité et
 * heure). Lot 9 : répare les emplois du temps saisis avant le correctif du
 * jour par défaut, qui rangeaient tout au lundi sans que personne ne s'en
 * aperçoive.
 */
export async function copierCreneauxJour(
  profilId: string,
  depuis: JourSemaine,
  vers: JourSemaine,
): Promise<void> {
  const profil = await db.profils.get(profilId)
  if (!profil) throw new Error('Profil introuvable')
  const cible = profil.edt[vers]
  const copies: CreneauEDT[] = profil.edt[depuis].map((c, i) => ({
    id: nouvelId('creneau'),
    activiteId: c.activiteId,
    heureDebut: c.heureDebut,
    ordre: cible.length + i,
  }))
  await db.profils.update(profilId, { edt: { ...profil.edt, [vers]: [...cible, ...copies] } })
}

/** Retrouve un créneau (et son activité) sans connaître son jour à l'avance. */
export async function creneauEtActivite(
  profilId: string,
  creneauId: string,
): Promise<{ jour: JourSemaine; creneau: CreneauEDT; activite: Activite } | undefined> {
  const profil = await db.profils.get(profilId)
  if (!profil) return undefined
  for (const jour of JOURS_SEMAINE) {
    const creneau = profil.edt[jour].find((c) => c.id === creneauId)
    if (creneau) {
      const act = await db.activites.get(creneau.activiteId)
      if (!act) return undefined
      return { jour, creneau, activite: act }
    }
  }
  return undefined
}

/**
 * Marque comme faite une activité sans séquence (SPEC §4.2, « vue plein
 * écran du picto »). Réutilise le mécanisme de cochage avec une étape
 * sentinelle : ces activités n'ont pas d'étapes à proprement parler, mais
 * ont tout de même besoin d'un signal « fait » pour l'état du créneau.
 */
const ETAPE_SENTINELLE = 'vu'

export async function marquerCreneauFait(profilId: string, creneauId: string): Promise<void> {
  await cocherEtape(profilId, creneauId, ETAPE_SENTINELLE)
}

export async function creneauEstFait(profilId: string, creneauId: string): Promise<boolean> {
  const cochage = await lireCochage(profilId, creneauId)
  return Boolean(cochage?.etapesFaites.length)
}

/* --- Pages TLA -----------------------------------------------------------
 * Communes à l'établissement (SPEC §2). Chaque profil choisit sa page
 * noyau et ses pages contextuelles parmi celles-ci (voir ci-dessous).
 */

export async function listerPagesTLA(): Promise<PageTLA[]> {
  const pages = await db.pagesTLA.toArray()
  return pages.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function pageTLA(id: string): Promise<PageTLA | undefined> {
  return db.pagesTLA.get(id)
}

export async function creerPageTLA(nom: string): Promise<PageTLA> {
  const nouvelle: PageTLA = { id: nouvelId('pageTLA'), nom: nom.trim() || 'Page TLA', pictoIds: [] }
  await db.pagesTLA.add(nouvelle)
  return nouvelle
}

export async function renommerPageTLA(id: string, nom: string): Promise<void> {
  await db.pagesTLA.update(id, { nom: nom.trim() || 'Page TLA' })
}

export async function supprimerPageTLA(id: string): Promise<void> {
  await db.pagesTLA.delete(id)
}

export async function ajouterPictoAPage(pageId: string, pictoId: string): Promise<void> {
  const page = await db.pagesTLA.get(pageId)
  if (!page || page.pictoIds.includes(pictoId)) return
  await db.pagesTLA.update(pageId, { pictoIds: [...page.pictoIds, pictoId] })
}

export async function retirerPictoDePage(pageId: string, pictoId: string): Promise<void> {
  const page = await db.pagesTLA.get(pageId)
  if (!page) return
  await db.pagesTLA.update(pageId, { pictoIds: page.pictoIds.filter((id) => id !== pictoId) })
}

export async function reordonnerPictosPage(pageId: string, pictoIds: string[]): Promise<void> {
  await db.pagesTLA.update(pageId, { pictoIds })
}

/* --- Configuration TLA et vocale par profil ----------------------------- */

export async function definirGrilleTLA(profilId: string, colonnes: number, lignes: number): Promise<void> {
  await db.profils.update(profilId, { grilleTLA: { colonnes, lignes } })
}

export async function definirPageNoyau(profilId: string, pageId: string): Promise<void> {
  await db.profils.update(profilId, { pageTLAnoyau: pageId })
}

export async function definirPagesContextuelles(profilId: string, pageIds: string[]): Promise<void> {
  await db.profils.update(profilId, { pagesTLA: pageIds })
}

export async function modifierReglagesVocaux(
  profilId: string,
  vocal: Profil['vocal'],
): Promise<void> {
  await db.profils.update(profilId, { vocal })
}

/* --- Règles ---------------------------------------------------------------
 * Communes à l'établissement (SPEC §2). Rattachées à une ou plusieurs
 * activités (Activite.regleIds) et/ou à la journée d'un profil
 * (Profil.reglesJournee).
 */

export async function listerRegles(): Promise<Regle[]> {
  const regles = await db.regles.toArray()
  return regles.sort((a, b) => a.texte.localeCompare(b.texte, 'fr'))
}

export async function regle(id: string): Promise<Regle | undefined> {
  return db.regles.get(id)
}

export async function creerRegle(donnees: { texte: string; pictoId?: string }): Promise<Regle> {
  const nouvelle: Regle = { id: nouvelId('regle'), texte: donnees.texte.trim(), pictoId: donnees.pictoId }
  await db.regles.add(nouvelle)
  return nouvelle
}

export async function modifierRegle(
  id: string,
  patch: Partial<Pick<Regle, 'texte' | 'pictoId'>>,
): Promise<void> {
  await db.regles.update(id, patch)
}

/** Reste à retirer des activités et profils qui la référencent : ils
 *  ignorent simplement un id de règle disparu à l'affichage. */
export async function supprimerRegle(id: string): Promise<void> {
  await db.regles.delete(id)
}

export async function definirReglesActivite(
  activiteId: string,
  regleIds: string[],
  groupeRegleIds: string[] = [],
): Promise<void> {
  await db.activites.update(activiteId, { regleIds, groupeRegleIds })
}

export async function definirReglesJournee(
  profilId: string,
  regleIds: string[],
  groupesJournee?: string[],
): Promise<void> {
  const patch: Partial<Profil> = { reglesJournee: regleIds }
  if (groupesJournee) patch.groupesJournee = groupesJournee
  await db.profils.update(profilId, patch)
}

/* --- Ensembles de règles -------------------------------------------------
 * Trois règles qui vont ensemble (« mains calmes », « pieds calmes »,
 * « bouche silencieuse ») se rappellent d'un seul appui, toutes à l'écran.
 */

export async function listerGroupesRegles(): Promise<GroupeRegles[]> {
  const groupes = await db.groupesRegles.toArray()
  return groupes.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function groupeRegles(id: string): Promise<GroupeRegles | undefined> {
  return db.groupesRegles.get(id)
}

export async function creerGroupeRegles(nom: string, regleIds: string[]): Promise<GroupeRegles> {
  const nouveau: GroupeRegles = { id: nouvelId('groupe'), nom: nom.trim(), regleIds }
  await db.groupesRegles.add(nouveau)
  return nouveau
}

export async function modifierGroupeRegles(
  id: string,
  patch: Partial<Pick<GroupeRegles, 'nom' | 'regleIds'>>,
): Promise<void> {
  await db.groupesRegles.update(id, patch)
}

export async function supprimerGroupeRegles(id: string): Promise<void> {
  await db.groupesRegles.delete(id)
}

/** Les règles d'un ensemble, dans l'ordre de l'ensemble, sans les disparues. */
export async function reglesDuGroupe(id: string): Promise<Regle[]> {
  const groupe = await db.groupesRegles.get(id)
  if (!groupe) return []
  const regles = await db.regles.bulkGet(groupe.regleIds)
  return regles.filter((r): r is Regle => Boolean(r))
}

/* --- Export / import de la configuration --------------------------------
 * SPEC §4.6 : « pour dupliquer le paramétrage d'une tablette à l'autre sans
 * tout ressaisir ». Sont exportés les données communes à l'établissement et
 * les profils (y compris leurs réglages TLA et vocaux) — pas le code PIN de
 * la tablette (propre à chaque appareil), ni les cochages (état du jour,
 * pas de la configuration).
 */

type PictoExporte = Omit<Picto, 'image'> & { imageBase64: string }

type ConfigurationExportee = {
  /** 1 : avant les ensembles de règles. 2 : avec. */
  version: 1 | 2
  exporteLe: string
  pictos: PictoExporte[]
  sequences: Sequence[]
  activites: Activite[]
  regles: Regle[]
  groupesRegles?: GroupeRegles[]
  pagesTLA: PageTLA[]
  profils: Profil[]
}

function blobEnBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resolve((lecteur.result as string).split(',')[1] ?? '')
    lecteur.onerror = () => reject(new Error('Lecture du picto impossible'))
    lecteur.readAsDataURL(blob)
  })
}

function base64EnBlob(base64: string): Blob {
  const octets = atob(base64)
  const tableau = new Uint8Array(octets.length)
  for (let i = 0; i < octets.length; i++) tableau[i] = octets.charCodeAt(i)
  return new Blob([tableau], { type: 'image/png' })
}

export async function exporterConfiguration(): Promise<string> {
  const [pictosBruts, sequences, activites, regles, groupesRegles, pagesTLA, profils] =
    await Promise.all([
      db.pictos.toArray(),
      db.sequences.toArray(),
      db.activites.toArray(),
      db.regles.toArray(),
      db.groupesRegles.toArray(),
      db.pagesTLA.toArray(),
      db.profils.toArray(),
    ])

  const pictos: PictoExporte[] = await Promise.all(
    pictosBruts.map(async ({ image, ...reste }) => ({ ...reste, imageBase64: await blobEnBase64(image) })),
  )

  const configuration: ConfigurationExportee = {
    version: 2,
    exporteLe: new Date().toISOString(),
    pictos,
    sequences,
    activites,
    regles,
    groupesRegles,
    pagesTLA,
    profils,
  }
  return JSON.stringify(configuration, null, 1)
}

export type ResultatImport = {
  pictos: number
  sequences: number
  activites: number
  regles: number
  groupesRegles: number
  pagesTLA: number
  profils: number
}

/** Fusionne (bulkPut, par id) sans rien effacer d'existant. */
export async function importerConfiguration(json: string): Promise<ResultatImport> {
  const donnees = JSON.parse(json) as ConfigurationExportee
  // Un fichier v1 est encore lisible : il n'a simplement pas d'ensembles.
  if (donnees.version !== 1 && donnees.version !== 2) {
    throw new Error('Format de fichier non reconnu')
  }
  const groupesRegles = donnees.groupesRegles ?? []

  const pictos: Picto[] = donnees.pictos.map(({ imageBase64, ...reste }) => ({
    ...reste,
    image: base64EnBlob(imageBase64),
  }))

  await db.transaction(
    'rw',
    [db.pictos, db.sequences, db.activites, db.regles, db.groupesRegles, db.pagesTLA, db.profils],
    async () => {
      if (pictos.length) await db.pictos.bulkPut(pictos)
      if (donnees.sequences.length) await db.sequences.bulkPut(donnees.sequences)
      if (donnees.activites.length) await db.activites.bulkPut(donnees.activites)
      if (donnees.regles.length) await db.regles.bulkPut(donnees.regles)
      if (groupesRegles.length) await db.groupesRegles.bulkPut(groupesRegles)
      if (donnees.pagesTLA.length) await db.pagesTLA.bulkPut(donnees.pagesTLA)
      if (donnees.profils.length) await db.profils.bulkPut(donnees.profils)
    },
  )

  return {
    pictos: pictos.length,
    sequences: donnees.sequences.length,
    activites: donnees.activites.length,
    regles: donnees.regles.length,
    groupesRegles: groupesRegles.length,
    pagesTLA: donnees.pagesTLA.length,
    profils: donnees.profils.length,
  }
}
