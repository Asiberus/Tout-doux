# Le plan journalier — ce que le serveur garantit

Le « daily » est la mécanique la plus contrainte du domaine. Ce fichier recense **ce que le
serveur refuse**. Les règles que seule l'interface impose sont dans
[`../../../frontend/docs/domain/daily-rules.md`](../../../frontend/docs/domain/daily-rules.md) —
ne pas confondre les deux, c'est précisément ce qui fait prendre une contrainte d'UI pour une
garantie.

## Les trois origines d'un `DailyTask`

Une ligne du plan vient de l'une des trois, **jamais de deux** :

| Origine                  | Champs remplis    | Nom et tags                              |
| ------------------------ | ----------------- | ---------------------------------------- |
| Une **tâche** existante  | `task`            | hérités de la tâche, **non modifiables** |
| Une **tâche récurrente** | `common_task`     | hérités, **non modifiables**             |
| Une **saisie libre**     | `name` (+ `tags`) | propres à la ligne, modifiables          |

## À la création — `serializers/daily_task/daily_task_post.py`

| Règle                                                       | Ligne  | Message                                                                           |
| ----------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Pas de `taskId` **et** de `commonTaskId` ensemble           | 76     | `You can't create a daily task related to a task and a common task`               |
| Une origine liée interdit `name` et `tags`                  | 78     | `You can't create a daily task related to a task/common task with a name or tags` |
| Il faut au moins une origine                                | 82     | `You must provide a name or a task id or a common task id to create a daily task` |
| La tâche source ne doit pas être déjà terminée              | 49     | `You can't link a completed task to a daily task`                                 |
| Ni appartenir à un projet ou une collection archivé         | 51, 54 | voir [archive-guards](../patterns/archive-guards.md)                              |
| La tâche / tâche récurrente doit appartenir à l'utilisateur | 45, 62 | `Invalid pk …`                                                                    |

**`date` n'est pas saisissable.** Le champ est `auto_now_add` : une ligne est toujours créée
pour « aujourd'hui ». Il est donc impossible de planifier à l'avance ou de compléter un jour
passé par l'API.

**La même tâche ne peut pas être tirée deux fois le même jour** : contraintes
`UniqueConstraint(date, task)` et `(date, common_task)`. En revanche, autant de lignes libres
que voulu — les `NULL` n'entrent pas en conflit. Voir
[../architecture/data-model.md](../architecture/data-model.md).

Le doublon est refusé par une garde écrite à la main dans `validate()`, qui répond **409**
(`AlreadyInDailyError`, `exceptions.py`). Elle est nécessaire parce que `date` est en
`auto_now_add` : le champ est hors du sérialiseur, DRF ne peut donc pas dériver la contrainte
d'unicité, et l'insertion remontait auparavant en **500**. Deux POST simultanés peuvent encore
passer la garde et lever un `IntegrityError`.

## À la modification — `serializers/daily_task/daily_task_patch.py`

| Règle                                                              | Ligne | Message                                                          |
| ------------------------------------------------------------------ | ----- | ---------------------------------------------------------------- |
| Un jour passé n'accepte **que** `completed`                        | 57    | `You can't edit a closed daily task`                             |
| Une ligne d'origine liée n'accepte **que** `completed` et `action` | 62    | `You can't edit a daily task related to a task or a common task` |

Corollaire : `name` et `tags` ne sont modifiables que sur une ligne **libre**, et **le jour
même**.

> La troisième branche (`elif 'task' in data or 'common_task' in data`, ligne 64) est **du code
> mort** : `Meta.fields` ne contient ni `task` ni `common_task`, donc ces clés ne peuvent jamais
> apparaître dans `data`. Inoffensif, mais ne pas le prendre pour une protection active.

## La propagation de l'achèvement

C'est la règle la moins évidente du projet. Cocher un daily task **peut** cocher la tâche
source, sous **quatre** conditions simultanées (`daily_task_patch.py:31`) :

1. la ligne a une `task` source (une `common_task` ne propage jamais) ;
2. `completed` fait partie de la modification ;
3. l'`action` est **vide ou `FI` (Finir)** — une ligne « Réfléchir » ou « Travailler » ne clôt
   jamais la tâche source ;
