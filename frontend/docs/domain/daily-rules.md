# Règles de la planification journalière

Le « daily » est le cœur de l'application. **La plupart de ses invariants ne sont garantis ni par
les types ni par le backend** — ils tiennent aux composants. Les contourner produit des données
incohérentes sans aucune erreur.

Deux écrans : le **wizard** (`daily-update`, préparer la journée) et le **résumé**
(`daily-summary`, exécuter et consulter). Voir
[../architecture/routing.md](../architecture/routing.md) pour les routes.

## Les trois origines d'un DailyTask

Un `DailyTask` provient de l'une de ces trois sources, **exclusivement** :

| Origine                             | Corps envoyé               | Déclenché depuis                                                                                                              |
| ----------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Une **Task** (projet ou collection) | `{ taskId }`               | `DailyUpdateProjectListItem.vue:85`, `DailyUpdateCollectionListItem.vue:47`, `TaskCard.vue` (context menu)                    |
| Un **CommonTask**                   | `{ commonTaskId }`         | `DailyUpdateCommonTask.vue:19`                                                                                                |
| **Libre** (ad hoc)                  | `{ name, tagIds, action }` | `DailyTaskForm.vue` via `DailyUpdateTaskList.vue` (wizard) ou `DailyDetailTaskTimeline.vue` (résumé, jour courant uniquement) |

⚠️ **Aucune validation n'existe.** `DailyTaskPost` a ses champs **tous optionnels** : un corps
vide passe le typage, et un DailyTask sans origine rendrait un titre vide. L'invariant est
uniquement tenu par les composants émetteurs, et reconnu par deux `as string` dans le code.

**Résolution du nom affiché** — `task.name` → sinon `commonTask.name` → sinon `name`.
Logique dupliquée à l'identique dans `DailyTaskCard.vue:19` et `DailyTaskFormCard.vue:24`.

## Cycle de vie

| Champ            | Modifiable                                    | Où                                                                    |
| ---------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `action`         | ✅                                            | wizard, chip éditable → `PATCH` immédiat                              |
| `completed`      | ✅                                            | **résumé uniquement** (dialog de détail)                              |
| `name`, `tagIds` | ✅ mais **seulement pour un DailyTask libre** | wizard, menu « Edit »                                                 |
| `date`           | ❌                                            | absent de `DailyTaskPatch` — un DailyTask ne peut pas changer de jour |

**Règle de séparation des écrans** : on **prépare** dans le wizard, on **exécute** dans le
résumé. Il n'y a délibérément aucun moyen de cocher une tâche depuis le wizard. La seule brèche
dans l'autre sens est la création d'un DailyTask libre depuis le résumé, limitée au jour courant
(voir règle 2 ci-dessous).

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
2. **Seul aujourd'hui peut être préparé.** `dailyUpdateGuard` réécrit toute autre date vers
   celle du jour. **Ce guard est structurel, pas cosmétique** : `DailyTaskPost` **n'a pas de
   champ `date`** — le backend écrit implicitement sur « maintenant ». Sans le guard, ouvrir
   `/daily/2026-01-01/update/task` afficherait les tâches du 1ᵉʳ janvier tout en créant les
   nouvelles sur aujourd'hui : l'écran et les données divergeraient silencieusement. Pour la même
   raison, l'élément d'ajout de `DailyDetailTaskTimeline` n'est rendu que si la date du dialog est
   celle du jour.
3. **Pas de doublon dans une journée** — une même Task ou CommonTask ne peut pas être ajoutée
   deux fois. Dans le wizard, vérifié par `isTaskSelected` / `isCommonTaskSelected`, qui rendent
   la carte inerte. ⚠️ **Le context menu de `TaskCard` n'a pas cet état** : il ne connaît pas le
   daily du jour. Il poste, et un **409** du serveur signifie « déjà présente » — traité comme
   un succès par `useAddTaskToDaily`, le résultat étant le même pour l'utilisateur.
4. **Seules les tâches non complétées sont planifiables**, et seuls les projets/collections non
   archivés apparaissent (filtres serveur `archived: false`, `has_uncompleted_task: true`, plus
   des filtres locaux).
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
8. **Une journée vide n'est pas ouvrable** depuis le résumé (carte non cliquable si aucune tâche
   ni événement).

## Wizard — mécanique

Deux étapes non linéaires (`v-stepper non-linear`, les deux items `editable`) : **task** puis
**event**. Le param de route `:step(task|event)` pilote l'étape ; la regex de route rejette toute
autre valeur.

- La synchronisation est **unidirectionnelle** : le stepper écrit dans la route
  (`router.replace`), mais aucun watcher ne surveille la prop `step`. **Les boutons
  précédent/suivant du navigateur ne déplacent donc pas le stepper.**
- L'étape « task » offre 5 onglets sources : Project, Collection, Common task, puis
  « Weekly task » et « Monthly task » **désactivés** (fonctionnalités annoncées, non
  implémentées). L'énumération `DailyUpdateTaskTab` ne couvre que les 3 premiers.
- Depuis un DailyTask déjà planifié, cliquer sur son chip projet/section/collection **ramène le
  panneau de gauche sur la source correspondante** (navigation inverse).
- L'étape « event » fait du CRUD sur les événements du jour via `EventDialog`, et retire de la
  liste tout événement qui, après édition, ne couvre plus la journée (`isEventRelatedToDate`).

## Résumé — mécanique

- Grille de `DailySummaryCard` d'aujourd'hui vers le passé, paginée par un bouton « Load more
  days ». La taille de page est calculée une fois selon le breakpoint.
- ⚠️ **Les arguments de `getDailySummary(startDate, endDate)` sont inversés par rapport à leurs
  noms** : `startDate` est le jour **le plus récent**, `endDate` la borne la plus ancienne.
- La couleur de fond d'une carte encode la progression sur une rampe verte à 5 crans.
- Le **dialog de détail est piloté par l'URL** (param `:date`), pas par un état local : le bouton
  retour du navigateur le ferme. Voir [../patterns/dialogs.md](../patterns/dialogs.md).
- Après avoir coché une tâche, le compteur de la carte est patché **en place** (pas de refetch) ;
  de même `totalTask` après une création depuis la timeline. Ni l'un ni l'autre n'est rafraîchi
  après un passage dans le wizard.
- La timeline des tâches du dialog offre, **pour le jour courant seulement**, un dernier élément
  grisé qui se transforme en `DailyTaskForm` au clic. Il n'apparaît qu'au bas d'une timeline non
  vide : une journée sans tâche ne rend pas la timeline du tout, donc l'amorçage d'une journée
  reste réservé au wizard.
- Layout du détail : en `mdAndUp` deux colonnes (tâches 7 / événements 5) ; en `mdAndDown` des
  onglets, mais **seulement si les deux listes sont non vides** — sinon la liste unique s'affiche
  sans onglets. Le glissement horizontal change d'onglet, le glissement vers le bas ferme le
  dialog (sauf si le contenu est déjà scrollé).

## Voir aussi

- [glossary.md](glossary.md) — Task vs CommonTask vs DailyTask
- [events.md](events.md) — règles temporelles de l'étape « event »
- [../architecture/routing.md](../architecture/routing.md) — routes et guards
- [../quality/watched-risks.md](../quality/watched-risks.md) — fragilités connues de ce domaine
