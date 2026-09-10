#!/usr/bin/env node
/**
 * Construit le sous-ensemble ARASAAC embarqué (ROADMAP lot 1).
 *
 * Ce script est le SEUL endroit du projet qui touche au réseau, et il ne
 * tourne jamais sur la tablette : il tourne une fois, à la fabrication, et
 * dépose des fichiers dans public/pack-arasaac/. À l'exécution l'application
 * ne lit que ces fichiers locaux.
 *
 * Sortie :
 *   public/pack-arasaac/index.json     index de recherche français
 *   public/pack-arasaac/<id>.png       les images
 *
 * Usage :
 *   node scripts/build-arasaac.mjs [--max 1500] [--resolution 300] [--force]
 *
 * Licence : pictogrammes propriété du Gouvernement d'Aragon, créés par
 * Sergio Palao pour ARASAAC, sous CC BY-NC-SA. Usage non commercial.
 * L'attribution figure dans l'écran « À propos ».
 */

import { mkdir, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const API = 'https://api.arasaac.org/v1'
const STATIQUE = 'https://static.arasaac.org/pictograms'
const SORTIE = path.resolve('public/pack-arasaac')

/* --- Arguments --------------------------------------------------------- */

function argument(nom, defaut) {
  const i = process.argv.indexOf(`--${nom}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const MAX = Number(argument('max', 1500))
const RESOLUTION = Number(argument('resolution', 300))
const FORCE = process.argv.includes('--force')

/* --- Ce qu'on embarque -------------------------------------------------
 * SPEC §3 : « quotidien, école, émotions, alimentation, hygiène, lieux,
 * verbes courants ». On filtre le catalogue complet sur ces thèmes, puis on
 * garde les plus téléchargés — ce sont les plus universels.
 */

const CATEGORIES = [
  'food', 'drink', 'meal', 'fruit', 'vegetable',
  'hygiene', 'health', 'body', 'clothing',
  'emotion', 'feeling',
  'school', 'education', 'work',
  'place', 'building', 'home', 'room', 'furniture',
  'transport', 'time', 'weather',
  'action', 'verb', 'communication', 'leisure', 'sport', 'animal', 'family',
]

const MOTS_CLES = [
  // Quotidien
  'manger', 'boire', 'dormir', 'se lever', 'se coucher', 'maison', 'chambre',
  'cuisine', 'salle de bain', 'table', 'chaise', 'lit', 'porte', 'ranger',
  'nettoyer', 'laver', 'vaisselle', 'aspirateur', 'linge', 'poubelle', 'courses',
  // Hygiène
  'se laver les mains', 'savon', 'serviette', 'douche', 'brosse à dents',
  'dents', 'toilettes', 'papier toilette', 'se coiffer', 'se moucher', 'mouchoir',
  // Alimentation
  'pain', 'eau', 'lait', 'fruit', 'légume', 'pomme', 'assiette', 'verre',
  'fourchette', 'couteau', 'cuillère', 'petit-déjeuner', 'déjeuner', 'goûter', 'dîner',
  // École et atelier
  'école', 'classe', 'cahier', 'crayon', 'lire', 'écrire', 'compter', 'ordinateur',
  'atelier', 'travail', 'ranger le matériel', 'pause', 'récréation',
  // Émotions et état
  'content', 'triste', 'en colère', 'peur', 'fatigué', 'malade', 'calme',
  'bruit', 'mal', 'douleur',
  // Lieux
  'bus', 'voiture', 'magasin', 'parc', 'piscine', 'hôpital', 'rue', 'dehors',
  // Verbes et vocabulaire noyau du TLA (SPEC §4.5)
  'je veux', 'vouloir', 'encore', 'fini', 'aide', 'aider', 'stop', 'arrêter',
  'oui', 'non', 'aller', 'venir', 'donner', 'prendre', 'regarder', 'écouter',
  'parler', 'attendre', 'jouer', 'marcher', 'ouvrir', 'fermer', 'commencer',
  'plus', 'moins', 'bonjour', 'au revoir', 'merci', 's\'il te plaît',
]

/* --- Réseau ------------------------------------------------------------ */

/** Une 404 est définitive : ce picto n'a pas d'image à cette résolution,
 *  la répéter ne change rien. On ne la retente donc pas. */
class Erreur404 extends Error {}

async function recuperer(url, type = 'json') {
  let derniere
  for (let essai = 1; essai <= 4; essai++) {
    try {
      const reponse = await fetch(url, { headers: { 'User-Agent': 'sequentiel-ime/0.1' } })
      if (reponse.status === 404) throw new Erreur404(`HTTP 404 sur ${url}`)
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
      return type === 'json' ? await reponse.json() : Buffer.from(await reponse.arrayBuffer())
    } catch (e) {
      if (e instanceof Erreur404) throw e
      derniere = e
      if (essai < 4) await new Promise((r) => setTimeout(r, 2 ** essai * 1000))
    }
  }
  throw new Error(`Échec sur ${url} : ${derniere.message}`)
}

/* --- Sélection --------------------------------------------------------- */

function motsDuPicto(picto) {
  const mots = (picto.keywords ?? [])
    .map((k) => (typeof k === 'string' ? k : k.keyword))
    .filter(Boolean)
  return mots.map((m) => m.toLowerCase())
}

function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function selectionner(catalogue) {
  const clesVoulues = new Set(MOTS_CLES.map(normaliser))
  const categoriesVoulues = new Set(CATEGORIES)

  const retenus = catalogue.filter((picto) => {
    const mots = motsDuPicto(picto)
    if (mots.length === 0) return false
    if (picto.sex || picto.violence) return false
    if (mots.some((m) => clesVoulues.has(normaliser(m)))) return true
    return (picto.categories ?? []).some((c) =>
      categoriesVoulues.has(String(c).toLowerCase()),
    )
  })

  // Les plus téléchargés d'abord : ce sont les pictos les plus lisibles et
  // les plus partagés entre établissements.
  retenus.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
  return retenus.slice(0, MAX)
}

/* --- Programme --------------------------------------------------------- */

async function principal() {
  console.log(`Catalogue ARASAAC français…`)
  const catalogue = await recuperer(`${API}/pictograms/all/fr`)
  if (!Array.isArray(catalogue)) throw new Error('Réponse inattendue de l\'API ARASAAC')
  console.log(`  ${catalogue.length} pictogrammes au catalogue`)

  const choisis = selectionner(catalogue)
  console.log(`  ${choisis.length} retenus (plafond ${MAX})`)
  if (choisis.length < 200) {
    throw new Error(
      'Sélection trop petite : le format de l\'API a probablement changé, ' +
        'vérifier CATEGORIES et motsDuPicto().',
    )
  }

  await mkdir(SORTIE, { recursive: true })

  const index = []
  const echecs = []
  let telecharges = 0
  let ignores = 0

  for (const picto of choisis) {
    const id = String(picto._id ?? picto.id)
    const fichier = path.join(SORTIE, `${id}.png`)
    const mots = motsDuPicto(picto)

    if (!FORCE && existsSync(fichier)) {
      ignores++
    } else {
      try {
        const image = await recuperer(`${STATIQUE}/${id}/${id}_${RESOLUTION}.png`, 'binaire')
        await writeFile(fichier, image)
        telecharges++
      } catch (e) {
        // Un picto sans image à cette résolution ne doit pas faire échouer
        // tout le pack : on le note et on continue avec les autres.
        echecs.push({ id, libelle: mots[0], raison: e.message })
        continue
      }
    }

    index.push({
      id,
      libelle: mots[0],
      tags: [...new Set(mots.slice(1))],
      categories: picto.categories ?? [],
    })

    if (telecharges > 0 && telecharges % 100 === 0) {
      console.log(`  ${telecharges} images téléchargées…`)
    }
  }

  index.sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'))
  await writeFile(
    path.join(SORTIE, 'index.json'),
    JSON.stringify(
      {
        version: 1,
        genereLe: new Date().toISOString().slice(0, 10),
        resolution: RESOLUTION,
        licence: 'CC BY-NC-SA — Sergio Palao / ARASAAC / Gouvernement d\'Aragon',
        pictos: index,
      },
      null,
      1,
    ),
  )

  const fichiers = await readdir(SORTIE)
  let octets = 0
  for (const f of fichiers) octets += (await stat(path.join(SORTIE, f))).size

  console.log(`\nTerminé.`)
  console.log(`  ${telecharges} téléchargées, ${ignores} déjà présentes`)
  if (echecs.length > 0) {
    console.log(`  ${echecs.length} ignorés (pas d'image à cette résolution) :`)
    for (const e of echecs.slice(0, 20)) console.log(`    - ${e.id} (${e.libelle}) : ${e.raison}`)
    if (echecs.length > 20) console.log(`    … et ${echecs.length - 20} autres`)
  }
  console.log(`  ${index.length} entrées dans index.json`)
  console.log(`  ${(octets / 1024 / 1024).toFixed(1)} Mo dans public/pack-arasaac/`)
}

principal().catch((e) => {
  console.error(`\nÉchec : ${e.message}`)
  process.exit(1)
})
