# CLAUDE.md — Instructions projet

Application de supports visuels interactifs pour un IME. Utilisée sur tablettes Android
par des jeunes accompagnés (avec ou sans lecture) et par les éducateurs.

Lis `SPEC.md` avant toute chose. `ROADMAP.md` donne l'ordre de construction : ne saute
pas de lot, chaque lot doit être déployable et testable sur tablette avant le suivant.

## Contraintes non négociables

1. **Hors ligne total.** Aucune requête réseau au runtime. Pictogrammes, polices,
   scripts : tout est embarqué. L'app doit fonctionner en atelier cuisine sans wifi.
2. **Pas de backend.** Site statique déployé sur GitHub Pages. Toutes les données
   restent dans la tablette (IndexedDB). Aucune synchronisation entre appareils.
3. **Aucune donnée nominative.** Les profils sont identifiés par initiales ou prénom
   court, jamais par nom de famille. Pas de date de naissance, pas de champ libre
   invitant à saisir des informations médicales.
4. **Cible tactile.** Zone tactile minimale 64 × 64 px, 88 px pour les actions
   principales en mode jeune. Aucune interaction dépendant du survol, du clic droit
   ou d'un appui précis.
5. **Orientation paysage prioritaire**, portrait fonctionnel mais secondaire.

## Stack

- Vite + React + TypeScript
- Routage : `react-router` en mode hash (contrainte GitHub Pages)
- Stockage : IndexedDB via Dexie (les images de pictos sont des Blobs, `localStorage`
  est insuffisant)
- PWA : `vite-plugin-pwa`, précache complet, installable sur l'écran d'accueil Android
- Vocal : Web Speech API (`speechSynthesis`), voix système Android
- Pas de librairie de composants UI. Le style est fait main, voir « Direction visuelle ».
- `vite.config.ts` : `base: '/<nom-du-depot>/'` sinon les assets cassent sur Pages

## Direction visuelle

L'interface ne doit **jamais** concurrencer les pictogrammes. Les pictos portent la
couleur et l'information ; le châssis reste silencieux.

- Fond : gris très clair neutre `#F2F3F4`. Surfaces : blanc pur.
- Texte : `#1C1C1E`. Texte secondaire : `#6B6F76`.
- Un seul accent d'action, bleu profond `#1D4E89` (boutons éducateur, sélection).
- Statuts : vert `#2E7D4F` pour une étape faite, jaune `#E8A33D` pour l'étape en cours.
- Pas de dégradés, pas d'ombres portées, pas de cartes arrondies partout. Les bordures
  et les fonds servent à séparer les zones, pas à décorer.
- Typographie : **Atkinson Hyperlegible** (police libre conçue pour la basse vision),
  embarquée en local. Une seule famille. Corps de texte 20 px minimum en mode jeune,
  titres d'étape 32 px.
- Mouvement : uniquement en réponse à une action (une étape cochée, un picto ajouté à
  la phrase). Aucune animation d'apparition décorative.

## Écriture des textes d'interface

Phrases courtes, verbes à l'infinitif ou à l'impératif, jamais de jargon technique.
« Ranger la vaisselle », pas « Item 3 ». Les écrans vides disent quoi faire :
« Aucune séquence pour l'instant. Appuyer sur + pour en créer une. »

Deux registres à distinguer : le mode jeune parle au jeune, le mode éducateur parle à
l'adulte. Ne pas mélanger.

## Méthode de travail attendue

- Commits petits et fréquents, messages en français.
- À chaque lot terminé : mettre à jour `ROADMAP.md` (cocher) et vérifier que le build
  `npm run build` passe.
- Écrire les types du modèle de données **avant** les écrans (`src/types.ts`), ils sont
  déjà décrits dans `SPEC.md`.
- Ne pas inventer de fonctionnalité absente de `SPEC.md`. En cas de doute sur un choix
  produit, poser la question plutôt que trancher seul.
- Placer `deploy.yml` dans `.github/workflows/` et activer Pages sur la source
  « GitHub Actions ».

## Licence des pictogrammes

Les pictogrammes ARASAAC sont sous licence CC BY-NC-SA. L'attribution est obligatoire
et doit apparaître dans l'écran « À propos » :
auteur des pictos **Sergio Palao**, origine **ARASAAC** (arasaac.org), propriété du
**Gouvernement d'Aragon**, distribués sous **CC BY-NC-SA**. Usage non commercial
uniquement — ce qui est le cas ici.
