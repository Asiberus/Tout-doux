# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexte du projet

`frontend` est le client web de **Tout-Doux**, une application de gestion de tâches/projets avec planification quotidienne (« daily »). Ce dossier fait partie d'un mono-repo plus large (`../backend`, `../docker-compose.yml`, `../td.sh`) mais s'utilise et se développe de façon autonome depuis ce répertoire.

## Commandes

```bash
npm install          # installation des dépendances
npm run dev          # serveur de dev Vite (port 3000, host exposé)
npm run build        # build de production (vite build)
npm run serve        # preview du build de production
npm run lint         # eslint --fix sur le projet (respecte .gitignore)
npm run format       # prettier --write sur tout le projet
```

- Il n'y a **aucune suite de tests** configurée actuellement (pas de script `test:unit`/`test:e2e` dans `package.json`, malgré ce qu'indique le `README.md`, qui est obsolète sur ce point).
- Un hook pre-commit Husky (`.husky/pre-commit`) lance `pretty-quick --staged` puis `lint-staged` (règles dans `.lintstagedrc` : eslint + prettier sur `*.{js,ts,tsx,scss,css,md,vue}`).
- Les messages de commit sont vérifiés par commitlint (`commitlint.config.js`, config conventionnelle).
- Commandes Docker (depuis ce dossier, utilisent les fichiers du mono-repo parent) : `npm run docker:build`, `npm run docker:up`, `npm run docker:prod:build`, `npm run docker:prod:up`.

## Stack

Vue 3 (Composition API) + Vue Router 4 + Pinia + Vuetify 3 + TypeScript + Vite. Alias d'import `@` → `src/`.

## Architecture

### Configuration runtime (pas de `.env` Vite classique)

La config n'est **pas** injectée via `import.meta.env` mais lue depuis des balises `<meta>` de `index.html` (`API_URL`, `VERSION`) au moyen de `src/config/config.loader.ts` (`getConfigValue`), exposée ensuite via `src/config/index.ts`. Pour changer l'URL de l'API ou la version affichée, il faut modifier `index.html` (ou son équivalent généré côté Docker/`.conf/`), pas un fichier `.env`.

### Couche API et Axios

- `src/api-routes.ts` centralise tous les chemins d'API (avec placeholders type `:taskId` remplacés via `.replace()`).
- `src/api/*.api.ts` (un fichier par domaine : `task`, `project`, `section`, `collection`, `daily-task`, `event`, `tag`, `common-task`, `preferences`, `user`, `feedback`, `auth`) exposent des fonctions fines qui appellent `axiosInstance` et retournent `response.data`. Réexportés en namespaces via `src/api/index.ts` (ex. `taskApi.createTask(...)`).
- `src/axios/axios-instance.ts` : instance unique, injecte le Bearer token via un intercepteur de requête (`authService.isAuthenticated()`), et sur une réponse `401` supprime le token, réinitialise les stores (`authService.resetStore()`) et redirige vers `login`. Toute nouvelle route API doit passer par cette instance pour bénéficier de ce comportement.

### Store (Pinia)

- Un store par domaine (`user`, `preferences`, `project`, `collection`, `auth`) réexporté via `src/store/index.ts`.
- `app.store.ts` est un store d'orchestration : `init()` déclenche en parallèle `userStore.getUser()` et `preferencesStore.getPreferences()` (appelé dans le guard global du routeur au premier chargement si l'utilisateur est authentifié) ; `exit()` réinitialise user/preferences/project/collection (appelé notamment lors du logout via `authService.resetStore()`).

### Routeur

- `src/router/index.ts` définit deux arborescences parallèles montées sur `/` : `AuthenticatedLayout` (routes protégées, assemblées depuis `src/router/modules/*.router.ts` : `project`, `collection`, `daily`, `settings`, `profile`, `administration`) et `NonAuthenticatedLayout` (`nonAuthRoutes` : login, register, reset password…).
- Guards dans `src/router/guards/` : `authGuard` (global, redirige vers `login` si non authentifié et route non listée dans `nonAuthRoutes`), `admin.guard`, `login.guard`, `daily-update.guard` (garde spécifique appliquée sur la route `daily-update`).
- Le premier `beforeEach` déclenche `appStore.init()` uniquement à la navigation initiale (`from === START_LOCATION`) si un token existe déjà.

### Authentification

`src/services/auth.service.ts` gère le token (`localStorage`, clé `td_token`) et orchestre login/logout en s'appuyant sur `authApi` et `appStore.exit()`. C'est la source de vérité pour `isAuthenticated()`, utilisée à la fois par les guards et par l'intercepteur Axios.

### Domaine métier (`src/views/`)

Organisation par feature, chacune avec ses sous-dossiers `components/` locaux :
- `project/` : liste, détail (avec `tabs/`) et formulaires de projets.
- `collection/` : équivalent pour les « collections ».
- `daily/` : le cœur applicatif — `daily-summary` (vue du jour), `daily-update` (assistant multi-étapes `steps/` pour ajouter tâches/événements, protégé par `daily-update.guard`), composants partagés (`DailyTaskCard`, `DailyTaskForm`…).
- `agenga/` (Agenda), `feedback/`, `profile/`, `settings/`, `administration/` : features secondaires.

Les modèles TypeScript associés (`src/models/*.model.ts`) suivent la même découpe par domaine et distinguent souvent les variantes `Post`/`Patch` des payloads API (ex. `TaskPost`, `TaskPatch` dans `task.model.ts`).

### Vuetify

Thème et icônes configurés dans `src/plugins/vuetify.ts` (thèmes `light`/`dark` avec couleurs métier custom comme `taskCompleted`, `projectArchived`, `event`…) et styles Sass compilés via `src/styles/settings.scss` (référencé dans `vite.config.ts`).
