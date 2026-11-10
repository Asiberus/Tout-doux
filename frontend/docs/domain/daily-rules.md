# Règles de la planification journalière

Le « daily » est le cœur de l'application. **La plupart de ses invariants ne sont garantis ni par
les types ni par le backend** — ils tiennent aux composants. Les contourner produit des données
incohérentes sans aucune erreur.

Deux écrans : le **wizard** (`daily-update`, préparer la journée) et le **résumé**
(`daily-summary`, exécuter et consulter). Voir
[../architecture/routing.md](../architecture/routing.md) pour les routes.

## Les trois origines d'un DailyTask

Un `DailyTask` provient de l'une de ces trois sources, **exclusivement** :

| Origine                             | Corps envoyé                     | Déclenché depuis                                                                                                              |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Une **Task** (projet ou collection) | `{ taskId, date }`               | `DailyUpdateProjectListItem.vue:85`, `DailyUpdateCollectionListItem.vue:47`, `TaskCard.vue` (context menu)                    |
| Un **CommonTask**                   | `{ commonTaskId, date }`         | `DailyUpdateCommonTask.vue:19`                                                                                                |
| **Libre** (ad hoc)                  | `{ name, tagIds, action, date }` | `DailyTaskForm.vue` via `DailyUpdateTaskList.vue` (wizard) ou `DailyDetailTaskTimeline.vue` (résumé, jour courant et à venir) |

⚠️ **L'origine n'est toujours pas validée.** Les quatre champs d'origine de `DailyTaskPost`
restent **optionnels** : `{ date }` seul passe le typage, et un DailyTask sans origine rendrait
un titre vide. L'invariant tient aux composants émetteurs, et est reconnu par deux `as string`
dans le code. Seule `date` est **requise** — les composants émettent un `DailyTaskDraft` (le
même type sans le jour), et l'écran qui appelle l'API y ajoute la date qu'il affiche.

**Résolution du nom affiché** — `task.name` → sinon `commonTask.name` → sinon `name`.
Logique dupliquée à l'identique dans `DailyTaskCard.vue:19` et `DailyTaskFormCard.vue:24`.

## Cycle de vie

| Champ            | Modifiable                                    | Où                                                                    |
| ---------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `action`         | ✅                                            | wizard, chip éditable → `PATCH` immédiat                              |
| `completed`      | ✅ sauf sur un jour à venir                   | **résumé uniquement** (dialog de détail)                              |
| `name`, `tagIds` | ✅ mais **seulement pour un DailyTask libre** | wizard, menu « Edit »                                                 |
| `date`           | ❌                                            | absent de `DailyTaskPatch` — un DailyTask ne peut pas changer de jour |

**Une Task planifiée sur plusieurs jours** — cocher sa ligne d'un jour, sans action ou en
`FI`, termine la Task mais ne touche pas aux lignes des autres jours : elles restent
planifiées et non cochées. Le jour venu, cocher l'une d'elles termine à nouveau la Task et
**écrase `completed_at`** : la date de fin retenue est celle de la dernière ligne cochée.
Dé-cocher n'importe laquelle de ces lignes rouvre la Task. Terminer la Task depuis son
projet ne coche aucune ligne.

⚠️ **En étude** — ce comportement laisse les jours suivants afficher une ligne non cochée
pour une tâche déjà terminée. Pistes envisagées, aucune retenue :

- **Retirer la tâche des jours à venir** quand elle est terminée. Simple, mais la
  planification est perdue sans prévenir, et dé-cocher ne la rétablit pas.
- **Cocher les lignes des jours à venir.** Fabrique un faux historique sur des jours pas
  encore vécus, et contredit le refus de cocher un jour à venir.
- **Garder les lignes avec un état « déjà terminée »**, dérivé de `task.completed`. Rien
  n'est perdu, mais il faut toucher la carte, la timeline, les compteurs du résumé et le
  wizard.
- **Masquer les lignes dont la Task a été terminée avant leur jour.** Réversible et limité
  au back, mais peu lisible : une ligne disparaît sans geste de l'utilisateur.

