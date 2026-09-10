/**
 * Retrouve l'id de créneau courant depuis l'URL (utile pour savoir quelle
 * activité est en cours, et donc quelle page TLA ou quelles règles lui sont
 * rattachées). Partagé entre le TLA et le rappel de règle.
 */
export function creneauDepuisChemin(pathname: string, search: string): string | undefined {
  const viaCreneauEcran = pathname.match(/^\/profil\/[^/]+\/creneau\/([^/]+)/)
  if (viaCreneauEcran) return viaCreneauEcran[1]
  const viaSequentiel = pathname.match(/^\/profil\/[^/]+\/sequentiel\//)
  if (viaSequentiel) return new URLSearchParams(search).get('creneau') ?? undefined
  return undefined
}
