/**
 * Catalogue ARASAAC embarqué (public/pack-arasaac/, produit par
 * scripts/build-arasaac.mjs). Ce module ne lit jamais le réseau : les
 * fichiers sont servis en local, comme n'importe quel autre asset du build.
 *
 * Le catalogue lui-même n'est pas dans IndexedDB : c'est un fichier statique
 * de référence. Choisir un picto du catalogue en crée un vrai dans Dexie,
 * image copiée en Blob — voir `obtenirPictoCatalogue` dans db.ts. C'est cette
 * copie qui garantit le hors ligne.
 */

import { normaliser } from './texte'

export type EntreeCatalogue = {
  id: string
  libelle: string
  tags: string[]
}

type IndexCatalogue = {
  version: number
  genereLe: string
  resolution: number
  /** Absent de l'index v1, qui était en PNG. */
  extension?: string
  licence: string
  pictos: EntreeCatalogue[]
}

let chargement: Promise<IndexCatalogue> | null = null

function urlPack(chemin: string): string {
  // import.meta.env.BASE_URL vaut '/S-quentiel-/' en prod, '/' en dev.
  return `${import.meta.env.BASE_URL}pack-arasaac/${chemin}`
}

/**
 * L'extension vient de l'index, pas d'une constante : pendant la bascule du
 * pack PNG (lot 1) vers le pack WebP (lot 6), l'application déployée doit
 * continuer à afficher le pack encore en place. Elle est fixée ici, dans le
 * chargement lui-même, pour être disponible dès que l'index l'est — et non
 * un tour de boucle plus tard.
 */
let extensionConnue = 'png'

async function charger(): Promise<IndexCatalogue> {
  const reponse = await fetch(urlPack('index.json'))
  if (!reponse.ok) {
    // Le pack n'a pas encore été construit (voir README « Pack ARASAAC »).
    return { version: 0, genereLe: '', resolution: 0, licence: '', pictos: [] }
  }
  const index: IndexCatalogue = await reponse.json()
  extensionConnue = index.extension ?? 'png'
  return index
}

function catalogue(): Promise<IndexCatalogue> {
  if (!chargement) chargement = charger()
  return chargement
}

/** À n'appeler qu'après avoir obtenu une EntreeCatalogue : le catalogue est
 *  alors chargé, donc l'extension est connue. */
export function urlImageCatalogue(id: string): string {
  return urlPack(`${id}.${extensionConnue}`)
}

export async function catalogueDisponible(): Promise<boolean> {
  return (await catalogue()).pictos.length > 0
}

export type FiltreCatalogue = {
  recherche?: string
  /** Exclut du résultat les entrées déjà présentes dans la bibliothèque. */
  idsExclus?: Set<string>
  limite?: number
}

/**
 * Classement : sur ~13 800 entrées, une simple sous-chaîne remonte n'importe
 * quoi. On note chaque correspondance, du plus au moins pertinent.
 */
function score(entree: EntreeCatalogue, q: string): number {
  const libelle = normaliser(entree.libelle)
  if (libelle === q) return 0
  if (libelle.startsWith(q)) return 1
  if (libelle.includes(q)) return 2
  for (const tag of entree.tags) {
    const t = normaliser(tag)
    if (t === q) return 3
    if (t.startsWith(q)) return 4
    if (t.includes(q)) return 5
  }
  return Number.POSITIVE_INFINITY
}

export async function rechercherCatalogue(filtre: FiltreCatalogue): Promise<EntreeCatalogue[]> {
  const c = await catalogue()
  const q = filtre.recherche ? normaliser(filtre.recherche.trim()) : ''
  const limite = filtre.limite ?? 120

  let resultats = c.pictos
  if (filtre.idsExclus?.size) {
    resultats = resultats.filter((p) => !filtre.idsExclus!.has(p.id))
  }
  if (!q) return resultats.slice(0, limite)

  const notes: { entree: EntreeCatalogue; note: number }[] = []
  for (const entree of resultats) {
    const note = score(entree, q)
    if (note !== Number.POSITIVE_INFINITY) notes.push({ entree, note })
  }
  notes.sort((a, b) => a.note - b.note || a.entree.libelle.localeCompare(b.entree.libelle, 'fr'))
  return notes.slice(0, limite).map((n) => n.entree)
}

export async function entreeCatalogue(id: string): Promise<EntreeCatalogue | undefined> {
  const c = await catalogue()
  return c.pictos.find((p) => p.id === id)
}
