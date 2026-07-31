# CLAUDE.md

Guidage pour Claude Code sur le dossier `frontend/`.

Ce fichier ne contient **que** ce qui doit être immédiatement disponible pour produire du code
correct. Tout le reste est dans **[`docs/`](docs/)** — et **la doc est la source de vérité**, pas
ce fichier.

## Contexte

`frontend` est le client web de **Tout-Doux** (organisation personnelle : projets, collections,
planification journalière). SPA **Vue 3** (Composition API, `<script setup>`) + **Vue Router 5**
+ **Pinia 4** + **Vuetify 4** + TypeScript + Vite. Monorepo : `../backend` (Django),
`../docker-compose.yml`.

Une migration Vue 2 → 3 → Vuetify 4 est **en cours** :
[docs/workflows/vuetify-4-migration.md](docs/workflows/vuetify-4-migration.md).

## Commandes

**Yarn, jamais npm** (`yarn.lock`, versions épinglées via Volta : Node 22.23.1 / Yarn 1.22.19).

```bash
yarn                 # installer
yarn dev             # serveur Vite, port 3000
yarn build           # build prod — NE VÉRIFIE AUCUN TYPE
yarn type-check      # vue-tsc --noEmit  (28 erreurs préexistantes)
yarn lint            # eslint --fix
yarn format          # prettier --write
```

Docker : `yarn docker:build`, `yarn docker:up`, `yarn docker:prod:build`, `yarn docker:prod:up`.

**Aucun test n'existe** (pas de script `test`). Le seul garde-fou automatique est le hook
`pre-commit` (eslint sans `--fix` + prettier) et `commit-msg` (commitlint conventionnel).
Détail : [docs/workflows/verification.md](docs/workflows/verification.md).

## Règles à respecter en écrivant du code

**Imports** — alias `@` → `src/`. Toujours passer par les barrels `@/api`, `@/store`,
`@/services`, jamais par le fichier. Un composant n'importe **jamais** `@/axios` : il passe par
`@/api`. `src/models/` ne dépend de rien. ⚠️ **Aucune de ces règles n'est vérifiée par un
linter** — voir [docs/architecture/overview.md](docs/architecture/overview.md).

**Convention SFC** — `<script setup lang="ts">` en haut, puis `<template>`, puis
`<style scoped lang="scss">`.

**Commits** — en-tête conventionnel (`feat(front):`, `fix(front):`, `chore(front):`), puis un
sujet par ligne en texte brut, sans tiret ni puce.

**Pièges à connaître avant d'écrire :**

| Sujet | Piège | Où |
|---|---|---|
| Responsive | `useDisplay()` renvoie des **refs** : `xs.value` en script, `xs` en template. `display.xs` est **toujours truthy** | [docs/patterns/responsive.md](docs/patterns/responsive.md) |
| Styles | Vuetify 4 impose les **CSS layers** : hors layer bat dans un layer. `:deep()` ne cible pas la racine du composant | [docs/patterns/styling.md](docs/patterns/styling.md) |
| Typographie | Les classes `text-h1`…`text-h6`, `text-body-1|2`, `text-caption` **n'existent plus** (MD3) | [docs/patterns/styling.md](docs/patterns/styling.md) |
| Dialogs | Slot activator = `{ props }` + `v-bind="props"`, sinon le clic n'ouvre rien. Largeur via `useDialogWidth()` | [docs/patterns/dialogs.md](docs/patterns/dialogs.md) |
| Formulaires | `v-form.validate()` est **asynchrone** ; `useTemplateRef` renvoie un ref (`.value`) | [docs/patterns/forms.md](docs/patterns/forms.md) |
| Store ou API ? | Store uniquement pour `currentProject`/`currentCollection` + `user`/`preferences` ; sinon appel direct à `@/api` | [docs/architecture/state.md](docs/architecture/state.md) |
| Config | Lue depuis des balises `<meta>` de `index.html`, **pas** `import.meta.env` | [docs/adr/0001-config-via-meta-tags.md](docs/adr/0001-config-via-meta-tags.md) |
| Domaine daily | Task ≠ CommonTask ≠ DailyTask ; règles métier appliquées **par l'UI seulement** | [docs/domain/daily-rules.md](docs/domain/daily-rules.md) |
| Route publique | À ajouter à `nonAuthRoutes`, sinon elle est silencieusement protégée | [docs/architecture/routing.md](docs/architecture/routing.md) |

## Documentation

| Besoin | Fichier |
|---|---|
| Organisation du code, sens des imports | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Couche API, pagination, erreurs | [docs/architecture/api-layer.md](docs/architecture/api-layer.md) |
| Stores Pinia | [docs/architecture/state.md](docs/architecture/state.md) |
| Routes, guards, boot | [docs/architecture/routing.md](docs/architecture/routing.md) |
| Composants, thème, tokens | [docs/architecture/ui-layer.md](docs/architecture/ui-layer.md) |
| Recettes (endpoint, dialog, form, responsive, style) | [docs/patterns/](docs/patterns/) |
| Vocabulaire métier | [docs/domain/glossary.md](docs/domain/glossary.md) |
| Pourquoi un choix a été fait | [docs/adr/](docs/adr/) |
| **Ce qui est cassé / risqué — ne pas imiter** | [docs/quality/](docs/quality/) |

⚠️ `docs/quality/` décrit ce qui est **cassé ou fragile**. Ne jamais y prendre un exemple comme
modèle : les modèles sont dans `docs/patterns/`.

## Mettre à jour la doc — dans le MÊME changement

Quand une modification change quelque chose que `docs/` décrit, **mettre à jour le fichier
concerné dans le même commit**. Correspondances :

| Si tu modifies… | Mets à jour |
|---|---|
| une route, un guard, `main.ts` | [docs/architecture/routing.md](docs/architecture/routing.md) (la table des routes est **maintenue à la main**) |
| un store, `app.store.ts` | [docs/architecture/state.md](docs/architecture/state.md) |
| `axios/`, `api-routes.ts`, une convention d'API | [docs/architecture/api-layer.md](docs/architecture/api-layer.md) + [docs/patterns/adding-an-endpoint.md](docs/patterns/adding-an-endpoint.md) |
| une couleur de thème, un `defaults` Vuetify, `global.scss` | [docs/architecture/ui-layer.md](docs/architecture/ui-layer.md) (table des tokens **maintenue à la main**) + [docs/patterns/styling.md](docs/patterns/styling.md) |
| un modèle métier, une énumération, une règle métier | [docs/domain/glossary.md](docs/domain/glossary.md), [daily-rules.md](docs/domain/daily-rules.md) ou [events.md](docs/domain/events.md) |
| un composant partagé, un layout | [docs/architecture/ui-layer.md](docs/architecture/ui-layer.md) |
| un script `package.json`, un hook, la CI | [docs/workflows/development.md](docs/workflows/development.md) + [verification.md](docs/workflows/verification.md) |
| **tu corriges un item de `quality/`** | **Supprimer** sa ligne et sa section — ne pas la marquer « fait » |
| tu découvres une faiblesse ou une règle non outillée | L'inscrire dans [docs/quality/](docs/quality/) (backlog si on agit, risques surveillés sinon) |
| une décision structurante | Nouvel ADR dans [docs/adr/](docs/adr/) |

Le format attendu de chaque type de fichier (squelette markdown, convention de nommage,
déclencheur précis) est dans **[docs/README.md](docs/README.md)** — le lire avant de créer un
fichier de doc.

Pour vérifier qu'un changement n'a rien laissé dérivé : commande `/sync-docs`
(`.claude/commands/sync-docs.md`).
