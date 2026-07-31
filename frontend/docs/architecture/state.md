# État partagé (Pinia)

Six stores, **tous en style options** (`state` / `getters` / `actions`) — aucun setup store. Le
store n'est **pas** la voie par défaut d'accès aux données : la majorité des écrans appelle
`@/api` directement. Le critère de choix est ci-dessous.

## Inventaire

| Store | Fichier | État | Rôle |
|---|---|---|---|
| `app` | `src/store/app.store.ts` | — (sans état) | Orchestration : `init()` / `exit()` |
| `user` | `src/store/user.store.ts` | `user?: User` | Utilisateur connecté |
| `preferences` | `src/store/preferences.store.ts` | `preferences?: Preferences` | Préférences UI |
| `project` | `src/store/project.store.ts` | `currentProject?: ProjectDetail` | Agrégat de la page détail projet (8 getters dérivés) |
| `collection` | `src/store/collection.store.ts` | `currentCollection?: CollectionDetail` | Idem pour une collection |
| `auth` | `src/store/auth.store.ts` | — | **CODE MORT** — voir ci-dessous |

## Règle : store ou appel direct ?

Règle de fait, dérivée du code (27 composants appellent `@/api` en direct) :

**Un store existe uniquement pour :**
1. les **agrégats de page détail** qu'il faut muter par morceaux depuis plusieurs composants
   enfants (`currentProject`, `currentCollection` : ajout/édition/suppression de tâches,
   sections, événements depuis des sous-composants) ;
2. les **singletons applicatifs** chargés une fois au boot (`user`, `preferences`).

**Tout le reste appelle `@/api` directement depuis le composant** : listes, données éphémères,
back-office, écrans non authentifiés. C'est le cas pour `commonTaskApi`, `dailyTaskApi`,
`tagApi`, `feedbackApi`, et pour `eventApi`/`sectionApi` hors du périmètre d'un projet.

> **Nouveau cas** : si la donnée est mutée depuis plus d'un composant **et** doit rester
> cohérente à l'écran sans refetch → store. Sinon → appel direct dans le composant.

Deux écarts existants : `ProjectSettings.vue:92` et `CollectionSettings.vue:67` appellent
`deleteProject`/`deleteCollection` en direct alors que le store est utilisé pour les autres
mutations du même fichier.

## Contraintes non évidentes

- **`app.store.init()`** lance `Promise.all([userStore.getUser(), preferencesStore.getPreferences()])`
  — **parallèle**, et ne charge ni projet ni collection. Appelé à deux endroits seulement : le
  premier `beforeEach` du routeur (uniquement si `from === START_LOCATION`) et `Login.vue:41`
  après connexion. Voir [routing.md](routing.md) pour l'ordre.
- **`init()` ne peut jamais échouer** : `getUser` et `getPreferences` avalent leurs erreurs en
  `console.error`. En cas d'échec réseau, `user` reste `undefined` et
  `AuthenticatedLayout.vue:29` (`v-if="userStore.user"`) rend une **coquille vide** en
  permanence, sans message.
- **`app.store.exit()`** réinitialise user/preferences/project/collection, de façon synchrone.
  Il **ne supprime pas le token** : c'est la responsabilité de l'appelant
  (`authService.logout()`, ou l'intercepteur 401).
- **Les getters `loadedX` lèvent une exception** si l'état n'est pas chargé
  (`user.store.ts:27`, `project.store.ts:51`, etc.) et sont appelés **directement depuis les
  templates**. Ils ne sont sûrs que grâce au `v-if` parent qui les garde
  (`AuthenticatedLayout.vue:29`, `ProjectDetail.vue:24`, `CollectionDetail.vue:19`…).
  **Supprimer un de ces `v-if` transforme un champ vide en exception de rendu.**
- **Aucun store n'a d'état `loading` ni `error`.** Toutes les actions terminent par
  `.catch(error => console.error(error))` (14 occurrences dans `project.store.ts`).
- **`updateProperties` dépend de l'ordre du spread** : `{ ...this.currentProject, ...response }`
  (`project.store.ts:116`). L'API de mise à jour renvoie un `Project` **sans** `sections`,
  `tasks`, `events` ; seul cet ordre préserve l'arbre chargé. Inverser le spread vide l'écran.
- **`id === 0` est un piège** : plusieurs branchements testent la vérité d'un identifiant
  (`if (task.sectionId)`, `project.store.ts:174`) alors que `0` est utilisé comme **sentinelle
  « pas de section »** dans le domaine daily. Voir [../domain/daily-rules.md](../domain/daily-rules.md).

## Décisions négatives

- **`src/store/auth.store.ts` n'est pas utilisé** (auto-signalé `// TODO: Not used ?` à la
  ligne 22, aucun `useAuthStore()` dans `src/`). Il duplique intégralement
  `src/services/auth.service.ts`, y compris une seconde constante `TOKEN_KEY = 'td_token'`.
  **L'implémentation vivante est le service, pas le store.** Inscrit au
  [backlog](../quality/refactoring-backlog.md).
- **Pas de store de liste** : aucune mise en cache des listes de projets/collections. Le wizard
  daily refetch `getProjectListDetailed` alors que le store projet détient déjà ce type.
- **Pas de `$patch` / `$reset` / `storeToRefs`** dans le projet (0 occurrence) : mutation par
  assignation directe.
- **Le token n'est pas dans le store**, il est dans `localStorage` (clé `td_token`) et lu via
  `authService`. Voir [../adr/0002-pinia-stores-scope.md](../adr/0002-pinia-stores-scope.md).

## Voir aussi

- [api-layer.md](api-layer.md) · [routing.md](routing.md)
- [../adr/0002-pinia-stores-scope.md](../adr/0002-pinia-stores-scope.md)
