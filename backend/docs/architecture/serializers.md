# Sérialiseurs

41 modules, un par couple (ressource, usage), regroupés en 10 sous-packages. **C'est la couche
qui porte la logique métier** de ce backend : validation, contrôle d'appartenance, gardes
d'archivage et effets de bord vivent ici, pas dans les vues.
[adr/0001](../adr/0001-serializer-per-action.md) explique pourquoi.

## La convention centrale : un sérialiseur par action

`get_serializer_class()` de chaque viewset choisit selon `self.action`. Les suffixes sont
stables dans tout le projet :

| Suffixe               | Rôle                                         | Base                         |
| --------------------- | -------------------------------------------- | ---------------------------- |
| _(aucun)_             | forme de lecture canonique                   | `ReadOnlyModelSerializer`    |
| `List`                | lecture de liste, **enrichie d'agrégats**    | hérite de la forme canonique |
| `Detail` / `Extended` | lecture enrichie de **relations imbriquées** | idem                         |
| `Post`                | création                                     | `ModelSerializer` nu         |
| `Patch`               | modification                                 | `ModelSerializer` nu         |
| `PostOrPatch`         | les deux, quand les règles sont identiques   | `ModelSerializer` nu         |

| Ressource                              | Lecture                                     | Liste                                | Détail                                        | Écriture                                                                                                   |
| -------------------------------------- | ------------------------------------------- | ------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Project                                | `ProjectSerializer`                         | `ProjectList` — 3 compteurs calculés | `ProjectDetail` — sections, tasks, events     | `ProjectPostOrPatch`                                                                                       |
| Collection                             | `CollectionSerializer`                      | `CollectionList` — 2 compteurs       | `CollectionDetail` — tasks                    | `CollectionPostOrPatch`                                                                                    |
| Task                                   | `TaskSerializer`                            | —                                    | `TaskExtended` — project, section, collection | `TaskPost`, `TaskPatch`                                                                                    |
| Section                                | `SectionSerializer` — project               | —                                    | `SectionTasks` — tasks                        | `SectionPost`, `SectionPatch`                                                                              |
| Event                                  | `EventSerializer`                           | —                                    | `EventExtended` — project                     | `EventPostOrPatch`                                                                                         |
| DailyTask                              | `DailyTaskSerializer`                       | `DailySummary` — agrégats par jour   | —                                             | `DailyTaskPost`, `DailyTaskPatch`                                                                          |
| Tag, CommonTask, Preferences, Feedback | **un sérialiseur mixte** lecture + écriture |                                      |                                               |                                                                                                            |
| User                                   | `UserSerializer`                            |                                      |                                               | `UserRegister`, `UserActivation`, `UserPatch`, `UserAccountState`, `UserChangePassword`, `UserEmailChange` |

## Les trois mécanismes à connaître avant d'écrire

### 1. `ReadOnlyModelSerializer` neutralise l'écriture

`serializers/common.py` — `create()` et `update()` sont redéfinis pour **retourner `None`**.
Toute forme de lecture en hérite. Conséquence : si on passe par erreur un sérialiseur de
lecture à un `save()`, **rien ne se passe et aucune erreur n'est levée**. C'est un garde-fou
volontaire, mais il échoue en silence.

### 2. Les sérialiseurs d'écriture répondent avec **un autre** sérialiseur

Tous les `*Post` / `*Patch` / `*PostOrPatch` redéfinissent `to_representation()` pour déléguer à
la forme de lecture :

```python
# serializers/task/task_post.py:46
def to_representation(self, instance):
    return TaskSerializer(instance).data
```

Donc **la forme d'entrée et la forme de sortie d'un POST/PATCH n'ont rien à voir** : on envoie
`tagIds`, `projectId` ; on reçoit `tags` (objets complets), sans `projectId`. Ne pas chercher
un `fields` qui contiendrait les deux.

Deux cas particuliers :

- `SectionPost` et `SectionPatch` répondent avec `SectionTasksSerializer` (donc avec la liste
  des tâches), pas avec `SectionSerializer`.
- `EventPostOrPatchSerializer.to_representation` (`serializers/event/event_post_or_patch.py:54`)
  **lit un query param** pour choisir sa forme de sortie : `?extended=true` renvoie
  `EventExtended`, sinon `EventSerializer`. Un sérialiseur qui dépend de la requête HTTP est
  une exception unique dans le projet — ne pas la généraliser.

### 3. camelCase à la main, sur chaque champ

Il n'y a **aucun** renommage automatique (pas de `djangorestframework-camel-case`). Chaque champ
multi-mot est redéclaré :

