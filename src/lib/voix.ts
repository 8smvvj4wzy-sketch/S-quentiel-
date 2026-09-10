import { useEffect, useState } from 'react'

/**
 * `speechSynthesis.getVoices()` renvoie souvent un tableau vide au premier
 * appel sur Android : les voix arrivent de façon asynchrone via l'événement
 * `voiceschanged` (SPEC §6). Ce hook les expose une fois chargées.
 */
export function useVoixDisponibles(): SpeechSynthesisVoice[] {
  const [voix, setVoix] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return
    function rafraichir() {
      setVoix(speechSynthesis.getVoices())
    }
    rafraichir()
    speechSynthesis.addEventListener('voiceschanged', rafraichir)
    return () => speechSynthesis.removeEventListener('voiceschanged', rafraichir)
  }, [])

  return voix
}

export function voixFrancaisesDisponibles(voix: SpeechSynthesisVoice[]): boolean {
  return voix.some((v) => v.lang.toLowerCase().startsWith('fr'))
}

export function parler(texte: string, options: { voixURI?: string; vitesse: number }): void {
  if (typeof speechSynthesis === 'undefined' || !texte.trim()) return
  const enonce = new SpeechSynthesisUtterance(texte)
  enonce.rate = options.vitesse
  if (options.voixURI) {
    const voix = speechSynthesis.getVoices().find((v) => v.voiceURI === options.voixURI)
    if (voix) enonce.voice = voix
  }
  speechSynthesis.cancel()
  speechSynthesis.speak(enonce)
}
