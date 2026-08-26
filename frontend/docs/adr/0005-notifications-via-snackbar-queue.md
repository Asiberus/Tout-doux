# 0005 — Notifications via un `VSnackbarQueue` unique et un store

- **Statut** : accepté
- **Date** : 2026-08

## Contexte

L'application n'avait **aucun mécanisme de retour utilisateur**. Toutes les erreurs finissent en
`console.error` — 14 occurrences dans `project.store.ts`, autant ailleurs — et un succès n'est
signalé que par le rafraîchissement de l'écran. La seule trace d'une intention contraire est un
`// TODO : add notification` dans `AdministrationUser.vue:41`.

Le besoin est apparu avec le bouton « Add to today's daily » du context menu d'une task : l'action
ne modifie rien à l'écran courant, donc sans retour visuel l'utilisateur ne peut pas savoir si son
clic a abouti. La première version portait un `<v-snackbar>` dans chacun des trois composants qui
rendent une `TaskCard` — d'où trois copies du markup, et **un snackbar par section** dans
`ProjectSectionItem`, qui est rendu une fois par section.

## Décision

**Un seul `<v-snackbar-queue>` monté dans `AuthenticatedLayout.vue`, alimenté par un store
`notification`.** Notifier depuis n'importe où tient en une ligne :

```ts
useNotificationStore().notifySuccess("Task added to today's daily")
```

`VSnackbarQueue` (Vuetify 4.1.6, auto-importé par `vite-plugin-vuetify`) gère l'empilement et
retire lui-même l'élément affiché en réémettant le tableau : le `v-model` est donc à double sens,
et le store expose un tableau `queue` inscriptible.

La position est décidée à cet unique endroit — `top right`, et `top` (donc haut-centré) sous le
breakpoint `xs`.

## Alternatives écartées

- **Un `ref` au niveau module dans un composable** (singleton implicite). Fonctionne, et évite
  Pinia. Écarté parce qu'il introduirait un **second mécanisme d'état global** à côté des stores,
  invisible dans les devtools et sans précédent dans le repo — l'unique composable existant,
  `useDialogWidth`, est sans état. La règle de [../architecture/state.md](../architecture/state.md)
  (« muté depuis plus d'un composant et doit rester cohérent à l'écran → store ») désigne
  directement le store.
- **Un snackbar par composant appelant** — l'état initial. Triple le markup, et multiplie les
  instances quand le composant est rendu en boucle.
- **Un composant de notification maison** — `VSnackbarQueue` fait déjà l'empilement, la file et la
  temporisation. Rien à réécrire.

## Conséquences

- **C'est un écart au périmètre documenté des stores** ([state.md](../architecture/state.md)),
  qui les réservait aux agrégats de page détail et aux singletons chargés au boot. `notification`
  est le premier store d'**état d'UI**, sans aucun lien avec l'API. L'inventaire de `state.md`
  l'acte.
- **Rien ne s'affiche depuis les écrans non authentifiés** : `NonAuthenticatedLayout` a son propre
  `v-app` et ne monte pas la file. Le jour où un écran de login doit notifier, c'est la même ligne
  à y ajouter — les deux layouts ne sont jamais montés en même temps.
- Le retour utilisateur devient un **choix par appel**, plus une infrastructure à construire : le
  `TODO` d'`AdministrationUser.vue` est désormais faisable en deux lignes.
- Aucun mécanisme d'erreur globale pour autant : l'intercepteur axios ne notifie pas, les
  `console.error` existants restent muets pour l'utilisateur. Ce n'est pas un système de
  gestion d'erreurs, seulement un canal d'affichage.

## Preuve

`src/store/notification.store.ts`, monté dans `src/layout/AuthenticatedLayout.vue`. Premier
consommateur : `src/composables/useAddTaskToDaily.ts`. Composant Vuetify :
`node_modules/vuetify/lib/components/VSnackbarQueue/`, dont le `modelValue` est un tableau et qui
émet `update:modelValue` privé de l'élément affiché.
