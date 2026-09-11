# Cahier des charges

## 1. Ce que fait l'application

Quatre supports visuels réunis dans un seul outil, sur tablette :

| Support | Rôle |
|---|---|
| Emploi du temps | La journée du jeune, activité par activité |
| Séquentiel | Le découpage d'une activité en étapes à cocher |
| Rappel de règle | Une consigne affichable, seule ou en ensemble, rattachée à une activité ou à la journée |
| TLA | Tableau de langage assisté : grille de pictos pour communiquer |

Le fil conducteur : depuis l'emploi du temps, on appuie sur l'activité en cours, ce qui
ouvre son séquentiel. Le TLA reste accessible en permanence, par-dessus n'importe quel
écran.

## 2. Modèle de données

```ts
type Picto = {
  id: string
  source: 'arasaac' | 'photo' | 'composite'
  image: Blob                 // PNG rendu, quelle que soit la source
  parts?: string[]            // ids des pictos composants, si composite
  libelleAffiche: string      // ce qui est écrit sous le picto
  libelleParle: string        // ce que prononce la synthèse vocale
  tags: string[]              // pour la recherche
}

type Etape = {
  id: string
  pictoId?: string            // picto et/ou texte, au moins l'un des deux
  texte?: string
}

type Sequence = {
  id: string
  nom: string
  etapes: Etape[]
}

type Regle = {
  id: string
  pictoId?: string
  texte: string
}

type GroupeRegles = {          // lot 10 : des règles qui vont ensemble
  id: string
  nom: string                  // « Le calme »
  regleIds: string[]
}

type Activite = {
  id: string
  nom: string
  pictoId: string
  sequenceId?: string         // facultatif
  regleIds: string[]
  groupeRegleIds?: string[]
  tlaContexteId?: string      // page TLA à charger pendant cette activité
}

type CreneauEDT = {
  id: string
  activiteId: string
  heureDebut?: string         // facultatif, un EDT peut être une simple suite
  ordre: number
}

type PageTLA = {
  id: string
  nom: string                 // « Cuisine », « Récréation »…
  pictoIds: string[]
}

type Profil = {
  id: string
  initiales: string
  edt: Record<JourSemaine, CreneauEDT[]>
  grilleTLA: { colonnes: number, lignes: number }   // 3×2 à 8×6
  pageTLAnoyau: string        // page de vocabulaire noyau, toujours visible
  pagesTLA: string[]
  reglesJournee: string[]
  groupesJournee?: string[]
  vocal: {
    actif: boolean
    auTap: boolean
    aLaValidation: boolean
    voixURI?: string
    vitesse: number           // 0.5 à 1.5
  }
}

type EtatCochage = {
  profilId: string
  creneauId: string
  etapesFaites: string[]      // ids d'étapes cochées
}
```

**Portée des données.** Pictos, séquences, activités, règles et pages TLA sont
**communs à l'établissement** : une séquence « se laver les mains » est écrite une fois
puis rattachée aux profils qui en ont besoin. L'EDT, la configuration TLA, les réglages
vocaux et l'état de cochage sont **propres à chaque profil**.

## 3. Socle pictogrammes

Trois manières d'obtenir un picto :

1. **Bibliothèque ARASAAC embarquée.** Recherche par mot-clé en français, filtrage par
   catégorie. Le pack complet fait plusieurs milliers d'images : embarquer un sous-
   ensemble utile (~1500 pictos couvrant quotidien, école, émotions, alimentation,
   hygiène, lieux, verbes courants), extensible par import d'un dossier ZIP.
2. **Import photo.** Depuis la galerie ou l'appareil photo de la tablette. Recadrage
   carré, compression à 512 px de côté avant stockage.
3. **Générateur de picto composite.** Combiner 2 à 4 pictos existants dans une seule
   vignette pour représenter une notion générique. Exemple : lave-vaisselle +
   aspirateur = « tâches fonctionnelles ». Dispositions proposées : 2 côte à côte,
   4 en quadrants, 1 grand + 2 petits. Le résultat est rendu en PNG et devient un picto
   normal, réutilisable partout.

