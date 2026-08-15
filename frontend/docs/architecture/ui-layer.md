# Couche de présentation

Vuetify 4 en thème sombre unique. Trois niveaux de composants coexistent, avec un critère de
placement explicite ; le thème est étendu de couleurs **métier** (pas seulement d'une palette).

## Trois niveaux de composants

| Niveau                  | Emplacement                            | Critère                                                                                | Exemples                                                                                                     |
| ----------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Global**              | `src/components/` (15)                 | Réutilisable **sans connaissance du domaine**, ou chip/avatar d'entité utilisé partout | `ConfirmDialog`, `HalfDialog`, `EmptyListDisplay`, `FilterChip`, `ProgressWheel`, `MainTitle`, `ProjectChip` |
| **Partagé par domaine** | `src/views/components/<domaine>/` (13) | Lié à une entité, consommé par **≥ 2 features**                                        | `task/TaskCard`, `event/EventDialog`, `tag/TagGroup`, `common-task/CommonTaskCard`                           |
| **Local à une feature** | `src/views/<feature>/components/`      | Utilisé par une seule feature                                                          | `daily/components/DailyTaskCard`, `project/project-detail/components/ProjectSectionItem`                     |

> **Nouveau composant** : commencer local. Le promouvoir vers `views/components/<domaine>/` au
> 2ᵉ consommateur hors de sa feature, vers `src/components/` seulement s'il perd toute
> dépendance au domaine. Les 4 domaines existants sont `task`, `event`, `tag`, `common-task`.

Note : `src/components/` contient déjà des composants **couplés au domaine**
(`ProjectChip`, `SectionChip`, `CollectionChip`, `ProjectAvatar`) — c'est un écart au critère,
assumé car ils sont utilisés dans presque tous les écrans.

## Thème et tokens

`src/plugins/vuetify.ts`. `defaultTheme: 'dark'` et **aucune bascule de thème n'existe** dans
l'app (0 `useTheme` dans `src/`) : le thème `light` est déclaré mais **inatteignable**.

Table **maintenue à la main** — la mettre à jour à tout ajout/suppression de couleur.

| Token                                        | Valeur                | Rôle                                                                            | Utilisé ?            |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- | -------------------- |
| `primary`                                    | `#ee44aa`             | Accent principal (défaut de `VSwitch`)                                          | oui                  |
| `secondary`                                  | `#424242`             | Bordures, fonds neutres                                                         | oui                  |
| `accent`                                     | `#82B1FF`             | Sélection, onglets actifs                                                       | oui                  |
| `project` / `antiProject`                    | `#004D40` / `#99b7b2` | Fond / texte d'un avatar de projet                                              | oui                  |
| `projectArchived` / `antiProjectArchived`    | `#82B1FF` / `#d9e7ff` | Idem, projet archivé                                                            | oui                  |
| `projectArchivedCard` / `collectionArchived` | `#363e4d`             | Fond de carte archivée                                                          | oui                  |
| `collection`                                 | `#827717`             | Identité visuelle collection                                                    | oui                  |
| `event`                                      | `#009688`             | Événement à venir                                                               | oui                  |
| `passedEvent`                                | `#191919`             | Événement passé                                                                 | oui                  |
| `taskCompleted`                              | `#497549`             | —                                                                               | **non — token mort** |
| `taskInCreation`                             | `#181b1f`             | —                                                                               | **non — token mort** |
| `info` / `success` / `warning`               | —                     | Standard Vuetify                                                                | oui                  |
| `error`                                      | `#FF5252`             | **Déclaré dans `light` uniquement** → le thème `dark` utilise le défaut Vuetify | incohérence          |

Les tâches complétées utilisent la palette Material générique (`green-darken-2`) et non
`taskCompleted`. Voir [../patterns/styling.md](../patterns/styling.md) pour la conséquence
(deux systèmes de couleur coexistent).

⚠️ Les tokens de thème n'ont **aucune nuance** générée : aucune option `variations` n'est déclarée
dans `vuetify.ts`, donc `bg-collection-lighten-2` & co. n'existent pas. Une nuance ne s'applique
qu'aux couleurs de la palette Material (`grey-darken-3`, `green-darken-2`…).

## Défauts globaux de composants

`vuetify.ts` → bloc `defaults` : tous les champs de saisie en `variant: 'underlined'` (le défaut
Vuetify 4 est `filled` — ce bloc restaure l'apparence historique de l'app), `VSwitch` en
`color: 'primary'`, `VDialog` en `transition: 'scale-transition'`.

`VDialog` : le défaut Vuetify 4 n'est pas une transition CSS mais le **composant**
`VDialogTransition`, qui mesure la boîte de l'activateur et fait grandir la dialog **depuis le
bouton**. `scale-transition` rétablit le scale depuis le centre de l'écran, comme en Vuetify 2.

**Conséquence** : ne pas remettre `variant="underlined"` localement sur un champ, c'est déjà le
défaut. Un `variant` local **écrase** le défaut (`Feedback.vue` utilise volontairement `filled`),
de même qu'un `transition` local (`DailyDetail.vue` et `HalfDialog.vue` gardent le leur).

## Styles globaux

`src/styles/` contient deux fichiers, avec des rôles distincts :

| Fichier         | Rôle                                                                                     | Chargé par                                    |
| --------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `settings.scss` | **Variables Sass Vuetify** (`@use 'vuetify/settings' with (...)`) — compilé dans Vuetify | `vite.config.ts` (option `styles.configFile`) |
| `global.scss`   | Classes utilitaires maison + overrides de composants Vuetify                             | `App.vue`                                     |

Ce qui vit dans `global.scss` : le reset des marges `h1`-`h6`/`p` (dans
`@layer vuetify-core.reset`), les utilitaires `gap-*`, `cursor-*`, `opacity-60`, `text-link`,
`h-100`, `hide-scroll`, et les overrides de dialogs (`.half-dialog`, `.daily-detail-dialog`).

**Règle** : un override qui ne concerne qu'un seul composant vit dans le `<style scoped>` de ce
composant, pas ici. C'est pourquoi le bloc `.daily-update-stepper` a été déplacé dans
`DailyUpdate.vue` (ses descendants Vuetify passent par `:deep()`).

**Il reste un bloc d'override mort** — le bloc `.v-chip/.v-tab ::before` de neutralisation du
survol mobile : en Vuetify 4 le pseudo-élément est devenu un **élément** `__overlay`. Voir
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).

