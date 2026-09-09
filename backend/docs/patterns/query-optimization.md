# Compter et précharger sans requêtes N+1

**Problème** — un sérialiseur de liste ou de détail déclenche une requête par objet sérialisé, ce
qui ne produit **aucune erreur** : seulement de la lenteur, invisible à la relecture comme à
`manage.py check`.

## La règle

**Un `SerializerMethodField` ne fait jamais de requête.** Tout comptage et tout accès à une
relation vient de la vue, par `annotate`, `select_related` ou `prefetch_related`.

Le corollaire est un couplage à assumer : un sérialiseur `*List` ne fonctionne plus que sur un
queryset annoté. Il lèvera une `AttributeError` sur une instance nue. C'est le prix, et il est
volontaire — voir [../architecture/serializers.md](../architecture/serializers.md).

## Recette

### 1. Choisir entre `Count` et une sous-requête

> **Tout compteur servi par un endpoint de liste → sous-requête scalaire (`scalar_count`).** > `Count` ne reste acceptable que pour un agrégat ponctuel, hors d'un queryset trié ou paginé.

Le critère a été durci le 28/08/2026, après une régression en production : `Count` avait été
retenu pour `CollectionViewSet` au nom de la lisibilité, en n'acceptant qu'un seul des trois
coûts ci-dessous. Le troisième s'est vu à l'écran.

**Trois coûts cachés**, tous mesurés :

**Le produit cartésien.** Deux `Count` sur deux relations vers-plusieurs différentes joignent
deux fois : sur un projet à 3 tâches directes et 4 tâches en section, les deux compteurs
renvoient **24**, pas 7 — la jointure produit 3 × 4 = 12 lignes et chaque `Count` en compte 12.
`distinct=True` corrige `Count`, mais pas `Sum` ni `Avg`, et fait payer un tri.

**Le `COUNT(*)` de la pagination.** Django enveloppe le comptage dans une sous-requête groupée
dès qu'une annotation contient un agrégat (`sql/query.py`, `has_existing_aggregation`) :

| Annotation            | SQL du `.count()` de pagination                                    |
| --------------------- | ------------------------------------------------------------------ |
| sous-requête scalaire | `SELECT COUNT(*) FROM project` — plat, sous-requêtes non exécutées |
| `Count('tasks')`      | `SELECT COUNT(*) FROM (… LEFT JOIN task … GROUP BY 1) subquery`    |

Une sous-requête scalaire a `contains_aggregate = False`, donc Django élide entièrement
l'annotation du comptage.

**La perte de `Meta.ordering`** — c'est le plus dangereux, parce qu'il se voit à l'écran et
nulle part ailleurs. Dès qu'un `GROUP BY` est produit, Django **supprime** le tri par défaut du
modèle, sans erreur ni avertissement (`sql/compiler.py`) :

```python
result.append("GROUP BY %s" % ", ".join(grouping))
if self._meta_ordering:
    order_by = None
```

`_meta_ordering` n'est renseigné que si le tri vient de `Meta.ordering` : un `order_by()`
explicite, lui, survit. Une sous-requête scalaire ne produit aucun `GROUP BY` et ne pose donc
jamais la question. Le filet est
`test_the_list_is_ordered_like_the_model`, dans `test_api_contract.py`.

### 2. Écrire la sous-requête avec `scalar_count`

`tout_doux/queries.py` porte l'aide, qui applique la recette documentée par Django (« Using
aggregates within a Subquery expression ») :

```python
# views/project.py
task_count=(
    scalar_count(Task.objects.filter(project=OuterRef('pk')), 'project')
    + scalar_count(Task.objects.filter(section__project=OuterRef('pk')), 'section__project')
),
```

Deux pièges y sont déjà traités, et ne doivent pas être « simplifiés » :

- **`order_by()`** vide le tri hérité du `Meta` du modèle, que Django ajouterait sinon à la
  sous-requête.
