# Ajouter un endpoint

**Problème** — la surface d'API se construit par assemblage de six fichiers, dont trois barrels.
En oublier un ne produit aucune erreur explicite : l'endpoint est simplement absent, ou pire,
non cloisonné.

Exemple de référence complet dans le dépôt : la ressource **`common-task`**, la plus petite du
projet (1 modèle, 1 sérialiseur, 1 viewset, 1 action supplémentaire).

## Recette

### 1. Le modèle — `models/<nom>.py`

Hériter de `UserRelatedModel`, **jamais** de `models.Model` directement, sinon aucun
cloisonnement n'est possible :

```python
from tout_doux.models.user import UserRelatedModel   # module concret, pas le barrel

class Thing(UserRelatedModel):
    ...
    class Meta:
        ordering = ('-pk',)        # sinon la pagination n'est pas déterministe
```

Exporter dans `models/__init__.py`, puis `python manage.py makemigrations`.

### 2. Les sérialiseurs — `serializers/<nom>/`

Un fichier par action. Le minimum est `<nom>.py` (lecture) + une forme d'écriture.

- **Lecture** : hériter de `ReadOnlyModelSerializer` (`serializers/common.py`).
- **Écriture** : `ModelSerializer` nu + `to_representation()` qui délègue à la forme de lecture.
- Redéclarer **chaque** champ multi-mot en camelCase avec `source=`.
- Relations entrantes en `PrimaryKeyRelatedField(source='<relation>')`, nommées `<relation>Id`
  ou `<relation>Ids`.
- `user = serializers.HiddenField(default=serializers.CurrentUserDefault())` dans la forme
  d'écriture **et dans `Meta.fields`**.
- Un `validate_<champ>` par relation entrante, avec le contrôle d'appartenance —
  [ownership-and-scoping.md](ownership-and-scoping.md).
- Si l'entité dépend d'un projet ou d'une collection : les trois gardes d'archivage —
  [archive-guards.md](archive-guards.md).

Exporter dans `serializers/<nom>/__init__.py`. ⚠️ **L'ordre des lignes de ce barrel compte** si
le nouveau sérialiseur importe un sérialiseur d'une autre ressource : lister d'abord les modules
sans dépendance croisée. Voir [../architecture/overview.md](../architecture/overview.md).

### 3. La vue — `views/<nom>.py`

```python
class ThingViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination   # sauf si liste courte par nature
    filterset_fields = ('archived',)

    def get_queryset(self):
        return self.request.user.things.all()         # related_name = classe + 's'

    def get_serializer_class(self):
        if self.action == 'create':
            return ThingPostSerializer
        ...
```

Choisir la base selon ce qu'on veut exposer : `ModelViewSet` (tout), `ReadOnlyModelViewSet`, ou
la composition de mixins utilisée par `views/task.py` et `views/section.py` quand la liste et le
détail ne servent à rien (les objets ne sont lus qu'imbriqués dans leur parent).

Une garde de suppression va dans `destroy()`, avec `PermissionDenied`.

Exporter dans `views/__init__.py`.

### 4. La route — `tout_doux/urls.py`

```python
router.register(r'thing', ThingViewSet, basename='thing')
```

`basename` est obligatoire : les viewsets n'ont pas d'attribut `queryset` (il est calculé), donc
DRF ne peut pas le déduire. Une ressource hors routeur (comme `preferences/`) s'ajoute à
`urlpatterns` — mais préférer le routeur.

Une action supplémentaire s'ajoute avec `@action`, en explicitant `url_path` en kebab-case :

```python
# views/common_task.py:17
@action(detail=False, url_path='is-name-unique', url_name='common_task_is_name_unique')
```

Les actions `detail=False` doivent être **déclarées avant** toute route de détail concurrente —
voir [../architecture/api-surface.md](../architecture/api-surface.md).

### 5. La documentation, dans le même commit

- **Toujours** : la table de [../architecture/api-surface.md](../architecture/api-surface.md).
- Si un contrôle d'appartenance ou un garde d'archivage a été ajouté : la table « Sites
  d'application » du pattern concerné.
- Si une entité, une énumération ou une règle métier apparaît :
  [../domain/glossary.md](../domain/glossary.md).

### 6. Côté client

Rien n'est généré : le front doit ajouter son chemin dans `frontend/src/api-routes.ts`, sa
fonction dans `frontend/src/api/`, et son type dans `frontend/src/models/`. Voir
[`../../../frontend/docs/patterns/adding-an-endpoint.md`](../../../frontend/docs/patterns/adding-an-endpoint.md).

## Vérification

Il n'existe aucun test : la vérification est manuelle, et l'API browsable de DRF est l'outil le
plus rapide. Procédure dans [../workflows/verification.md](../workflows/verification.md).

## Variantes légitimes

| Situation                                           | Choix                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Lecture et écriture ont exactement les mêmes champs | Un sérialiseur mixte suffit (`tag`, `common_task`, `feedback`, `preferences`) |
| Création et modification ont les mêmes règles       | Un seul `*PostOrPatch` (`project`, `collection`, `event`)                     |
| Les règles diffèrent (champs figés après création)  | Deux sérialiseurs `*Post` / `*Patch` (`task`, `section`, `daily_task`)        |
| L'objet n'est jamais lu seul                        | Mixins plutôt que `ModelViewSet` (`task`, `section`)                          |
| Une seule instance par utilisateur                  | `APIView` hors routeur (`preferences`) — mais lire R3 avant de copier         |

## Voir aussi

- [../architecture/serializers.md](../architecture/serializers.md) — les conventions en détail
- [ownership-and-scoping.md](ownership-and-scoping.md), [archive-guards.md](archive-guards.md)
