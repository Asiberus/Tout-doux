# Cloisonnement par utilisateur

**Problème** — chaque ligne appartient à un utilisateur, et aucune permission au niveau objet
n'existe dans ce projet. L'isolation repose entièrement sur trois gestes, à faire **tous les
trois**. En oublier un ouvre une fuite entre comptes.

## Recette

### 1. Restreindre le queryset de la vue

```python
# views/project.py:24
def get_queryset(self):
    return self.request.user.projects.all()
```

Le `related_name` est `<nomdeclasse en minuscules>s` — voir
[../architecture/data-model.md](../architecture/data-model.md). C'est ce qui protège `retrieve`,
`update` et `destroy` : un `pk` étranger produit un **404**, pas un 403.

### 2. Injecter le propriétaire à la création

```python
# serializers/task/task_post.py:33
user = serializers.HiddenField(default=serializers.CurrentUserDefault())
```

Obligatoire dans `Meta.fields`. `UserRelatedModel.user` étant `editable=False`, un
`ModelSerializer` ne le verra jamais tout seul ; sans cette ligne, la ligne créée est rattachée
à l'utilisateur `anonymous` **sans aucune erreur**.

### 3. Déclarer chaque relation entrante en `OwnedPrimaryKeyRelatedField`

Un `PrimaryKeyRelatedField` nu cherche dans un `queryset` **global** (`Project.objects.all()`,
`Tag.objects.filter(type=…)`) : il accepte donc l'`id` d'un objet appartenant à quelqu'un
d'autre. `OwnedPrimaryKeyRelatedField` (`serializers/common.py`) restreint ce queryset à
l'utilisateur de la requête :

```python
# serializers/task/task_post.py:16
projectId = OwnedPrimaryKeyRelatedField(
    source='project',
    queryset=Project.objects.all(),
    required=False,
    allow_null=True
)
```

Un `id` étranger reçoit l'erreur DRF native `Invalid pk "…" - object does not exist.` : le refus
d'accès n'est pas avoué. Le `validate_<champ>` ne sert plus qu'aux gardes d'archivage et d'état
([archive-guards.md](archive-guards.md)).

## Sites d'application

_Maintenue à la main. Ajouter une ligne à chaque nouveau viewset ou sérialiseur d'écriture._

**Querysets restreints (8)** — `views/` : `project`, `collection`, `task`, `section`,
`daily_task`, `event`, `tag`, `common_task`.

**`HiddenField(CurrentUserDefault())` (8)** — `serializers/` : `project_post_or_patch`,
`collection_post_or_patch`, `section_post`, `task_post`, `daily_task_post`,
`event_post_or_patch`, `tag/tag`, `common_task/common_task`.

**Relations déclarées en `OwnedPrimaryKeyRelatedField` (13)** :

| Fichier                                        | Relations                                  |
| ---------------------------------------------- | ------------------------------------------ |
| `serializers/task/task_post.py`                | tagIds, projectId, sectionId, collectionId |
| `serializers/daily_task/daily_task_post.py`    | taskId, commonTaskId, tagIds               |
| `serializers/task/task_patch.py`               | tagIds                                     |
| `serializers/daily_task/daily_task_patch.py`   | tagIds                                     |
| `serializers/project/project_post_or_patch.py` | tagIds                                     |
| `serializers/event/event_post_or_patch.py`     | projectId                                  |
| `serializers/section/section_post.py`          | projectId                                  |
| `serializers/common_task/common_task.py`       | tagIds                                     |

**Ancres d'un déplacement** — `services/ordering.py`, `move` : elles sont cherchées dans la liste
**et** parmi les lignes de l'utilisateur ; une ancre d'un autre utilisateur donne un 409.

## Écarts assumés

| Endroit                               | Écart                                                            | Statut                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `views/feedback.py:11`                | `queryset = Feedback.objects.all()` — pas de restriction         | **Voulu** : la lecture est réservée au staff par `CreateOrAdmin`, et un feedback est destiné à l'admin |
| `serializers/feedback/feedback.py:22` | injecte l'utilisateur dans `create()` au lieu d'un `HiddenField` | Équivalent fonctionnel, seule occurrence. Ne pas imiter                                                |
| `views/user.py:15`                    | `queryset` = tous les utilisateurs                               | **Voulu** : `IsAdminUser` au niveau classe, et les actions `me/…` ignorent le queryset                 |
| `views/preferences.py:11`             | `self.request.user.preferencess.first()`                         | Restreint, mais renvoie `None` si la ligne n'existe pas — [R3](../quality/refactoring-backlog.md)      |

## Ce qui ne protège **pas**

- **`limit_choices_to` sur une FK** : n'agit que sur les `ModelForm` et l'admin. Voir
  [../architecture/data-model.md](../architecture/data-model.md).
- **`UserRelatedModel.user.default`** : rattache silencieusement à `anonymous` au lieu d'échouer.
- **Le `related_name` d'une relation imbriquée** : `ProjectDetailSerializer` expose
  `project.sections`, `project.tasks`, `project.events` sans refiltrer par utilisateur. C'est
  sûr **parce que** le projet lui-même vient d'un queryset restreint, pas par construction.

## Voir aussi

- [adding-an-endpoint.md](adding-an-endpoint.md) — la recette complète, dont ces 3 gestes
- [archive-guards.md](archive-guards.md) — l'autre règle répliquée à la main
- [../adr/0002-scoping-by-queryset.md](../adr/0002-scoping-by-queryset.md) — pourquoi pas de
  permission d'objet
