# Feuille de route

Chaque lot se termine par un déploiement sur GitHub Pages et un test réel sur tablette.
Cocher les cases au fur et à mesure.

## Lot 0 — Socle technique
- [x] Projet Vite + React + TypeScript, `base` configurée pour GitHub Pages
- [x] Workflow `deploy.yml` en place, premier déploiement vérifié — *site en ligne, reste à vérifier concrètement sur tablette*
- [x] PWA installable, précache complet, test en mode avion
- [x] Police Atkinson Hyperlegible embarquée, tokens de couleur définis
- [x] `src/types.ts` complet, conforme à SPEC.md §2
- [x] Base Dexie et couche d'accès aux données
- [x] Verrouillage : mode jeune / mode éducateur, appui long 3 s + PIN, retour auto
- [x] Écran d'accueil et gestion des profils (créer, renommer, supprimer)

## Lot 1 — Socle pictogrammes
- [x] Sous-ensemble ARASAAC embarqué, avec index de recherche français
- [x] Écran bibliothèque : recherche, catégories, aperçu
- [x] Import photo (galerie + appareil photo), recadrage carré, compression 512 px
- [x] Générateur de picto composite : 2 à 4 pictos, 3 dispositions, rendu PNG
- [x] Édition des libellés affiché et parlé sur chaque picto
- [x] Import d'un pack ARASAAC complémentaire par ZIP

## Lot 2 — Séquentiels
- [x] Bibliothèque de séquences : créer, dupliquer, supprimer
- [x] Éditeur d'étapes : picto et/ou texte, réordonnancement par glisser-déposer
- [x] Vue jeune : liste d'étapes, cochage, étape en cours mise en avant, écran « Fini »
- [x] Option « une étape à la fois »
- [x] État de cochage persistant par profil et par créneau
- [x] Remise à zéro et annulation depuis l'espace éducateur

## Lot 3 — Emploi du temps
- [x] Bibliothèque d'activités : nom, picto, séquence rattachée
- [x] Construction de l'EDT par profil et par jour de semaine
- [x] Vue jeune : créneaux, états passé / en cours / à venir
- [x] Navigation créneau → séquentiel, et retour
- [x] Activité sans séquence : vue plein écran du picto

## Lot 4 — TLA et vocal
- [x] Configuration de la grille par profil (3×2 à 8×6)
- [x] Pages TLA : noyau fixe + pages contextuelles
- [x] Bandeau de phrase, effacement simple et total
- [x] Bouton flottant d'accès au TLA sur tous les écrans, sans perte d'état
- [x] Rattachement d'une page TLA à une activité
- [x] Réglages vocaux par profil : actif, au tap, à la validation, voix, vitesse
- [x] Bouton « Tester la voix » et avertissement si aucune voix française

## Lot 5 — Règles et finitions
- [x] Bibliothèque de règles, rattachement activité et journée
- [x] Affichage plein écran et bandeau de journée
- [x] Export / import de la configuration en JSON
- [x] Écran « À propos » avec l'attribution ARASAAC obligatoire
- [x] Passe d'accessibilité : contrastes, tailles tactiles, `prefers-reduced-motion`
- [x] Relecture des textes d'interface (registre jeune / registre éducateur)

---

Lots 6 à 9 : refonte « utilisation terrain », après le premier usage réel.
L'application marchait, mais elle demandait trop de gestes pour préparer ou
réadapter un support pendant un atelier.

## Lot 6 — Catalogue complet
- [x] Correctif : l'EDT s'ouvrait sur lundi, la vue jeune lisait le jour courant
- [x] Tout le catalogue ARASAAC français, sans filtre thématique
- [x] Images converties en WebP, index allégé
- [x] Recherche classée par pertinence, filtre par catégorie retiré
- [ ] Pack reconstruit par le workflow et déployé

## Lot 7 — Choisir un picto sans détour
- [ ] Sélecteur unique : bibliothèque et catalogue dans la même recherche
- [ ] Enregistrement du picto en coulisse, sans étape « obtenir »
- [ ] Suggestions de pictos pendant la saisie d'un libellé

## Lot 8 — Navigation de terrain
- [ ] Quatre écrans : emploi du temps, séquentiels, règles, TLA
- [ ] Écran de paramétrage, seul endroit encore protégé par le PIN
- [ ] Édition libre en dehors du paramétrage

## Lot 9 — EDT et séquentiel souples
- [ ] Créneau créé en un geste depuis l'emploi du temps
- [ ] Séquentiel modifiable pendant qu'il tourne
- [ ] Séquentiel lançable seul, hors emploi du temps