```python
createdOn = serializers.DateField(source='created_on')
tagIds    = serializers.PrimaryKeyRelatedField(source='tags', queryset=..., many=True)
```

Oublier la redéclaration expose le nom `snake_case` sans que rien ne le signale. Les query
params, eux, n'ont pas été uniformisés : `start_date`, `has_uncompleted_task` cohabitent avec
`excludeId`.

## Où va quelle validation

| Type de règle                          | Emplacement                                                  | Exemple                     |
| -------------------------------------- | ------------------------------------------------------------ | --------------------------- |
| L'objet référencé m'appartient-il ?    | `validate_<champ>`                                           | `task_post.py:57`           |
| La cible est-elle archivée ?           | `validate_<champ>` (création) et `validate()` (modification) | `task_patch.py:46`          |
| Cohérence entre champs                 | `validate()`                                                 | `event_post_or_patch.py:73` |
| Effet de bord sur une **autre** entité | `update()` / `save()`                                        | `daily_task_patch.py:31`    |
| Force du mot de passe                  | `validate_password()` de Django, appelé à la main            | `user_register.py:32`       |

Les deux premières lignes sont des patterns à part entière :
[../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md) et
[../patterns/archive-guards.md](../patterns/archive-guards.md).

## Contraintes non évidentes

- **Les sérialiseurs `*List` sont couplés à l'annotation de leur vue.** `ProjectListSerializer`
  et `CollectionListSerializer` déclarent leurs compteurs en `IntegerField(source=…)` : ils
  lèvent une `AttributeError` sur une instance non annotée. Même chose pour
  `DailySummarySerializer`, qui lit un dictionnaire préparé par `daily_summary_counts`. C'est
  volontaire — aucun `SerializerMethodField` du projet ne doit faire de requête — et c'est ce
  qui impose de ne les instancier que depuis leur vue.
  Recette : [../patterns/query-optimization.md](../patterns/query-optimization.md).
- **`UserRegisterSerializer.create` (`user_register.py:28`) construit l'utilisateur avec le mot
  de passe en clair dans `validated_data`**, puis appelle `set_password()` avant `save()`. Le
  résultat est correct aujourd'hui, mais l'ordre des trois lignes est la seule chose qui empêche
  d'écrire un mot de passe en clair en base. Surveillé : W9.
- **`ResetPasswordRequestSerializer.validate` retourne un `User`, pas un dict.**
  `serializer.validated_data` est donc une instance de modèle, et `views/auth.py:57` en dépend.
  Unique dans le projet.
- **`TaskPatchSerializer.update` injecte `completed_at`** dans `validated_data`
  (`task_patch.py:28`) parce que le champ est `editable=False` et donc invisible du sérialiseur.
  Même mécanisme pour la propagation de complétion dans `DailyTaskPatchSerializer.update`.
- **`CollectionListSerializer` n'expose pas `itemName`** alors que `CollectionSerializer` et
  `CollectionDetailSerializer` le font, et que le type front `CollectionList` le déclare. Aucun
  composant ne le lit sur une liste aujourd'hui :
  [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R13.
- **`FeedbackSerializer` est le seul à ne pas utiliser `HiddenField(CurrentUserDefault())`** :
  il injecte l'utilisateur dans `create()` (`feedback/feedback.py:22`). Voir
  [../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md).
- **Deux classes n'ont pas le suffixe `Serializer`** : `UserAccountState` et
  `UserChangePassword`. Écart de nommage, pas de conséquence technique.

## Décisions négatives

- **Pas de `ModelViewSet` avec un sérialiseur unique.** Le coût est 41 fichiers ; le bénéfice
  est qu'aucun champ d'écriture ne fuit jamais en lecture et inversement —
  [adr/0001](../adr/0001-serializer-per-action.md).
- **Pas de sérialiseur imbriqué en écriture.** Les relations s'écrivent toujours par
  `PrimaryKeyRelatedField` (`tagIds`, `projectId`). Aucun `create()` n'écrit dans deux tables.
- **Pas de mixin partagé pour les contrôles répétés.** Les 13 contrôles d'appartenance et les 12
  gardes d'archivage sont copiés-collés. C'est ce qui a laissé passer le bug R1 —
  [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).

## Voir aussi

- [../patterns/query-optimization.md](../patterns/query-optimization.md) — compter et précharger
  depuis la vue, et pourquoi
- [api-surface.md](api-surface.md) — quel sérialiseur est appelé par quel endpoint
- [../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md) — la recette complète
- [../domain/events.md](../domain/events.md) — la validation la plus dense du projet
