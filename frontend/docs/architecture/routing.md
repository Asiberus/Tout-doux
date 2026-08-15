# Routage et points d'entrée

Vue Router 5. Deux arborescences **frères montés sur `/`**, distinguées par leur layout :
authentifiée (`AuthenticatedLayout`) et non authentifiée (`NonAuthenticatedLayout`). Aucune
route n'utilise `meta` — la politique d'accès est encodée autrement (voir Guards).

## Table des routes

Table **maintenue à la main** : la mettre à jour à tout ajout/suppression/renommage de route.
Elle sert aussi de **carte des features** (voir [../README.md](../README.md#features--non-peuplé-délibéré)).

### Arbre authentifié — `src/router/index.ts:22`, modules dans `src/router/modules/`

| Chemin                                   | Nom                          | Vue                                                   | Props depuis la route                         |
| ---------------------------------------- | ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `/`                                      | `home`                       | _(redirect → `daily-summary`)_                        | —                                             |
| `/daily/:date?`                          | `daily-summary`              | `DailySummary.vue`                                    | `date`                                        |
| `/daily/:date/update/:step(task\|event)` | `daily-update`               | `DailyUpdate.vue`                                     | `date`, `step` — **guard** `dailyUpdateGuard` |
| `/project`                               | `project-list`               | `ProjectList.vue`                                     | `archived` (`query.archived === 'true'`)      |
| `/project/:id`                           | `project-detail`             | `ProjectDescription.vue`                              | `projectId` (`parseInt`)                      |
| `/project/:id/section/:sectionId?`       | `project-detail-section`     | `ProjectSection.vue`                                  | `sectionId` (`parseInt`)                      |
| `/project/:id/event`                     | `project-detail-event`       | `ProjectEvent.vue`                                    | —                                             |
| `/project/:id/settings`                  | `project-detail-settings`    | `ProjectSettings.vue`                                 | —                                             |
| `/collection`                            | `collection-list`            | `CollectionList.vue`                                  | `archived`                                    |
| `/collection/:id`                        | `collection-detail`          | `CollectionGeneral.vue`                               | `collectionId` (`parseInt`)                   |
| `/collection/:id/settings`               | `collection-detail-settings` | `CollectionSettings.vue`                              | —                                             |
| `/agenda`                                | `agenda`                     | `views/agenga/Agenda.vue` ⚠️ dossier mal orthographié | —                                             |
| `/settings`                              | `settings-preferences`       | `SettingsPreferences.vue`                             | —                                             |
| `/settings/common-tasks`                 | `settings-common-tasks`      | `SettingsCommonTasks.vue`                             | —                                             |
| `/settings/tags`                         | `settings-tags`              | `SettingsTags.vue`                                    | —                                             |
| `/profile`                               | `profile-user`               | `ProfileUser.vue`                                     | —                                             |
| `/profile/email`                         | `profile-email`              | `ProfileEmail.vue`                                    | —                                             |
| `/profile/password`                      | `profile-password`           | `ProfilePassword.vue`                                 | —                                             |
| `/profile/account`                       | `profile-account`            | `ProfileAccount.vue`                                  | —                                             |
| `/administration/user-list`              | `administration-user-list`   | `AdministrationUser.vue`                              | — **guard** `adminGuard` (sur le parent)      |
| `/administration/feedback`               | `administration-feedback`    | `AdministrationFeedback.vue`                          | — **guard** `adminGuard`                      |
| `/feedback`                              | `feedback`                   | `views/feedback/Feedback.vue`                         | —                                             |

### Arbre non authentifié — `src/router/modules/nonAuth.router.ts`

| Chemin                    | Nom                      | Vue                        | Guard           |
| ------------------------- | ------------------------ | -------------------------- | --------------- |
| `/login`                  | `login`                  | `Login.vue`                | `loginGuard`    |
| `/register`               | `register`               | `Register.vue`             | `loginGuard`    |
| `/password-reset-request` | `password-reset-request` | `ResetPasswordRequest.vue` | `loginGuard`    |
| `/activate`               | `activate`               | `ActivateUser.vue`         | — (lien e-mail) |
| `/password-reset`         | `password-reset`         | `ResetPassword.vue`        | — (lien e-mail) |
| `/confirm-email`          | `confirm-email`          | `ConfirmEmail.vue`         | — (lien e-mail) |

## Guards

Quatre guards dans `src/router/guards/`, **tous en style Vue Router 4+** : ils _retournent_ une
valeur (`undefined` pour continuer, un objet de route pour rediriger), aucun n'appelle `next()`.

| Guard              | Enregistrement                                | Logique                                                                   |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| _(anonyme)_        | global `beforeEach` **n°1** (`index.ts:58`)   | `if (from === START_LOCATION && isAuthenticated()) await appStore.init()` |
| `authGuard`        | global `beforeEach` **n°2** (`index.ts:62`)   | non authentifié + route hors liste blanche → `login` avec `?next=`        |
| `loginGuard`       | `beforeEnter` sur 3 routes                    | déjà authentifié → `home`                                                 |
| `adminGuard`       | `beforeEnter` sur le parent `/administration` | `!user.isStaff` → `home`                                                  |
| `dailyUpdateGuard` | `beforeEnter` sur `daily-update`              | date ≠ aujourd'hui → même route avec la date du jour                      |

**L'ordre des deux guards globaux est porteur.** Le n°1 est le seul endroit où `userStore.user`
est peuplé au chargement à froid, et il **`await`**. Or `adminGuard` lit `userStore.user` : il
n'est correct que parce que le n°1 a déjà résolu. Inverser l'ordre, ou retirer l'`await`, ferait
rebondir tout accès direct à `/administration/*` vers `home`.

Le guard n°1 ne s'exécute **qu'une fois par chargement de page** (`from === START_LOCATION`) :
après un logout puis login dans la même session SPA il ne se redéclenche pas, d'où l'appel
explicite à `appStore.init()` dans `Login.vue:41`.

`authGuard` fonctionne par **liste blanche de noms** construite au chargement du module
(`nonAuthRoutes.map(r => r.name)`, `auth.guard.ts:5`) — il n'y a pas de `meta.public`.
**Conséquence : toute nouvelle route publique doit être ajoutée à `nonAuthRoutes`, sinon elle est
silencieusement protégée.**

## Séquence de boot — `src/main.ts`

1. `App.vue` importé → charge `@/styles/global.scss`.
2. `./registerServiceWorker` — effet de bord à l'import (voir Décisions négatives).
3. `import router` → **importe statiquement toutes les vues**, crée le routeur, enregistre les
   2 guards globaux. Transitivement : `services` → `api` → `axios-instance`, qui lit
   `config.API_URL` depuis les `<meta>` **au chargement du module**.
4. `createApp` → `createPinia()` / `createVuetify()`.
5. `app.use(router)` **puis** `app.use(pinia)` puis `app.use(vuetify)`.
6. `app.mount('#app')` → déclenche la navigation initiale, donc le guard n°1.

**Contrainte** : les balises `<meta>` de config doivent être présentes dans le HTML servi
**avant** le chargement du graphe de modules — il n'y a pas de repli sur `import.meta.env`.
Voir [../adr/0001-config-via-meta-tags.md](../adr/0001-config-via-meta-tags.md).

**Fragilité connue** : `router` est installé **avant** `pinia` alors que les guards globaux
instancient des stores. Ça ne fonctionne que parce que la navigation initiale est résolue
pendant/après `mount()`. L'ordre sûr est pinia → router. Inscrit au
[backlog](../quality/refactoring-backlog.md).

## Layouts

|                   | `AuthenticatedLayout.vue`                                              | `NonAuthenticatedLayout.vue`                   |
| ----------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Racine            | `v-app` **conditionnée à `userStore.user`**                            | `v-app` sans dépendance au store               |
| Chrome            | `TheHeader` (app-bar) + `TheNavbar` (drawer)                           | aucun — juste un titre « Tout Doux » cliquable |
| Navigation mobile | drawer fermé par défaut, hamburger dans le header, swipe gauche/droite | —                                              |

Le menu du drawer est un tableau local à `TheNavbar.vue:17` (Dashboard _(désactivé, sans route)_,
Daily, Projects, Collections, Agenda). **`/settings`, `/profile`, `/administration` et
`/feedback` ne sont accessibles que par le menu du header** (`TheHeader.vue:30`), pas par le
drawer. L'entrée Administration y est masquée par `v-if="userStore.loadedUser.isStaff"` — la
vérité serveur restant `adminGuard`.

## Décisions négatives

- **Aucun lazy loading** : zéro `() => import()` dans `src/router/`. Tout l'applicatif (y compris
  le back-office et les dialogs de 460 lignes) est livré au visiteur anonyme de `/login`.
  Inscrit aux [risques surveillés](../quality/watched-risks.md) avec un seuil mesurable.
- **Aucune route catch-all / 404.** Une URL inconnue ne matche aucun des deux arbres : un
  utilisateur authentifié obtient une page blanche. Un non-authentifié est « sauvé » par
  accident (`to.name === undefined` n'est pas dans la liste blanche → redirigé vers `login`).
- **Pas de `meta` de route** (ni `scrollBehavior`, ni `afterEach`, ni `router.onError`).
- **`loginGuard` n'est volontairement pas appliqué** à `activate`, `password-reset` et
  `confirm-email` : ces routes sont atteintes depuis des liens e-mail, y compris en étant
  connecté.
- **Le service worker n'est pas fonctionnel** — `src/registerServiceWorker.ts` est importé pour
  son effet de bord mais ne peut rien enregistrer (analyse et correctif :
  [§3.14 du tracker de migration](../workflows/vuetify-4-migration.md)).

## Voir aussi

- [state.md](state.md) — ce que `appStore.init()` charge
- [../domain/daily-rules.md](../domain/daily-rules.md) — pourquoi `dailyUpdateGuard` est
  indispensable et pas cosmétique
- [ui-layer.md](ui-layer.md) — les layouts et le chrome applicatif
