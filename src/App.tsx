import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CoinEducateur } from './composants/CoinEducateur'
import { FournisseurVerrouillage, useVerrouillage } from './lib/verrouillage'
import { Accueil } from './ecrans/Accueil'
import { APropos } from './ecrans/APropos'
import { Bibliotheque } from './ecrans/Bibliotheque'
import { Educateur } from './ecrans/Educateur'
import { Profil } from './ecrans/Profil'
import type { JSX } from 'react'

/**
 * Routage en mode hash : GitHub Pages ne sait pas réécrire les URL, et un
 * rechargement sur /educateur renverrait un 404.
 */

/** En mode jeune, l'espace éducateur n'est pas atteignable, même par l'URL. */
function ReserveEducateur({ children }: { children: JSX.Element }) {
  const { mode } = useVerrouillage()
  return mode === 'educateur' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <FournisseurVerrouillage>
      <HashRouter>
        <CoinEducateur />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/profil/:profilId" element={<Profil />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route
            path="/educateur"
            element={
              <ReserveEducateur>
                <Educateur />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/bibliotheque"
            element={
              <ReserveEducateur>
                <Bibliotheque />
              </ReserveEducateur>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </FournisseurVerrouillage>
  )
}