**Règle de séparation des écrans** : on **prépare** dans le wizard, on **exécute** dans le
résumé. Il n'y a délibérément aucun moyen de cocher une tâche depuis le wizard. La seule brèche
dans l'autre sens est la création d'un DailyTask libre depuis le résumé, ouverte au jour courant
et aux jours à venir, jamais au passé (voir règle 2 ci-dessous).

### `DailyTaskAction`

Marqueur d'intention **pour la journée** — jamais porté par la Task ou le CommonTask. Codes
courts côté API, libellés et couleurs mappés dans `src/utils/daily-task.utils.ts` :

| Code | Libellé | Sens                          |
| ---- | ------- | ----------------------------- |
| `TH` | Think   | juste y réfléchir aujourd'hui |
| `WO` | Work    | y travailler                  |
| `FI` | Finish  | la terminer                   |

`null` (« No action ») est une valeur légitime, c'est ainsi qu'on efface une action.
⚠️ `daily-task.utils.ts` **lève des chaînes de caractères**, pas des `Error`, sur un code inconnu.

## Règles appliquées par l'UI seulement

Aucune de ces règles n'est vérifiable par le typage. **Les respecter en écrivant du code qui
crée ou modifie des DailyTasks.**

1. **Une seule origine par DailyTask** (voir ci-dessus).
2. **Aujourd'hui et les jours à venir peuvent être préparés, le passé se consulte en lecture
   seule.** `dailyUpdateGuard` réécrit vers le jour courant toute date illisible ou au-delà de
   `MAX_PLANNING_HORIZON_DAYS`, et laisse passer le passé. Sur un jour passé, `DailyUpdate`
   transmet `readonly` aux deux étapes : ajout, création, édition, action, suppression,
   réordonnancement et CRUD d'événements disparaissent ; seule la navigation reste (onglets,
   ouverture d'un projet ou d'une collection, chips de retour à la source, description d'un
   événement). **Ce n'est plus lui qui empêche l'écran et les données de
   diverger** : `DailyTaskPost.date` est **requise**, donc l'écran qui poste doit dire sur quel
   jour il écrit, et le compilateur le vérifie. Le guard ne fait plus qu'appliquer les bornes.
   ⚠️ Il ne rejoue **pas** sur un changement de param — voir
   [../architecture/routing.md](../architecture/routing.md). L'élément d'ajout de
   `DailyDetailTaskTimeline` suit la même règle : rendu sur le jour courant et les jours à
   venir, masqué sur un jour passé.
3. **Pas de doublon dans une journée** — une même Task ou CommonTask ne peut pas être ajoutée
   deux fois. Dans le wizard, vérifié par `isTaskSelected` / `isCommonTaskSelected`, qui rendent
   la carte inerte. ⚠️ **Le context menu de `TaskCard` n'a pas cet état** : il ne connaît pas le
   daily du jour. Il poste, et un **409** du serveur signifie « déjà présente » — traité comme
   un succès par `useAddTaskToDaily`, le résultat étant le même pour l'utilisateur.
4. **Seules les tâches non complétées sont planifiables.** Le wizard liste les projets/collections
   renvoyés par le filtre serveur `daily_task_date` : non archivés avec une tâche ouverte, plus
   ceux — archivés compris — dont une tâche est liée à une daily task du jour affiché. Une
   tâche terminée, ou d'un conteneur archivé, n'est montrée que si elle est liée au jour,
   marquée sélectionnée ; un conteneur archivé garde sa couleur des listes et n'offre pas
   « Create a task ». Les listes sont rechargées à chaque changement de jour, la précédente
   requête annulée.
5. **`section.id === 0` = « General tasks »** — sentinelle pour les tâches rattachées
   directement au projet, sans section. Une section synthétique `{ id: 0, name: 'General tasks' }`
   est fabriquée côté UI. ⚠️ Conséquence : plusieurs branchements testent la vérité d'un
   identifiant (`if (sectionId)`), donc **`0` prend systématiquement la branche « pas de
   section »** — ce qui est ici voulu, mais rend tout vrai `id === 0` impossible.