Chaque picto porte un libellé affiché et un libellé parlé, souvent identiques. Le
libellé parlé permet d'afficher « toilettes » et de faire prononcer « je veux aller aux
toilettes ».

## 4. Écrans

### 4.1 Accueil
Liste des profils (initiales, grande vignette). Un appui ouvre l'accueil du profil : quatre
grandes tuiles (emploi du temps, séquentiels, règles, pour parler). Bouton discret en bas
pour le paramétrage.

> **Écart avec la version initiale (lot 8).** L'accueil d'un profil n'ouvrait à l'origine
> que l'EDT du jour. Le premier usage réel a montré que chaque support (séquentiels,
> règles, TLA) doit pouvoir être ouvert et préparé indépendamment, sans détour par
> l'emploi du temps — d'où les quatre tuiles.

### 4.2 Emploi du temps (mode jeune)
Suite verticale ou horizontale de créneaux, un gros picto par activité, nom en dessous.
États visibles : passé (grisé, coche verte), en cours (encadré jaune), à venir (normal).
Un appui sur le créneau en cours ouvre son séquentiel. Un appui sur un autre créneau
l'ouvre aussi — c'est l'éducateur qui pilote, pas l'app.
Si l'activité n'a pas de séquence, l'appui ouvre une vue plein écran du picto seul.
Un bouton « Modifier » en barre haute ouvre l'édition de l'EDT du jour, où un créneau se
crée en un seul geste (nom, picto, séquence facultative, heure facultative) — voir §4.6.

### 4.3 Séquentiel
Étapes en liste, chacune avec picto et/ou texte. Le texte d'une étape prime toujours sur
le libellé du picto : on écrit « gâteau » sous un picto qu'ARASAAC appelle « biscuit »,
parce que c'est le mot que le jeune connaît. Un appui coche l'étape : coche verte,
étape suivante mise en avant. Quand toutes les étapes sont faites : écran « Fini », avec
« Recommencer » (on refait souvent la même activité dans la foulée) et « Retour ».
Option par séquence : affichage « une étape à la fois » (plein écran) pour les jeunes
qui se perdent dans la liste.
Un bouton « Modifier » bascule la vue en édition en place (ajouter, modifier, supprimer,
réordonner des étapes), sans quitter le séquentiel en cours. Un séquentiel se lance aussi
seul, depuis l'écran Séquentiels, sans passer par l'emploi du temps.

> **Écart avec la version initiale (lot 8).** Décocher une étape et modifier une séquence
> en cours étaient interdits en mode jeune (voir §5). Le terrain a montré l'inverse : un
> éducateur qui se trompe ou qui réadapte une activité en cours d'atelier doit pouvoir
> corriger tout de suite, sans sortir vers un espace protégé.

### 4.4 Règles
Affichage plein écran d'une règle, ou bandeau permanent en haut de l'EDT pour les
règles de journée. Déclenchable par l'éducateur à tout moment depuis le menu flottant.

Les règles peuvent être réunies en **ensembles** (lot 10) : « le calme » = mains
calmes + pieds calmes + bouche silencieuse. Un ensemble se rappelle d'un seul appui
et s'affiche d'un bloc, toutes ses règles sur le même écran — ces consignes se
tiennent, les montrer une par une leur fait perdre leur sens. Un ensemble se coche
comme une règle, pour une activité comme pour la journée.

### 4.5 TLA
Grille configurable de 3×2 à 8×6. Structure :
- **Bandeau de phrase** en haut : les pictos touchés s'y empilent. Bouton « effacer »
  (dernier picto) et appui long pour tout effacer. Bouton « parler » si le vocal est
  actif à la validation.
- **Vocabulaire noyau** : une zone fixe (colonne de gauche ou ligne du bas) toujours
  affichée — je veux, encore, fini, aide, stop, oui, non.
- **Vocabulaire contextuel** : le reste de la grille, chargé selon la page TLA de
  l'activité en cours. Sélecteur de page accessible si plusieurs pages.

Le TLA s'ouvre par un **bouton flottant présent sur tous les écrans**, y compris
pendant un séquentiel. Il se referme sans perdre l'état de l'écran en dessous.

