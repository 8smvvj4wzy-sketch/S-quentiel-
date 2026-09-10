import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BoutonFlottantMenu } from './composants/BoutonFlottantMenu'
import { CoinEducateur } from './composants/CoinEducateur'
import { FournisseurVerrouillage, useVerrouillage } from './lib/verrouillage'
import { Accueil } from './ecrans/Accueil'
import { Activites } from './ecrans/Activites'
import { APropos } from './ecrans/APropos'
import { Bibliotheque } from './ecrans/Bibliotheque'
import { ConfigurationTLA } from './ecrans/ConfigurationTLA'
import { ConstruireEDT } from './ecrans/ConstruireEDT'
import { Educateur } from './ecrans/Educateur'
import { EditeurPageTLA } from './ecrans/EditeurPageTLA'
import { EditeurSequence } from './ecrans/EditeurSequence'
import { ExportImport } from './ecrans/ExportImport'
import { PagesTLA } from './ecrans/PagesTLA'
import { Profil } from './ecrans/Profil'
import { ReglagesVocaux } from './ecrans/ReglagesVocaux'
import { Regles } from './ecrans/Regles'
import { Sequences } from './ecrans/Sequences'
import { VueCreneau } from './ecrans/VueCreneau'
import { VueSequentiel } from './ecrans/VueSequentiel'
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
        <BoutonFlottantMenu />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/profil/:profilId" element={<Profil />} />
          <Route path="/profil/:profilId/sequentiel/:sequenceId" element={<VueSequentiel />} />
          <Route path="/profil/:profilId/creneau/:creneauId" element={<VueCreneau />} />
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
          <Route
            path="/educateur/sequences"
            element={
              <ReserveEducateur>
                <Sequences />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/sequences/:sequenceId"
            element={
              <ReserveEducateur>
                <EditeurSequence />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/activites"
            element={
              <ReserveEducateur>
                <Activites />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/profils/:profilId/edt"
            element={
              <ReserveEducateur>
                <ConstruireEDT />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/tla"
            element={
              <ReserveEducateur>
                <PagesTLA />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/tla/:pageId"
            element={
              <ReserveEducateur>
                <EditeurPageTLA />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/profils/:profilId/tla"
            element={
              <ReserveEducateur>
                <ConfigurationTLA />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/profils/:profilId/vocal"
            element={
              <ReserveEducateur>
                <ReglagesVocaux />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/regles"
            element={
              <ReserveEducateur>
                <Regles />
              </ReserveEducateur>
            }
          />
          <Route
            path="/educateur/export-import"
            element={
              <ReserveEducateur>
                <ExportImport />
              </ReserveEducateur>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </FournisseurVerrouillage>
  )
}
