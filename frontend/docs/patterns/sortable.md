# Listes réordonnables

**Problème** — laisser réordonner une liste de cartes à la souris, au doigt et au clavier, en
passant par la couche de déplacement existante.

## Recette

1. Envelopper la liste dans `SortableList` (`src/components/sortable/`). Exemple réel,
   `ProjectSectionItem.vue` :

   ```vue
   <SortableList
     :items="uncompletedTasks"
     :disabled
     :item-label="task => task.name"
     class="d-flex flex-column gap-2 mb-2"
     @move="moveTask">
     <template #item="{ item: task, index, setHandle, moveToTop }">
       <TaskCard :task :set-handle :at-top="index === 0" @move-to-top="moveToTop?.()" />
     </template>
   </SortableList>
   ```

2. **La mise en page reste chez le parent** : la grille ou la colonne passe en `class` sur
   `SortableList`.
3. La carte affiche `SortableHandle` quand elle reçoit `setHandle`, et « Move to top » quand elle
   n'est pas `atTop`. Sans `setHandle`, elle se rend comme avant. La poignée est en
   `position: absolute`, enfant direct de la `v-card`. Sur un appareil à survol, la carte réserve
   `padding-left: var(--sortable-gutter-width)` dans `@media (hover: hover)`, sinon la bande
   recouvre la case à cocher. `SortableItem` pose la largeur et l'opacité
   (`--sortable-gutter-width`, `--sortable-handle-opacity`).
4. `@move="(id, anchors)"` va vers `store.moveTask` ou `useDailyTaskMove` : déplacement optimiste,
   file, rechargement sur 403/404/409. `SortableList` n'appelle jamais l'API.
5. `disabled` rend une liste simple (archivé, jour passé) ; une liste d'un élément aussi.
   `lockedId` : la carte en édition ne se soulève pas mais reste une cible.

## Règles

Chacune corrige un défaut constaté sur le prototype. Aucune n'est outillée.

- **Une seule `.v-card` par élément.** Les styles de la carte soulevée la ciblent, parce que la
  bibliothèque impose `transform`, `translate` et `scale` sur l'élément qu'elle déplace.
- **Aucune règle `:active` sur la carte** : elle remplace la `transition` pendant tout un glisser
  à la souris, et l'inclinaison saute.
- **Aucune bordure ni `display: none` sur l'emplacement.** La bibliothèque aligne la taille et la
  position de la carte glissée sur lui. Le repli le sort du flux en `position: absolute`, avec sa
  taille figée par des variables posées sur la liste : sur l'emplacement, elles seraient
  écrasées par la copie continue du style de la carte.
- **Les classes `pressing`, `collapsed`, `moving-to-top` et `dropped-under-pointer` sont posées
  hors de Vue** (`classList`) :
  un rendu à la prise coûte une image, et le FLIP du repli et de « Move to top » doit mesurer le
  DOM juste avant et juste après le changement. Les écouteurs de `pressing` sont en capture, parce que la bibliothèque
  arrête la propagation des événements pointeur.
- **Une transition CSS sur la carte glissée ne survit pas à un déplacement dans le DOM**, que la
  bibliothèque fait quand l'emplacement change de place et à la fin du dépôt. Un changement
  visuel en cours de glisser passe par `animate()` (`captureDraggedCard`), ou se joue pendant
  `[data-dnd-dropping]`.
- **La position du pointeur se lit dans `event.to`** de `@drag-move` ; `operation.position` a un
  mouvement de retard. Les limites de la liste se mesurent à la prise et au défilement.
- **Les contrôles d'une carte ne déclenchent jamais l'appui long** : `CONTROL_SELECTOR`
  (`dnd-kit.ts`) exclut les `.v-btn`, `.v-chip`, liens et champs. Un contrôle cliquable d'un autre
  type doit y être ajouté.
- **Les internes de la bibliothèque ne se lisent que dans `dnd-kit.ts`**, dont
  `dnd-kit.spec.ts` interroge un vrai gestionnaire. Voir
  [W15](../quality/watched-risks.md#w15--dnd-kit-en-0x-internes-utilisés).

## Variantes légitimes

- La vue « Completed » n'utilise pas `SortableList` : on ne réordonne que ce qui reste à faire.
- Dans le wizard, seules les tâches du jour sont dans `SortableList` ; l'aperçu du report et la
  carte de création restent à côté, dans le même défileur.

## Écarts assumés / non migrés

- La timeline du résumé daily (`DailyDetailTaskTimeline`) ne se réordonne pas : la carte entière
  y coche la tâche.
- Pas de déplacement d'une liste à l'autre : chaque `SortableList` a son propre fournisseur.
- Sans glisser ni clavier, seul « Move to top » est disponible : laborieux sur une longue liste.

## Voir aussi

- [../adr/0008-sortable-lists-with-dnd-kit.md](../adr/0008-sortable-lists-with-dnd-kit.md)
- [../workflows/verification.md](../workflows/verification.md#listes-réordonnables)
- [../domain/glossary.md](../domain/glossary.md#réordonner)
