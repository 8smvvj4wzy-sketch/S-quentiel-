/**
 * Lecture d'archives ZIP côté client, pour l'import d'un pack ARASAAC
 * complémentaire (SPEC §3.1). `fflate` est une dépendance npm embarquée au
 * build, jamais chargée depuis le réseau à l'exécution.
 */
import { unzipSync } from 'fflate'

const EXTENSIONS_IMAGE = new Set(['png', 'jpg', 'jpeg'])

function typeMime(nom: string): string {
  const ext = nom.split('.').pop()?.toLowerCase()
  return ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
}

export async function extraireImagesDuZip(
  fichierZip: Blob,
): Promise<{ nom: string; contenu: Blob }[]> {
  const octets = new Uint8Array(await fichierZip.arrayBuffer())
  const entrees = unzipSync(octets)

  const images: { nom: string; contenu: Blob }[] = []
  for (const [nom, donnees] of Object.entries(entrees)) {
    if (nom.endsWith('/')) continue // dossier
    const ext = nom.split('.').pop()?.toLowerCase()
    if (!ext || !EXTENSIONS_IMAGE.has(ext)) continue
    images.push({ nom, contenu: new Blob([donnees], { type: typeMime(nom) }) })
  }
  return images
}
