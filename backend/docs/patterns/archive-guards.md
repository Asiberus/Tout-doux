# Gardes d'archivage

**Problème** — « un projet ou une collection archivé est en lecture seule, et cette
inertie se propage à tout ce qui lui est rattaché ». Aucune contrainte base ni permission
n'exprime cette règle : elle est **réécrite à la main dans 12 endroits**.

## La règle, telle qu'elle est réellement appliquée

`Project.archived` et `Collection.archived` sont les deux seuls porteurs. La propagation se fait
par chemin : `task → project`, `task → section → project`, `task → collection`,
`event → project`, `section → project`, `daily_task → task → …`.

| Action                                                  | Sur cible archivée                                      | Message                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Créer un projet/collection déjà archivé                 | **refusé**                                              | `You can't create a archived project`                                          |
| Modifier un projet/collection archivé                   | **refusé**, sauf `archived: false`                      | `You can't edit an archived project`                                           |
| **Supprimer** un projet/collection archivé              | **autorisé**                                            | —                                                                              |
| Créer une section, une tâche ou un événement dedans     | **refusé**                                              | `You can't create a task to an archived project`                               |
| Modifier une section, une tâche ou un événement dedans  | **refusé**                                              | `You can't edit a task related to an archived project`                         |
| Supprimer une section, une tâche ou un événement dedans | **refusé** (403)                                        | `This task is related to either an archived project or an archived collection` |
| Créer un daily task depuis une tâche archivée           | **refusé**                                              | `You can't create a daily task with a task related to an archived project`     |
| Cocher un daily task dont la tâche est archivée         | **autorisé**, mais la tâche source **n'est pas** cochée | —                                                                              |

Les deux lignes en gras sont les surprises : **on peut supprimer un projet archivé mais pas la
tâche qu'il contient**, et l'archivage n'empêche pas de clore un daily task, il empêche
seulement la propagation. Les deux semblent voulus ; ni l'un ni l'autre n'est commenté dans le
code.

## Recette

Deux emplacements selon le moment :

**À la création** — dans le `validate_<champ>` qui contrôle déjà l'appartenance, juste après :

```python
# serializers/task/task_post.py:62
if project.archived:
    raise serializers.ValidationError("You can't create a task to an archived project")
```

**À la modification** — dans `validate()`, en interrogeant `self.instance`, car la cible n'est
pas dans les données entrantes :

```python
# serializers/task/task_patch.py:46
if self.instance.project and self.instance.project.archived:
    raise serializers.ValidationError("You can't edit a task related to an archived project")
elif self.instance.section and self.instance.section.project.archived:
    ...
```

**À la suppression** — dans `destroy()` de la vue, avec `PermissionDenied` (403) et non
`ValidationError` (400) :

```python
# views/task.py:24
def destroy(self, request, *args, **kwargs):
    instance = self.get_object()
    if (instance.project and instance.project.archived) or ...:
        raise PermissionDenied('This task is related to ...')
```

**Un nouveau modèle rattaché à un projet doit donc écrire trois gardes**, pas un.

## Sites d'application

_Maintenue à la main. Toute nouvelle entité rattachée à un projet ou une collection s'ajoute
ici._

| Fichier                                              | Ligne      | Moment                                  |
| ---------------------------------------------------- | ---------- | --------------------------------------- |
| `serializers/project/project_post_or_patch.py`       | 38         | création + modification                 |
| `serializers/collection/collection_post_or_patch.py` | 24         | création + modification                 |
| `serializers/section/section_post.py`                | 30         | création                                |
| `serializers/section/section_patch.py`               | 17         | modification                            |
| `serializers/task/task_post.py`                      | 62, 72, 82 | création (project, section, collection) |
| `serializers/task/task_patch.py`                     | 46         | modification                            |
| `serializers/event/event_post_or_patch.py`           | 68, 84     | création, modification                  |
| `serializers/daily_task/daily_task_post.py`          | 51, 54     | création                                |
| `serializers/daily_task/daily_task_patch.py`         | 36         | propagation conditionnelle              |
| `views/task.py`                                      | 24         | suppression                             |
| `views/section.py`                                   | 24         | suppression                             |
| `views/event.py`                                     | 54         | suppression                             |

## Écarts assumés

- **`ProjectViewSet` et `CollectionViewSet` n'ont pas de garde de suppression** : les seuls
  viewsets à utiliser le `destroy` de DRF tel quel. Voir la table ci-dessus.
- **`TagViewSet` et `CommonTaskViewSet` n'ont aucun garde** : les tags et tâches récurrentes ne
  dépendent d'aucun projet. Normal.
- **Désarchiver et modifier au même moment est accepté** : `{"archived": false, "name": "x"}`
  passe la validation de `project_post_or_patch.py:42`, qui ne rejette que l'absence de
  `archived` ou `archived: true`. Non testé, comportement probablement involontaire mais sans
  conséquence.
- **`limit_choices_to={'archived': False}`** sur 4 FK ne fait rien à l'exécution — voir
  [../architecture/data-model.md](../architecture/data-model.md). Ne jamais s'appuyer dessus.

## Voir aussi

- [ownership-and-scoping.md](ownership-and-scoping.md) — l'autre règle répliquée à la main
- [../domain/glossary.md](../domain/glossary.md) — ce que « archivé » veut dire pour
  l'utilisateur
- [`../../../frontend/docs/domain/glossary.md`](../../../frontend/docs/domain/glossary.md) —
  ce que l'UI empêche en plus
