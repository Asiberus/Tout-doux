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

### 3. Vérifier l'appartenance de **chaque** relation entrante

Les `PrimaryKeyRelatedField` portent un `queryset` **global** (`Project.objects.all()`,
`Tag.objects.filter(type=…)`) : DRF accepte donc l'`id` d'un objet appartenant à quelqu'un
d'autre. Le contrôle est manuel, un `validate_<champ>` par relation :

```python
# serializers/task/task_post.py:57
def validate_projectId(self, project):
    current_user = self.context.get('request').user
    if project.user.pk is not current_user.pk:
        raise serializers.ValidationError(f'Invalid pk "{project.pk}" - object does not exist.')
    return project
```

Le message imite volontairement l'erreur DRF « objet inexistant » plutôt que d'avouer un refus
d'accès.

> ⚠️ **Ce code contient un bug.** `is not` compare des identités d'objets, pas des valeurs. Il
> ne fonctionne que grâce au cache des petits entiers de CPython et **casse dès que l'`id` de
> l'utilisateur dépasse 256** : l'utilisateur se voit alors refuser ses propres objets. Échec
> fermé, donc pas une faille — mais l'application devient inutilisable pour ces comptes.
> [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R1. **Écrire `!=` dans
> tout nouveau code.**

## Sites d'application

_Maintenue à la main. Ajouter une ligne à chaque nouveau viewset ou sérialiseur d'écriture._

**Querysets restreints (8)** — `views/` : `project`, `collection`, `task`, `section`,
`daily_task`, `event`, `tag`, `common_task`.

**`HiddenField(CurrentUserDefault())` (8)** — `serializers/` : `project_post_or_patch`,
`collection_post_or_patch`, `section_post`, `task_post`, `daily_task_post`,
`event_post_or_patch`, `tag/tag`, `common_task/common_task`.

**Contrôles d'appartenance (13)** — tous écrits avec le `is not` fautif :

| Fichier                                        | Lignes         | Relations contrôlées               |
| ---------------------------------------------- | -------------- | ---------------------------------- |
| `serializers/task/task_post.py`                | 52, 59, 69, 79 | tags, project, section, collection |
| `serializers/daily_task/daily_task_post.py`    | 45, 62, 70     | task, common_task, tags            |
| `serializers/task/task_patch.py`               | 41             | tags                               |
| `serializers/daily_task/daily_task_patch.py`   | 50             | tags                               |
| `serializers/project/project_post_or_patch.py` | 33             | tags                               |
| `serializers/event/event_post_or_patch.py`     | 65             | project                            |
| `serializers/section/section_post.py`          | 27             | project                            |
| `serializers/common_task/common_task.py`       | 33             | tags                               |

## Écarts assumés

| Endroit                                  | Écart                                                            | Statut                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `views/feedback.py:11`                   | `queryset = Feedback.objects.all()` — pas de restriction         | **Voulu** : la lecture est réservée au staff par `CreateOrAdmin`, et un feedback est destiné à l'admin |
| `serializers/feedback/feedback.py:22`    | injecte l'utilisateur dans `create()` au lieu d'un `HiddenField` | Équivalent fonctionnel, seule occurrence. Ne pas imiter                                                |
| `views/user.py:15`                       | `queryset` = tous les utilisateurs                               | **Voulu** : `IsAdminUser` au niveau classe, et les actions `me/…` ignorent le queryset                 |
| `views/preferences.py:11`                | `self.request.user.preferencess.first()`                         | Restreint, mais renvoie `None` si la ligne n'existe pas — [R3](../quality/refactoring-backlog.md)      |
| `serializers/section/section_post.py:10` | `queryset=Project.objects.all()` puis contrôle manuel            | Conforme à la recette, juste plus visible ici                                                          |

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