6. **Seul un DailyTask libre est éditable** — le menu « Edit » est masqué pour les autres, alors
   que `DailyTaskPatch.name` reste inconditionnellement optionnel. La suppression, elle, est
   offerte pour toutes les origines.
7. **Une journée doit contenir quelque chose pour être « démarrée »** — bouton `disabled` si les
   deux compteurs sont à zéro.
8. **Une journée passée vide n'est pas ouvrable** depuis le résumé (carte non cliquable si
   aucune tâche ni événement). ⚠️ **La règle ne vaut pas pour les jours à venir**, toujours
   cliquables : ils commencent tous vides, et les rendre inertes fermerait la seule voie par où
   on les planifie — carte → détail → crayon → wizard.

## Wizard — mécanique

Deux étapes non linéaires (`v-stepper non-linear`, les deux items `editable`) : **task** puis
**event**. Le param de route `:step(task|event)` pilote l'étape ; la regex de route rejette toute
autre valeur.

- **Ordre.** Une tâche créée depuis le wizard est placée **en fin** de la liste affichée, après la
  dernière tâche à faire, par le serveur ; si la liste a changé ailleurs, la création est refusée
  et le projet ou la collection est rechargé. Une ligne du jour, créée ou reportée, va **en fin**.
  Le déplacement d'une ligne, terminée ou non, passe par `useDailyTaskMove` : au moindre échec,
  le jour est rechargé.
- La synchronisation est **unidirectionnelle** : le stepper écrit dans la route
  (`router.replace`), mais aucun watcher ne surveille la prop `step`. **Les boutons
  précédent/suivant du navigateur ne déplacent donc pas le stepper.**
- L'étape « task » offre 4 onglets sources, ceux de l'énumération `DailyUpdateTaskTab` : Due, Project, Collection, Common task.
- **Onglet « Due »** — absent sur un jour passé. Il liste, calculées côté client
  (`collectDueEntries`) depuis les projets et collections chargés, les tâches dont l'échéance
  tombe au plus tard 5 jours après le jour affiché, groupées, dans cet ordre, Today / Late /
  Soon, chaque titre précédé de l'icône et de la couleur de la pastille correspondante et suivi
  du nombre de ses tâches en chip. Sur un autre jour qu'aujourd'hui, Today devient This day,
  avec un sous-texte qui nomme le jour planifié. Le sous-texte de Soon rappelle la fenêtre de
  5 jours : « Due in the next 5 days » aujourd'hui, « Due in the 5 days after Thursday 22
  October » sinon. Les conteneurs archivés en sont exclus ; une tâche planifiée sur le jour
  reste à sa place, en vert, terminée ou non. Chaque tâche occupe toute la ligne et porte, sur
  la ligne de son nom, sa pastille d'échéance puis le chip de son projet, de sa section ou de sa collection, comme une daily task (slot `meta` de `TaskCard`). Un clic sur la carte planifie la
  tâche ; son menu ⋮ reporte l'échéance en un geste (Today, Tomorrow, Next Friday, Next week, End of month, calculés depuis aujourd'hui, sans celui qui correspond déjà à l'échéance) ou la retire, puis confirme par une notification ; le bouton plan tasks du groupe Today (ou This day) planifie d'un coup, une à une et dans l'ordre, toutes ses tâches pas encore planifiées ; un clic sur le chip ouvre son conteneur dans l'onglet Project ou Collection, comme depuis une daily task, y compris sur une tâche déjà planifiée. L'icône de l'onglet porte un point, sans nombre, dès que l'onglet contient une tâche, planifiée ou non — il ne disparaît pas à la sélection : rouge s'il y en a une en retard, orange s'il y en a une du jour, jaune s'il n'y a que des tâches Soon. Il n'apparaît qu'une fois le jour chargé. Les cartes projet et collection repliées comptent de
  même les tâches en retard ou du jour, **planifiées ou non**.
