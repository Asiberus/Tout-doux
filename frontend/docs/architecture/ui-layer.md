# Couche de présentation

Vuetify 4 en thème sombre unique. Trois niveaux de composants coexistent, avec un critère de
placement explicite ; le thème est étendu de couleurs **métier** (pas seulement d'une palette).

## Trois niveaux de composants

| Niveau                  | Emplacement                            | Critère                                                                                | Exemples                                                                                                     |
| ----------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Global**              | `src/components/` (15)                 | Réutilisable **sans connaissance du domaine**, ou chip/avatar d'entité utilisé partout | `ConfirmDialog`, `HalfDialog`, `EmptyListDisplay`, `FilterChip`, `ProgressWheel`, `MainTitle`, `ProjectChip` |
| **Partagé par domaine** | `src/views/components/<domaine>/` (13) | Lié à une entité, consommé par **≥ 2 features**                                        | `task/TaskCard`, `event/EventDialog`, `tag/TagGroup`, `common-task/CommonTaskCard`                           |
| **Local à une feature** | `src/views/<feature>/components/`      | Utilisé par une seule feature                                                          | `daily/components/DailyTaskCard`, `project/project-detail/components/ProjectSectionItem`                     |

> **Nouveau composant** : commencer local. Le promouvoir vers `views/components/<domaine>/` au
> 2ᵉ consommateur hors de sa feature, vers `src/components/` seulement s'il perd toute
> dépendance au domaine. Les 4 domaines existants sont `task`, `event`, `tag`, `common-task`.

Note : `src/components/` contient déjà des composants **couplés au domaine**
(`ProjectChip`, `SectionChip`, `CollectionChip`, `ProjectAvatar`) — c'est un écart au critère,
assumé car ils sont utilisés dans presque tous les écrans.

## Thème et tokens

`src/plugins/vuetify.ts`. `defaultTheme: 'dark'` et **aucune bascule de thème n'existe** dans
l'app (0 `useTheme` dans `src/`) : le thème `light` est déclaré mais **inatteignable**.

Table **maintenue à la main** — la mettre à jour à tout ajout/suppression de couleur.

| Token                                        | Valeur                | Rôle                                                                            | Utilisé ?            |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- | -------------------- |
| `primary`                                    | `#ee44aa`             | Accent principal (défaut de `VSwitch`)                                          | oui                  |
| `secondary`                                  | `#424242`             | Bordures, fonds neutres                                                         | oui                  |
| `accent`                                     | `#82B1FF`             | Sélection, onglets actifs                                                       | oui                  |
| `stepperInactive`                            | `#757575`             | Étape de stepper **non** sélectionnée                                           | oui                  |
| `project` / `antiProject`                    | `#004D40` / `#99b7b2` | Fond / texte d'un avatar de projet                                              | oui                  |
| `projectArchived` / `antiProjectArchived`    | `#82B1FF` / `#d9e7ff` | Idem, projet archivé                                                            | oui                  |
| `projectArchivedCard` / `collectionArchived` | `#363e4d`             | Fond de carte archivée                                                          | oui                  |
| `collection`                                 | `#827717`             | Identité visuelle collection                                                    | oui                  |
| `event`                                      | `#009688`             | Événement à venir                                                               | oui                  |
| `passedEvent`                                | `#191919`             | Événement passé                                                                 | oui                  |
| `surface-container-high`                     | `#2e2e2e`             | Niveau 2 — contenu dans une carte, bottom sheet                                 | oui                  |
| `surface-container-highest`                  | `#3a3a3a`             | Niveau 3 — carte posée dans la bottom sheet                                     | oui                  |
| `taskCompleted`                              | `#497549`             | —                                                                               | **non — token mort** |
| `taskInCreation`                             | `#181b1f`             | —                                                                               | **non — token mort** |
| `info` / `success` / `warning`               | —                     | Standard Vuetify                                                                | oui                  |
| `error`                                      | `#FF5252`             | **Déclaré dans `light` uniquement** → le thème `dark` utilise le défaut Vuetify | incohérence          |

**`stepperInactive`** distingue l'étape inactive du stepper de `daily-update` :
`VStepperItem` colore sa pastille dès que l'étape est `editable`, donc avec un `color` unique les
deux étapes se ressemblaient. La couleur est posée **par étape**
(`:color="dailyStepper === n ? 'accent' : 'stepperInactive'"`) plutôt qu'en CSS sur la classe
`v-stepper-item--selected`, la pastille étant un `VAvatar` dont la couleur vient d'une prop.

`#757575` est `grey-darken-1` de la palette Material — mais posé en **token de thème** et non en
`color="grey-darken-1"` sur le composant, contrainte qui vient de l'icône : le gris Material est
une classe statique compilée dans `main.css` (`.bg-grey-darken-1 { color: #FFFFFF }`), impossible
à surcharger sans CSS additionnel. Un token de thème, lui, génère ses variables au runtime et
laisse déclarer son propre **`on-stepperInactive`** (`#000`) — c'est le seul moyen de forcer le
noir : Vuetify choisit sinon la couleur du texte en **APCA**, pas en ratio WCAG
(`whiteContrast > min(blackContrast, 50)`), et sur `#757575` le blanc l'aurait emporté (noir 32,1,
blanc 79,8). Le noir est ici un choix esthétique — les deux étapes portent la même icône — et non
le meilleur contraste. `genOnColors()` saute toute couleur dont le `on-<nom>` est déjà défini, ce
qui est le seul moyen de couper le calcul automatique.