- **`Coalesce(..., 0)`** : un `GROUP BY` sans groupe ne renvoie pas `0`, il ne renvoie **aucune
  ligne**, et la sous-requête vaut alors `NULL`. Un projet sans tâche servirait `null` au front,
  qui divise `completedTaskCount / taskCount`.

`Count` n'a pas ce problème : sur une relation vide il renvoie bien `0`.

### 3. Filtrer par `Exists`, jamais par `filter().distinct()`

Une jointure sur une relation vers-plusieurs duplique la ligne porteuse, et `DISTINCT` défait
ensuite ce qu'elle a produit. `EXISTS` s'arrête à la première ligne trouvée :

```python
# views/collection.py
queryset.filter(Exists(Task.objects.filter(collection=OuterRef('pk'), completed=False)))
```

Le `DISTINCT` a un second effet : il ramène le produit cartésien dès qu'on ajoute un `annotate`.

### 4. Faire correspondre les préchargements à l'arbre de sérialisation

Un lookup par `many=True` de l'arbre, ni plus ni moins. `select_related` pour les relations
vers-un (jointure dans la requête principale), `prefetch_related` pour les vers-plusieurs
(requête plate supplémentaire). Les tags sont des M2M : jamais de `select_related` dessus.

⚠️ **Le cache de préchargement se contourne en silence.** `.all()`, `len()` et `.count()`
l'utilisent ; `.filter()`, `.exclude()`, `.order_by()` et `.exists()` clonent le queryset et
repartent en base. C'est pourquoi `collection.tasks.filter(completed=True).count()` ne se
corrige **pas** par un `prefetch_related('tasks')` — seule l'annotation le résout.

### 5. Restreindre par action, mais sur mesure

Précharger coûte des requêtes fixes ; les restreindre aux actions qui en profitent est
souhaitable, mais la liste blanche `('list', 'detailed', 'retrieve')` n'est pas universelle.
`DailyTaskViewSet` répond aux écritures avec la chaîne imbriquée complète, via
`to_representation` : mesuré, un `PATCH` coûte **7** requêtes en gardant les préchargements et
**9** en les restreignant aux lectures. Seul `destroy`, qui ne lit qu'un champ, y perd — d'où
`if self.action != 'destroy'` et non une liste blanche.

Précharger sur une écriture ne sert jamais des données périmées : `add`, `remove` et `clear`
purgent le cache (`related_descriptors.py`, `_remove_prefetched_objects`).

### 6. Quand l'entité ne se groupe pas par la clé demandée

Un `GROUP BY` suppose qu'une ligne appartient à un seul groupe. Ce n'est pas toujours vrai : un
événement à cheval sur trois jours appartient à trois dates. La recette est alors de rapatrier
les **bornes** en une requête et de balayer en Python — voir `daily_summary_counts` dans
`tout_doux/queries.py`.

## Étudié, non implémenté : trier les tags par nombre d'usages

Étudié le 04/09/2026, **non retenu**. Consigné parce que la forme naïve n'est pas seulement
lente, elle est **fausse**.

`Tag` porte **quatre** relations inverses vers-plusieurs, que `Tag.Type` partitionne : un tag
`project` n'est utilisé que par `projects`, un tag `task` par `tasks`, `daily_tasks` **et**
`common_tasks`. Le compteur est donc une **somme sur trois ou quatre relations**, ce qui déclenche
les trois coûts ci-dessus à la fois — le premier de façon rédhibitoire :
`Count('tasks') + Count('daily_tasks') + Count('common_tasks')` multiplie les cardinalités entre
elles et ne renvoie pas un compte trop lent, il renvoie un compte faux.

La forme correcte :

```python
usage_count=(
    scalar_count(Project.objects.filter(tags=OuterRef('pk')), 'tags')
    + scalar_count(Task.objects.filter(tags=OuterRef('pk')), 'tags')
    + scalar_count(DailyTask.objects.filter(tags=OuterRef('pk')), 'tags')
    + scalar_count(CommonTask.objects.filter(tags=OuterRef('pk')), 'tags')
)
```

