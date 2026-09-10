/**
 * Catalogue ARASAAC embarqué (public/pack-arasaac/, produit par
 * scripts/build-arasaac.mjs). Ce module ne lit jamais le réseau : les
 * fichiers sont servis en local, comme n'importe quel autre asset du build.
 *
 * Le catalogue lui-même n'est pas dans IndexedDB : c'est un fichier statique
 * de référence. « Obtenir un picto » (SPEC §3) depuis ce catalogue crée un
 * vrai Picto dans Dexie, avec son image copiée en Blob — voir db.ts.
 */

import { normaliser } from './texte'

export type EntreeCatalogue = {
  id: string
  libelle: string
  tags: string[]
  categories: string[]
}

type IndexCatalogue = {
  version: number
  genereLe: string
  resolution: number
  licence: string
  pictos: EntreeCatalogue[]
}

let chargement: Promise<IndexCatalogue> | null = null

function urlPack(chemin: string): string {
  // import.meta.env.BASE_URL vaut '/S-quentiel-/' en prod, '/' en dev.
  return `${import.meta.env.BASE_URL}pack-arasaac/${chemin}`
}

async function charger(): Promise<IndexCatalogue> {
  const reponse = await fetch(urlPack('index.json'))
  if (!reponse.ok) {
    // Le pack n'a pas encore été construit (voir README « Pack ARASAAC »).
    return { version: 0, genereLe: '', resolution: 0, licence: '', pictos: [] }
  }
  return reponse.json()
}

function catalogue(): Promise<IndexCatalogue> {
  if (!chargement) chargement = charger()
  return chargement
}

export function urlImageCatalogue(id: string): string {
  return urlPack(`${id}.png`)
}

export async function catalogueDisponible(): Promise<boolean> {
  return (await catalogue()).pictos.length > 0
}

export async function categoriesCatalogue(): Promise<string[]> {
  const c = await catalogue()
  const vues = new Set<string>()
  for (const p of c.pictos) for (const cat of p.categories) vues.add(cat)
  return [...vues].sort((a, b) => a.localeCompare(b, 'fr'))
}

export type FiltreCatalogue = {
  recherche?: string
  categorie?: string
  /** Exclus du résultat les entrées déjà présentes dans la bibliothèque. */
  idsExclus?: Set<string>
  limite?: number
}

export async function rechercherCatalogue(filtre: FiltreCatalogue): Promise<EntreeCatalogue[]> {
  const c = await catalogue()
  const q = filtre.recherche ? normaliser(filtre.recherche.trim()) : ''

  let resultats = c.pictos
  if (filtre.idsExclus?.size) {
    resultats = resultats.filter((p) => !filtre.idsExclus!.has(p.id))
  }
  if (filtre.categorie) {
    resultats = resultats.filter((p) => p.categories.includes(filtre.categorie!))
  }
  if (q) {
    resultats = resultats.filter(
      (p) => normaliser(p.libelle).includes(q) || p.tags.some((t) => normaliser(t).includes(q)),
    )
  }
  return resultats.slice(0, filtre.limite ?? 120)
}

export async function entreeCatalogue(id: string): Promise<EntreeCatalogue | undefined> {
  const c = await catalogue()
  return c.pictos.find((p) => p.id === id)
}