**Échelle tonale.** Vuetify 4 ne livre pas la famille `surface-container-*` de MD3 : le thème
sombre n'a que `background` (`#121212`) et `surface` (`#212121`) d'utilisables comme fonds, alors
que quatre niveaux se superposent sur l'écran de daily update. En thème sombre la profondeur se lit
sur des tons **plus clairs** : une ombre ne fait qu'assombrir ce qu'il y a derrière elle, ce qui est
presque invisible sur `#121212`.

| Niveau | Ton                                   | Où                                           |
| ------ | ------------------------------------- | -------------------------------------------- |
| 0      | `background` `#121212`                | fond de page                                 |
| 1      | `surface` `#212121`                   | carte projet, carte collection               |
| 2      | `surface-container-high` `#2e2e2e`    | lignes de tâche dans une carte, bottom sheet |
| 3      | `surface-container-highest` `#3a3a3a` | carte de tâche dans la bottom sheet          |

Ces deux tokens sont nommés en kebab-case, contrairement aux couleurs métier en camelCase, pour se
ranger avec les surfaces livrées par Vuetify (`surface-bright`, `surface-variant`).

Les tâches complétées utilisent la palette Material générique (`green-darken-2`) et non
`taskCompleted`. Voir [../patterns/styling.md](../patterns/styling.md) pour la conséquence
(deux systèmes de couleur coexistent).

⚠️ Les tokens de thème n'ont **aucune nuance** générée : aucune option `variations` n'est déclarée
dans `vuetify.ts`, donc `bg-collection-lighten-2` & co. n'existent pas. Une nuance ne s'applique
qu'aux couleurs de la palette Material (`grey-darken-3`, `green-darken-2`…).

## Défauts globaux de composants

`vuetify.ts` → bloc `defaults` : tous les champs de saisie en `variant: 'underlined'` (le défaut
Vuetify 4 est `filled` — ce bloc restaure l'apparence historique de l'app), `VSwitch` en
`color: 'primary'`, `VDialog` en `transition: 'scale-transition'`.

`VDialog` : le défaut Vuetify 4 n'est pas une transition CSS mais le **composant**
`VDialogTransition`, qui mesure la boîte de l'activateur et fait grandir la dialog **depuis le
bouton**. `scale-transition` rétablit le scale depuis le centre de l'écran, comme en Vuetify 2.

