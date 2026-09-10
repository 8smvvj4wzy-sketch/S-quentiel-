import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BoutonFlottantMenu } from './composants/BoutonFlottantMenu'
import { FournisseurVerrouillage, useVerrouillage } from './lib/verrouillage'
import { Accueil } from './ecrans/Accueil'
import { AccueilProfil } from './ecrans/AccueilProfil'
import { APropos } from './ecrans/APropos'
import { Bibliotheque } from './ecrans/Bibliotheque'
import { ConfigurationTLA } from './ecrans/ConfigurationTLA'
import { ConstruireEDT } from './ecrans/ConstruireEDT'
import { EcranTLA } from './ecrans/EcranTLA'
import { EditeurPageTLA } from './ecrans/EditeurPageTLA'
import { EditeurSequence } from './ecrans/EditeurSequence'
import { ExportImport } from './ecrans/ExportImport'
import { PagesTLA } from './ecrans/PagesTLA'
import { Parametrage } from './ecrans/Parametrage'
import { Profil } from './ecrans/Profil'
import { ReglagesVocaux } from './ecrans/ReglagesVocaux'
import { Regles } from './ecrans/Regles'
import { Sequences } from './ecrans/Sequences'
import { VueCreneau } from './ecrans/VueCreneau'
import { VueSequentiel } from './ecrans/VueSequentiel'
import type { JSX } from 'react'

/**
 * Routage en mode hash : GitHub Pages ne sait pas réécrire les URL, et un
 * rechargement sur une route profonde renverrait un 404.
 *
 * Depuis le lot 8, l'arborescence suit l'usage et non l'administration :
 * un profil, puis ses quatre supports. Le paramétrage est à part, et c'est
 * le seul endroit encore protégé par le code PIN.
 */

/** Seul le paramétrage reste derrière le PIN (écart assumé avec SPEC §5). */
function ReserveParametrage({ children }: { children: JSX.Element }) {
  const { mode } = useVerrouillage()
  return mode === 'educateur' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <FournisseurVerrouillage>
      <HashRouter>
        <BoutonFlottantMenu />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/a-propos" element={<APropos />} />

          {/* Les quatre supports d'un profil */}
          <Route path="/profil/:profilId" element={<AccueilProfil />} />
          <Route path="/profil/:profilId/edt" element={<Profil />} />
          <Route path="/profil/:profilId/edt/modifier" element={<ConstruireEDT />} />
          <Route path="/profil/:profilId/sequentiels" element={<Sequences />} />
          <Route path="/profil/:profilId/sequentiels/:sequenceId" element={<EditeurSequence />} />
          <Route path="/profil/:profilId/sequentiel/:sequenceId" element={<VueSequentiel />} />
          <Route path="/profil/:profilId/creneau/:creneauId" element={<VueCreneau />} />
          <Route path="/profil/:profilId/regles" element={<Regles />} />
          <Route path="/profil/:profilId/tla" element={<EcranTLA />} />
          <Route path="/profil/:profilId/tla/pages" element={<PagesTLA />} />
          <Route path="/profil/:profilId/tla/pages/:pageId" element={<EditeurPageTLA />} />
          <Route path="/profil/:profilId/tla/grille" element={<ConfigurationTLA />} />

          {/* Paramétrage — protégé par le PIN */}
          <Route
            path="/parametrage"
            element={
              <ReserveParametrage>
                <Parametrage />
              </ReserveParametrage>
            }
          />
          <Route
            path="/parametrage/bibliotheque"
            element={
              <ReserveParametrage>
                <Bibliotheque />
              </ReserveParametrage>
            }
          />
          <Route
            path="/parametrage/profils/:profilId/vocal"
            element={
              <ReserveParametrage>
                <ReglagesVocaux />
              </ReserveParametrage>
            }
          />
          <Route
            path="/parametrage/export-import"
            element={
              <ReserveParametrage>
                <ExportImport />
              </ReserveParametrage>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </FournisseurVerrouillage>
  )
}
