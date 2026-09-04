# Modèle de données

12 modèles dans `tout_doux/models/`, un par fichier. Les **7 migrations** de
`tout_doux/migrations/` font foi sur le schéma réel ; `makemigrations --check` est propre
(vérifié). Le vocabulaire métier est dans [../domain/glossary.md](../domain/glossary.md) — ici
on ne décrit que la mécanique.

## La classe pivot : `UserRelatedModel`

`models/user.py:20` — base abstraite dont héritent **les 11 autres modèles**, sans exception.

```python
user = models.ForeignKey(User, on_delete=CASCADE,
                         related_name='%(class)ss', related_query_name='%(class)ss',
                         editable=False, default=get_anonymous_user)
```

Trois conséquences structurantes :

1. **`related_name` = nom de classe en minuscules + `s`.** D'où `user.commontasks`,
   `user.dailytasks`, `user.preferencess` (double `s`), `user.useremailchanges`. C'est laid
   mais c'est le contrat : tous les `get_queryset()` s'appuient dessus — voir
   [../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md).
2. **`editable=False`** : le champ est invisible des `ModelSerializer`. Les sérialiseurs
   d'écriture le réintroduisent à la main via `HiddenField(CurrentUserDefault())`.
3. **`default=get_anonymous_user`** (`models/user.py:5`) : à défaut, la ligne est rattachée à un
   utilisateur `username="anonymous"` **créé à la volée**. C'est un vestige de la migration 0004
   (`chore(back): add default for user to ensure migration`, décembre 2023) qui masque
   aujourd'hui les oublis de `user` au lieu de les faire échouer — voir
   [../quality/watched-risks.md](../quality/watched-risks.md) W7.

## Relations

```
User ─┬─< Project ─┬─< Section ─< Task
      │            ├─< Task
      │            └─< Event
      ├─< Collection ─< Task
      ├─< Tag  (type=project → Project.tags ; type=task → Task/CommonTask/DailyTask.tags)
      ├─< CommonTask ─┐
      ├─< Task ───────┼─< DailyTask
      ├─< Preferences │
      ├─< Feedback    │
      └─< UserEmailChange
```

Une `Task` est rattachée à **exactement une** de ces trois cibles : `project`, `section` ou
`collection`. Les trois FK sont `null=True` au niveau base ; **l'exclusivité n'est garantie
que par le sérialiseur** (`serializers/task/task_post.py:87`) et n'est pas revalidée en PATCH.
Voir [../domain/glossary.md](../domain/glossary.md).

## Contraintes et invariants réellement en base

| Modèle            | Contrainte                                                              | Fichier                         |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `User`            | `email` unique (max 100)                                                | `models/user.py:11`             |
| `Tag`             | `UniqueConstraint(user, name, type)`                                    | `models/tag.py:39`              |
| `CommonTask`      | `UniqueConstraint(name, user)`                                          | `models/common_task.py:20`      |
| `DailyTask`       | `UniqueConstraint(date, task)` et `UniqueConstraint(date, common_task)` | `models/daily_task.py:57`       |
| `UserEmailChange` | `token` en clé primaire, table forcée à `tout_doux_user_email_change`   | `models/user_email_change.py:9` |

⚠️ **Les deux contraintes de `DailyTask` ne mordent pas sur les tâches libres.** PostgreSQL
considère deux `NULL` comme distincts : autant de `DailyTask` sans `task` ni `common_task` que
voulu peuvent coexister le même jour. C'est le comportement souhaité, pas un trou.

## Ordonnancements par défaut

| Modèle                           | `ordering`                                          | Effet               |
| -------------------------------- | --------------------------------------------------- | ------------------- |
| `Project`, `Collection`          | `('-created_on', '-pk')`                            | plus récent d'abord |
| `Section`                        | `('-pk',)`                                          | plus récent d'abord |
| `CommonTask`, `DailyTask`, `Tag` | `('pk',)`                                           | ordre de création   |
| `Feedback`                       | `('-date',)`                                        |                     |
| `User`                           | `('date_joined',)`                                  |                     |
| `Event`                          | `('start_date','end_date','start_time','end_time')` |                     |
| `Task`                           | `('-completed_at','-pk')`                           | **voir ci-dessous** |
| `Preferences`                    | **aucun**                                           |                     |