### 4.6 Paramétrage
Accessible par un bouton « Paramétrage » discret sur l'accueil et sur l'accueil de
profil, puis code PIN à 4 chiffres (défini au premier lancement, modifiable dans les
réglages). Contient ce qui se règle une fois, pas ce qui se prépare au quotidien :
- Gestion des profils
- Bibliothèque de pictos (recherche, import photo, générateur composite)
- Réglages vocaux par profil, **avec bouton de test de voix**
- Remise à zéro des cochages (un profil, un jour, ou tout) et annulation d'un cochage
- Export / import de la configuration complète en fichier JSON, pour dupliquer le
  paramétrage d'une tablette à l'autre sans tout ressaisir
- À propos (attribution ARASAAC)

Tout le reste — séquences, activités, règles, construction de l'EDT, configuration du
TLA — est passé dans les quatre écrans du profil (§4.1) : chaque écran gère son propre
contenu (créer, modifier, supprimer, lancer), en édition libre, sans PIN.

> **Écart avec la version initiale (lot 8).** L'espace éducateur regroupait à l'origine
> tout ce qui n'était pas la vue jeune du jour : profils, pictos, séquences, activités,
> règles, EDT, TLA — douze écrans derrière un appui long caché de 3 secondes. Le premier
> usage réel a montré que cet arbre convenait à une préparation ponctuelle mais pas à une
> réadaptation en direct pendant un atelier (ajouter une étape, corriger un créneau,
> décocher une erreur). Seul ce qui se règle une fois par tablette — profils, pictos,
> voix, export/import — reste protégé ; le reste est en édition libre à même les quatre
> écrans du profil.

## 5. Verrouillage

Mode jeune par défaut au démarrage. Le passage en mode paramétrage est volontairement
peu découvrable (bouton discret + PIN) mais rapide pour un adulte prévenu. Retour
automatique en mode jeune après 5 minutes sans interaction dans le paramétrage.

> **Écart avec la version initiale (lot 8).** À l'origine, le mode jeune interdisait tout
> décochage et toute modification, et le passage en mode éducateur se faisait par un
> appui long de 3 secondes caché dans un coin d'écran. Le terrain a montré le contraire :
> un jeune ou un éducateur doit pouvoir corriger une étape cochée par erreur ou ajouter un
> créneau sans quitter l'écran en cours, et l'appui long caché ralentissait un geste qui
> doit être immédiat pendant un atelier. Le PIN protège désormais uniquement le
> paramétrage (§4.6) — profils, pictos, voix, export/import — pas l'usage quotidien des
> quatre écrans du profil, où l'édition est libre.

## 6. Synthèse vocale

Trois réglages indépendants, par profil :
- **Vocal actif** : interrupteur général
- **Au tap** : chaque picto se prononce dès qu'on le touche
- **À la validation** : seule la phrase complète du bandeau TLA est lue au bouton
  « parler »

Le vocal s'applique au TLA en priorité, et optionnellement aux étapes de séquentiel
(lecture du libellé parlé de l'étape quand elle devient l'étape en cours).

**Point de vigilance technique.** `speechSynthesis` utilise les voix système Android.
Le fonctionnement hors ligne suppose que la voix française est téléchargée sur la
tablette (Paramètres → Synthèse vocale → moteur Google → télécharger le français).
L'écran de réglages doit donc :
- lister les voix disponibles (`getVoices()`, en gérant l'événement `voiceschanged` qui
  arrive de manière asynchrone sur Android),
- laisser choisir la voix et la vitesse,
- proposer un bouton « Tester la voix » qui prononce une phrase d'exemple,
- afficher un avertissement clair si aucune voix française n'est trouvée, en indiquant
  la marche à suivre.

## 7. Hors périmètre (pour l'instant)

- Toute forme de synchronisation ou de compte utilisateur
- Génération de supports imprimables (c'est l'autre projet, dépôt séparé)
- Collecte de données de cotation (c'est l'appli ABA, dépôt séparé)
- Statistiques d'usage ou suivi de progression du jeune
