# Échéance des tâches — conception

- **Date** : 2026-10-19
- **Statut** : validé, amendé par le plan d'implémentation

## Objectif

Donner à une tâche une date optionnelle à laquelle elle doit être terminée, et faire remonter
dans le daily update, sans recherche, les tâches dues ou en retard pour le jour planifié.

## Périmètre

**Inclus**

- Saisie, modification et effacement de l'échéance dans `TaskDialog`.
- Badge d'échéance sur `TaskCard` (tous les écrans) et sur `DailyTaskCard`.
- Daily update : onglet « Due » en tête, badges sur les cartes projet et collection.

**Exclus**

- Suggestion des tâches dues dans l'état vide de « Tasks of the day » : second temps.
- Heure d'échéance, rappels, notifications.
- Tri ou filtre par échéance dans les listes : l'ordre manuel reste la seule source d'ordre.
- Affichage dans l'agenda.
- Indicateur « terminée en retard ».
- Compteur de retards sur les listes de projets et de collections hors daily update.

## Décisions

| Sujet              | Décision                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| Nom                | `due_date` en base, `dueDate` dans l'API, « Due date » dans l'interface    |
| Type               | Date seule (`DateField`, nullable), sans heure                             |
| Dates passées      | Autorisées à la création comme à l'édition                                 |
| Tâche terminée     | L'échéance est conservée mais pas affichée ; la carte montre la complétion |
| Date de référence  | Le jour planifié dans le daily update, pas la date réelle                  |
| « Soon »           | De J+1 à J+5 par rapport au jour de référence                              |
| Jours passés       | Ni onglet « Due », ni badge                                                |
| Onglet à l'arrivée | « Due » s'il reste au moins une tâche à planifier, « Project » sinon       |
| Tâche sélectionnée | Reste dans « Due », à sa place, sur fond vert comme dans les cartes projet |

## 1. Back

- `Task.due_date = DateField(null=True, blank=True)`, migration sans backfill.
- `TaskSerializer` et `TaskExtendedSerializer` exposent `dueDate` ; `TaskPostSerializer` et
  `TaskPatchSerializer` l'acceptent, `null` efface.
- `Meta.ordering` inchangé.
- `backend/docs/architecture/api-surface.md` et `data-model.md` documentent le champ
  (`openapi.yaml` est un stub abandonné, ADR 0004).
- Tests : création avec et sans échéance, modification, effacement, valeur nulle par défaut.

## 2. Statut d'échéance

Fonction pure `dueDateStatus(task, referenceDay)` dans `task.utils.ts`, testée :

| Statut    | Condition (tâche non terminée)   | Rendu                                                   |
| --------- | -------------------------------- | ------------------------------------------------------- |
| `overdue` | `dueDate < referenceDay`         | rouge, `mdi-calendar-alert`, « 3 days late »            |
| `today`   | `dueDate = referenceDay`         | orange, `mdi-calendar-today`, « Today »                 |
| `soon`    | de J+1 à J+5                     | ambre, `mdi-calendar`, « Tomorrow » / « Next Thursday » |
| `later`   | au-delà                          | neutre, `mdi-calendar`, « 12 November 2026 »            |
| `none`    | pas d'échéance ou tâche terminée | rien                                                    |

Hors du daily update, le jour de référence est aujourd'hui (`useToday`). La couleur
s'accompagne toujours d'une icône et d'un texte ; la date complète s'affiche au survol.

## 3. Saisie — `TaskDialog`

- Ordre des champs : Name, Due date, Tags. Le nom porte un astérisque rouge. La date se
  présente en champ libellé « Due date (optional) », sans titre de section ; Tags garde son
  titre, marqué « optional ».
- Champ « Due date » ouvrant un `v-date-picker` dans un `v-menu` (même montage que
  `EventDialog`), avec un bouton d'effacement toujours visible dès qu'une date est choisie
  (`persistent-clear`). Les jours passés restent sélectionnables.
- Raccourcis en chips : Today · Tomorrow · Next Friday · Next week (lundi suivant) · End of
  month, les trois derniers suivis de leur date courte (« 23 Oct »). Next Friday n'est
  proposé que du lundi au jeudi. Un raccourci qui tombe le même jour qu'un précédent est
  retiré.

## 4. Carte — `TaskCard` et `DailyTaskCard`

- Pastille au fond semi-opaque sur la ligne du nom, à droite, lisible sur toutes les couleurs
  de carte ; elle passe à la ligne plutôt que de recouvrir un nom long. Échéance et date de
  complétion s'excluent.