4. la tâche n'appartient pas à un projet ou une collection archivé.

Si une seule condition manque, la ligne du daily est cochée **et la tâche source reste
ouverte**. C'est voulu : « j'ai travaillé dessus aujourd'hui » n'est pas « c'est fini ».

Dans le sens inverse, il n'y a **aucune** propagation : terminer une tâche via `task/{pk}/`
laisse ses daily tasks inchangés.

## La suppression

- **Un daily task ne peut être supprimé que le jour même** (`views/daily_task.py:63`, 403
  `The daily task is not related to the current day`).
- **Supprimer la tâche source ne supprime pas la ligne du daily.** Un signal `pre_delete`
  (`models/task.py:53` et `models/common_task.py:24`) recopie d'abord le nom et les tags dans
  chaque `DailyTask` concerné ; la FK est ensuite mise à `NULL` (`on_delete=SET_NULL`). La ligne
  **devient une ligne libre** portant l'ancien libellé, et redevient donc modifiable — mais
  seulement si elle date du jour.

## Le report de la veille — `daily-task/carry-over…`

Deux endpoints, sans corps ni paramètre : `carry-over-candidates/` (GET) dit ce qui serait
copié, `carry-over/` (POST) crée les copies et les renvoie en **201**. La sélection est faite
par `queries.py:daily_carry_over_candidates`, la copie par `views/daily_task.py`, dans une
`transaction.atomic()`.

Une ligne de la veille est copiable si elle n'est **pas cochée**, et selon son origine :

- **`task`** — refusée si la tâche est terminée, si son projet, le projet de sa section ou sa
  collection est archivé, ou si elle est déjà planifiée aujourd'hui.
- **`common_task`** — refusée seulement si elle est déjà planifiée aujourd'hui.
- **Saisie libre** — jamais refusée : aucune contrainte d'unicité ne couvre les lignes libres.

**L'état de la tâche source est lu à l'appel, pas à la veille.** Une tâche cochée depuis un
projet dans la journée d'hier au soir n'est donc pas reportée. C'est la raison d'être du GET :
le client ne peut pas trancher lui-même sans rejouer ces règles.

**Le POST n'est pas idempotent pour les lignes libres.** Les origines liées sont protégées par
les contraintes d'unicité et par l'exclusion ci-dessus ; deux appels successifs recréent en
revanche les lignes libres en double. Le client s'en prémunit en verrouillant son bouton
pendant la requête, rien côté serveur ne le fait.

L'`action` du jour (`TH` / `WO` / `FI`) est recopiée telle quelle. Les copies conservent l'ordre
de la veille (`Meta.ordering = ('pk',)`).

⚠️ La veille est calculée comme `date.today() - 1 jour`, donc en UTC — voir la section sur les
fuseaux en fin de fichier.

## Le résumé — `daily-task/summary/`

`start_date` et `end_date` sont **obligatoires**, au format ISO ; sinon 400 (`You must provide a
start date and an end date` / `Date not valid.`). L'intervalle est inclusif et
`utils/date.py:7` accepte un ordre inversé (il itère à rebours). Chaque jour renvoie
`totalTask`, `totalTaskCompleted`, `totalEvent`. Réponse **non paginée** ; aucune borne n'est
imposée à l'étendue demandée — voir [../quality/watched-risks.md](../quality/watched-risks.md) W8.

## ⚠️ « Aujourd'hui » est calculé en UTC

`date.today()` (garde de suppression, garde de modification) et `auto_now_add` s'appuient sur
l'horloge du conteneur, qui est en **UTC**, alors que `TIME_ZONE` vaut `Europe/Paris`. Entre
minuit et 2 h du matin heure de Paris (1 h en hiver), le serveur est encore la veille :
l'utilisateur voit le plan du nouveau jour côté client, mais le serveur refuse d'y supprimer une
ligne et en crée de nouvelles datées de la veille.
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R4.

## Voir aussi

- [glossary.md](glossary.md) — `Task` vs `CommonTask` vs `DailyTask`
- [../architecture/serializers.md](../architecture/serializers.md) — où vivent ces validations
