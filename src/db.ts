import Dexie, { type Table } from 'dexie'
import {
  edtVide,
  LIMITES,
  type Activite,
  type EtatCochage,
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

  const nouveau: Picto = {
    id,
    source: 'arasaac',
    image,
    libelleAffiche: entree.libelle,
    libelleParle: entree.libelle,
    tags: [...new Set([entree.libelle, ...entree.tags])],
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
