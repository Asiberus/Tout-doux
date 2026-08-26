# Surface d'API

Le contrat d'API n'existe nulle part ailleurs : pas de schéma généré, pas de collection
Postman, `openapi.yaml` à la racine du monorepo est un stub mort de 13 lignes
([adr/0004](../adr/0004-no-openapi-schema.md)). **La table ci-dessous est la référence.**

> ⚠️ **Table maintenue à la main.** Tout ajout, renommage, suppression d'endpoint, ou tout
> changement de méthode / permission / filtre se répercute ici **dans le même commit**. Elle a
> été construite depuis le resolver Django, pas depuis les fichiers d'URL : c'est le seul moyen
> de voir les routes que le routeur DRF génère implicitement.

## Assemblage

`backend/urls.py` monte l'admin puis `tout_doux/urls.py`, qui combine :

- un `routers.DefaultRouter()` — 10 ressources enregistrées (`tout_doux/urls.py:12`) ;
- 13 `path(...)` explicites pour l'authentification et les préférences.

Permission par défaut : **`IsAuthenticated`** (`settings.py:122`). Les exceptions sont dans la
colonne « Accès ».

## Authentification

| Endpoint                        | Méthode | Accès        | Réponse                               | Vue                     |
| ------------------------------- | ------- | ------------ | ------------------------------------- | ----------------------- |
| `auth/login/`                   | POST    | libre        | `{token, expiry, user}` (Knox)        | `views/auth.py:18`      |
| `auth/logout/`                  | POST    | connecté     | 204                                   | `knox.views.LogoutView` |
| `auth/register/`                | POST    | libre        | 201 + `User`                          | `views/auth.py:23`      |
| `auth/activate/`                | POST    | libre        | **204**                               | `views/auth.py:28`      |
| `auth/resend-activation-email/` | POST    | libre        | 204                                   | `views/auth.py:38`      |
| `auth/reset-password-request/`  | POST    | libre        | **204 toujours**, même e-mail inconnu | `views/auth.py:51`      |
| `auth/reset-password/`          | POST    | libre        | 204                                   | `views/auth.py:63`      |
| `auth/validate-password/`       | POST    | libre        | `{errors: string[]}`                  | `views/auth.py:73`      |
| `auth/confirm-email-change/`    | POST    | libre        | 204                                   | `views/auth.py:91`      |
| `auth/check-token/`             | POST    | libre        | `{valid: bool}`                       | `views/auth.py:100`     |
| `auth/check-password/`          | POST    | **connecté** | `{valid: true}`                       | `views/auth.py:110`     |

Détail des jetons, des e-mails et du cycle de vie de compte : [auth.md](auth.md).

## Ressources

Sauf mention contraire : accès **connecté**, réponse de liste **paginée** (voir plus bas).

