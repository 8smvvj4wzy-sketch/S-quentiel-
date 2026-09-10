/**
 * Traitements image côté client, sans dépendance externe : recadrage carré
 * et compression pour l'import photo (SPEC §3.2), rendu du picto composite
 * (SPEC §3.3). Tout passe par un <canvas>, jamais par le réseau.
 */

export const TAILLE_PHOTO = 512
export const TAILLE_COMPOSITE = 512

function chargerImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image illisible"))
    }
    img.src = url
  })
}

function canvasVersPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Échec de génération du PNG'))
    }, 'image/png')
  })
}

/**
 * Recadre au carré (le plus grand carré centré dans l'image) puis redimensionne
 * à `taille` px de côté. Le recadrage est centré : pas d'ajustement manuel
 * dans cette première version, ce qui reste simple et prévisible côté jeune
 * comme côté éducateur.
 */
export async function recadrerCarreEtCompresser(
  source: Blob,
  taille = TAILLE_PHOTO,
): Promise<Blob> {
  const img = await chargerImage(source)
  const cote = Math.min(img.naturalWidth, img.naturalHeight)
  const decalageX = (img.naturalWidth - cote) / 2
  const decalageY = (img.naturalHeight - cote) / 2

  const canvas = document.createElement('canvas')
  canvas.width = taille
  canvas.height = taille
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')
  ctx.drawImage(img, decalageX, decalageY, cote, cote, 0, 0, taille, taille)

  return canvasVersPng(canvas)
}

export type DispositionComposite = 'cote-a-cote' | 'quadrants' | 'un-grand-deux-petits'

export const DISPOSITIONS_COMPOSITE: { id: DispositionComposite; nom: string; max: number }[] = [
  { id: 'cote-a-cote', nom: '2 côte à côte', max: 2 },
  { id: 'quadrants', nom: '4 en quadrants', max: 4 },
  { id: 'un-grand-deux-petits', nom: '1 grand + 2 petits', max: 3 },
]

/** Zones (en fraction 0–1 de la surface) où poser chaque image source. */
function zones(disposition: DispositionComposite, nb: number): [number, number, number, number][] {
  if (disposition === 'cote-a-cote') {
    return Array.from({ length: nb }, (_, i) => [i / nb, 0, 1 / nb, 1])
  }
  if (disposition === 'quadrants') {
    const positions: [number, number][] = [
      [0, 0],
      [0.5, 0],
      [0, 0.5],
      [0.5, 0.5],
    ]
    return positions.slice(0, nb).map(([x, y]) => [x, y, 0.5, 0.5])
  }
  // un-grand-deux-petits : le premier picto occupe la moitié gauche en
  // pleine hauteur, les suivants se partagent la moitié droite.
  const zonesResultat: [number, number, number, number][] = [[0, 0, 0.5, 1]]
  const nbPetits = Math.max(0, nb - 1)
  for (let i = 0; i < nbPetits; i++) {
    zonesResultat.push([0.5, i / nbPetits, 0.5, 1 / nbPetits])
  }
  return zonesResultat
}

/**
 * Compose 2 à 4 pictos en une seule vignette (SPEC §3.3). `sources` doit être
 * dans le même ordre que les zones de la disposition choisie.
 */
export async function genererComposite(
  sources: Blob[],
  disposition: DispositionComposite,
  taille = TAILLE_COMPOSITE,
): Promise<Blob> {
  if (sources.length < 2 || sources.length > 4) {
    throw new Error('Un picto composite combine 2 à 4 pictos')
  }
  const infos = DISPOSITIONS_COMPOSITE.find((d) => d.id === disposition)
  if (!infos || sources.length > infos.max) {
    throw new Error(`La disposition « ${disposition} » accepte au plus ${infos?.max} pictos`)
  }

  const images = await Promise.all(sources.map(chargerImage))
  const canvas = document.createElement('canvas')
  canvas.width = taille
  canvas.height = taille
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, taille, taille)

  const marge = 4
  const zonesCalculees = zones(disposition, images.length)
  images.forEach((img, i) => {
    const [zx, zy, zw, zh] = zonesCalculees[i]
    const x = zx * taille + marge
    const y = zy * taille + marge
    const w = zw * taille - marge * 2
    const h = zh * taille - marge * 2

    // On garde le ratio de l'image source, centrée dans sa zone.
    const echelle = Math.min(w / img.naturalWidth, h / img.naturalHeight)
    const largeurDessin = img.naturalWidth * echelle
    const hauteurDessin = img.naturalHeight * echelle
    const dx = x + (w - largeurDessin) / 2
    const dy = y + (h - hauteurDessin) / 2

    ctx.drawImage(img, dx, dy, largeurDessin, hauteurDessin)
    ctx.strokeStyle = '#d8dade'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
  })

  return canvasVersPng(canvas)
}
