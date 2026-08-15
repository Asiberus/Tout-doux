# Glossaire métier

Vocabulaire de référence. **Utiliser ces termes tels quels** dans le code, les commits et l'UI —
plusieurs concepts voisins sont facilement confondus.

Tout-Doux est une application d'organisation personnelle : on range son travail dans des
**projets** et des **collections**, et on planifie chaque **journée** en y tirant des tâches.

## Entités

| Entité           | Définition dans cette app                                    | Contient                      | Modèle                   |
| ---------------- | ------------------------------------------------------------ | ----------------------------- | ------------------------ |
| **Project**      | Corps de travail structuré, taggable, jalonné d'événements   | Sections, Tasks, Events, Tags | `project.model.ts`       |
| **Section**      | Subdivision d'un projet                                      | Tasks                         | `section.model.ts`       |
| **Collection**   | Liste plate d'items homogènes (« liste de X »)               | Tasks                         | `collection.model.ts`    |
| **Task**         | To-do réel et persistant, appartenant à un conteneur         | Tags                          | `task.model.ts`          |
| **CommonTask**   | **Modèle** de tâche récurrente, réutilisable, sans conteneur | Tags                          | `common-task.model.ts`   |
| **DailyTask**    | Ligne du plan **d'une journée précise**                      | Tags                          | `daily-task.model.ts`    |
| **Event**        | Élément d'agenda, daté, éventuellement rattaché à un projet  | —                             | `event.model.ts`         |
| **Tag**          | Étiquette colorée, typée `project` ou `task`                 | —                             | `tag.model.ts`           |
| **DailySummary** | Agrégat en lecture seule d'une journée (compteurs)           | —                             | `daily-summary.model.ts` |

## Relations

```
Project ──1-n──► Section ──1-n──► Task
   │                                ▲
   ├──1-n──► Task (tâches « General », sans section)
   └──1-n──► Event (Event.projectId est optionnel)

Collection ──1-n──► Task

DailyTask ──0..1──► Task
          ──0..1──► CommonTask
          (ou un name libre — voir daily-rules.md)

Tag ──n-n──► Project | Task | CommonTask | DailyTask
```

- Une **Task** appartient à **au plus un** conteneur : projet **ou** section **ou** collection.
  `TaskPost` expose les trois identifiants en optionnel — l'exclusivité n'est **pas** garantie
  par le type, seulement par les sites d'appel.
- **Collection, Section et Event ne portent pas de Tags.**
- `Tag.type` discrimine l'usage : les formulaires de projet cherchent des tags `project`, tout ce
  qui est tâche (y compris DailyTask) cherche des tags `task`.

## Distinctions à ne pas confondre

### Task vs CommonTask vs DailyTask

|                         | Task                           | CommonTask                | DailyTask                     |
| ----------------------- | ------------------------------ | ------------------------- | ----------------------------- |
| Nature                  | to-do réel                     | **gabarit** réutilisable  | **planification** d'un jour   |
| Rattachée à             | projet / section / collection  | rien (niveau utilisateur) | une date                      |
| A un état d'achèvement  | ✅ `completed` + `completedAt` | ❌ aucun                  | ✅ `completed` (pour ce jour) |
| Achever fait progresser | le projet / la collection      | rien                      | rien globalement              |
| Gérée depuis            | détail projet / collection     | Réglages → Common tasks   | wizard daily                  |

Un **CommonTask** est une corvée récurrente (« sortir le chien », « faire les courses »), décrite
comme telle dans l'UI (`SettingsCommonTasks.vue:61`). Il n'a pas d'état : le « faire » un jour
donné signifie créer un DailyTask qui le référence.

Un **DailyTask** n'est jamais une définition de tâche : c'est une **enveloppe de planification**.
Le supprimer retire la ligne de la journée, sans toucher la Task ou le CommonTask sous-jacent.
Seul un DailyTask adossé à une **Task** affiche les chips projet / section / collection.

### Project vs Collection

Les deux contiennent des Tasks et sont archivables. Ce qui les sépare, d'après le code :

|                                      | Project | Collection           |
| ------------------------------------ | ------- | -------------------- |
| Sections                             | ✅      | ❌                   |
| Events                               | ✅      | ❌                   |
| Tags                                 | ✅      | ❌                   |
| `itemName` (libellé libre des items) | ❌      | ✅ (défaut `'task'`) |

Un **Project** est un travail structuré et planifié dans le temps ; une **Collection** est une
liste plate et homogène d'items dont l'utilisateur choisit le nom (« livres », « courses »),
affiché tel quel dans l'UI (« List of {{ itemName }} »).

### Archivage vs suppression

`archived: boolean` sur Project et Collection : l'entité reste consultable (les listes ont un
filtre `?archived=true`) mais est exclue du wizard daily et rendue avec un traitement visuel
distinct (tokens `projectArchived`, `collectionArchived`). La suppression est définitive et
protégée par un `ConfirmDialog`.

## Champs pièges

- **Dates et heures sont toutes des `string`** — `'YYYY-MM-DD'` pour les dates, `'HH:mm'` pour
  les heures. Aucun type ne le distingue d'un datetime ISO. Voir [events.md](events.md).
- **Nommage des horodatages incohérent** selon le domaine : `createdAt` (Task) vs `createdOn`
  (Project, Collection) vs `date` (DailyTask, Feedback) vs `dateJoined` (User).
- **`Task.completedAt` est typé non-optionnel et non-nullable** alors qu'une tâche non complétée
  n'en a pas — le code teste sa présence (`task.utils.ts:6`). Le type est faux.
- **`section.id === 0` est une sentinelle** signifiant « pas de section / General tasks », pas une
  section réelle. Voir [daily-rules.md](daily-rules.md).
- **`EventExtendedModel.project` est typé non-optionnel** mais un Event peut n'avoir aucun projet ;
  l'UI teste défensivement sa présence.

## Rôles utilisateur

Une seule dimension : `User.isStaff`. Elle ouvre la zone `/administration` (liste des
utilisateurs, feedbacks), gardée par `adminGuard`. Aucun autre rôle, aucune permission fine.

## Voir aussi

- [daily-rules.md](daily-rules.md) — les règles de planification journalière
- [events.md](events.md) — les règles temporelles des événements
- [../architecture/api-layer.md](../architecture/api-layer.md) — comment ces modèles sont
  maintenus (à la main)