| Endpoint                      | Méthodes                | Sérialiseurs (par action)                    | Filtres                                                      | Notes                                                          |
| ----------------------------- | ----------------------- | -------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `project/`                    | GET, POST               | `ProjectList` / `ProjectPostOrPatch`         | `archived`, `has_uncompleted_task`                           |                                                                |
| `project/detailed/`           | GET                     | `ProjectDetail`                              | idem                                                         | délègue à `list()`                                             |
| `project/{pk}/`               | GET, PUT, PATCH, DELETE | `ProjectDetail` / `ProjectPostOrPatch`       |                                                              |                                                                |
| `collection/`                 | GET, POST               | `CollectionList` / `CollectionPostOrPatch`   | `archived`, `has_uncompleted_task`                           |                                                                |
| `collection/detailed/`        | GET                     | `CollectionDetail`                           | idem                                                         | délègue à `list()`                                             |
| `collection/{pk}/`            | GET, PUT, PATCH, DELETE | `CollectionDetail` / `CollectionPostOrPatch` |                                                              |                                                                |
| `task/`                       | **POST seul**           | `TaskPost`                                   |                                                              | pas de liste ni de détail                                      |
| `task/{pk}/`                  | PUT, PATCH, DELETE      | `TaskPatch`                                  |                                                              |                                                                |
| `section/`                    | **POST seul**           | `SectionPost`                                |                                                              |                                                                |
| `section/{pk}/`               | PUT, PATCH, DELETE      | `SectionPatch`                               |                                                              |                                                                |
| `daily-task/`                 | GET, POST               | `DailyTask` / `DailyTaskPost`                | `date`                                                       | POST répond **409** si la tâche est déjà dans le daily du jour |
| `daily-task/summary/`         | GET                     | `DailySummary`                               | `start_date`, `end_date` **obligatoires**                    | **non paginé**                                                 |
| `daily-task/{pk}/`            | GET, PUT, PATCH, DELETE | `DailyTask` / `DailyTaskPatch`               |                                                              | DELETE refusé hors du jour courant                             |
| `event/`                      | GET, POST               | `EventExtended` / `EventPostOrPatch`         | `date`, ou `month`+`year`                                    | **non paginé**                                                 |
| `event/{pk}/`                 | GET, PUT, PATCH, DELETE | `EventExtended` / `EventPostOrPatch`         | `extended` (forme de la réponse d'écriture)                  |                                                                |
| `tag/`                        | GET, POST               | `Tag`                                        | `type`, `search`, `exclude_ids`                              |                                                                |
| `tag/is-name-unique/`         | GET                     | —                                            | `name` **obligatoire**, `type` **obligatoire**, `exclude_id` | `{unique: bool}`                                               |
| `tag/{pk}/`                   | GET, PUT, PATCH, DELETE | `Tag`                                        |                                                              |                                                                |
| `common-task/`                | GET, POST               | `CommonTask`                                 |                                                              |                                                                |
| `common-task/is-name-unique/` | GET                     | —                                            | `name` **obligatoire**, `exclude_id`                         | `{unique: bool}`                                               |
| `common-task/{pk}/`           | GET, PUT, PATCH, DELETE | `CommonTask`                                 |                                                              |                                                                |
| `feedback/`                   | GET, POST               | `Feedback`                                   | `is_read`                                                    | **POST libre pour tout connecté, lecture réservée au staff**   |
| `feedback/{pk}/`              | GET, PUT, PATCH, DELETE | `Feedback`                                   |                                                              | staff seulement                                                |
| `preferences/`                | GET, PATCH              | `Preferences`                                |                                                              | **hors routeur**, `APIView`                                    |

### `user/` — trois régimes d'accès dans une seule vue

| Endpoint                             | Méthodes        | Accès     |
| ------------------------------------ | --------------- | --------- |
| `user/`                              | GET             | **staff** |
| `user/{pk}/`                         | GET, **DELETE** | **staff** |
| `user/{pk}/account-state/`           | POST            | **staff** |
| `user/{pk}/resend-activation-email/` | POST            | **staff** |
| `user/me/`                           | GET, PATCH      | connecté  |
| `user/me/change-password/`           | POST            | connecté  |
| `user/me/change-email/`              | POST            | connecté  |
| `user/me/delete-account/`            | POST            | connecté  |
| `user/is-username-unique/`           | GET             | **libre** |
| `user/is-email-unique/`              | GET             | **libre** |

`UserViewSet` est un `ReadOnlyModelViewSet`, et pourtant **`DELETE user/{pk}/` fonctionne** : le
routeur DRF mappe une méthode HTTP dès que la vue possède l'attribut correspondant, et
`views/user.py:54` définit `destroy`. Vérifié sur le resolver. Ne pas « nettoyer » cette méthode
en croyant qu'elle est morte.

## Enveloppe de pagination

`pagination.py` — `ExtendedPageNumberPagination`, appliquée à `project`, `collection`,
`daily-task`, `tag`, `common-task`, `user`, `feedback`.

```json
{ "count": 42, "page": 1, "size": 20, "first": true, "last": false, "content": [ ... ] }
```

- Paramètres : `page`, `size` (défaut 20, `settings.py:132`).
- **`size=0` renvoie tout** : `get_all` passe à `true`, `content` contient le queryset complet,
  `size` est renvoyé à `0` et `first`/`last` sont forcés à `true`. `count` reste le total réel.
  C'est le mode utilisé par le front pour presque toutes ses listes.
- Non évident : quand `size=0`, `page_size` retombe silencieusement à 20 en interne (DRF refuse
  `0` comme entier positif) — sans effet, puisque le queryset entier est renvoyé, mais ça
  explique le calcul de `self.page`.

**Deux endpoints de liste ne sont pas paginés** et renvoient un tableau nu :
`daily-task/summary/` et `event/`. À l'inverse, `project/detailed/` et `collection/detailed/`
délèguent à `list()` : ils **sont** paginés, comme les listes ordinaires.

## Contraintes non évidentes

- **Les routes sont ancrées.** `backend/urls.py` et `tout_doux/urls.py` utilisent `path()`.
  Vérifié : `POST /prefixe/auth/login/` répond **404**. Ne pas revenir à `re_path()` sans motif
  ancré (`r'^…$'`) : il applique `re.search`, ce qui ferait résoudre n'importe quel chemin
  contenant la route.
- **Suffixes de format.** `DefaultRouter` double chaque route par une variante
  `…​.<format>` (`project.json`, `user/1.api`). Non utilisée par le front, jamais testée.
- **`GET /`** sert l'API browsable de DRF (`APIRootView`), et `api-auth/login|logout/` la page de
  connexion par session de DRF. Les deux exigent `IsAuthenticated`, mais sont exposés en
  production — voir [../quality/watched-risks.md](../quality/watched-risks.md) W6.
- **`user/me/…` passe avant `user/{pk}/`.** Le routeur enregistre les actions `detail=False`
  avant la route de détail, sinon `me` serait capturé comme un `pk`. Ne pas réordonner les
  décorateurs `@action` de `views/user.py`.
- **PUT est routé partout, et jamais appelé.** Les sérialiseurs `*Patch` sont écrits pour PATCH
  (plusieurs portent le commentaire « only used in a PATCH context ») ; en PUT, `partial=False`
  rend leurs champs obligatoires. Comportement non vérifié — ne pas s'en servir sans le tester.
- **Les query params inconnus sont ignorés en silence.** `has_uncompleted_task`, `exclude_ids`,
  `extended` sont lus à la main dans `get_queryset()` / `to_representation()` ; une faute de
  frappe ne produit aucune erreur, juste un filtre non appliqué.
- **`FeedbackViewSet` déclare `SearchFilter` sans `search_fields`** (`views/feedback.py:15`) :
  configuration morte, `?search=` n'a aucun effet —
  [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R9.

## Décisions négatives

- **Pas de versionnage d'API.** Pas de préfixe `/api/`, pas de `/v1/`. Le front est le seul
  client et il est déployé avec le backend.
- **Pas de schéma généré** — [adr/0004](../adr/0004-no-openapi-schema.md).
- **Pas de gestion d'erreur personnalisée** : les erreurs sont les formes DRF standard
  (`{"detail": …}` pour les exceptions, `{"champ": ["…"]}` pour la validation). Aucun
  `exception_handler` n'est configuré. Une seule `APIException` maison existe,
  `AlreadyInDailyError` (`exceptions.py`), pour le seul code hors 400/401/403/404 de l'API :
  le **409** de `daily-task/`.
- **Pas de limitation de débit** (`throttling`), y compris sur `auth/login/` et les endpoints
  d'unicité ouverts — voir [../quality/watched-risks.md](../quality/watched-risks.md) W5.

## Voir aussi

- [serializers.md](serializers.md) — quel sérialiseur pour quelle action, et pourquoi
- [auth.md](auth.md) — permissions, jetons, cycle de vie de compte
- [../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md) — la recette
- [`../../../frontend/docs/architecture/api-layer.md`](../../../frontend/docs/architecture/api-layer.md)
  — comment le client consomme ce contrat