Trois points à respecter le jour où on le fait :

- **Ne pas sérialiser le compteur** s'il ne sert qu'à trier — on évite le couplage
  sérialiseur ↔ annotation de [../architecture/serializers.md](../architecture/serializers.md).
- **Le brancher comme une entrée de `TagViewSet.SORTS`**
  (`'usage': ('-usage_count', Lower('name'))`), jamais comme `Meta.ordering` : un `order_by()`
  explicite survit à un `GROUP BY`, `Meta.ordering` non.
- **N'annoter que quand ce tri est demandé**, pour ne pas faire payer quatre sous-requêtes aux
  autres appels.

L'alternative dénormalisée — un champ `usage_count` maintenu par `m2m_changed` — coûterait zéro
requête, mais demande quatre signaux (`add`, `remove`, `clear`, `post_clear`), une migration, un
backfill, et introduit une dérive silencieuse. Disproportionné au volume actuel.

Réserve indépendante de la technique : trier par usage rend l'ordre **instable dans le temps**,
là où l'alphabétique est prévisible. Le compromis courant est de garder l'alphabétique comme ordre
de liste et de ne biaiser que le premier résultat de l'autocomplete — celui qu'`Entrée` choisit.

## Sites d'application

Liste maintenue à la main.

| Emplacement           | Ce qui y est appliqué                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `queries.py`          | `scalar_count`, `daily_summary_counts`, `daily_carry_over_candidates`                                                                                                                                        |
| `views/project.py`    | 5 `scalar_count` ; `Exists` ; `tags`, `tasks__tags`, `sections__tasks__tags`, `events`                                                                                                                       |
| `views/collection.py` | 2 `scalar_count` ; `Exists` ; `tasks__tags`                                                                                                                                                                  |
| `views/daily_task.py` | 4 `select_related`, 5 `prefetch_related`, hors `destroy` ; `daily_summary_counts` dans `summary()` ; `bulk_create` sur la table et sur la liaison des tags, puis relecture par `pk__in`, dans `carry_over()` |
| `views/event.py`      | `select_related('project')`, `prefetch_related('project__tags')`                                                                                                                                             |

## Comment on le vérifie

Un N+1 ne se voit qu'au compteur de requêtes. `tout_doux/test_query_counts.py` encode la
propriété qui compte — **le nombre de requêtes ne croît pas avec les données** — sans nombre
magique, et `tout_doux/test_api_contract.py` gèle en parallèle la forme et les valeurs des
réponses.

| Endpoint                    | Avant | Croissance                   | Après |
| --------------------------- | ----- | ---------------------------- | ----- |
| `GET /project/`             | 58    | +4 par projet                | 3     |
| `GET /project/detailed/`    | 131   | +10 par projet, +1 par tâche | 9     |
| `GET /collection/`          | 26    | +2 par collection            | 2     |
| `GET /collection/detailed/` | 59    | +1 par tâche                 | 4     |
| `GET /daily-task/`          | 74    | +6 par daily task            | 5     |
| `GET /daily-task/summary/`  | 126   | +3 par jour affiché          | 2     |
| `GET /event/`               | 27    | +2 par événement             | 2     |

⚠️ `CaptureQueriesContext` force le curseur de debug et fonctionne donc avec `DEBUG=False` ;
`connection.queries` à la main, non.

## Écarts assumés

- **`daily-task/summary/` ne borne pas l'intervalle demandé.** Le coût est passé de linéaire en
  nombre de jours à constant, mais la liste construite en mémoire, elle, reste linéaire : W13.

## Voir aussi

- [../architecture/serializers.md](../architecture/serializers.md) — le couplage
  sérialiseur ↔ annotation
- [../workflows/verification.md](../workflows/verification.md) — lancer les tests
- [../workflows/development.md](../workflows/development.md) — `CONN_MAX_AGE` et
  `CONN_HEALTH_CHECKS`
