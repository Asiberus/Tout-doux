# Glossaire et garanties du serveur

Le vocabulaire de référence, et surtout **la frontière entre ce que le serveur refuse et ce
qu'il laisse passer**. Le client applique des règles supplémentaires qui ne sont pas ici :
[`../../../frontend/docs/domain/glossary.md`](../../../frontend/docs/domain/glossary.md).

## Entités

| Terme               | Définition                                                                                                                                    | Rattaché à                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Project**         | Un chantier durable, décrit, étiquetable, archivable. Contient sections, tâches et événements                                                 | utilisateur                        |
| **Section**         | Un regroupement nommé de tâches **dans** un projet. Pas d'autre attribut                                                                      | projet                             |
| **Collection**      | Une liste plate de tâches, sans section ni événement. Son `itemName` (défaut `task`) permet de renommer l'unité affichée                      | utilisateur                        |
| **Task**            | Une unité de travail, rattachée à **exactement une** cible : projet, section, ou collection                                                   | projet \| section \| collection    |
| **Tag**             | Une étiquette colorée, **typée** : un tag `project` ne s'applique qu'aux projets, un tag `task` aux tâches, tâches récurrentes et daily tasks | utilisateur                        |
| **CommonTask**      | Un **modèle** de tâche récurrente : un nom, des tags, aucun état d'achèvement. N'existe que pour être tiré dans un daily                      | utilisateur                        |
| **DailyTask**       | Une ligne du plan d'un jour. Trois origines exclusives : une `Task`, une `CommonTask`, ou un texte libre                                      | utilisateur                        |
| **Event**           | Une échéance datée, optionnellement rattachée à un projet                                                                                     | utilisateur, projet _(facultatif)_ |
| **Preferences**     | Une ligne par utilisateur, un seul réglage aujourd'hui                                                                                        | utilisateur                        |
| **Feedback**        | Un message de l'utilisateur vers l'administrateur, avec un état « lu »                                                                        | utilisateur                        |
| **UserEmailChange** | Une demande de changement d'e-mail en attente, jetonnée et datée                                                                              | utilisateur                        |

**Archivé** — état booléen porté **uniquement** par `Project` et `Collection`. Il gèle en
lecture seule tout ce qui en dépend : voir [../patterns/archive-guards.md](../patterns/archive-guards.md)
pour la liste exacte de ce qui est refusé.

## Énumérations

_Tables maintenues à la main. Le modèle fait foi ; toute valeur hors liste est rejetée par le
`ChoiceField` que DRF génère depuis `choices`._

**`Tag.Type`** (`models/tag.py:7`) — `project`, `task`.

**`DailyTask.ACTION_CHOICES`** (`models/daily_task.py:13`) — le champ vaut le code, l'API ne
renvoie **jamais** le libellé :

| Code | Libellé (interne, français) |
| ---- | --------------------------- |
| `TH` | Réfléchir                   |
| `WO` | Travailler                  |
| `FI` | Finir                       |

**`Preferences.ProgressWheelMode`** (`models/preferences.py:7`) — `number`, `percent`.

**`Tag.Color`** (`models/tag.py:11`) — liste fermée de 20 valeurs hexadécimales :

|                       |                  |                     |                       |
| --------------------- | ---------------- | ------------------- | --------------------- |
| `#37474F` grey dark   | `#607D8B` grey   | `#880E4F` pink dark | `#9C27B0` purple      |
| `#673AB7` purple dark | `#3F51B5` indigo | `#0D47A1` dark blue | `#2962FF` blue        |
| `#2196F3` light blue  | `#00BCD4` cyan   | `#009688` teal      | `#4CAF50` green       |
| `#8BC34A` light green | `#9E9D24` lime   | `#FFB300` yellow    | `#FB8C00` yellow dark |
| `#FF5722` orange      | `#E53935` red    | `#B71C1C` red dark  | `#794948` brown       |

## Ce que le serveur refuse

| Règle                                                                                                          | Où                                                         | Message                                                                  |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Une tâche doit être liée à un projet, une section **ou** une collection                                        | `task_post.py:87`                                          | `You must link a task to either a project, a section or a collection`    |
| …​et à **une seule** des trois                                                                                 | `task_post.py:93`                                          | `You can't create a task related to a project, a section and collection` |
| Une tâche ou tâche récurrente **déjà présente dans le daily du jour**                                          | `daily_task_post.py`                                       | **409** `This task is already in today's daily`                          |
| Un tag de type `project` ne peut pas être posé sur une tâche                                                   | `queryset=Tag.objects.filter(type=…)` dans chaque `tagIds` | `Invalid pk …`                                                           |
| Deux tags de même `(nom, type)` pour un utilisateur                                                            | contrainte base                                            | erreur d'unicité                                                         |
| Deux tâches récurrentes de même nom pour un utilisateur                                                        | contrainte base                                            | erreur d'unicité                                                         |
| Un objet appartenant à un autre utilisateur                                                                    | 13 `validate_<champ>`                                      | `Invalid pk "…" - object does not exist.`                                |
| Toute écriture sur un projet/collection archivé, ou sur son contenu                                            | 12 sites                                                   | [archive-guards](../patterns/archive-guards.md)                          |
| Longueurs : nom de tâche 150, autres noms 50, tag 20, description 500, `itemName` 15, message de feedback 2000 | modèles                                                    | erreur DRF standard                                                      |

## Ce que le serveur accepte, alors qu'on pourrait croire l'inverse

C'est la partie qui compte : ne pas se reposer sur ces règles côté client.

- **Un tag `task` et un tag `project` peuvent porter le même nom.** La contrainte d'unicité
  inclut le type.
- **Supprimer un projet ou une collection archivé est autorisé**, alors que le modifier ne l'est
  pas, et que supprimer une tâche qu'il contient ne l'est pas non plus.
- **Rien ne relie une tâche à la section _de son propre projet_.** Une `Task` porte `project`
  **ou** `section`, jamais les deux ; il n'y a aucune cohérence à vérifier, mais aucune
  navigation directe tâche → projet quand elle passe par une section.
- **L'exclusivité des trois rattachements n'est vérifiée qu'à la création.** `TaskPatch`
  n'expose pas ces champs, donc la règle tient — mais elle tiendrait par omission, pas par
  contrôle.
- **Un `Event` sans projet est parfaitement valide** : c'est un événement personnel.
- **La `description` d'un projet ou d'une collection peut être absente ou vide.** Le modèle porte
  `default='', blank=True`, donc DRF en fait un champ `required=False, allow_blank=True` ; la valeur
  est une chaîne vide, jamais `null`.
- **`itemName` n'est pas exposé par la liste des collections**, seulement par le détail — voir
  [../architecture/serializers.md](../architecture/serializers.md).
- **Aucune limite au nombre de tags par objet**, ni de projets, ni de tâches.

## Voir aussi

- [daily-rules.md](daily-rules.md) — les règles du plan journalier, les plus denses du domaine
- [events.md](events.md) — la validation des dates et heures d'un événement
- [../architecture/data-model.md](../architecture/data-model.md) — la mécanique sous-jacente