- Mode `small` pris en charge.
- Une seule pastille, `TaskDateBadge`, sert à l'échéance (`kind="due"`) et à la date de
  complétion d'une tâche terminée (`kind="completed"`). La complétion garde toujours l'icône
  `mdi-calendar-check` et la couleur neutre, avec les mêmes libellés que l'échéance, sauf
  dans le passé : « Yesterday », « 3 days ago » au lieu de « N days late ». Si la tâche a été terminée après son
  échéance, le retard suit la date, toujours en neutre : « Today · 2 days late ».
- Dans le daily update, `TaskCard` reçoit le jour affiché comme jour de référence.
- Quand le jour de référence est aujourd'hui : libellés relatifs jusqu'à 5 jours d'écart
  (« 1 day late », « 5 days late », « Today », « Tomorrow », « Next Thursday ») ; au-delà,
  date complète « 16 October 2026 », passée comme future.
- Sur un autre jour du daily update : « This day » pour une échéance sur ce jour, la date
  complète pour toutes les autres.
- Sur `DailyTaskCard`, la pastille précède les chips de conteneur ; sur `DailyTaskFormCard`, l'ordre est chip de conteneur, pastille, tags.

## 5. Daily update

Les projets et collections viennent du filtre `daily_task_date` : non archivés avec une tâche
ouverte, plus ceux, archivés compris, dont une tâche est planifiée sur le jour affiché. Ils
sont rechargés à chaque changement de jour.

### Onglet « Due »

Premier onglet de l'enum `DailyUpdateTaskTab`, absent pour un jour passé. Pas d'appel API
dédié : la liste se calcule à partir des projets et collections chargés, avec `J` le jour
affiché.

1. **Rassembler** les tâches des projets non archivés (directes et de sections, via
   `flattenProjectTasks`) et des collections non archivées, chacune avec son conteneur.
2. **Garder** les tâches qui ont une `dueDate` au plus tard à `J + 5`, et qui sont disponibles
   selon la même règle que `isTaskAvailable` : non terminées, ou terminées mais planifiées sur
   `J`.
3. **Grouper** :

   - « Today » : `dueDate = J` ; il devient « This day » quand `J` n'est pas aujourd'hui,
     avec un sous-texte (« Due on Thursday 22 October, the day being planned ») ;
   - « Late » : `dueDate < J`, de la plus ancienne à la plus récente ;
   - « Soon » : de `J + 1` à `J + 5`, par date croissante, avec un sous-texte qui explique la
     fenêtre (« Due in the next 5 days » aujourd'hui, « Due in the 5 days after Thursday 22
     October » sinon).

   Chaque titre est précédé de l'icône et de la couleur de la pastille correspondante.

   Les groupes s'affichent dans cet ordre.

   À date égale : ordre des conteneurs, puis ordre manuel des tâches.

4. **Afficher** chaque tâche sur toute la ligne, au niveau 1 de l'échelle des surfaces, avec
   sur la ligne de son nom sa pastille puis le chip de son conteneur (projet, section ou collection), comme une `DailyTaskCard`. Un clic sur le chip ouvre le conteneur dans son onglet, comme depuis une daily task, même sur une tâche déjà planifiée. Une tâche planifiée sur `J` reste à sa place, en `TaskCard` sélectionnée
   (fond vert, inerte), comme dans les cartes projet. L'en-tête de chaque groupe donne le
   nombre de ses tâches dans une chip, comme le compteur de « Tasks of the day », sans animation.
5. **Pastille** sur l'icône de l'onglet : le nombre total de tâches de l'onglet, planifiées
   comprises — elle ne baisse pas à la sélection. Rouge s'il y a une tâche en retard, orange
   sinon.

S'il n'y a aucune tâche dans la fenêtre, l'onglet affiche un état vide « Nothing due ».

### Onglet à l'arrivée

- Jour passé : « Project ».
- Sinon, une fois les projets **et** les collections du jour chargés : « Due » s'il reste au
  moins une tâche à planifier, « Project » sinon. L'onglet n'est pas affiché avant ce choix,
  pour ne pas changer sous les yeux de l'utilisateur.
- Le choix est refait à chaque changement de jour, jamais en cours de route.
- Le lien d'une daily task vers son conteneur (`select`) continue d'ouvrir l'onglet et la
  section visés.

### Badges sur les cartes projet et collection

Nombre de tâches overdue ou today du conteneur, planifiées sur `J` ou non, avec
les mêmes couleurs.

## Points d'attention

- `DailyUpdateTaskTab` est un enum numérique : ajouter « Due » en tête décale les valeurs. Les
  `v-tab` doivent suivre l'enum, pas des nombres en dur.
- Le filtre `daily_task_date` peut renvoyer des conteneurs archivés : l'onglet « Due » et les
  badges les écartent.
- Le comportement d'une tâche planifiée sur plusieurs jours puis terminée le premier est à
  l'étude séparément ; la règle de l'étape 2 suit `isTaskAvailable` et en héritera.