- Dans la liste des tâches du jour (`DailyTaskFormCard`), une tâche porte dans l'ordre le chip de son conteneur, sa pastille d'échéance, puis ses tags. `DailyTaskCard` et l'onglet Due placent la pastille avant le chip.
- **Signal des échéances hors du daily update** — le store `due` lit
  `GET task/due-summary/?date=<aujourd'hui>` : les tâches ouvertes en retard ou dues aujourd'hui,
  conteneur non archivé. L'entrée Daily du menu porte le nombre de celles **pas encore
  planifiées aujourd'hui**, rouge s'il y en a une en retard, orange sinon ; le bouton ☰ de
  l'en-tête porte un point de même couleur quand le menu est fermé ; la page Daily Summary affiche un bandeau jaune (« 2 late tasks · 1 task due today, not planned yet ») avec, à droite, un bouton Plan them vers le daily update du jour. Les cartes de la liste des projets et des collections portent, comme dans
  le daily update, le nombre de leurs tâches en retard ou du jour **planifiées ou non**
  (`DueCountChip`).
- **Onglet à l'arrivée** — aucun tant que les tâches du jour, les projets et les collections ne
  sont pas chargés (`mandatory` de `v-tabs` est coupé jusque-là). Puis « Due » s'il reste une
  tâche à planifier, « Project » sinon ou sur un jour passé. Le choix est refait à chaque
  changement de jour, jamais en cours de route.
- Depuis un DailyTask déjà planifié, cliquer sur son chip projet/section/collection **ramène le
  panneau de gauche sur la source correspondante** (navigation inverse).
- L'étape « event » fait du CRUD sur les événements du jour via `EventDialog`, et retire de la
  liste tout événement qui, après édition, ne couvre plus la journée (`isEventRelatedToDate`).
- **Navigation jour à jour** — deux flèches dans l'en-tête (`router.replace`, pas `push` : les
  clics n'empilent pas l'historique), plus un bouton « today » dès qu'on a quitté le jour
  courant. La flèche gauche n'a pas de borne — le passé s'ouvre en lecture seule ; la droite se
  désactive à `MAX_PLANNING_HORIZON_DAYS` : **ce `disabled` est la seule borne**,
  `dailyUpdateGuard` ne rejouant pas sur un changement de param.
- **Signal d'état** — `DailyDayStatusChip`, à côté des titres « Tasks of the day » et « Events of
  the day » : « Past day » avec un cadenas sur un jour passé, « Upcoming » en `accent` tonal avec
  l'icône `mdi-calendar-arrow-right` du résumé sur un jour à venir, rien sur le jour courant. Sur
  un jour passé, les boutons d'ajout disparaissent et les états vides disent qu'il n'y avait rien
  ce jour-là.
- **Les deux étapes rechargent au changement de date**, par un `watch` sur la prop et non par un
  `:key` — un remontage relancerait aussi les listes de projets, collections et tâches
  récurrentes, qui ne dépendent pas du jour. Chacune **vide sa liste et remet son compteur à
  zéro avant le fetch**, pour ne jamais afficher la veille sous l'en-tête du nouveau jour.
- **Le report de la veille n'est proposé que sur le jour courant.** Les endpoints `carry-over…`
  sont codés « veille → aujourd'hui » sans paramètre ; ne pas interroger les candidats hors de
  ce jour est ce qui fait disparaître le bouton, dont la condition d'affichage
  (`carryOverCandidates.length > 0`) n'est alors jamais satisfaite.
- `DailyUpdateTaskList` reçoit la date et remet à zéro son formulaire de création et sa carte en
  édition quand elle change : sans ça, un libellé saisi pour le jour J partirait sur J+1.

## Résumé — mécanique

- Le chip « Upcoming » **bascule** entre deux listes exclusives : le **passé**, d'aujourd'hui
  vers l'arrière, et les **jours à venir**, du plus proche au plus lointain. Une seule est
  rendue à la fois, avec sa pagination et son bouton. Même taille de page, calculée une fois
  selon le breakpoint.