Où écrire un style : [../patterns/styling.md](../patterns/styling.md).

## Contraintes non évidentes

- **`MainTitle` / `SecondaryTitle` / `TertiaryTitle`** encapsulent les classes typographiques
  MD3 responsives. Les utiliser plutôt que d'écrire `text-headline-*` à la main.
  Attention : `TertiaryTitle` rend un `<h4>` (pas `<h3>`) et embarque `mb-2 mb-md-3`,
  contrairement aux deux autres qui n'ont pas de marge.
- **Le responsive passe par `useDisplay()`**, avec un piège de déballage de refs qui a causé des
  bugs réels : voir [../patterns/responsive.md](../patterns/responsive.md). **Lire avant tout
  code responsive.**
- **Les dialogs suivent un pattern unique** (activator slot + `useDialogWidth`) :
  [../patterns/dialogs.md](../patterns/dialogs.md).
- **Icônes MDI et police Roboto chargées depuis des CDN** (`index.html:12-17`), pas bundlées :
  l'app se dégrade hors ligne / derrière un proxy filtrant.

## Décisions négatives

- **Pas de bascule de thème, pas de mode clair** — le thème `light` déclaré est du code mort
  (aucune UI ne permet d'y accéder).
- **Pas d'i18n** (0 `vue-i18n` / `useI18n`). Les libellés sont en anglais en dur dans les
  templates, alors que `index.html` déclare `lang="fr"`. La locale Vuetify est figée à `en`.
- **Pas de design system formalisé** (pas de Storybook, pas de tokens exportés) : la référence
  est le code des composants partagés.
- **Pas de feature flags** (0 occurrence). Les fonctionnalités non finies sont des éléments
  `disabled` en dur : entrée « Dashboard » du drawer, onglet « Historic » de `ProjectDetail`,
  onglets « Weekly task » / « Monthly task » du wizard daily.

## Voir aussi

- [../patterns/styling.md](../patterns/styling.md) · [../patterns/dialogs.md](../patterns/dialogs.md) · [../patterns/responsive.md](../patterns/responsive.md)
- [routing.md](routing.md) — les layouts et le chrome