**Conséquence** : ne pas remettre `variant="underlined"` localement sur un champ, c'est déjà le
défaut. Un `variant` local **écrase** le défaut (`Feedback.vue` utilise volontairement `filled`),
de même qu'un `transition` local (`DailyDetail.vue` et `HalfDialog.vue` gardent le leur).

## Styles globaux

`src/styles/` contient deux fichiers, avec des rôles distincts :

| Fichier         | Rôle                                                                                     | Chargé par                                    |
| --------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `settings.scss` | **Variables Sass Vuetify** (`@use 'vuetify/settings' with (...)`) — compilé dans Vuetify | `vite.config.ts` (option `styles.configFile`) |
| `global.scss`   | Classes utilitaires maison + overrides de composants Vuetify                             | `App.vue`                                     |

Ce qui vit dans `global.scss` : le reset des marges `h1`-`h6`/`p` (dans
`@layer vuetify-core.reset`), les utilitaires `gap-*`, `cursor-*`, `opacity-60`, `text-link`,
`h-100`, `hide-scroll`, et les overrides de dialogs (`.half-dialog`, `.daily-detail-dialog`).

**Règle** : un override qui ne concerne qu'un seul composant vit dans le `<style scoped>` de ce
composant, pas ici. C'est pourquoi le bloc `.daily-update-stepper` a été déplacé dans
`DailyUpdate.vue` (ses descendants Vuetify passent par `:deep()`).

**Il reste un bloc d'override mort** — le bloc `.v-chip/.v-tab ::before` de neutralisation du
survol mobile : en Vuetify 4 le pseudo-élément est devenu un **élément** `__overlay`. Voir
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).

Où écrire un style : [../patterns/styling.md](../patterns/styling.md).

## Contraintes non évidentes

- **`MainTitle` / `SecondaryTitle` / `TertiaryTitle`** encapsulent les classes typographiques
  MD3 responsives. Les utiliser plutôt que d'écrire `text-headline-*` à la main.
  Attention : `TertiaryTitle` rend un `<h4>` (pas `<h3>`) et embarque `mb-2 mb-md-3`,
  contrairement aux deux autres qui n'ont pas de marge.
- **Le responsive passe par `useDisplay()`**, avec un piège de déballage de refs qui a causé des
  bugs réels : voir [../patterns/responsive.md](../patterns/responsive.md). **Lire avant tout
  code responsive.**
- **Les dialogs suivent un pattern unique** (activator slot + `useDialogWidth`) :
  [../patterns/dialogs.md](../patterns/dialogs.md).
- **Icônes MDI et police Roboto chargées depuis des CDN** (`index.html:12-17`), pas bundlées :
  l'app se dégrade hors ligne / derrière un proxy filtrant.
- **`TagSearch` charge sa liste en entier au montage** (`sort=name`, `size=200`), puis filtre
  côté client — il ne vit que dans des dialogs montées paresseusement, donc « monté » vaut
  « ouvert ». Deux subtilités Vuetify sont derrière son code : `useFilter` est alimenté par
  `isPristine ? '' : search` (`VAutocomplete.js:95`), ce qui affiche **tous** les items au clic
  sans code ; et **Cmd/Ctrl+Entrée** valide le formulaire porteur, intercepté en **phase de
  capture** avec `stopPropagation()` parce que le `onKeydown` de Vuetify ne regarde aucun
  modificateur et sélectionnerait le premier item au passage. `Entrée` seule reste au composant,
  qui ouvre le menu. Refermer ce menu après une sélection demande aussi un `v-model:menu` :
  en `multiple`, Vuetify ne le fait jamais et n'expose aucune prop pour ça.
  Quand l'utilisateur n'a aucun tag du type demandé, `hide-no-data` laisse le menu vide : un lien
  prend le relais et pointe vers `settings-tags` avec `query.type`, donc sur le bon onglet.
