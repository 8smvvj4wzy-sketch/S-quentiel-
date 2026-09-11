import { useEffect, useState } from 'react'
import { picto as chargerPicto } from '../db'
import type { Etape } from '../types'

/**
 * Le nom d'une étape : son texte propre, ou à défaut le libellé de son picto.
 * Le texte de l'étape gagne toujours — c'est ce qui permet d'écrire « gâteau »
 * sous un picto qu'ARASAAC appelle « biscuit ». Une étape sans texte ni picto
 * n'affiche rien plutôt qu'une ligne vide sans explication.
 */
export function useNomEtape(etape: Etape): string {
  const [libellePicto, setLibellePicto] = useState<string | null>(null)
  const texte = etape.texte?.trim()

  useEffect(() => {
    if (texte || !etape.pictoId) {
      setLibellePicto(null)
      return
    }
    let annule = false
    void chargerPicto(etape.pictoId).then((p) => {
      if (!annule) setLibellePicto(p?.libelleAffiche ?? null)
    })
    return () => {
      annule = true
    }
  }, [texte, etape.pictoId])

  return texte || libellePicto || ''
}