**`Task` — l'ordre dépend du moteur.** `completed_at` est `NULL` tant que la tâche n'est pas
faite, et PostgreSQL trie les `NULL` **en premier** en ordre décroissant (vérifié sur la base du
projet). Résultat : les tâches à faire remontent, puis les tâches faites de la plus récente à la
plus ancienne. C'est le comportement voulu par l'UI, mais il **repose sur un défaut PostgreSQL**,
pas sur une intention écrite. Un changement de moteur inverserait la liste.

**`Tag` trie par `pk`, faute d'horodatage.** Le modèle n'a ni `created_on` ni `created_at` :
« ordre de création » s'écrit donc sur la clé primaire. Ce tri fixe aussi l'ordre des tags
**imbriqués** dans les payloads projet et tâche — il correspond à ce que PostgreSQL renvoyait
déjà en pratique, mais rien ne le garantissait. Il rend enfin la pagination de `TagViewSet`
déterministe, ce qui devient nécessaire : le front demande une page réelle (`size=200`) et non
plus `size=0`.

**Le tri alphabétique est une option de la vue, pas du modèle** : `?sort=name` mappe sur
`(Lower('name'), 'pk')` dans `TagViewSet.SORTS`. `Lower` n'est pas un raffinement — sous la
collation de la base du projet (`en_US.utf8`, PostgreSQL 16), `ORDER BY name` place **toutes** les
majuscules avant toutes les minuscules : mesuré, `('banana', 'Apple', 'cherry', 'Zebra')` ressort
`Apple, Zebra, banana, cherry`. Les noms de tags étant saisis à la main, la casse est irrégulière.
Les caractères accentués, eux, restent après `z` : les intercaler demanderait une collation ICU.

**`Preferences` n'a pas d'ordre** — sans effet, l'endpoint ne sert qu'un objet unique.

## `limit_choices_to` ne protège rien ici

Cinq FK portent `limit_choices_to` (`Task.project`, `Task.collection`, `Section.project`,
`Event.project` : `archived=False` ; `DailyTask.task` : `completed=False`).

**Cette option n'agit que sur les `ModelForm` et l'admin Django.** Elle n'est appliquée ni par
les `PrimaryKeyRelatedField` de DRF, ni par une contrainte base. Toutes ces règles sont
réimplémentées à la main dans les sérialiseurs — c'est le pattern
[../patterns/archive-guards.md](../patterns/archive-guards.md). Ne jamais supposer qu'une FK
« ne peut pas » pointer vers un projet archivé : elle le peut, si le garde manuel est oublié.

## Signaux

Deux récepteurs `pre_delete`, portant **le même nom de fonction** dans deux modules différents
(`models/task.py:53` et `models/common_task.py:24`, tous deux `feed_daily_task_name`) :

> Avant qu'une `Task` ou une `CommonTask` soit supprimée, son nom et ses tags sont recopiés dans
> chaque `DailyTask` qui la référence.

C'est ce qui rend `DailyTask.task` / `.common_task` supprimables en `SET_NULL` sans perdre
l'historique du daily : la ligne devient une tâche « libre » portant l'ancien libellé. Voir
[../domain/daily-rules.md](../domain/daily-rules.md).

## Décisions négatives

- **Pas de suppression logique.** Aucun `deleted_at` ; l'archivage (`archived`) concerne les
  projets et collections, pas les tâches. Une suppression est définitive.
- **Pas d'index explicite** au-delà de ceux créés par les FK et les contraintes d'unicité.
  Justifié par le volume — voir [../quality/watched-risks.md](../quality/watched-risks.md) W8.
- **Pas de table d'audit ni d'horodatage systématique.** Seuls `Task` (`created_at`,
  `completed_at`), `Project`/`Collection` (`created_on`) et `Feedback`/`DailyTask` (`date`)
  datent quoi que ce soit.

## Voir aussi

- [../domain/glossary.md](../domain/glossary.md) — le sens métier des entités
- [../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md) — comment le
  cloisonnement par utilisateur est réellement obtenu
- [serializers.md](serializers.md) — où vivent les validations
