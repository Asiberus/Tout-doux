# Responsive

**Problème** — `useDisplay()` de Vuetify renvoie un objet dont **chaque propriété est un `Ref`**,
et non un objet `reactive`. Mal utilisé, il produit des conditions **toujours vraies**, sans
aucune erreur ni avertissement. Ce piège a cassé toute la responsivité des dialogs de l'app.

## La règle

```ts
// ✅ déstructurer, uniquement les clés utilisées
const { xs, smAndDown, mdAndUp } = useDisplay()
```

| Contexte                         | Écriture   | Pourquoi                                        |
| -------------------------------- | ---------- | ----------------------------------------------- |
| `<script>` (computed, fonctions) | `xs.value` | c'est un `Ref`                                  |
| `<template>`                     | `xs`       | Vue déballe les refs de premier niveau du setup |

**À ne jamais faire :**

```ts
// ❌ display.xs est un objet Ref imbriqué dans un objet NON réactif
const display = useDisplay()
if (display.smAndDown) return null // TOUJOURS vrai — un Ref est truthy
```

En template, `display.xs` n'est pas déballé non plus (ref imbriqué) : le binding reçoit l'objet
`Ref`, donc _truthy_.

> **Preuve historique** : `src/utils/dialog.utils.ts#getDialogWidth()` (fichier **supprimé
> depuis**) retournait de ce fait **toujours `null`** — tous les dialogs étaient en plein écran
> sur tous les écrans. C'est ce qui a motivé son remplacement par le composable `useDialogWidth`
> (voir [../workflows/vuetify-4-migration.md](../workflows/vuetify-4-migration.md), point 1.1).

## Largeur de dialog : passer par le composable

Ne pas recalculer une largeur de dialog à partir des breakpoints — utiliser
`useDialogWidth()`. Voir [dialogs.md](dialogs.md).

## Breakpoints

Vuetify 4 (MD3) a **réduit** les seuils par défaut. Le projet les **remet aux valeurs
historiques** (celles de Vuetify 2/3) :

| Breakpoint | Seuil du projet | Défaut Vuetify 4 |
| ---------- | --------------- | ---------------- |
| `xs`       | 0               | 0                |
| `sm`       | 600             | 600              |
| `md`       | **960**         | 840              |
| `lg`       | **1280**        | 1145             |
| `xl`       | **1920**        | 1545             |
| `xxl`      | **2560**        | 2138             |

⚠️ **Trois consommateurs doivent rester alignés.** Ne jamais en modifier un seul : un utilitaire
`d-lg-none` basculerait à un seuil différent d'une media query voisine.

| Consommateur                              | Source à modifier                      |
| ----------------------------------------- | -------------------------------------- |
| `useDisplay()` (JS)                       | `display.thresholds` de `vuetify.ts`   |
| Utilitaires et grille Vuetify (`d-md-*`…) | `$grid-breakpoints` de `settings.scss` |
| Media queries des `<style>` de SFC        | `src/styles/_breakpoints.scss`         |

Les trois lisent la même map, `src/styles/_breakpoint-values.scss` pour les deux premières côté
Sass. **Modifier la map suffit** ; c'est le seul endroit à toucher.

## Côté SCSS

Passer par le module **du projet**, pas directement par celui de Vuetify :

```scss
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

@media #{map.get(variables.$display-breakpoints, 'xs')} {
  ...
}
```

⚠️ `@use 'vuetify/lib/styles/settings/_variables'` en direct **compile avec les seuils MD3** :
le `configFile` de `vite-plugin-vuetify` ne s'applique qu'aux styles de Vuetify, pas aux blocs
`<style>` des SFC, qui sont des compilations Sass séparées. L'erreur est **silencieuse** — le
build passe, seules les media queries sont fausses. Les 46 SFC concernés utilisent le module du
projet ; garder cette forme.

Exemple réel : `src/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue`.

## Variantes légitimes

- **Valeur brute `width`** — quand un seuil ne correspond à aucun breakpoint :
  `HalfDialog.vue:20` (`width < 400` pour choisir la transition),
  `EventDayDialog.vue` (gestes tactiles). À réserver aux cas où le seuil est vraiment
  arbitraire.
- **Tailles calculées** — un `computed` qui mappe des breakpoints vers une taille de composant
  (`MainTitle.vue:11`, `TaskCard`, `ProgressWheel`). C'est le pattern normal ; penser à `.value`.

## Écarts assumés

- **`daysPerPage` de `DailySummary.vue:29` est calculé une seule fois** dans `onBeforeMount` :
  un redimensionnement ne réajuste pas la pagination. Volontairement figé pour ne pas refetch.
- **L'état initial du drawer** (`AuthenticatedLayout.vue:11`) est un `ref(!mobile.value)` : il ne
  réagit pas au franchissement d'un breakpoint après le montage.
- **La QA responsive complète `xs`→`xl` n'a jamais été menée** sur cette app. Le rétablissement
  des seuils V2/V3 doit lui rendre son comportement d'avant migration, mais ça n'a pas été
  vérifié écran par écran — voir
  [../workflows/vuetify-4-migration.md](../workflows/vuetify-4-migration.md) point 2.7.

## Voir aussi

- [dialogs.md](dialogs.md) · [styling.md](styling.md)
- [../architecture/ui-layer.md](../architecture/ui-layer.md)