- **`DailyTaskBottomSheet`** (local à `daily-update`) ancre la liste des tâches du jour en feuille
  à **trois crans** sous `sm-and-down`, pilotés par `DailyTaskSheetDetent`
  (`Collapsed` / `Half` / `Full`) et dimensionnés par cinq variables CSS portées par
  `.task-sheet` : `--sheet-collapsed-height` (56px), `--sheet-detent-half` (55svh),
  `--sheet-detent-full` (90svh), `--sheet-content-gap` (8px) et
  `--sheet-content-padding-bottom` (16px). Le panneau mesure **toujours** `--sheet-detent-full` et
  se déplace par `translateY` : régler un cran ne demande que de toucher sa variable. `position: sticky` y est **inutilisable** : `.v-window` et le `.v-sheet` du stepper
  sont en `overflow: hidden` et deviennent le contexte de confinement du sticky, dont les boîtes
  descendent sous l'écran. D'où un `position: fixed` en `z-index: 1010` — au-dessus de la barre
  d'application (1004), pour que le voile de la feuille la couvre et neutralise ses boutons, et
  sous les overlays Vuetify (2400) pour que les dialogs de tâche restent devant la feuille. Le
  tiroir de navigation, lui, est remonté à 1012 (voile 1011) dans `global.scss` afin de repasser
  devant la feuille : il n'y avait aucune place libre entre 1004 et le voile du tiroir (1005), donc
  descendre la feuille sous le tiroir l'aurait aussi fait passer sous la barre d'application. Hors mobile, les trois niveaux d'emballage passent en `display: contents` : sans ça la
  liste cesserait d'être l'enfant flex direct de `.daily-update-task` et perdrait sa largeur de
  33 %. L'étape inactive du stepper passe en `display: none` **sans démonter** le composant : un
  `IntersectionObserver` replie la feuille dans ce cas, faute de quoi `hideScroll()` laisserait le
  scroll de fond verrouillé sur l'étape Event. Plusieurs réglages ne se devinent pas à la lecture :
  - `--sheet-content-gap` est l'écart **visible** sous le dernier projet, mais la réserve laissée
    dans le flux en soustrait le `gap` de `.daily-update-task` (8px) et le padding bas du
    conteneur (12px), déjà présents entre le contenu et le bas de l'écran. Changer l'un des deux
    décale l'écart, et il vaut 16px en `sm` où le conteneur passe à `pa-sm-5`.
  - Au cran `Half`, le défileur porte une `margin-bottom` de `--sheet-detent-full` moins
    `--sheet-detent-half` : le panneau gardant la hauteur du cran haut, sa partie basse est hors
    écran, et sans cette marge la fin de la liste serait défilable mais invisible sous le bord de
    l'écran.
  - Repliée, la feuille passe en `overflow: hidden` : sans ça son contenu invisible resterait
    défilable sous la bande de 56px.
  - L'en-tête de `DailyUpdateTaskList` est en `position: sticky` sur le fond
    `surface-container-high` de la feuille et troque sa marge basse contre un padding : une marge
    laisserait le contenu défiler dans l'interstice sous l'en-tête.
  - Les cartes de la liste passent en `surface-container-highest` **sous `sm-and-down` seulement** :
    le fond `surface-container-high` de la feuille avalerait une carte en `surface`. Hors feuille
    elles reprennent la teinte par défaut, sur le fond du conteneur.
  - La zone de préhension est déclarée par la classe **`task-sheet__drag-zone`**, portée par la
    poignée et par l'en-tête de `DailyUpdateTaskList`. C'est le seul contrat entre les deux
    composants : la feuille écoute clic et toucher sur son panneau et ne réagit que si la cible
    est dans une zone ainsi marquée, ce qui lui évite d'exposer sa mécanique au parent. Le clic y
    ouvre à `Half` quand la feuille est repliée et la replie sinon, sauf sur un contrôle interne —
    le filtre laisse passer la poignée, qui est elle-même un `<button>`.
  - Le glissé **suit le doigt** : le JS écrit `--sheet-drag` en pixels sur le panneau et les trois
    transformations de cran la composent, si bien que les positions restent en CSS. La traînée est
    bornée par la position lue dans la matrice de transformation courante, donc on ne dépasse ni
    `Full` ni le replié — mais le drapeau qui distingue le tap du glissé se mesure sur le **doigt**
    et non sur cette traînée bornée : sinon un glissé en butée, où le panneau ne bouge pas, passe
    pour un tap et la feuille change de cran à l'envers. Au relâchement, deux régimes : un
    **lancer** — plus de `FLICK_VELOCITY` (0,5px/ms) sur plus de `FLICK_MIN_DISTANCE` (16px) —
    replie vers le bas et avance d'un cran vers le haut quelle que soit la distance, un lancer vers
    le haut au-delà de `FAST_FLICK_VELOCITY` (1,5px/ms) ouvrant directement en `Full` ; sinon c'est
    la distance qui décide, plus de 48px vers le bas repliant la feuille **depuis n'importe quel
    cran**, plus de 48px vers le haut la posant sur le cran le plus proche du doigt, et en dessous
    elle revient à son cran.
  - Hors zone de préhension, le glissé est repris **sur tout le panneau, mais en fermeture
    seulement** : la traînée est bornée à 0 vers le haut, si bien qu'un geste vers le bas replie la
    feuille et qu'un geste vers le haut rend la main à la liste. Deux conditions à cette reprise :
    feuille déployée et **défileur déjà en butée haute**, la convention des feuilles natives —
    sans la seconde, tout défilement vers le bas refermerait la feuille. Le panneau ne suit le
    doigt qu'au-delà de `TAP_SLOP`, sinon il tremblerait sous un simple appui sur une carte, et le
    défileur porte un `overscroll-behavior: contain` pour que le geste ne se prolonge pas en
    défilement de l'ancêtre.
  - La vitesse est échantillonnée sur des fenêtres d'au moins `VELOCITY_SAMPLE_MS` pendant le
    geste — la fenêtre est portée par l'appel dans `drag()`, pas par `sampleVelocity()` — mais
    **sans condition au lever du doigt**. Ce dernier relevé sert deux fois : il évite un lancer
    fantôme, doigt immobilisé avant de lever la mesure retombant à zéro au lieu de conserver la
    dernière vitesse atteinte, et il rattrape les gestes plus courts que la fenêtre, qui sinon
    sortiraient à vitesse nulle faute d'un seul relevé. `FLICK_MIN_DISTANCE` couvre l'inverse —
    sans lui, un tremblement de 3px en 5ms vaut 0,6px/ms et un simple tap partirait en lancer.
  - Au relâchement, `settle()` **compense** la traînée par l'écart entre l'ancien cran et le
    nouveau, et n'efface le tout qu'à l'image suivante. Sans ça le panneau reviendrait d'un coup
    au cran de départ — la feuille remonte — avant d'animer vers sa cible. La compensation fait
    aussi que l'annulation sous le seuil revient en douceur au lieu de sauter.
  - Un tap passe par `dragStart` comme un glissé, donc la transition est suspendue quand le `click`
    arrive — il tombe dans la même image, avant celle que `settle()` attend. Un
    `watch(detent)` en **`pre`** libère donc la suspension (`releaseDrag()`) sur toute bascule
    venue d'ailleurs que du glissé : tap sur la zone de préhension, clic sur un chip de tâche,
    repli demandé par le parent. En `pre`, la libération et le changement de classe s'affichent
    dans la même passe et la bascule anime ; en `post` la classe serait déjà peinte sans
    transition. `settle()` s'en exclut par un drapeau, qu'il n'arme que si le cran change
    réellement — sinon un tap dans le contenu, qui « atterrit » sur le cran courant, bloquerait la
    libération que réclame le clic suivant. Corollaire : la tolérance `TAP_SLOP` (8px) doit rester
    alignée sur celle des navigateurs, sous peine qu'un tap un peu tremblé soit classé en glissé,
    avale son propre clic et ne produise rien.
  - Le `watch(detent)` est en **`flush: 'post'`**, et ce n'est pas cosmétique. En `pre`, il
    s'exécute avant le ré-affichage, et son `scrollTop = 0` force un recalcul de layout : le
    navigateur fige alors un état où la classe de cran est encore l'ancienne alors que la traînée
    porte déjà la compensation, ce qui projette le panneau à l'écart des deux crans — hors de
    l'écran par le haut depuis `Full` — avant qu'il ne redescende.
  - Le glissé vers la droite de `v-main`, qui ouvre le menu (`v-touch` dans
    `AuthenticatedLayout.vue`), **reste actif feuille ouverte** : le panneau demeure son descendant
    DOM malgré son `position: fixed`, et le tiroir se pose par-dessus la feuille grâce aux
    `z-index` de `global.scss`. Deux effets à connaître : les deux voiles se cumulent le temps que
    le menu est ouvert, et un glissé franchement horizontal sur l'en-tête engage aussi le glissé
    vertical de la feuille — sa composante verticale étant faible, elle revient à son cran.
  - Le cran et le formulaire de création sont **couplés dans les deux sens** : ouvrir le formulaire
    déroule la feuille — à `Full` au-delà de `SHEET_FULL_TASK_COUNT` (5) tâches, où `Half` ferait
    naître le formulaire trop loin sous le bord du défileur, à `Half` sinon — la refermer efface le
    formulaire, et le « + » fait défiler jusqu'à la carte du formulaire (`scrollIntoView`, aligné
    sur le bord bas), qui naît en fin de liste, donc hors du défileur. Un clic sur le chip de projet, de section ou de
    collection d'une tâche replie aussi la feuille : la sélection se joue dans les onglets, qu'elle
    masque. Ces trois répercussions sont gardées par `smAndDown` — hors mobile la feuille n'existe
    pas, et franchir le seuil vers le bureau refermerait sinon le formulaire au passage.
  - Les `v-stepper-window-item` de `DailyUpdate.vue` sont en
    `transition="v-window-crossfade-transition"`, et c'est la feuille qui l'impose : la transition
    par défaut de `VWindow` applique un `transform` sur l'étape, or **un ancêtre transformé devient
    le bloc conteneur d'un `position: fixed`** — le temps de l'animation, le panneau se recalait
    dans la boîte de l'étape. Le fondu croisé livré par Vuetify n'anime qu'une `opacity` et pose
    l'étape sortante en `position: absolute`, deux propriétés qui ne créent **pas** un tel bloc
    conteneur. Deux pièges autour : couper la transition (`:transition="false"`) fait échanger les
    étapes dans la même passe et **le basculement se voit** ; et la prop `crossfade` de `VWindow`,
    qui pose la même transition, ajoute un `mix-blend-mode` permanent sur les étapes dont le
    contexte d'empilement confinerait le `z-index: 1010` de la feuille sous la barre
    d'application. Les `v-tabs-window-item` de `DailyUpdateTask.vue` portent la même transition,
    par cohérence : elles n'ont pas la contrainte du bloc conteneur, la feuille étant leur sœur et
    non leur descendante.
  - `detentOffsets()` convertit les crans en pixels par le **rapport** `--sheet-detent-half` /
    `--sheet-detent-full` appliqué à la hauteur mesurée du panneau. Les deux variables doivent
    donc rester exprimées dans la **même unité** : en passer une en `px` et laisser l'autre en
    `svh` fausserait le calcul en silence. C'est ce qui évite de résoudre `svh` en JS, où
    `innerHeight` n'est pas `svh` quand la barre d'URL est visible.
  - La bande de la poignée est **opaque et en `z-index: 1`**. Les bords de la feuille tombent sur
    des demi-pixels (`90svh` = 730,8px sur 812) : le clip du défileur et la peinture de l'en-tête
    collant sont arrondis séparément, et une ligne d'un pixel de la liste fuyait entre les deux.
    Les cartes étant en `position: relative; z-index: 0`, un fond opaque sans `z-index` ne
    suffirait pas — elles sont après la poignée dans l'arbre.
