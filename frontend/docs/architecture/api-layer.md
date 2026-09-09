# Couche API

Tout accès réseau passe par cette chaîne. Elle s'arrête à la frontière du transport : elle ne
connaît ni le store, ni les composants, et **ne gère aucune erreur** (sauf le 401 global).

## Chaîne

```
index.html <meta>  →  src/config/          config runtime (API_URL, VERSION)
                      src/axios/axios-instance.ts   instance + 2 intercepteurs
                      src/axios/http.ts             wrapper typé → resolve le body
                      src/api-routes.ts             table des chemins
                      src/api/<domaine>.api.ts      1 fonction par endpoint
                      src/models/<domaine>.model.ts interfaces du contrat
```

- **`config`** — `src/config/config.loader.ts:5` lit `document.querySelector('meta[property=KEY]')`.
  Deux valeurs seulement : `API_URL`, `VERSION`. Voir
  [../adr/0001-config-via-meta-tags.md](../adr/0001-config-via-meta-tags.md).
- **`axios-instance`** — `baseURL: config.API_URL`. Intercepteur de requête : injecte
  `Authorization: Bearer <token>` si `authService.isAuthenticated()`. Intercepteur de réponse :
  **seul le 401** est traité (purge du token, reset des stores, redirection `login`), tout le
  reste est rejeté tel quel.
- **`http`** — `src/axios/http.ts` : `get/post/patch/delete`, chacun `.then(r => r.data)`. Les
  fichiers `*.api.ts` l'utilisent **exclusivement** (respecté : zéro `axiosInstance` hors de
  `src/axios/`). Voir [../adr/0004-http-wrapper.md](../adr/0004-http-wrapper.md).
- **`api-routes.ts`** — objet plat, chemins **relatifs, sans slash initial, avec slash final**
  (convention Django). Placeholders substitués par `String.replace(':nom', v.toString())` sur
  chaque site d'appel, sans helper ni validation.

## Règles

| Règle                                                                 | Statut                                          |
| --------------------------------------------------------------------- | ----------------------------------------------- |
| Un fichier `*.api.ts` par domaine, fonctions libres, jamais de classe | DISCIPLINE                                      |
| Type de retour `Promise<T>` explicite + générique sur l'appel `http`  | DISCIPLINE (65/65 annotent le retour)           |
| Une fonction d'API ne fait **aucun** `try`/`catch`                    | DISCIPLINE (respecté : 0 catch dans `src/api/`) |
| Les types du contrat vivent dans `src/models/`, pas dans `src/api/`   | DISCIPLINE — **6 écarts**, voir ci-dessous      |
| Passer par le wrapper `http`, jamais `axiosInstance`                  | DISCIPLINE (respecté)                           |

Recette complète pour ajouter un endpoint :
[../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md).

## Contraintes non évidentes

- **Enveloppe de pagination** — `Pagination<Data>` (`src/models/pagination.model.ts:1`) =
  `{ count, page, size, first, last, content }`. 9 endpoints de liste la renvoient, **3 non**
  (`getDailySummary`, `getEvents` et `getCarryOverCandidates` renvoient un tableau nu, comme la
  réponse du POST `carryOverPreviousDay`). Le générique est instancié avec le **tableau**
  (`Pagination<Tag[]>`), donc `content` est la liste. Chaque appelant fait `response.content` à la
  main ; `count`/`page`/`first`/`last` ne sont **jamais lus** et 5 endpoints forcent `size: 0`
  pour désactiver la pagination — il n'y a aucune pagination dans l'UI. Seule exception :
  `TagSearch` demande `size: 200`, un plafond franc et non paginé ; au-delà, les tags
  surnuméraires sont **silencieusement absents** (W14).
- **Gestion d'erreur = `console.error`.** Aucun modèle d'erreur typé (pas d'`ApiError`, pas de
  forme DRF `{detail}` / `{champ: string[]}`), aucun toast global. Les erreurs de validation sont
  consommées en `AxiosError.response.data` non typé, au cas par cas.
- **Ni timeout, ni retry, ni annulation** (vérifié : zéro `timeout|retry|AbortController|CancelToken`
  dans `src/`). Un backend qui ne répond pas gèle l'écran sans échappatoire.
- **Le 401 est inconditionnel** — il s'applique aussi aux endpoints d'authentification
  (`auth/login/`, `auth/check-password/`). Un mot de passe erroné renvoyé en 401 déclenche donc
  purge du token + `appStore.exit()` + redirection, y compris au milieu d'un formulaire.
- **Casse des query params incohérente** : `snake_case` (`has_uncompleted_task`, `start_date`) et
  `camelCase` (`excludeId`) coexistent selon l'endpoint. Aucun sérialiseur ne normalise : un nom
  erroné est **silencieusement ignoré** par le backend.
- **Variantes de modèle** — convention dominante `XPost` / `XPatch` / `X` / `XList` / `XDetail`.
  Trois domaines s'en écartent : `auth` utilise `*Body`/`*Response`, `tag` et `common-task`
  utilisent un unique `*Form` pour create+update, `event` utilise `EventPostOrPatch` fusionné.
- **Dates : toutes en `string` nu.** Aucun type distinctif entre `'YYYY-MM-DD'`, un datetime ISO
  et `'HH:mm'`. Voir [../domain/events.md](../domain/events.md) et
  [../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md).

## Décisions négatives

- **Pas de génération de types** — [../adr/0003-hand-written-api-models.md](../adr/0003-hand-written-api-models.md).
- **Pas de couche de gestion d'erreur centralisée** au-delà du 401 : chaque appelant décide.
  Conséquence acceptée aujourd'hui : aucun retour visuel d'erreur sur la plupart des écrans.
- **Pas de rafraîchissement de token.** `LoginResponse.expiry` (`src/models/login.model.ts:7`)
  est reçu et **jamais lu** ; l'expiration n'est découverte qu'au 401 suivant.

## Voir aussi

- [../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md) — la recette
- [state.md](state.md) — qui appelle l'API : store ou composant
- [../quality/watched-risks.md](../quality/watched-risks.md) — absence de timeout, 401 global,
  divergences de modèle
