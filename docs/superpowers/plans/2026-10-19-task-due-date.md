# Échéance des tâches — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** donner une échéance optionnelle aux tâches, l'afficher sur les cartes, et faire
remonter dans le daily update les tâches dues ou en retard pour le jour planifié.

**Architecture :** un champ `due_date` côté back, exposé `dueDate` par les serializers de tâche.
Côté front, deux modules purs portent toute la logique : `due-date.utils.ts` (statut, libellé,
raccourcis) et `daily-due.utils.ts` (liste de l'onglet « Due » et compteurs des badges),
calculée à partir des projets et collections que le daily update charge déjà. Les composants
ne font qu'afficher.

**Tech stack :** Django 6.1 + DRF 3.18 ; Vue 3.5, Vuetify 4, TypeScript, moment, Vitest.

**Spec :** `docs/superpowers/specs/2026-10-19-task-due-date-design.md` (amendée par la tâche 0).

## Contraintes globales

- **Aucune commande git qui modifie le dépôt.** Le mainteneur indexe et commite lui-même. Pas
  d'étape de commit par tâche : un seul message, rédigé à la tâche 9.
- **Aucun fichier modifié sans que son contenu ait été présenté et validé.** Les signatures et
  tests de ce plan valent présentation ; tout écart se présente avant d'être appliqué.
- **Commentaires** : uniquement ce qui n'est pas lisible dans le code. Ce plan n'en prévoit
  aucun.
- Textes d'interface en anglais, mot pour mot : « Due date », « Today », « Tomorrow »,
  « Next Monday », « In 1 week », « Overdue », « Due today », « Due soon », « Nothing due »,
  « {n}d late », « {p}/{t} planned ».
- « Due soon » = de J+1 à **J+3** (`DUE_SOON_DAYS = 3`).
- Jour de référence `J` : le jour affiché dans le daily update ; ailleurs, aujourd'hui
  (`useToday`). Dates échangées au format `YYYY-MM-DD`.
- Jour passé (`readonly`) : ni onglet « Due », ni badge de conteneur.
- La documentation touchée par une tâche est mise à jour **dans cette tâche**.
- Back : `docker exec tout_doux_backend python manage.py …`. Front : depuis `frontend/`,
  `yarn …`, jamais npm.

## Review Focus

1. **Changement de jour dans le daily update** : la liste « Due », la pastille et l'onglet
   d'arrivée se recalculent pour le nouveau `J`, sans afficher l'état de la veille → tests de
   `collectDueEntries` avec deux `J` différents (tâche 6), vérification navigateur (tâche 9).
2. **Tâche terminée mais planifiée sur `J`** : elle reste dans « Due », en vert, sans compter
   dans la pastille → test dédié (tâche 6).
3. **Conteneur archivé renvoyé par `daily_task_date`** : ses tâches n'apparaissent ni dans
   « Due » ni dans un badge → test dédié (tâche 6).
4. **Effacer l'échéance** (`dueDate: null`) depuis le dialog : la carte perd son badge → test
   back (tâche 1), vérification navigateur (tâche 9).
5. **Échéance dans une autre année** : le libellé « later » porte l'année → test (tâche 2).

## Carte des fichiers

| Fichier                                                                                | Responsabilité                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `backend/tout_doux/models/task.py`, `migrations/0013_task_due_date.py`                 | champ `due_date`                                      |
| `backend/tout_doux/serializers/task/*.py`                                              | `dueDate` en lecture et en écriture                   |
| `backend/tout_doux/test_task_due_date.py`                                              | tests de la fonctionnalité (nouveau)                  |
| `frontend/src/models/task.model.ts`                                                    | `dueDate`                                             |
| `frontend/src/utils/due-date.utils.ts`                                                 | statut, libellé, raccourcis (nouveau)                 |
| `frontend/src/utils/task.utils.ts`                                                     | `isTaskPlanned`, `isTaskAvailable`                    |
| `frontend/src/utils/daily-due.utils.ts`                                                | liste « Due », compteurs (nouveau)                    |
| `frontend/src/views/components/task/TaskDueDateBadge.vue`                              | pastille d'échéance (nouveau)                         |
| `frontend/src/views/components/task/TaskCard.vue`, `TaskDialog.vue`                    | badge, saisie                                         |
| `frontend/src/views/daily/components/DailyTaskCard.vue`                                | badge de la tâche liée                                |
| `frontend/src/views/daily/daily-update/steps/task/components/DailyUpdate*ListItem.vue` | `date`, `isTaskAvailable` partagé, badge du conteneur |
| `frontend/src/views/daily/daily-update/steps/task/components/DailyUpdateDue.vue`       | onglet « Due » (nouveau)                              |
| `frontend/src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`                 | onglet, choix de l'onglet d'arrivée                   |
| `frontend/src/models/daily-task.model.ts`                                              | `DailyUpdateTaskTab.Due`                              |

---

### Tâche 0 : amender la spec

**Fichiers :** `docs/superpowers/specs/2026-10-19-task-due-date-design.md`

- [ ] **Étape 1 : statut** — `validé` → `validé, amendé par le plan d'implémentation`.
- [ ] **Étape 2 : section 1** — remplacer « `openapi.yaml` documente le champ. » par
      « `backend/docs/architecture/api-surface.md` et `data-model.md` documentent le champ
      (`openapi.yaml` est un stub abandonné, ADR 0004). »
- [ ] **Étape 3 : section 4** — ajouter « Dans le daily update, `TaskCard` reçoit le jour
      affiché comme jour de référence. »

### Tâche 1 : back — champ et serializers

**Fichiers :**

- Modifier : `backend/tout_doux/models/task.py`, `serializers/task/task.py`,
  `task_extended.py`, `task_post.py`, `task_patch.py`
- Créer : `backend/tout_doux/migrations/0013_task_due_date.py` (générée),
  `backend/tout_doux/test_task_due_date.py`
- Doc : `backend/docs/architecture/data-model.md`, `api-surface.md`

**Interfaces :**

- Produit : `dueDate: 'YYYY-MM-DD' | null` dans toute représentation de `Task` (y compris
  imbriquée dans `DailyTask.task`, `ProjectDetail`, `CollectionDetail`) ; accepté en POST et
  PATCH sur `task/`, `null` efface.

- [ ] **Étape 1 : écrire les tests** dans `test_task_due_date.py`, classe
      `TaskDueDateTest(DataFixtureTestCase)` (importée de `test_api_contract`) :

```python
def test_a_task_is_created_without_due_date(self):        # POST sans dueDate → dueDate None
def test_a_task_is_created_with_a_due_date(self):         # '2026-10-22' → '2026-10-22'
def test_a_past_due_date_is_accepted(self):               # '2020-01-01' → 201
def test_an_invalid_due_date_is_refused(self):            # '2026-13-40' → 400
def test_the_due_date_is_updated(self):                   # PATCH → nouvelle valeur
def test_the_due_date_is_cleared_with_null(self):         # PATCH {'dueDate': None} → None
def test_a_patch_without_due_date_keeps_it(self):         # PATCH {'name': …} → inchangée
def test_nested_tasks_carry_their_due_date(self):         # daily-task/ et project/{pk}/ détaillé
```

- [ ] **Étape 2 : lancer, constater l'échec**
      `docker exec tout_doux_backend python manage.py test tout_doux.test_task_due_date`
      → FAIL (`KeyError: 'dueDate'`).
- [ ] **Étape 3 : modèle** — `due_date = models.DateField(null=True, blank=True)` après
      `completed_at` ; `python manage.py makemigrations tout_doux --name task_due_date`.
- [ ] **Étape 4 : serializers** — lecture : `dueDate = serializers.DateField(source='due_date')`
      dans `TaskSerializer`, ajouté à `fields` après `completedAt` dans `TaskSerializer` et
      `TaskExtendedSerializer`. Écriture : `dueDate = serializers.DateField(source='due_date',
    required=False, allow_null=True)` dans `TaskPostSerializer` et `TaskPatchSerializer`, ajouté
      à leurs `fields`.
- [ ] **Étape 5 : lancer toute la suite**
      `docker exec tout_doux_backend python manage.py test tout_doux` → OK ;
      `makemigrations --check --dry-run` → « No changes detected ».
- [ ] **Étape 6 : doc** — ligne `due_date` dans la table `Task` de `data-model.md` ; mention de
      `dueDate` (POST/PATCH, `null` efface) dans les lignes `task/` de `api-surface.md`.

### Tâche 2 : front — modèle et `due-date.utils`

**Fichiers :**

- Modifier : `frontend/src/models/task.model.ts`, `frontend/src/test/fixtures.ts`
- Créer : `frontend/src/utils/due-date.utils.ts`, `due-date.utils.spec.ts`
- Doc : `frontend/docs/domain/glossary.md`

**Interfaces :**

- Produit :

```ts
// task.model.ts
Task.dueDate: string | null
TaskPost.dueDate?: string | null
TaskPatch.dueDate?: string | null

// due-date.utils.ts
export const DUE_SOON_DAYS = 3
export type DueDateStatus = 'overdue' | 'today' | 'soon' | 'later' | 'none'
export function dueDateStatus(task: Pick<Task, 'completed' | 'dueDate'>, referenceDay: string): DueDateStatus
export function dueDateLabel(dueDate: string, referenceDay: string): string
export interface DueDateShortcut { label: string; value: string }
export function dueDateShortcuts(today: string): DueDateShortcut[]
```

- [ ] **Étape 1 : fixture** — `makeTask` reçoit `dueDate: null`.
- [ ] **Étape 2 : écrire les tests** (`J = '2026-10-22'`, un jeudi) :

```ts
dueDateStatus({ completed: false, dueDate: null }, J); // 'none'
dueDateStatus({ completed: true, dueDate: "2026-10-20" }, J); // 'none'
dueDateStatus({ completed: false, dueDate: "2026-10-21" }, J); // 'overdue'
dueDateStatus({ completed: false, dueDate: "2026-10-22" }, J); // 'today'
dueDateStatus({ completed: false, dueDate: "2026-10-25" }, J); // 'soon'   (J+3)
dueDateStatus({ completed: false, dueDate: "2026-10-26" }, J); // 'later'  (J+4)

dueDateLabel("2026-10-19", J); // '3d late'
dueDateLabel("2026-10-22", J); // 'Today'
dueDateLabel("2026-10-23", J); // 'Tomorrow'
dueDateLabel("2026-10-24", J); // 'Sat'
dueDateLabel("2026-11-12", J); // '12 Nov'
dueDateLabel("2027-01-05", J); // '5 Jan 2027'

dueDateShortcuts(J); // [{Today, 2026-10-22}, {Tomorrow, 2026-10-23},
//  {Next Monday, 2026-10-26}, {In 1 week, 2026-10-29}]
```

- [ ] **Étape 3 : lancer** `yarn test --run src/utils/due-date.utils.spec.ts` → FAIL.
- [ ] **Étape 4 : implémenter** — écarts en jours avec
      `moment(dueDate).diff(moment(referenceDay), 'days')` ; « Next Monday » =
      `isoWeekday(8)` ; libellés `ddd`, `D MMM`, `D MMM Y` (année seulement si elle diffère de
      celle de `referenceDay`).
- [ ] **Étape 5 : relancer** → PASS ; `yarn test --run` → tous verts.
- [ ] **Étape 6 : doc** — `glossary.md` : `dueDate` dans la table de `Task` (optionnelle,
      jour seul, masquée une fois la tâche terminée).

### Tâche 3 : `TaskDueDateBadge`, `TaskCard` et `DailyTaskCard`

**Fichiers :**

- Créer : `frontend/src/views/components/task/TaskDueDateBadge.vue`
- Modifier : `TaskCard.vue`, `frontend/src/views/daily/components/DailyTaskCard.vue`
- Doc : `frontend/docs/architecture/ui-layer.md` (composant partagé)

**Interfaces :**

- Consomme : `dueDateStatus`, `dueDateLabel` (tâche 2).
- Produit :

  - `TaskDueDateBadge` — props `{ dueDate: string; referenceDay: string; small?: boolean }` ;
    ne rend rien si le statut est `none`.
  - `TaskCard` — nouvelles props `referenceDay?: string` (défaut : aujourd'hui via `useToday`,
    au format `YYYY-MM-DD`) et `showDueDate?: boolean` (défaut `true`).

- [ ] **Étape 1 : `TaskDueDateBadge`** — `<span>` avec icône et libellé, `title` « Due on
      D MMMM Y ». Fond `rgba(0, 0, 0, 0.32)`, `border-radius` 999px, padding `0 6px`. Couleur de
      l'icône et du texte selon le statut :

| Statut    | Icône                | Couleur                      |
| --------- | -------------------- | ---------------------------- |
| `overdue` | `mdi-calendar-alert` | `red-accent-1` (#FF8A80)     |
| `today`   | `mdi-calendar-today` | `orange-lighten-2` (#FFB74D) |
| `soon`    | `mdi-calendar`       | `amber-lighten-3` (#FFE082)  |
| `later`   | `mdi-calendar`       | blanc, opacité 0.87          |

- [ ] **Étape 2 : `TaskCard`** — le badge prend la place de `task-card__completed-at` quand
      `showDueDate && !task.completed && task.dueDate`. Renommer la classe
      `task-card__tags--with-completed-at` en `task-card__tags--with-footer`, appliquée dans les
      deux cas, avec `margin-right: 100px`.
- [ ] **Étape 3 : `DailyTaskCard`** — `TaskDueDateBadge` pour `dailyTask.task` non terminée,
      avec `referenceDay = dailyTask.date`, sur la ligne des chips de conteneur.
- [ ] **Étape 4 : vérifier** — `yarn lint:check`, `yarn type-check` (pas plus de 28 erreurs).
- [ ] **Étape 5 : doc** — `ui-layer.md` : ligne `TaskDueDateBadge`.

### Tâche 4 : saisie dans `TaskDialog`

**Fichiers :** `frontend/src/views/components/task/TaskDialog.vue`

**Interfaces :**

- Consomme : `dueDateShortcuts` (tâche 2) ; `TaskPost.dueDate`, `TaskPatch.dueDate`.
- Produit : les événements `create` et `update` portent `dueDate` (`null` si vide).

- [ ] **Étape 1 : formulaire** — `taskForm.data.dueDate: string | null`, alimenté par
      `populateForm` (`task.dueDate ?? null`, `null` en création).
- [ ] **Étape 2 : champ** — sous le nom : `v-menu` + `v-text-field` readonly, `clearable`,
      label « Due date », `prepend-icon="mdi-calendar"`, valeur affichée `D MMMM Y` ;
      `v-date-picker` `show-adjacent-months hide-title hide-header :first-day-of-week="1"`, qui
      écrit `YYYY-MM-DD` et referme le menu (même montage que `EventDialog`). Aucun `min` : les
      jours passés restent choisissables.
- [ ] **Étape 3 : raccourcis** — sous le champ, un `v-chip` `size="small"` par raccourci ;
      variante `flat` couleur `accent` si sa valeur est la date choisie, `tonal` sinon ; un clic
      fixe la date.
- [ ] **Étape 4 : vérifier dans le navigateur** — création avec raccourci, édition au
      calendrier, effacement par la croix : la carte suit à chaque fois.

### Tâche 5 : `isTaskPlanned` et `isTaskAvailable` partagés

**Fichiers :**

- Modifier : `frontend/src/utils/task.utils.ts`, `task.utils.spec.ts`,
  `DailyUpdateProjectListItem.vue`, `DailyUpdateCollectionListItem.vue`

**Interfaces :**

- Produit :

```ts
export function isTaskPlanned(task: Task, dailyTasks: DailyTask[]): boolean;
export function isTaskAvailable(
  task: Task,
  containerArchived: boolean,
  dailyTasks: DailyTask[],
): boolean;
```

- [ ] **Étape 1 : tests** — `isTaskPlanned` : vrai si une daily task porte `task.id`.
      `isTaskAvailable` : ouverte non planifiée → vrai ; terminée planifiée → vrai ; terminée non
      planifiée → faux ; conteneur archivé : vrai seulement si planifiée.
- [ ] **Étape 2 : lancer** → FAIL ; **implémenter** en reprenant la règle actuelle des deux
      composants ; **relancer** → PASS.
- [ ] **Étape 3 : brancher** — les fonctions locales `isTaskSelected` / `isTaskAvailable` des
      deux composants délèguent à ces utilitaires ; comportement inchangé.

### Tâche 6 : `daily-due.utils`

**Fichiers :**

- Créer : `frontend/src/utils/daily-due.utils.ts`, `daily-due.utils.spec.ts`
- Modifier : `frontend/src/test/fixtures.ts` (`makeCollectionDetail`)

**Interfaces :**

- Consomme : `isTaskPlanned`, `isTaskAvailable` (tâche 5), `DUE_SOON_DAYS` (tâche 2),
  `DailyUpdateTaskTab` (modèle).
- Produit :

```ts
export interface DueContainer {
  tab: DailyUpdateTaskTab.Project | DailyUpdateTaskTab.Collection;
  id: number;
  name: string;
  sectionId?: number;
  sectionName?: string;
}
export interface DueEntry {
  task: Task;
  container: DueContainer;
  planned: boolean;
}
export interface DueGroups {
  overdue: DueEntry[];
  today: DueEntry[];
  soon: DueEntry[];
}

export function collectDueEntries(
  projects: ProjectDetail[],
  collections: CollectionDetail[],
  dailyTasks: DailyTask[],
  referenceDay: string,
): DueGroups;
export function unplannedCount(groups: DueGroups): number;
export function hasUnplannedOverdue(groups: DueGroups): boolean;
export function containerDueCount(
  tasks: Task[],
  dailyTasks: DailyTask[],
  referenceDay: string,
): { count: number; overdue: boolean };
```

- [ ] **Étape 1 : tests de `collectDueEntries`** (`J = '2026-10-22'`) :
  - une tâche au 20, une au 22, une au 25, une au 26 → `overdue` [20], `today` [22],
    `soon` [25] ; celle du 26 est absente ;
  - une tâche sans échéance est absente ;
  - une tâche planifiée sur `J` est présente avec `planned: true` ;
  - une tâche terminée planifiée sur `J` est présente (`planned: true`) ; terminée non
    planifiée, absente ;
  - les tâches d'un projet ou d'une collection `archived: true` sont absentes, planifiées ou non ;
  - une tâche de section porte `sectionId` et `sectionName` ; une tâche directe n'en a pas ;
  - `overdue` et `soon` sont triés par date croissante ; à date égale, projets avant
    collections, ordre des listes reçues conservé ;
  - avec `J = '2026-10-25'`, la tâche du 22 passe en `overdue` et celle du 26 en `soon`.
- [ ] **Étape 2 : tests des compteurs** — `unplannedCount` ignore les `planned` ;
      `hasUnplannedOverdue` faux si la seule en retard est planifiée ; `containerDueCount`
      compte les tâches ouvertes, non planifiées, en retard ou du jour, et `overdue` vaut vrai
      dès qu'une est en retard.
- [ ] **Étape 3 : lancer** → FAIL ; **implémenter** — grouper sur l'écart en jours avec `J`
      (pas sur `dueDateStatus`, qui renvoie `none` pour une tâche terminée), tri stable ;
      **relancer** → PASS.

### Tâche 7 : badges des cartes projet et collection

**Fichiers :** `DailyUpdateProjectListItem.vue`, `DailyUpdateCollectionListItem.vue`,
`DailyUpdateTask.vue` (passage de `date`)

**Interfaces :**

- Consomme : `containerDueCount` (tâche 6), `TaskCard.referenceDay` (tâche 3).
- Produit : prop `date: string` sur les deux composants.

- [ ] **Étape 1 : prop `date`** — passée par `DailyUpdateTask` ; transmise à chaque `TaskCard`
      comme `reference-day`.
- [ ] **Étape 2 : badge** — sur la carte repliée (`!selected`), avant `TaskCounter` : `v-chip`
      `size="small"`, couleur `red-accent-2` si `overdue`, `orange` sinon, icône
      `mdi-calendar-alert` / `mdi-calendar-today`, texte = `count`, `title` « {n} due ». Masqué
      si `readonly`, si le conteneur est archivé ou si `count === 0`.
- [ ] **Étape 3 : vérifier** — `yarn lint:check`, `yarn type-check`.

### Tâche 8 : onglet « Due »

**Fichiers :**

- Créer : `.../steps/task/components/DailyUpdateDue.vue`
- Modifier : `frontend/src/models/daily-task.model.ts`, `DailyUpdateTask.vue`
- Doc : `frontend/docs/domain/daily-rules.md`

**Interfaces :**

- Consomme : `collectDueEntries`, `unplannedCount`, `hasUnplannedOverdue` (tâche 6) ;
  `TaskCard` (tâche 3).
- Produit : `DailyUpdateDue` — props `{ groups: DueGroups; date: string }`, événement
  `select-task: [data: { taskId: number }]` (même forme que les cartes projet).

- [ ] **Étape 1 : enum** — `DailyUpdateTaskTab { Due, Project, Collection, CommonTask }`. Les
      `v-tab` et `v-tabs-window-item` existants prennent `DailyUpdateTaskTab.X` ; les onglets
      désactivés « Weekly » et « Monthly » prennent `'weekly'` et `'monthly'`.
- [ ] **Étape 2 : `DailyUpdateDue`** — trois groupes dans l'ordre Overdue, Due today, Due soon ;
      un groupe vide n'est pas rendu. En-tête : titre + `{p}/{t} planned`. Chaque entrée : une
      `TaskCard` `small`, `:completable="false"`, `:show-completed-at="false"`,
      `:display-options="false"`, `:selected="entry.planned"`, `color="surface-container-high"`,
      `:reference-day="date"`, avec sous le nom le conteneur (`ProjectChip` / `CollectionChip`,
      section en suffixe). Clic sur une entrée non planifiée → `select-task`. Aucun groupe →
      `EmptyListDisplay` « Nothing due ».
- [ ] **Étape 3 : onglet** — premier `v-tab`, `v-if="!readonly"`, icône `mdi-calendar-alert`,
      avec `v-badge` : contenu `unplannedCount`, couleur `red-accent-2` si
      `hasUnplannedOverdue`, `orange` sinon, masqué à 0. `dueGroups` est un `computed` sur
      `projectList`, `collectionList`, `dailyTaskList` et `props.date`.
- [ ] **Étape 4 : onglet d'arrivée** — `taskTab` vaut `null` jusqu'au choix. Deux drapeaux
      `projectsLoaded` et `collectionsLoaded`, remis à `false` au changement de jour et passés à
      `true` à la réponse. Dès que les deux sont vrais et que `taskTab` est `null` :
      `readonly` → `Project` ; sinon `Due` si `unplannedCount > 0`, `Project` sinon. En
      `readonly`, `taskTab` vaut `Project` sans attendre. Le `watch` de `props.date` remet
      `taskTab` à `null`. `select()` reste inchangé.
- [ ] **Étape 5 : vérifier dans le navigateur** — voir tâche 9.
- [ ] **Étape 6 : doc** — `daily-rules.md` : règle de l'onglet « Due » (contenu, pastille,
      onglet d'arrivée, absence sur un jour passé).

### Tâche 9 : vérification et message de commit

- [ ] **Étape 1 : suites** — back : `manage.py test tout_doux` OK ; front : `yarn test --run`,
      `yarn lint:check`, `yarn format:check` verts, `yarn type-check` sans nouvelle erreur.
- [ ] **Étape 2 : navigateur** — avec des tâches dues le 20, 22, 25 et 26 pour `J` = 22 :
  - l'onglet « Due » s'ouvre à l'arrivée, pastille rouge à 2 ;
  - sélectionner la tâche du 22 : elle reste en place, verte, pastille à 1 ;
  - passer au 25 : listes et pastille recalculées ;
  - jour passé : pas d'onglet « Due », pas de badge, onglet « Project » ;
  - tout planifié : à la réouverture, arrivée sur « Project » ;
  - badges des cartes projet et collection cohérents ; mobile (375 px) lisible.
- [ ] **Étape 3 : message** — en anglais, sans `Co-Authored-By`, dans le scratchpad :

```
feat: add an optional due date to tasks

show due tasks first in the daily update with a badge on projects and collections
```

Si le mainteneur inclut `docs/superpowers/`, ajouter la ligne
`add the due date design and implementation plan`.

- [ ] **Étape 4 : valider et copier** —
      `awk 'length($0) > 100 {print NR}' <fichier>`,
      `npx --no-install commitlint --edit <fichier>` (depuis `frontend/`),
      `pbcopy < <fichier>` ; repli : `git commit -F <fichier>`.
