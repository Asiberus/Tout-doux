# 0004 — Wrapper `http` au-dessus de l'instance axios

- **Statut** : accepté
- **Date** : introduit par le commit `9a5922f` « chore(front): fix store and api typing after
  migration »

## Contexte

Avant ce commit, chaque fonction d'API répétait la même mécanique :

```ts
return axiosInstance.get<T>(url).then(response => response.data)
```

Sur 65 fonctions, cela produisait 65 fois le même `.then`, et le générique était parfois oublié
— ce qui faisait remonter un `AxiosResponse` non typé jusqu'aux appelants. Le travail de typage
post-migration Vue 3 a rendu ces oublis visibles.

## Décision

Introduire `src/axios/http.ts` : un objet exposant `get` / `post` / `patch` / `delete`, chacun
résolvant **directement le corps de la réponse**.

```ts
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.get<T>(url, config).then(response => response.data),
  // …
  delete: <T = void>(url: string, config?: AxiosRequestConfig): Promise<T> => …
}
```

**Les fichiers `src/api/*.api.ts` utilisent `http` exclusivement.** `axiosInstance` reste réservé
à la configuration du transport (intercepteurs). Cette règle est énoncée dans le commentaire de
`http.ts:4-8` et **respectée** : zéro usage d'`axiosInstance` hors de `src/axios/`.

## Alternatives écartées

- **Garder l'appel direct à `axiosInstance`** — écarté : répétition, et générique oubliable
  silencieusement.
- **Une classe `ApiClient` injectable** — écarté : le projet n'utilise aucune injection de
  dépendances, et aucun besoin de mock (il n'y a pas de tests).
- **Ajouter la gestion d'erreur dans le wrapper** — délibérément **non fait** : `http` reste un
  wrapper _mince_. La seule erreur traitée globalement est le 401, dans l'intercepteur.

## Conséquences

- ✅ Les fonctions d'API tiennent en une ligne et le type de retour est explicite (65/65
  annotent leur `Promise<T>`).
- ✅ `delete` a un défaut `T = void`, ce qui évite un générique inutile sur les 10 suppressions.
- ⚠️ Le wrapper n'expose **que** ces 4 verbes : pas de `put`, pas de `head`. Un besoin de `PUT`
  demanderait de l'étendre.
- ⚠️ Comme il masque l'objet `AxiosResponse`, **les en-têtes et le code de statut ne sont plus
  accessibles** aux appelants. Aucun appelant n'en a besoin aujourd'hui ; un cas de pagination
  par en-tête `Link` obligerait à contourner le wrapper.
- ⚠️ **`CLAUDE.md` décrivait encore l'ancien pattern** (« les api appellent `axiosInstance` et
  retournent `response.data` ») bien après ce commit : exemple de la dérive doc↔code que
  `docs/` doit éviter (voir
  [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md)).

## Preuve

`src/axios/http.ts`, `src/api/*.api.ts` (65 fonctions), commit `9a5922f`.

## Voir aussi

- [../architecture/api-layer.md](../architecture/api-layer.md)
- [../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md)
