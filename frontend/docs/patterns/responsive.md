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

Vuetify 4 a **réduit** les seuils par défaut par rapport à Vuetify 3, et le projet a **adopté
les nouveaux tels quels** (aucun `display.thresholds` dans `src/plugins/vuetify.ts`) :

| Breakpoint | Seuil V4 (actuel) | Seuil V3 (avant) |
| ---------- | ----------------- | ---------------- |
| `xs`       | 0                 | 0                |
| `sm`       | 600               | 600              |
| `md`       | **840**           | 960              |
| `lg`       | **1145**          | 1280             |
| `xl`       | **1545**          | 1920             |
| `xxl`      | **2138**          | 2560             |

**Conséquence à garder en tête** : tout basculement de layout arrive **plus tôt** qu'avant. Une
largeur entre 1145 et 1280 px, par exemple, est passée de `mdAndDown` à `lgAndUp` — ce qui a
changé le layout de `DailyDetail.vue` (onglets ↔ deux colonnes) sans modification de code.

## Côté SCSS

Utiliser la map de breakpoints Vuetify, pas des valeurs en dur :

```scss
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

@media #{map.get(variables.$display-breakpoints, 'xs')} {
  ...
}
```

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
- **La QA responsive complète n'a pas été refaite** depuis le passage aux seuils V4 — voir
  [../workflows/vuetify-4-migration.md](../workflows/vuetify-4-migration.md) point 2.7.

## Voir aussi

- [dialogs.md](dialogs.md) · [styling.md](styling.md)
- [../architecture/ui-layer.md](../architecture/ui-layer.md)
