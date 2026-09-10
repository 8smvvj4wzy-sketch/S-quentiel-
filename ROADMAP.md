# Feuille de route

Chaque lot se termine par un déploiement sur GitHub Pages et un test réel sur tablette.
Cocher les cases au fur et à mesure.

## Lot 0 — Socle technique
- [x] Projet Vite + React + TypeScript, `base` configurée pour GitHub Pages
- [ ] Workflow `deploy.yml` en place, premier déploiement vérifié — *workflow en place ; reste à activer Pages sur la source « GitHub Actions » et à vérifier sur tablette*
- [x] PWA installable, précache complet, test en mode avion
- [x] Police Atkinson Hyperlegible embarquée, tokens de couleur définis
- [x] `src/types.ts` complet, conforme à SPEC.md §2
- [x] Base Dexie et couche d'accès aux données
- [x] Verrouillage : mode jeune / mode éducateur, appui long 3 s + PIN, retour auto
- [x] Écran d'accueil et gestion des profils (créer, renommer, supprimer)

## Lot 1 — Socle pictogrammes
- [ ] Sous-ensemble ARASAAC embarqué, avec index de recherche français
- [ ] Écran bibliothèque : recherche, catégories, aperçu
- [ ] Import photo (galerie + appareil photo), recadrage carré, compression 512 px
- [ ] Générateur de picto composite : 2 à 4 pictos, 3 dispositions, rendu PNG
- [ ] Édition des libellés affiché et parlé sur chaque picto
- [ ] Import d'un pack ARASAAC complémentaire par ZIP

## Lot 2 — Séquentiels
- [ ] Bibliothèque de séquences : créer, dupliquer, supprimer
- [ ] Éditeur d'étapes : picto et/ou texte, réordonnancement par glisser-déposer
- [ ] Vue jeune : liste d'étapes, cochage, étape en cours mise en avant, écran « Fini »
- [ ] Option « une étape à la fois »
- [ ] État de cochage persistant par profil et par créneau
- [ ] Remise à zéro et annulation depuis l'espace éducateur

## Lot 3 — Emploi du temps
- [ ] Bibliothèque d'activités : nom, picto, séquence rattachée
- [ ] Construction de l'EDT par profil et par jour de semaine
- [ ] Vue jeune : créneaux, états passé / en cours / à venir
- [ ] Navigation créneau → séquentiel, et retour
- [ ] Activité sans séquence : vue plein écran du picto

## Lot 4 — TLA et vocal
- [ ] Configuration de la grille par profil (3×2 à 8×6)
- [ ] Pages TLA : noyau fixe + pages contextuelles
- [ ] Bandeau de phrase, effacement simple et total
- [ ] Bouton flottant d'accès au TLA sur tous les écrans, sans perte d'état
- [ ] Rattachement d'une page TLA à une activité
- [ ] Réglages vocaux par profil : actif, au tap, à la validation, voix, vitesse
- [ ] Bouton « Tester la voix » et avertissement si aucune voix française

## Lot 5 — Règles et finitions
- [ ] Bibliothèque de règles, rattachement activité et journée
- [ ] Affichage plein écran et bandeau de journée
- [ ] Export / import de la configuration en JSON
- [ ] Écran « À propos » avec l'attribution ARASAAC obligatoire
- [ ] Passe d'accessibilité : contrastes, tailles tactiles, `prefers-reduced-motion`
- [ ] Relecture des textes d'interface (registre jeune / registre éducateur)