- Les deux listes sont **disjointes** : aujourd'hui n'appartient qu'au passé, et disparaît donc
  de l'écran quand le chip est actif. C'est délibéré — une date présente dans les deux ferait
  patcher `findSummary` une seule des deux copies, et l'autre afficherait un compteur périmé à
  la bascule suivante.
- **Seule la vue affichée est chargée** ; l'autre l'est paresseusement à la première bascule,
  puis mise en cache.
- ⚠️ **Les arguments de `getDailySummary(startDate, endDate)` sont inversés par rapport à leurs
  noms** pour le passé : `startDate` y est le jour **le plus récent**, `endDate` la borne la plus
  ancienne. `loadUpcomingPage` est le **seul appel du front** à les passer dans le sens de leurs
  noms — `daterange` parcourt alors en avant et la réponse arrive croissante, sans `reverse`.
- L'état du chip est **porté par l'URL** (`?upcoming=true`), lu comme une prop de route à la
  manière d'`archived` sur les listes. `setDateParam` et `removeDateParam` réinjectent donc
  `route.query` : sans ça, ouvrir ou fermer le dialog de détail effacerait le chip.
- Le bouton « Load more » se désactive à `MAX_PLANNING_HORIZON_DAYS` sur les jours à venir, et la
  dernière page est bornée sur ce plafond — une borne de début dépassant la borne de fin ferait
  parcourir `daterange` à l'envers et insérerait une page décroissante au milieu de la liste.
- La couleur de fond encode la progression sur une rampe verte à 5 crans. **Une carte à venir
  n'entre pas dans cette rampe** : elle n'a ni progression ni « journée vide » à signaler, garde
  le fond par défaut et se distingue par un `variant="outlined"`.
- Le **dialog de détail est piloté par l'URL** (param `:date`), pas par un état local : le bouton
  retour du navigateur le ferme. Voir [../patterns/dialogs.md](../patterns/dialogs.md).
- **Navigation jour à jour dans le dialog** — deux flèches entre le titre et le crayon, groupées
  à gauche parce que le bouton de fermeture est en `position: absolute; right: 0`. Le dialog
  n'appelle pas le routeur : il émet `navigate`, et `DailySummary` fait le `router.replace` en
  conservant `route.query`. Borne vers l'avant à `MAX_PLANNING_HORIZON_DAYS`, **aucune vers
  l'arrière** — un jour passé sans rien affiche simplement l'état vide. Le glissement horizontal
  n'y est pas branché : il sert déjà au changement d'onglet.
- Après avoir coché une tâche, le compteur de la carte est patché **en place** (pas de refetch) ;
  de même `totalTask` après une création depuis la timeline. Ni l'un ni l'autre n'est rafraîchi
  après un passage dans le wizard.
- La timeline des tâches du dialog offre, **sauf sur un jour passé**, un dernier élément grisé
  qui se transforme en `DailyTaskForm` au clic. Il n'apparaît qu'au bas d'une timeline non vide :
  une journée sans tâche ne rend pas la timeline du tout, donc **l'amorçage d'une journée reste
  réservé au wizard**, y compris pour un jour à venir.
- **Une tâche d'un jour à venir ne se coche pas.** Le serveur refuse `completed` sur une ligne
  future ; la carte et la pastille de timeline perdent donc ripple, curseur et écouteur de clic,
  pour ne pas offrir un geste qui repartirait en 400.
- Les textes des deux timelines ont **trois** formes : passé, jour courant, à venir.
- Layout du détail : en `mdAndUp` deux colonnes (tâches 7 / événements 5) ; en `mdAndDown` des
  onglets, mais **seulement si les deux listes sont non vides** — sinon la liste unique s'affiche
  sans onglets. Le glissement horizontal change d'onglet, le glissement vers le bas ferme le
  dialog (sauf si le contenu est déjà scrollé).

## Voir aussi

- [glossary.md](glossary.md) — Task vs CommonTask vs DailyTask
- [events.md](events.md) — règles temporelles de l'étape « event »
- [../architecture/routing.md](../architecture/routing.md) — routes et guards
- [../quality/watched-risks.md](../quality/watched-risks.md) — fragilités connues de ce domaine