- **Dans `daily-update` (onglet Task, `sm-and-down`)**, c'est le conteneur des projets /
  collections / tâches communes qui défile, pas la page : `__tabs-items` et son `__content` sont
  en `flex: 1 1 0` avec `min-height: 0`, chaîne prolongée jusqu'au `.v-window__container` de
  Vuetify. Sans elle, une carte ouverte — en `position: absolute; height: 100%` — résout son
  `100 %` sur la hauteur du contenu replié et non sur la place disponible. Le layout ne bouge donc
  plus à la sélection : les bornes du conteneur et celles de la carte ouverte sont les mêmes.
  Corollaire du même piège : un `min-height: 100%` sur un élément de grille se résout **à zéro**
  (piste de hauteur indéfinie), ce qui écrasait les cartes « Create a task » à 2px ; elles portent
  désormais le `min-height: 62px` d'une `TaskCard` `small`.

## Notifier l'utilisateur

Un **unique `<v-snackbar-queue>`** est monté dans `AuthenticatedLayout.vue`, alimenté par le store
`notification`. Ne jamais poser de `v-snackbar` dans un composant : notifier tient en une ligne,
depuis n'importe où.

```ts
const notificationStore = useNotificationStore()
notificationStore.notifySuccess("Task added to today's daily")
notificationStore.notifyError("Could not add the task to today's daily")
```

