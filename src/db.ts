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
