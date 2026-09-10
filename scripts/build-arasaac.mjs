#!/usr/bin/env node
/**
 * Construit le catalogue ARASAAC embarqué (ROADMAP lot 6).
 *
 * Ce script est le SEUL endroit du projet qui touche au réseau, et il ne
 * tourne jamais sur la tablette : il tourne une fois, à la fabrication, et
 * dépose des fichiers dans public/pack-arasaac/. À l'exécution l'application
 * ne lit que ces fichiers locaux.
 *
 * Depuis le lot 6 on embarque le catalogue français COMPLET (~13 800
 * pictogrammes) : le sous-ensemble thématique du lot 1 laissait tomber des
 * mots courants (« gâteau » était introuvable).
 *
 * Les images sont converties en WebP. Le gain est réel mais modeste — les
 * PNG d'ARASAAC sont déjà bien optimisés. Mesuré sur 40 pictos du pack du
 * lot 1, rapporté au catalogue complet :
 *   PNG 300 px      12,5 Ko  ~169 Mo
 *   WebP q80 300 px 10,2 Ko  ~138 Mo
 *   WebP q60 300 px  8,5 Ko  ~115 Mo   <- retenu
 * On garde 300 px : l'affichage plein écran d'une règle ou d'une étape monte
 * à 280 px, en dessous ça se verrait.
 *
 * Sortie :
 *   public/pack-arasaac/index.json     index de recherche français
 *   public/pack-arasaac/<id>.webp      les images
 *
 * Usage :
 *   node scripts/build-arasaac.mjs [--max 500] [--resolution 300] [--force]
 *   --max        plafonne le nombre de pictos (pour un pack de test)
 *   --resolution taille demandée à ARASAAC, en pixels
 *   --force      retélécharge même les images déjà présentes
 *
 * Licence : pictogrammes propriété du Gouvernement d'Aragon, créés par
 * Sergio Palao pour ARASAAC, sous CC BY-NC-SA. Usage non commercial.
 * L'attribution figure dans l'écran « À propos ».
 */

import { mkdir, writeFile, readdir, stat, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const API = 'https://api.arasaac.org/v1'
const STATIQUE = 'https://static.arasaac.org/pictograms'
const SORTIE = path.resolve('public/pack-arasaac')
const EXTENSION = 'webp'
/** 60 : le meilleur compromis mesuré sur du trait plat avec transparence. */
const QUALITE_WEBP = 60
/** Nombre de téléchargements menés de front. Au-delà, ARASAAC limite. */
const PARALLELISME = 16
/** Au plus 6 tags par picto : au-delà, index.json enfle pour rien. */
const TAGS_MAX = 6

/* --- Arguments --------------------------------------------------------- */

function argument(nom, defaut) {
  const i = process.argv.indexOf(`--${nom}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const MAX = Number(argument('max', Infinity))
const RESOLUTION = Number(argument('resolution', 300))
const FORCE = process.argv.includes('--force')

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

/* --- Sélection ---------------------------------------------------------- */

function motsDuPicto(picto) {
  const mots = (picto.keywords ?? [])
    .map((k) => (typeof k === 'string' ? k : k.keyword))
    .filter(Boolean)
  return mots.map((m) => m.toLowerCase())
}

/**
 * Tout le catalogue, sauf ce qui n'a pas sa place devant un jeune. Plus de
 * filtre thématique : c'est lui qui faisait manquer des mots du quotidien.
 */
function selectionner(catalogue) {
  const retenus = catalogue.filter((picto) => {
    if (motsDuPicto(picto).length === 0) return false
    return !picto.sex && !picto.violence
  })
  // Les plus téléchargés d'abord : utile seulement si --max plafonne.
  retenus.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
  return Number.isFinite(MAX) ? retenus.slice(0, MAX) : retenus
}

/* --- Images ------------------------------------------------------------- */

/** ARASAAC sert des PNG ; on convertit nous-mêmes pour maîtriser la taille. */
async function imagePicto(id) {
  const png = await recuperer(`${STATIQUE}/${id}/${id}_${RESOLUTION}.png`, 'binaire')
  return sharp(png).webp({ quality: QUALITE_WEBP }).toBuffer()
}

/** Exécute `tache` sur chaque élément, `PARALLELISME` en vol à la fois. */
async function enParallele(elements, tache) {
  let curseur = 0
  const ouvriers = Array.from({ length: PARALLELISME }, async () => {
    while (curseur < elements.length) {
      const i = curseur++
      await tache(elements[i], i)
    }
  })
  await Promise.all(ouvriers)
}

/** Supprime les images d'un format qu'on n'utilise plus (le pack du lot 1
 *  était en PNG), sinon elles resteraient à traîner dans le dépôt. */
async function nettoyerAutresFormats() {
  if (!existsSync(SORTIE)) return 0
  const fichiers = await readdir(SORTIE)
  const perimes = fichiers.filter((f) => f !== 'index.json' && !f.endsWith(`.${EXTENSION}`))
  for (const f of perimes) await unlink(path.join(SORTIE, f))
  return perimes.length
}

/* --- Programme --------------------------------------------------------- */

async function principal() {
  console.log('Catalogue ARASAAC français…')
  const catalogue = await recuperer(`${API}/pictograms/all/fr`)
  if (!Array.isArray(catalogue)) throw new Error("Réponse inattendue de l'API ARASAAC")
  console.log(`  ${catalogue.length} pictogrammes au catalogue`)

  const choisis = selectionner(catalogue)
  console.log(`  ${choisis.length} retenus${Number.isFinite(MAX) ? ` (plafond ${MAX})` : ''}`)
  if (choisis.length < 200) {
    throw new Error(
      "Sélection trop petite : le format de l'API a probablement changé, vérifier motsDuPicto().",
    )
  }

  await mkdir(SORTIE, { recursive: true })
  const supprimes = await nettoyerAutresFormats()
  if (supprimes > 0) console.log(`  ${supprimes} images d'un ancien format supprimées`)

  const index = []
  const echecs = []
  let telecharges = 0
  let ignores = 0

  await enParallele(choisis, async (picto) => {
    const id = String(picto._id ?? picto.id)
    const fichier = path.join(SORTIE, `${id}.${EXTENSION}`)
    const mots = motsDuPicto(picto)

    if (!FORCE && existsSync(fichier)) {
      ignores++
    } else {
      try {
        await writeFile(fichier, await imagePicto(id))
        telecharges++
        if (telecharges % 500 === 0) console.log(`  ${telecharges} images téléchargées…`)
      } catch (e) {
        // Un picto sans image ne doit pas faire échouer tout le pack.
        echecs.push({ id, libelle: mots[0], raison: e.message })
        return
      }
    }

    index.push({
      id,
      libelle: mots[0],
      tags: [...new Set(mots.slice(1))].slice(0, TAGS_MAX),
    })
  })

  index.sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'))
  await writeFile(
    path.join(SORTIE, 'index.json'),
    JSON.stringify({
      version: 2,
      genereLe: new Date().toISOString().slice(0, 10),
      resolution: RESOLUTION,
      extension: EXTENSION,
      licence: "CC BY-NC-SA — Sergio Palao / ARASAAC / Gouvernement d'Aragon",
      pictos: index,
    }),
  )

  const fichiers = await readdir(SORTIE)
  let octets = 0
  for (const f of fichiers) octets += (await stat(path.join(SORTIE, f))).size

  console.log('\nTerminé.')
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
