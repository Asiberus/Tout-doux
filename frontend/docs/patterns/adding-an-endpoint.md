# Ajouter un endpoint

**Problème** — brancher un nouvel appel réseau en respectant la chaîne
`api-routes → api → models`, sans réinventer les conventions.

## Recette

1. **Déclarer le chemin** dans `src/api-routes.ts` — relatif, **sans slash initial, avec slash
   final** (convention Django). Placeholders en `:camelCase` :

   ```ts
   taskById: 'task/:taskId/',
   ```

2. **Déclarer/étendre les modèles** dans `src/models/<domaine>.model.ts`. Convention dominante :

   | Type      | Rôle                                        |
   | --------- | ------------------------------------------- |
   | `XPost`   | Corps de création (champs requis)           |
   | `XPatch`  | Corps de mise à jour (tous optionnels)      |
   | `X`       | Modèle de lecture de base                   |
   | `XList`   | `extends X` + compteurs pour les vues liste |
   | `XDetail` | `extends X` + collections imbriquées        |

3. **Écrire la fonction** dans `src/api/<domaine>.api.ts` — fonction libre, type de retour
   explicite, générique sur l'appel `http`, aucun `try`/`catch` :

   ```ts
   export function updateTaskById(taskId: number, task: TaskPatch): Promise<Task> {
     return http.patch<Task>(apiRoutes.taskById.replace(':taskId', taskId.toString()), task)
   }
   ```

   Exemple réel : `src/api/task.api.ts:9`.

4. **Exposer** — rien à faire si le fichier de domaine existe déjà ; sinon ajouter le namespace
   dans `src/api/index.ts` (`export * as xApi from './x.api'`).

5. **Consommer** — store ou composant selon le critère de
   [../architecture/state.md](../architecture/state.md#règle--store-ou-appel-direct-).

## Conventions à connaître

- **Liste paginée** : le retour est `Pagination<X[]>`, l'appelant lit `response.content`. Si
  l'écran n'a pas de pagination (c'est le cas partout aujourd'hui), passer `size: 0` dans les
  params pour tout récupérer :

  ```ts
  return http.get<Pagination<ProjectList[]>>(apiRoutes.project, { params: { size: 0, ...params } })
  ```

- **`DELETE`** : ne pas passer de générique, le défaut `T = void` de `http.delete` suffit.
- **Dates** : `string` au format `'YYYY-MM-DD'`, heures en `'HH:mm'`. **Aucun type ne le
  garantit** — respecter le format à la main, et convertir avec `moment` au point de contact
  (voir [../domain/events.md](../domain/events.md)).
- **Erreurs** : ne rien attraper dans `api/`. L'appelant fait `.catch(error => console.error(error))`,
  qui est la convention actuelle du projet (il n'y a pas de retour visuel d'erreur — voir
  [../quality/watched-risks.md](../quality/watched-risks.md)).

## Variantes légitimes

- **Params de requête typés** : trois conventions coexistent. Pour un nouveau cas, préférer une
  interface dédiée (`PaginationParams` de `src/models/pagination.model.ts` si ce sont juste
  `page`/`size`, sinon une interface nommée). **Éviter `params = {}`** (utilisé dans
  `project.api.ts:12` et `collection.api.ts:12`) : le type implicite `{}` fait échouer tout
  appelant qui passe un param.
- **Réponse conditionnelle selon un param** : `event.api.ts:11` utilise un type conditionnel
  (`EventReturn<T>`) pour renvoyer `EventModel` ou `EventExtendedModel` selon `{ extended }`.
  C'est le seul cas ; ne le reproduire que si les deux branches sont réellement utilisées
  (aujourd'hui la branche `false` est morte, les 2 appelants passent `extended: true`).

## Écarts assumés / non migrés

À **ne pas imiter** — ce sont des incohérences historiques, pas des modèles :

| Écart                                       | Où                                                          | Convention correcte                                                             |
| ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Type de params inline au lieu d'un modèle   | `auth.api.ts:19` (`login`)                                  | `LoginPost` existe déjà                                                         |
| Interfaces de params déclarées dans `api/`  | `common-task.api.ts:7`, `tag.api.ts:7,13`, `user.api.ts:13` | Les types vivent dans `src/models/`                                             |
| Suffixe `*Body`/`*Response`                 | tout `auth.model.ts`                                        | `*Post`/`*Patch`                                                                |
| `*Form` unique pour create+update           | `tag.model.ts:10`, `common-task.model.ts:9`                 | `*Post` + `*Patch` séparés                                                      |
| Corps construit depuis un primitif          | `feedback.api.ts:14` (`setFeedbackReadProperty`)            | Un `FeedbackPatch`                                                              |
| PATCH envoyant le modèle de lecture complet | `preferences.api.ts:9`                                      | Un `PreferencesPatch`                                                           |
| Params en `snake_case` vs `camelCase`       | `exclude_ids` (tag) vs `excludeId` (user)                   | Suivre le backend, mais vérifier : un nom erroné est ignoré **silencieusement** |
| Import profond au lieu du barrel            | `CommonTaskDialog.vue:5`, `TagDialog.vue:5`                 | `from '@/api'`                                                                  |

Nommage : `updateTaskById` / `updateEventById` cohabitent avec `updateProject` / `updateTag`
pour la même sémantique. Aucune des deux formes n'est « la bonne » — suivre celle du domaine
qu'on modifie.

## Voir aussi

- [../architecture/api-layer.md](../architecture/api-layer.md) — la chaîne complète et ses
  contraintes
- [../adr/0003-hand-written-api-models.md](../adr/0003-hand-written-api-models.md) — pourquoi
  les modèles sont manuels, et le risque de divergence
