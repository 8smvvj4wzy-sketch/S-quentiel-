# Séquentiel

Supports visuels interactifs pour un IME : emploi du temps, séquentiels,
rappels de règle et tableau de langage assisté, sur tablette Android.

Hors ligne total, sans backend, sans donnée nominative. Voir `SPEC.md` pour le
cahier des charges, `ROADMAP.md` pour l'ordre de construction et `CLAUDE.md`
pour les contraintes de projet.

## Développer

```sh
npm install
npm run dev      # serveur local
npm run build    # vérification des types + build de production
npm run preview  # servir le build, pour tester le mode hors ligne
```

## Déployer

Un push sur `main` déclenche `.github/workflows/deploy.yml`. Activer une fois
Pages sur la source « GitHub Actions » (Settings → Pages).

## Pack de pictogrammes ARASAAC

`scripts/build-arasaac.mjs` est le seul code du projet qui accède au réseau, et
il ne tourne jamais sur la tablette. Lancer localement :

```sh
npm run pack:arasaac -- --max 1500 --resolution 300
```

ou depuis n'importe où, téléphone compris : onglet **Actions** → **Pack ARASAAC**
→ **Run workflow**. Le pack est déposé dans `public/pack-arasaac/` et validé
dans le dépôt.

## Licence des pictogrammes

Pictogrammes propriété du Gouvernement d'Aragon, créés par Sergio Palao pour
ARASAAC (arasaac.org), distribués sous CC BY-NC-SA. Usage non commercial.
