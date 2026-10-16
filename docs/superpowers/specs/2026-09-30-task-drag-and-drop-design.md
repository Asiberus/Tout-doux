# Drag and drop des tâches — conception

- **Date** : 2026-09-30
- **Statut** : validé, amendé par le plan d'implémentation
- **Prérequis** : [tri manuel des tâches](2026-09-29-task-ordering-design.md), qui livre l'API
  `move`, `anchorsAt`, `applyMove` et la file de déplacements

## Objectif

Réordonner à la main les tâches d'une liste et les daily tasks d'un jour. Le geste doit être
compris sans explication, ne jamais se confondre avec les autres actions d'une carte, rester
utilisable au clavier et sur mobile, et **les animations doivent être fluides**.

## Périmètre

**Inclus**

- Quatre listes : tâches générales d'un projet (grille), tâches d'une section, tâches d'une
  collection, « Tasks of the day » du wizard (tous les jours qu'il affiche, d'aujourd'hui à
  l'horizon de planification).
- Poignée, appui long, clavier et action « Move to top ».
- Lâcher hors de la liste : la liste se referme, puis la carte revient à sa place.

**Exclus**

- La timeline du résumé daily (`DailyDetailTaskTimeline`) : la carte entière y coche la tâche.
- Le déplacement vers une autre liste ou vers un autre jour.
- Le découpage du bundle ([W7](../../../frontend/docs/quality/watched-risks.md)).
- Les tests de composants ([R13](../../../frontend/docs/quality/refactoring-backlog.md)).

## Décisions

| Sujet            | Décision                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Bibliothèque     | `@dnd-kit/vue`, `@dnd-kit/dom`, `@dnd-kit/abstract` en **0.5.0 exacte** (MIT, ~37 ko gzip)                                |
| Déclencheurs     | Poignée (immédiat) ; appui long de 250 ms sur la carte au doigt et au stylet, 150 ms à la souris ; clavier sur la poignée |
| Menu ⋮           | Une seule entrée ajoutée : « Move to top »                                                                                |
| Hors de la liste | La liste se referme sans la carte ; au lâcher, la carte revient et les voisines s'écartent                                |
| Axe              | Libre partout : la carte suit le pointeur dans les deux axes et peut sortir de la liste par le côté                       |
| Écrans daily     | Le wizard seul                                                                                                            |

Écartés :

- `vue-draggable-plus` (SortableJS) : aucun support du clavier.
- Pragmatic DnD : il s'appuie sur le glisser natif du navigateur, qui ne permet ni inclinaison ni
  style sur la carte glissée.
- Une implémentation maison : collisions en grille, défilement automatique et accessibilité à
  réécrire.

## 1. Interaction

### Poignée

- Icône `mdi-drag-vertical` dans une bande sur toute la hauteur du bord gauche de la carte :
  toute la bande se prend. Curseur `grab`, puis `grabbing` pendant le glisser.
- Avec une souris : bande de 20 px, que la carte réserve (son contenu est décalé de 20 px, 22 px
  dans la carte du jour). Invisible au repos, 60 % au survol ou au focus de la carte, 100 % avec
  un fond léger au survol de la bande.
- Au toucher : pas de gouttière, la carte garde ses marges. La poignée n'est qu'un repère de 8 px
  à 2 px du bord, icône de 16 px à 38 % ; les touchers la traversent vers l'appui long.
- Pendant la prise : 70 % partout. Au dépôt, elle revient à sa valeur de repos, ou reste à 60 %
  si le pointeur est sur la place où la carte se pose.

**Pas de poignée** (liste simple, sans appui long ni annonce) :

- projet ou collection archivé ;
- jour passé, y compris quand minuit passe pendant que le wizard est ouvert ;
- vue « Completed » ;
- liste d'une seule tâche.

La carte du jour en mode édition n'a pas de poignée non plus, mais elle reste une cible de dépôt.

### Déclencheurs

| Entrée        | Démarrage                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Souris        | Poignée : immédiat. Corps de la carte : appui de 150 ms ; bouger avant sélectionne le texte                                      |
| Doigt, stylet | Poignée : immédiat. Corps de la carte : appui de 250 ms, annulé si le doigt bouge de plus de 5 px, ce qui laisse défiler la page |
| Clavier       | Poignée : Espace ou Entrée pour prendre, flèches, Espace / Entrée / Tab pour poser, Échap pour annuler                           |
| Menu ⋮        | « Move to top », masqué si la carte est déjà en tête                                                                             |

Les contrôles de la carte (case à cocher, menu, chips, liens) ne déclenchent jamais la prise.

### Rendu

| Élément                          | Valeur                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Retour d'appui                   | 98,5 % dès 90 ms, en 250 ms                                                                                                      |
| Carte soulevée                   | inclinaison **−3°**, **105 %**, ombre forte ; transition de 150 ms `ease-out`                                                    |
| Emplacement                      | vide, de la taille exacte de la carte, sans pointillés                                                                           |
| Voisines                         | 350 ms `cubic-bezier(0.25, 1, 0.5, 1)`                                                                                           |
| Dépôt                            | 350 ms, même courbe ; la carte revient à plat et retrouve son ombre pendant le trajet                                            |
| Move to top                      | toutes les cartes glissent vers leur place en 350 ms ; la carte déplacée passe au-dessus, 105 % et ombre forte, sans inclinaison |
| Hors de la liste                 | à plat, **80 %**, opacité **80 %**, en 150 ms                                                                                    |
| Marge avant « hors de la liste » | **50 px** autour de la liste                                                                                                     |
| `prefers-reduced-motion`         | pas d'inclinaison ni d'agrandissement, durées à 0                                                                                |

### Hors de la liste

1. **À la sortie**, l'emplacement revient à la place d'origine et se replie : les voisines
   comblent le vide en 350 ms. La liste montre l'état qui suivra le lâcher.
2. **Au retour dans la liste**, l'emplacement se rouvre sous le pointeur et le tri reprend.
3. **Au lâcher dehors**, l'emplacement se rouvre à la place d'origine : les voisines s'écartent
   pendant que la carte y revient. Aucune requête n'est envoyée.

### Mobile

- Sélection de texte et menu contextuel iOS désactivés sur les cartes déplaçables des écrans
  tactiles ; à la souris, le nom d'une tâche reste sélectionnable.
- Vibration de 10 ms à la prise (Android ; Safari iOS ne l'expose pas).
- La navbar ne s'ouvre pas par glissement latéral pendant un glisser.
- La feuille du wizard abandonne son glissé dès qu'une carte est soulevée, et revient à son cran :
  tirer une carte vers le bas ne referme pas la feuille.

### Annonces (lecteur d'écran)

| Moment       | Texte                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| Instructions | « Press space to pick up. Use the arrow keys to move. Press space to drop, or escape to cancel. » |
| Prise        | « Picked up _Name_. Position 3 of 8. »                                                            |
| Déplacement  | « Position 4 of 8. » (seulement si la position change)                                            |
| Sortie       | « Outside the list. Release to put _Name_ back at position 3 of 8. »                              |
| Dépôt        | « Dropped _Name_ at position 4 of 8. »                                                            |
| Annulation   | « Cancelled. _Name_ is back at position 3 of 8. »                                                 |
| Move to top  | « Moved _Name_ to top. »                                                                          |

La région d'annonce de la bibliothèque ne couvre que ses propres événements. `SortableList`
ajoute la sienne, masquée, pour « Outside the list » et « Move to top ».

**Limite connue** : sans glisser ni clavier, seul « Move to top » est disponible. N'importe quel
ordre reste atteignable, mais c'est laborieux sur une longue liste.

## 2. Architecture

### Nouveaux fichiers

| Fichier                                      | Rôle                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/sortable/SortableList.vue`   | Fournisseur, détection hors liste, repli animé, annonces, région `aria-live`                                                                                             |
| `src/components/sortable/SortableItem.vue`   | `useSortable`, retour d'appui, styles de la carte soulevée, largeur de la gouttière et opacité de la poignée selon l'état                                                |
| `src/components/sortable/SortableHandle.vue` | Bande de la poignée, en `position: absolute` dans la gouttière ; transmet l'élément DOM du `v-btn` (`$el`)                                                               |
| `src/components/sortable/dnd-kit.ts`         | **Seul fichier qui touche aux internes** de la bibliothèque : capteurs, plugins (annonces, durée du dépôt), `sortablePosition`, `revertToInitialIndex`, `dragInProgress` |
| `src/utils/sortable.utils.ts`                | Fonctions pures : `isOutside(bounds, point, margin)`, textes des annonces                                                                                                |

### `SortableList.vue`

- **Props** :
  - `items` ;
  - `disabled`, qui rend une liste simple sans aucun élément de tri ;
  - `lockedId`, pour la carte en édition ;
  - `itemLabel`, pour les annonces.
- **Slot** : `#item="{ item, index, setHandle, moveToTop }"`. `setHandle` et `moveToTop` sont
  absents quand la liste n'est pas triable : la carte se rend alors comme avant.
- **Émet** : `move(id, anchors)`, avec `anchors = anchorsAt(items, id, index)`, et rien si `null`.
- **La mise en page reste chez le parent** : la classe de la grille passe sur la racine.

### Branchements

| Fichier                    | Changement                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TaskCard.vue`             | Props `setHandle` (affiche la poignée ; réserve la gouttière sur un appareil à survol) et `atTop` ; « Move to top » dans le menu, émet `move-to-top` |
| `DailyTaskFormCard.vue`    | Idem                                                                                                                                                 |
| `ProjectDescription.vue`   | `disabled` si archivé → `projectStore.moveTask`                                                                                                      |
| `ProjectSectionItem.vue`   | → `projectStore.moveTask(id, anchors, section.id)`                                                                                                   |
| `CollectionGeneral.vue`    | → `collectionStore.moveTask`                                                                                                                         |
| `DailyUpdateTaskList.vue`  | Tâches du jour seules (aperçu du report et carte de création en dehors) ; `lockedId` ; `disabled` si jour passé ; émet `move`                        |
| `DailyUpdateTask.vue`      | `useDailyTaskMove(dailyTaskList, retrieveDailyTaskList)`                                                                                             |
| `DailyTaskBottomSheet.vue` | Abandonne son glissé quand `dragInProgress` passe à `true`                                                                                           |
| `AuthenticatedLayout.vue`  | `showNavbar` / `hideNavbar` inactifs quand `dragInProgress`                                                                                          |

### Flux

```
geste ─► SortableList ─ emit move(id, anchors) ─► parent
      ─► store.moveTask / useDailyTaskMove ─► applyMove optimiste + file
      ─► 403 / 404 / 409 : rechargement et notification
« Move to top » ─► anchorsAt(items, id, 0) ─► même chemin
```

La couche de déplacement existante ne change pas.

## 3. Règles d'implémentation issues du prototype

Chacune correspond à un défaut constaté puis mesuré sur le prototype.

1. **L'emplacement ne change jamais de taille.**
   - `Feedback` aligne la taille _et la position_ de la carte glissée sur celles de l'emplacement,
     via un `ResizeObserver`.
   - Une bordure faisait grandir la liste de 4 px.
   - Un `display: none` réduisait la carte à 0 × 0 et la faisait partir vers la droite au lâcher.
   - Le repli sort donc l'emplacement du flux (`position: absolute`), avec sa taille figée par des
     variables CSS posées **sur la liste**. Posées sur l'emplacement, elles seraient effacées : la
     bibliothèque y recopie en continu le style de la carte.
2. **Les styles de la carte soulevée portent sur le `.v-card` intérieur.** La bibliothèque impose
   `transform`, `translate` et `scale` sur l'élément qu'elle déplace.
3. **L'état « appuyé » cède dès `[data-dnd-dragging]`.**
   - La classe est posée directement sur l'élément, sans passer par Vue : un rendu au moment de la
     prise coûtait une image.
   - Ses écouteurs sont en phase de capture, parce que la bibliothèque arrête la propagation des
     événements pointeur.
4. **Aucune règle `:active` sur la carte.** Elle remplaçait la `transition` pendant tout un glisser
   à la souris, et l'inclinaison sautait.
5. **La position du pointeur se lit dans `event.to`** de `@drag-move`. `operation.position` a un
   mouvement de retard.
6. **Les limites de la liste sont mesurées à la prise et au défilement**, pas à chaque mouvement.
   Leur hauteur est figée pendant le repli, sinon la limite basse remonterait d'une carte.
7. **Hors de la liste, `dragover` est bloqué** (`preventDefault`), et l'emplacement est ramené à sa
   place d'origine par `setDropTarget`. Le lâcher dehors tombe ainsi au même index : il n'envoie
   rien, sans appel à `actions.stop`.
8. **Le repli et « Move to top » sont animés en FLIP** (Web Animations sur `translate`), avec la
   durée et la courbe des voisines. Pour « Move to top », la mesure précède l'`emit` et l'animation
   suit le `nextTick` : le store réordonne la liste sans attendre le serveur.
9. **Si la liste change pendant un glisser** (rechargement après un échec, par exemple), le glisser
   est annulé avant d'appliquer le changement. Sinon, Vue et le DOM réordonné par la bibliothèque
   se désynchroniseraient.
10. **La bibliothèque déplace la carte glissée dans le DOM**, quand l'emplacement change de place
    et à la fin du dépôt (`replaceWith`). Le navigateur annule alors les transitions CSS de la
    carte. D'où trois parades :
    - la sortie de la liste est jouée par `animate()`, qui survit au déplacement ;
    - l'ombre revient pendant le dépôt (`box-shadow: revert-layer`), pas après ;
    - `:hover` n'étant réévalué qu'au mouvement suivant, la classe `dropped-under-pointer` garde la
      poignée visible quand le pointeur est sur la place d'arrivée.

## 4. Tests

- **`sortable.utils.spec.ts`** :
  - `isOutside` : limites, marge, hauteur figée pendant le repli ;
  - les textes des annonces.
- **`dnd-kit.spec.ts`** :
  - règles d'activation : poignée immédiate, contrôles exclus, 250 ms au doigt et au stylet, 150 ms à la souris,
    sur le corps ;
  - `revertToInitialIndex` et `sortablePosition` sur le registre **réel** d'un
    `DragDropManager` : une mise à jour de version doit casser un test, pas l'interface. jsdom
    n'ayant pas de `ResizeObserver`, que `@dnd-kit/dom` instancie dès son import,
    `src/test/setup.ts` en pose un bouchon.
- **Aucun test de composant** : jsdom n'a pas de mise en page.
- **Essais manuels** :
  - dans le navigateur intégré, pour les quatre écrans : souris, appui long, clavier, hors liste,
    409 ;
  - **sur un vrai téléphone iOS et Android** : défilement contre appui long, menu contextuel,
    vibration, fluidité.
- **Contrôles** : `yarn test`, `lint`, `format`, et `type-check` sans nouvelle erreur.

## 5. Documentation à mettre à jour dans le même changement

- `frontend/docs/patterns/sortable.md` (nouveau) : utilisation de `SortableList` et règles du § 3.
- `frontend/docs/domain/glossary.md` : poignée, hors de la liste.
- `frontend/docs/workflows/verification.md` : procédure d'essai manuel, dont le téléphone.
- `frontend/docs/quality/watched-risks.md` : dépendance 0.x et internes utilisés.
- `frontend/docs/architecture/state.md` : `dragInProgress`.
- `frontend/docs/adr/0008-sortable-lists-with-dnd-kit.md` (nouveau) : choix de la bibliothèque.
- `frontend/docs/architecture/ui-layer.md` : les trois composants de `src/components/sortable/`.

## 6. Risques

| Risque                                                                                          | Parade                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@dnd-kit` en 0.x, internes utilisés (`registry.droppables`, `sortable.index`, `setDropTarget`) | Version exacte, internes isolés dans `dnd-kit.ts`, test de contrat |
| +37 ko gzip dans le bundle principal (routes non découpées, W7)                                 | Accepté ; W7 reste le déclencheur                                  |
| Première prise après chargement : une image de 34 ms                                            | Accepté ; les suivantes sont à 16–17 ms                            |
| Comportement tactile réel non mesuré                                                            | Essai sur appareil obligatoire avant de considérer le lot terminé  |

## 7. Prototype

Prototype jetable (Vue et `@dnd-kit/vue`, faux serveur), validé dans le navigateur intégré.
Mesures sur un écran à 120 Hz :

- p95 à 9 ms pendant un glisser avec défilement automatique ;
- à la prise, par appui long comme par la poignée, l'inclinaison démarre en 24–26 ms et atteint
  −3° en 150 ms.

Ses sources ne sont pas conservées (voir la conversation de conception).

## 8. Suites prévues

- **Déplacement vers une autre liste** : un fournisseur commun à la page, et la logique « hors de
  la liste » à revoir.
- **Timeline du résumé** : à rouvrir si le besoin de réordonner depuis le résumé apparaît.