La position est décidée à ce seul endroit : `top right`, et `top` (haut-centré) sous `xs`. Chaque
notification porte une croix de fermeture (`closable`) en plus de sa fermeture automatique au
bout de 5 s. La file est à double sens — le composant réémet le tableau privé de l'élément
qu'il vient d'afficher.

⚠️ **Rien ne s'affiche depuis les écrans non authentifiés** : `NonAuthenticatedLayout` a son propre
`v-app` et ne monte pas la file. Voir
[../adr/0005-notifications-via-snackbar-queue.md](../adr/0005-notifications-via-snackbar-queue.md).

## Décisions négatives

- **Pas de bascule de thème, pas de mode clair** — le thème `light` déclaré est du code mort
  (aucune UI ne permet d'y accéder).
- **Pas d'i18n** (0 `vue-i18n` / `useI18n`). Les libellés sont en anglais en dur dans les
  templates, alors que `index.html` déclare `lang="fr"`. La locale Vuetify est figée à `en`.
- **Pas de gestion d'erreurs globale** : le canal d'affichage existe (ci-dessus), mais
  l'intercepteur axios ne notifie pas et les `console.error` des stores restent muets pour
  l'utilisateur. Notifier est un choix par appel.
- **Pas de design system formalisé** (pas de Storybook, pas de tokens exportés) : la référence
  est le code des composants partagés.
- **Pas de feature flags** (0 occurrence). Les fonctionnalités non finies sont des éléments
  `disabled` en dur : entrée « Dashboard » du drawer, onglet « Historic » de `ProjectDetail`,
  onglets « Weekly task » / « Monthly task » du wizard daily.

## Voir aussi

- [../patterns/styling.md](../patterns/styling.md) · [../patterns/dialogs.md](../patterns/dialogs.md) · [../patterns/responsive.md](../patterns/responsive.md)
- [routing.md](routing.md) — les layouts et le chrome
