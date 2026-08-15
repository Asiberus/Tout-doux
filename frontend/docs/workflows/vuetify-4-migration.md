# Migration Vue 2 → Vue 3 → Vuetify 4 — Tâches restantes

> ⚠️ **Document temporaire.** Il suit un chantier en cours sur la branche `migrate-to-vue3` et
> **doit être supprimé** quand la migration atterrit — `git log` sera alors le registre de ce qui
> a été fait. Ce qui doit lui survivre a déjà été extrait :
>
> - les règles pérennes → [../patterns/](../patterns/) (notamment
>   [responsive.md](../patterns/responsive.md) et [styling.md](../patterns/styling.md)) ;
> - la dette encore ouverte → [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).
>
> Ne pas y ajouter de règle de référence : elle serait perdue à la suppression.

> **But** : terminer la migration (Vue 2→3, Vuetify 2→3, Vuex→Pinia, Vue-Router 3→4) sans **aucune** différence de fonctionnement ni de style entre avant et après.
> **Public** : ce document doit permettre à une personne qui **ne connaît pas le projet** de traiter chaque tâche. Chaque point donne les fichiers, les **numéros de ligne**, et le code **avant → après**.
> **Légende priorité** : 🔴 Bloquant (casse le fonctionnement) · 🟠 Iso-visuel (casse le style) · 🟡 Dette/nettoyage · ⚪ Optionnel.

## ✅ Avancement de la migration

> Suivi mis à jour au fil de l'eau. Chaque tâche réalisée est cochée ici **et** son titre de section reçoit le marqueur « — ✅ FAIT ».

### 1. 🔴 Bloquants

- [x] §0 — `vue-tsc@3.3.8` + script `type-check` ajoutés (+ fix `tsconfig` : retrait `types:["jest"]`)
- [x] 1.1 — `useDisplay()` : refs déballés (composable `useDialogWidth`)
- [x] 1.2 — Slot activator `{ attrs, on }` → `{ props }` _(+ correctif wrappers `:props`)_
- [x] 1.3 — `$vuetify.breakpoint` → `$vuetify.display`
- [x] 1.4 — `v-form.validate()` asynchrone
- [x] 1.5 — `v-stepper` V2 → V3
- [x] 1.6 — `v-tabs-items`/`v-tab-item` → `v-tabs-window`/`-item` _(+ correctif flex barre d'onglets)_
- [x] 1.7 — `@click.native` → `@click` _(+ `.stop` interne aux chips)_
- [x] 1.8 — `EventDialog.vue` : date/time pickers (Vuetify 4)
- [x] 1.9 — `v-calendar` (Agenda) _(API classique restaurée en Vuetify 4 → pas de rewrite, juste correctifs de types)_
- [x] 1.10 — Type `Route` (Vue Router 4)
- [x] 1.11 — VAutocomplete : slot `item` → `internalItem` (Vuetify 4)
- [x] 1.12 — `ProfileAccount.vue` : `useRouter()` hors du scope `setup` → navigation morte

### 2. 🟠 Iso-visuel

- [x] 2.1 — `variant` des inputs (`underlined`)
- [x] 2.2 — `offset-*` / `nudge-*` supprimés
- [x] 2.3 — Hover mobile chips & tabs _(`::before` mort → `.v-chip__overlay` ; `.v-tab` couvert par `.v-btn__overlay`)_
- [x] 2.4 — QA des sélecteurs `:deep()` _(14/15 classes toujours valides ; `.v-timeline-item__divider` → `.v-timeline-divider`)_
- [x] 2.5 — slot `v-hover` `{ hover }` → `{ isHovering }` (Vuetify 3 manqué)
- [x] 2.6 — (Vuetify 4) Typographie MD3 _(91 occurrences renommées, 51 fichiers)_
- [ ] 2.7 — (Vuetify 4) Breakpoints réduits (`useDisplay`) _(décision prise : MD3 adopté tel quel, cf. §2.7)_
- [⛔] 2.8 — (Vuetify 4) `fill-height` / VContainer _(ANNULÉ : le rendu actuel convient, aucune action)_
- [x] 2.9 — (Vuetify 4) VBtn (uppercase + grid→flex)
- [x] 2.10 — (Vuetify 4) CSS Layers + `!important` _(cas connu traité, cf. §2.10)_
- [x] 2.11 — (Vuetify 4) Variables Sass (`settings.scss`)
- [x] 2.12 — (Vuetify 4) Grille VRow/VCol _(surface recomptée : 1 v-container, 2 v-row, 4 v-col — clos sans action)_
- [x] 2.13 — (Vuetify 4) Blocs CSS morts dans `global.scss` _(+ bloc stepper déplacé dans `DailyUpdate.vue`)_
- [x] 2.14 — (Vuetify 4) Modificateurs de nuance `lighten-*`/`darken-*` silencieusement perdus

### 3. 🟡 Nettoyage / dette

- [x] 3.1 — Hack `loginGuard`
- [x] 3.2 — Typer `src/api/*.api.ts`
- [x] 3.3 — Husky v9 _(les hooks ne s'exécutaient pas du tout : argument `frontend/.husky` jeté par `husky install`)_
- [x] 3.4 — Props booléennes verbeuses
- [⛔] 3.5 — `exact` sur `v-tab` _(ANNULÉ, PRÉMISSE DU DOC FAUSSE : `exact` reste actif en Vuetify **4** (`router.js` L.42/68) → nécessaire sur les onglets dont le `:to` est un chemin parent. Retrait annulé/rétabli.)_
- [x] 3.6 — `formRef` sans `.value` _(+ `inputNameRef.focus()` corrigé)_
- [x] 3.7 — `v-list-item-icon` _(déjà migré, confirmé : aucune occurrence)_
- [x] 3.8 — Dette de type : `string | null` → `string | undefined` _(clos par §3.13)_
- [x] 3.9 — Dette de type : Vue Router 5 (`:to` chips, `auth.guard`, params) _(clos par §3.13)_
- [x] 3.10 — Dette de type : `EventDialog`/events & divers _(reliquat clos par §3.13 et par les correctifs de bugs associés)_
- [x] 3.11 — (Vuetify 4) Divers 🟡 (elevation, date range, thème `system`, labs) _(chaque sous-point conclut « aucune action requise »)_
- [x] 3.12 — Montée de **Vite** 6 → dernière stable _(8.2.0, moteur Rolldown)_
- [x] 3.13 — Amener `yarn type-check` à **0 erreur** _(atteint : 28 → 0)_
- [x] 3.14 — Supprimer le service worker non fonctionnel _(reliquat Vue CLI, 404 en prod)_
- [x] 3.15 — Renommer `src/views/agenga/` → `src/views/agenda/`
- [x] 3.16 — Remplacer le fork local `eslint-plugin-vuetify` par le paquet npm _(le fork n'était pas versionné : `yarn lint` était cassé sur un clone frais)_

### 4. ⚪ Optionnel

- [ ] §4 — Améliorations optionnelles _(4.1 `v-model`, 4.3 audit des appels API, 4.4 factorisation des getters, 4.5 et 4.6 bugs latents : faits ; reste Vuelidate, reporté)_

### 5. Checklist QA finale

- [ ] §5 — QA finale

### 6. 📦 Montée de versions (2026-07) — ✅ FAIT

- [x] 6.1 — Node 18→22, vue→3.5.40, vue-router→5.2.0, pinia→4.0.2 (+`@vue/devtools-api`), axios→1.18.1, **vuetify→4.1.6** (+ `vite-plugin-vuetify` 2.1.3, `eslint-plugin-vuetify` 2.7.2, `sass` 1.102), `vue-tsc`+`type-check` _(build OK)_

_(La **version** Vuetify est montée en 4.x — build OK. Restent les **adaptations MD3** runtime/visuelles : §2.5–§2.12 et §3.11. La dette de type `vue-tsc` (§3.8–§3.10) et la montée de Vite (§3.12) sont aussi détaillées ci-dessous.)_

---

## 0. À lire avant de commencer

- **Gestionnaire de paquets : `yarn`** (présence de `yarn.lock`, version épinglée via Volta). Toujours `yarn`, jamais `npm`.
- **Convention SFC du projet** : `<script setup lang="ts">` en **haut** du fichier, puis `<template>`, puis `<style scoped lang="scss">`. Donc dans les listes ci-dessous : « ligne basse » = script, « ligne haute » = template. Le repère décisif reste le **contenu** de la ligne (`if (...)`, `const` = script ; `:prop="..."`, `v-if="..."`, `<v-... >` = template).
- **Le build ne typecheck pas.** `yarn build` = `vite build` (esbuild) transpile **sans vérifier les types**. Des erreurs comme un type disparu (`Route`, cf. §1.10) passent inaperçues.

  **Action à faire en tout premier** — ajouter `vue-tsc` :

  ```bash
  yarn add -D vue-tsc
  ```

  Dans `package.json`, section `scripts`, ajouter :

  ```json
  "type-check": "vue-tsc --noEmit"
  ```

  Lancer `yarn type-check` après chaque section.

- **Vérification systématique après chaque section** : `yarn type-check` + `yarn lint` (le plugin `eslint-plugin-vuetify` signale props/composants dépréciés) + test manuel de l'écran concerné.
- Traiter dans l'ordre : §1 (bloquants) → §2 (style) → §3 (dette).

---

<details>
<summary><strong>1. 🔴 Bloquants — cassent le comportement — ✅ Terminé (12/12)</strong></summary>

### 1.1 `useDisplay()` : refs jamais déballés (`.value` manquant) — ✅ FAIT

**Contexte technique (à comprendre une fois).** `useDisplay()` renvoie un objet dont **chaque propriété est un `Ref`** (vérifié dans `node_modules/vuetify/lib/composables/display.d.ts` : `xs: Ref<boolean>`, `smAndDown: Ref<boolean>`, …). Ce n'est **pas** un objet `reactive`. Conséquences du pattern `const display = useDisplay()` puis `display.xs` :

- **En JS (computed / fonctions)** : `display.xs` est un objet `Ref`, donc **toujours _truthy_** → `if (display.smAndDown) return null` est **toujours vrai**.
- **En template** : `display.xs` est un ref **imbriqué** dans un objet non-réactif → Vue **ne le déballe pas** → le binding reçoit l'objet `Ref` (toujours _truthy_).

**Règle de correction (unique)** pour chaque fichier concerné :

1. Remplacer `const display = useDisplay()` par une **déstructuration** des seules clés utilisées : `const { xs, smAndDown, mdAndUp } = useDisplay()`.
2. Dans le **`<template>`** : `display.xs` → `xs` (sans `.value`).
3. Dans le **`<script>`** (computed/fonctions) : `display.xs` → `xs.value`.

> ⚠️ Ne jamais écrire `xs.value` dans le template, ni `xs` (sans `.value`) dans le script.

#### 1.1.a — `dialog.utils.ts` → composable (obligatoire)

Le fichier `src/utils/dialog.utils.ts` contient le bug _truthy_ en JS pur : `getDialogWidth()` renvoie **toujours `null`** (fullscreen partout). Le remplacer par un composable retournant des `computed` réactifs.

**Créer `src/composables/useDialogWidth.ts`** (nouveau fichier) :

```ts
import { computed, ComputedRef } from 'vue'
import { useDisplay } from 'vuetify'

interface UseDialogWidth {
  dialogWidth: ComputedRef<string | null>
  dialogFullscreen: ComputedRef<boolean>
  confirmDialogWidth: ComputedRef<string | null>
  confirmDialogFullscreen: ComputedRef<boolean>
}

export function useDialogWidth(): UseDialogWidth {
  const { xs, smAndDown, mdAndDown } = useDisplay()

  const dialogWidth = computed<string | null>(() => {
    if (smAndDown.value) return null // fullscreen
    if (mdAndDown.value) return '80%'
    return '60%'
  })

  const confirmDialogWidth = computed<string | null>(() => {
    if (xs.value) return null // fullscreen
    if (mdAndDown.value) return '70%'
    return '50%'
  })

  return {
    dialogWidth,
    dialogFullscreen: smAndDown,
    confirmDialogWidth,
    confirmDialogFullscreen: xs,
  }
}
```

> `dialogFullscreen` / `confirmDialogFullscreen` remplacent les `:fullscreen="display.smAndDown"` / `display.xs` des mêmes dialogs (touchés par le même bug). Ensuite **supprimer `src/utils/dialog.utils.ts`**.

**Dans chaque composant appelant** : remplacer l'import et l'appel.

```ts
// AVANT (script)
import { getDialogWidth } from '@/utils/dialog.utils'
// APRÈS (script)
import { useDialogWidth } from '@/composables/useDialogWidth'
const { dialogWidth, dialogFullscreen } = useDialogWidth()
```

```html
<!-- AVANT (template) -->
<v-dialog v-model="taskDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
  <!-- APRÈS (template) -->
  <v-dialog v-model="taskDialog" :width="dialogWidth" :fullscreen="dialogFullscreen"></v-dialog
></v-dialog>
```

**Fichiers appelant `getDialogWidth()`** (import + `:width="getDialogWidth()"` + `:fullscreen="display.smAndDown"`) :

| Fichier                                                              | Ligne import | Ligne `:width` / `:fullscreen` |
| -------------------------------------------------------------------- | ------------ | ------------------------------ |
| `src/views/settings/components/SettingsTagList.vue`                  | 7            | 95                             |
| `src/views/collection/collection-list/CollectionList.vue`            | 8            | 66 (fullscreen 67)             |
| `src/views/collection/collection-detail/tabs/CollectionGeneral.vue`  | 9            | 78                             |
| `src/views/daily/daily-update/steps/event/DailyUpdateEvent.vue`      | 7            | 99                             |
| `src/views/project/project-detail/tabs/ProjectSection.vue`           | 7            | 109                            |
| `src/views/project/project-detail/tabs/ProjectEvent.vue`             | 8            | 58                             |
| `src/views/project/project-detail/tabs/ProjectDescription.vue`       | 10           | 122 et 148                     |
| `src/views/project/project-detail/components/ProjectSectionItem.vue` | 10           | 97 et 139                      |
| `src/views/project/project-list/ProjectList.vue`                     | 8            | 69                             |
| `src/views/components/common-task/CommonTaskDialog.vue`              | 9            | 125 (fullscreen 126)           |
| `src/views/components/task/TaskCard.vue`                             | 6            | 135                            |
| `src/views/components/event/EventItemCard.vue`                       | 9            | 193                            |
| `src/views/components/tag/TagCard.vue`                               | 4            | 41                             |
| `src/views/agenga/Agenda.vue`                                        | 10           | 280                            |

**Fichiers appelant `getConfirmDialogWidth()`** → `confirmDialogWidth` / `confirmDialogFullscreen` :

| Fichier                                    | Ligne import | Ligne `:width` / `:fullscreen`    |
| ------------------------------------------ | ------------ | --------------------------------- |
| `src/components/ConfirmDialog.vue`         | 2            | 37 (fullscreen 38 : `display.xs`) |
| `src/components/ConfirmPasswordDialog.vue` | 5            | 76 (fullscreen 77 : `display.xs`) |

#### 1.1.b — Bugs JS purs (`display.x` sans `.value` dans computed/fonctions)

Ces fichiers utilisent `display.x` dans du code JS → **toujours _truthy_**. Appliquer la règle (déstructurer + `.value` dans le script). Les lignes de **template** du même fichier passent sans `.value`.

| Fichier                                                              | Ligne `const` | Lignes **script** (→ `.value`)                                      | Lignes **template** (→ sans `.value`)                                                    | Clés à déstructurer                            |
| -------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `src/components/MainTitle.vue`                                       | 5             | 12 (`sm`), 13 (`mdAndUp`)                                           | —                                                                                        | `sm, mdAndUp`                                  |
| `src/views/settings/tabs/SettingsPreferences.vue`                    | 9             | 13 (`xs`), 14 (`smAndDown`), 15 (`width`)                           | —                                                                                        | `xs, smAndDown, width`                         |
| `src/views/collection/collection-detail/tabs/CollectionGeneral.vue`  | 15            | 21, 36 (`xs`), 37 (`smAndDown`), 38 (`mdAndDown`), 39 (`lgAndDown`) | 78 (`smAndDown`), 82, 83 (`xs`)                                                          | `xs, smAndDown, mdAndDown, lgAndDown`          |
| `src/views/daily/daily-summary/components/DailyDetail.vue`           | 15            | 39 (`smAndUp`), 40 (`xs`), 95 (`mdAndDown`)                         | 173 (`mdAndDown`)                                                                        | `xs, smAndUp, mdAndDown`                       |
| `src/views/project/project-detail/tabs/ProjectDescription.vue`       | 16            | 23, 48 (`xs`), 49 (`smAndDown`), 50 (`mdAndDown`), 51 (`lgAndDown`) | 121, 152 (`xs`), 122/148 (`smAndDown`), 147 (`smAndUp`)                                  | `xs, smAndUp, smAndDown, mdAndDown, lgAndDown` |
| `src/views/project/project-detail/components/ProjectSectionItem.vue` | 15            | 46 (`smAndDown`), 47 (`mdAndDown`), 48 (`lgAndDown`)                | 85, 126 (`xs`), 97/141 (`smAndDown`), 102/119 (`mdAndDown`), 117/127/212/217 (`smAndUp`) | `xs, smAndUp, smAndDown, mdAndDown, lgAndDown` |
| `src/views/components/event/EventDayDialog.vue`                      | 10            | 35, 36 (`width`), 38 (`xs`)                                         | 60, 61 (`xs`), 65 (`smAndUp`)                                                            | `xs, smAndUp, width`                           |
| `src/views/components/event/EventItemCard.vue`                       | 13            | 38 (`xs`)                                                           | 111 (`smAndUp`), 185 (`xs`), 193 (`smAndDown`)                                           | `xs, smAndUp, smAndDown`                       |
| `src/views/profile/tabs/ProfileUser.vue`                             | 9             | 48 (`xs`), 49 (`sm`), 50 (`md`), 51 (`width`)                       | 87 (`smAndDown`), 126 (`xs`), 132 (`mdAndUp`)                                            | `xs, sm, md, smAndDown, mdAndUp, width`        |

#### 1.1.c — `display.x` uniquement dans le template

Appliquer la règle (déstructurer + template sans `.value`). Aucune ligne de script à modifier ici.

| Fichier                                                                 | Ligne `const` | Lignes template                                               | Clés                     |
| ----------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- | ------------------------ |
| `src/components/ConfirmDialog.vue`                                      | 6             | 38                                                            | `xs`                     |
| `src/components/HalfDialog.vue`                                         | 6             | 23                                                            | `width`                  |
| `src/components/ConfirmPasswordDialog.vue`                              | 9             | 77                                                            | `xs`                     |
| `src/views/settings/Settings.vue`                                       | 5             | 15                                                            | `mdAndUp`                |
| `src/views/settings/components/SettingsTagList.vue`                     | 11            | 95                                                            | `smAndDown`              |
| `src/views/collection/collection-list/CollectionList.vue`               | 15            | 67                                                            | `smAndDown`              |
| `src/views/collection/collection-detail/CollectionDetail.vue`           | 7             | 21 (`xs`), 24 (`smAndUp`)                                     | `xs, smAndUp`            |
| `src/views/collection/collection-detail/tabs/CollectionSettings.vue`    | 12            | 85, 107, 168                                                  | `xs`                     |
| `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`           | 24            | 164 (`mdAndUp`), 165 (`smAndDown`)                            | `mdAndUp, smAndDown`     |
| `src/views/daily/daily-update/steps/event/DailyUpdateEvent.vue`         | 12            | 99 (`smAndDown`), 102/103 (`smAndUp`)                         | `smAndUp, smAndDown`     |
| `src/views/daily/daily-summary/components/DailyDetailEventTimeline.vue` | 9             | 38                                                            | `xs`                     |
| `src/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue`  | 8             | 65, 69, 72                                                    | `xs`                     |
| `src/views/feedback/Feedback.vue`                                       | 9             | 45 (`smAndUp`), 80 (`xs`)                                     | `xs, smAndUp`            |
| `src/views/project/project-detail/ProjectDetail.vue`                    | 7             | 26 (`xs`), 29 (`smAndUp`)                                     | `xs, smAndUp`            |
| `src/views/project/project-detail/tabs/ProjectSection.vue`              | 15            | 100, 109 (`smAndDown`)                                        | `smAndDown`              |
| `src/views/project/project-detail/tabs/ProjectSettings.vue`             | 16            | 110, 132, 204                                                 | `xs`                     |
| `src/views/project/project-detail/tabs/ProjectEvent.vue`                | 13            | 58 (`smAndDown`), 63 (`xs`)                                   | `xs, smAndDown`          |
| `src/views/project/project-detail/components/SectionDialog.vue`         | 6             | 87                                                            | `xs`                     |
| `src/views/project/project-list/ProjectList.vue`                        | 15            | 69                                                            | `smAndDown`              |
| `src/views/components/common-task/CommonTaskDialog.vue`                 | 13            | 126                                                           | `smAndDown`              |
| `src/views/components/task/TaskCard.vue`                                | 10            | 135                                                           | `smAndDown`              |
| `src/views/components/tag/TagCard.vue`                                  | 8             | 41                                                            | `smAndDown`              |
| `src/views/profile/Profile.vue`                                         | 6             | 18                                                            | `mdAndUp`                |
| `src/views/agenga/Agenda.vue`                                           | 15            | 175, 178, 185, 193 (`xs`), 195 (`smAndUp`), 280 (`smAndDown`) | `xs, smAndUp, smAndDown` |
| `src/views/administration/Administration.vue`                           | 5             | 15                                                            | `mdAndUp`                |

#### 1.1.d — Déjà corrects (ne rien changer)

- `src/layout/AuthenticatedLayout.vue` (L.8 `const { mobile }`, `.value` en JS l.11/15/22) ✅
- `src/layout/components/TheNavbar.vue` (L.4 `const { mobile }`, template) ✅
- `src/layout/components/TheHeader.vue` (L.9 `const { mobile }`, template) ✅
- `src/views/daily/daily-summary/DailySummary.vue` (L.13 `const display`, mais `display.xs.value` en JS l.66-68 — **fonctionnel**). Harmonisation possible (déstructurer) mais **pas de bug**.

---

### 1.2 Slot activator Vuetify 2 (`{ attrs, on }`) — activator mort — ✅ FAIT

En Vuetify 3, le slot activator expose `{ props }` (plus `{ attrs, on }`). `v-on="on"` reçoit `undefined` → **le clic n'ouvre plus rien**. Ces 3 fichiers utilisent des composants wrappers custom (`CommonTaskDialog`, `ConfirmDialog`, `ConfirmPasswordDialog`) qui exposent déjà `{ props }` (confirmé par les autres usages corrects, ex. `AdministrationUser.vue:104/127`).

**`src/views/settings/tabs/SettingsCommonTasks.vue`** — L.66-67 :

```html
<!-- AVANT -->
<template #activator="{ attrs, on }">
  <v-btn v-bind="attrs" v-on="on">
    <!-- APRÈS -->
    <template #activator="{ props }"> <v-btn v-bind="props"></v-btn></template></v-btn
></template>
```

**`src/views/project/project-detail/tabs/ProjectSettings.vue`** — deux occurrences :

- L.106-113 : `<template #activator="{ attrs, on }">` → `{ props }` ; sur le `<v-btn>`, supprimer `v-bind="attrs"` (L.108) et `v-on="on"` (L.113), ajouter `v-bind="props"`.
- L.128-135 : idem (`v-bind="attrs"` L.130, `v-on="on"` L.135).

**`src/views/profile/tabs/ProfileAccount.vue`** — L.32-33 :

```html
<!-- AVANT -->
<template #activator="{ attrs, on }">
  <v-btn v-bind="attrs" color="error" :block="$vuetify.breakpoint.xs" v-on="on">
    <!-- APRÈS (voir aussi §1.3 pour $vuetify.breakpoint) -->
    <template #activator="{ props }">
      <v-btn v-bind="props" color="error" :block="$vuetify.display.xs"></v-btn></template></v-btn
></template>
```

---

### 1.3 `$vuetify.breakpoint` supprimé → `$vuetify.display` — ✅ FAIT

`$vuetify.breakpoint` n'existe plus en Vuetify 3 (renommé `$vuetify.display`).

- `src/views/profile/tabs/ProfileAccount.vue:33` — `:block="$vuetify.breakpoint.xs"` → `:block="$vuetify.display.xs"`
- `src/views/profile/tabs/ProfilePassword.vue:145` — `:block="$vuetify.breakpoint.xs"` → `:block="$vuetify.display.xs"`

---

### 1.4 `v-form.validate()` renvoie une `Promise` — ✅ FAIT

En Vuetify 3, `validate()` est **asynchrone** et renvoie `Promise<{ valid: boolean; errors: [] }>`. Tester la valeur de retour directement ne bloque **jamais** (une `Promise` est _truthy_). **Seuls 2 fichiers** appellent `validate()` :

**`src/views/non-auth/ResetPasswordRequest.vue`** — fonction `submit()` L.34-41 :

```ts
// AVANT (L.35)
function submit(): void {
  if (!formRef.value.validate()) return
  ...
}
// APRÈS
async function submit(): Promise<void> {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  ...
}
```

**`src/views/profile/tabs/ProfileEmail.vue`** — fonction `submit()` L.56-60 :

```ts
// AVANT (L.57)
function submit(): void {
  if (!formRef.value.validate() || !form.value.data.email) return
  confirmPasswordDialog.value = true
}
// APRÈS
async function submit(): Promise<void> {
  const { valid } = await formRef.value.validate()
  if (!valid || !form.value.data.email) return
  confirmPasswordDialog.value = true
}
```

> `resetValidation()` (utilisé dans beaucoup d'autres forms) reste valide en V3 — **ne pas y toucher**, sauf les 2 bugs `.value` du §3.6.

---

### 1.5 `v-stepper` en syntaxe V2 — `DailyUpdate.vue` — ✅ FAIT

`src/views/daily/daily-update/DailyUpdate.vue` (L.52-79) utilise l'API stepper de Vuetify 2, disparue. Réécriture complète du bloc :

```html
<!-- AVANT (L.52-79) -->
<v-stepper
  :value="dailyStepper"
  non-linear
  alt-labels
  class="daily-update-stepper"
  @change="onStepperChange($event)">
  <v-stepper-header>
    <v-divider />
    <v-stepper-step :step="1" editable color="accent">Task …</v-stepper-step>
    <v-divider />
    <v-stepper-step :step="2" editable color="accent">Event …</v-stepper-step>
    <v-divider />
  </v-stepper-header>
  <v-stepper-items>
    <v-stepper-content :step="1"><DailyUpdateTask … /></v-stepper-content>
    <v-stepper-content :step="2"><DailyUpdateEvent … /></v-stepper-content>
  </v-stepper-items>
</v-stepper>

<!-- APRÈS -->
<v-stepper v-model="dailyStepper" non-linear alt-labels class="daily-update-stepper">
  <v-stepper-header>
    <v-divider />
    <v-stepper-item :value="1" editable color="accent">Task …</v-stepper-item>
    <v-divider />
    <v-stepper-item :value="2" editable color="accent">Event …</v-stepper-item>
    <v-divider />
  </v-stepper-header>
  <v-stepper-window>
    <v-stepper-window-item :value="1"><DailyUpdateTask … /></v-stepper-window-item>
    <v-stepper-window-item :value="2"><DailyUpdateEvent … /></v-stepper-window-item>
  </v-stepper-window>
</v-stepper>
```

Détails :

- `:value=` + `@change=` → `v-model="dailyStepper"` (déjà `ref(1)` L.21). Les `value` des items (`1`, `2`) doivent matcher les valeurs de `dailyStepper`.
- `<v-stepper-step :step="N">` → `<v-stepper-item :value="N">` ; garder le contenu (label + `<template v-if="dailyTaskCount > 0">`).
- `<v-stepper-items>` → `<v-stepper-window>` ; `<v-stepper-content :step="N">` → `<v-stepper-window-item :value="N">`.
- **`@change` supprimé** : la fonction `onStepperChange` (L.29-32) était appelée dessus. La rebrancher avec un `watch` :
  ```ts
  import { watch } from 'vue'
  watch(dailyStepper, index => {
    const step = index === 1 ? 'task' : 'event'
    router.replace({ params: { step } })
  })
  ```
- **SCSS** L.93 : `.v-stepper__step--editable:hover` n'existe plus → cibler `.v-stepper-item` (le sélecteur actuel devient sans effet ; adapter si le hover doit être neutralisé).

---

### 1.6 `v-tabs-items` / `v-tab-item` supprimés → `v-tabs-window` / `v-tabs-window-item` — ✅ FAIT

Règle générale : `<v-tabs-items>` → `<v-tabs-window>` ; `<v-tab-item>` → `<v-tabs-window-item>`. Le `v-tabs` **et** le `v-tabs-window` doivent partager le **même `v-model`** ; chaque `v-tab` et chaque `v-tabs-window-item` doit porter un `value` correspondant.

**`src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`** (L.160-298) :

- `v-tabs v-model="taskTab"` (L.161) : les 5 `<v-tab>` (L.169-183) **n'ont pas de `value`** → en V3 le matching par index disparaît. **Ajouter un `value` explicite** sur chaque `v-tab` **et** le `value` correspondant sur chaque `<v-tabs-window-item>`. Vérifier le type de `taskTab` (ref) et la fonction `resetSelectedItem()` branchée sur `@update:model-value` (L.168).
- L.186 `<v-tabs-items v-model="taskTab" touchless …>` → `<v-tabs-window v-model="taskTab" touchless …>` ; fermeture L.298.
- L.187, 229, 270, 292, 295 `<v-tab-item :transition="false">` → `<v-tabs-window-item :value="…" :transition="false" :reverse-transition="false">`.

**`src/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue`** (L.181-199) :

- L.181 `<v-tabs-items v-model="sectionTab" touchless …>` → `<v-tabs-window …>` ; fermeture L.199.
- L.182 `<v-tab-item v-for="section of taskBySection" :key="…">` → `<v-tabs-window-item :key="…" :value="…">` (ajouter un `value` = id de section, cohérent avec les `v-tab` de la barre au-dessus).

**`src/views/daily/daily-summary/components/DailyDetail.vue`** (L.176-191) :

- Les `<v-tab tab-value="task">` / `tab-value="event"` (L.177-178) : **`tab-value` → `value`** en V3.
- L.181 `<v-tabs-items v-model="tab" touchless …>` → `<v-tabs-window …>` ; fermeture L.191.
- L.182 `<v-tab-item value="task">` / L.187 `<v-tab-item value="event">` → `<v-tabs-window-item value="task">` / `value="event"`.

**`src/views/project/project-detail/tabs/ProjectSection.vue`** (L.52-85) :

- `v-tabs v-model="sectionTabs"` (L.53) avec `@update:model-value="changeRouteParam($event)"` (L.60) : `changeRouteParam(index)` utilise `sections[index]` → dépend de l'**index**. Les `<v-tab>` (L.61) n'ont pas de `value` → index conservé, OK, **mais** vérifier après migration que `sectionTabs` reste bien un **index numérique**.
- L.77 `<v-tabs-items v-model="sectionTabs" … touchless>` → `<v-tabs-window …>` ; fermeture L.85.
- L.78 `<v-tab-item v-for="section of sections" :key="…">` → `<v-tabs-window-item :key="…">`.

---

### 1.7 `@click.native` supprimé → `@click` — ✅ FAIT

Le modificateur `.native` n'existe plus en Vue 3.

- `src/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue:195` — sur `<TaskCard>` : `@click.native="selectTask(task)"` → `@click="selectTask(task)"`
- `src/views/daily/daily-update/steps/task/components/DailyUpdateCommonTask.vue:38` — sur `<CommonTaskCard>` : `@click.native="selectCommonTask(commonTask.id)"` → `@click="…"`
- `src/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue:110` — sur `<TaskCard>` : `@click.native="selectTask(task)"` → `@click="…"`
- `src/views/daily/components/DailyTaskCard.vue` — L.50, 59, 68 sur `<ProjectChip>` / `<SectionChip>` / `<CollectionChip>` : `@click.native.stop` → `@click.stop`

⚠️ Les cibles sont des **composants custom** (`TaskCard`, `CommonTaskCard`, `ProjectChip`…). En Vue 3, `@click` écoute l'événement `click` _émis_ par le composant ; si le composant a un élément racine unique, le listener retombe dessus (_fallthrough_) et le clic DOM est capté. **Tester chaque cas** : le clic sur la carte doit bien sélectionner la tâche / le clic sur le chip doit bien être stoppé (`.stop`).

---

### 1.8 `EventDialog.vue` — date/time pickers cassés — ✅ FAIT

> **Réalisé en Vuetify 4** (`VDatePicker`/`VTimePicker` en core, auto-importés) : `no-title`/`scrollable`/`@change` retirés des `v-date-picker` ; `v-model` (Date) géré via `:model-value="moment(str).toDate()"` + handlers `onStartDateSelected`/`onEndDateSelected` (conversion Date↔string `YYYY-MM-DD`) ; `.save()` du menu remplacé par `@click:minute="…Picker = false"` ; `ref="startDateTimeMenu"`/`ref="endDateTimeMenu"` et `@change` des champs readonly supprimés ; corrigé aussi les 4 erreurs de type (`emit('update', { id: event.id })`, `formattedDate(string | null)`, `$refs.save`). **build + type-check OK.** ⚠️ QA runtime à faire : sélection date/heure début & fin, « takes whole day », effacement date de fin, messages d'erreur.

`src/views/components/event/EventDialog.vue` cumule plusieurs API V2 disparues dans les 4 blocs `<v-menu>` (Start date, Start time, End date, End time).

**a. `<v-menu>` : `offset-y` + `nudge-top`** (L.256-258, 285-287, 318-320, 356-357) — props supprimées. Retirer `offset-y` et `nudge-top="30"` (voir §2.2 pour le remplacement par `location`/`offset` si un décalage est nécessaire).

**b. `<v-date-picker>` (L.270-277 et 336-348)** :

- `@change="startDatePicker = false"` (L.276) et `@change="() => {…}"` (L.342) — l'événement `change` n'existe plus → **le menu ne se ferme jamais**. Remplacer par `@update:model-value`.
- `no-title` et `scrollable` — **props supprimées** en V3 : les retirer. `show-adjacent-months` et `:first-day-of-week="1"` restent valides.
- **`v-model="eventForm.data.startDate"` / `endDate`** : en V3 `v-date-picker` travaille avec un **objet `Date`**, alors que `startDate`/`endDate` sont des **strings `'YYYY-MM-DD'`** (cf. `populateForm` L.117-140 et le modèle). Prévoir une conversion : passer un `Date` au picker, reconvertir en string à la sortie (par ex. via un `computed` avec getter/setter, ou `@update:model-value="val => eventForm.data.startDate = moment(val).format('YYYY-MM-DD')"`).

**c. `<v-time-picker>` (L.301-307 et 373-379)** :

- **Composant `labs`** en Vuetify 3 : non disponible par défaut. L'enregistrer, p. ex. dans `src/plugins/vuetify.ts` :
  ```ts
  import { VTimePicker } from 'vuetify/labs/VTimePicker'
  // dans createVuetify({ components: { VTimePicker, ... } })
  ```
- `@click:minute="$refs.startDateTimeMenu.save(eventForm.data.startTime)"` (L.306) et l'équivalent end (L.378) — la méthode **`.save()` du menu n'existe plus** (pattern _return-value_ V2). Remplacer par une fermeture explicite du menu : `@update:model-value="startTimePicker = false"` (ou fermer après sélection selon l'UX voulue). Les `ref="startDateTimeMenu"` (L.281) / `ref="endDateTimeMenu"` (L.352) ne servaient qu'à `.save()` → devenus inutiles.

**d. Bug pré-existant** : L.232 `requried` (faute de frappe) → `required` sur le `<v-text-field>` du nom.

⚠️ Écran délicat : re-tester intégralement création + édition d'événement (dates début/fin, heures, « takes whole day », effacement date de fin `@click:clear` L.333, messages d'erreur).

---

### 1.9 `v-calendar` (Agenda) — retiré du core, API entièrement changée — ✅ FAIT

> **⚠️ PRÉMISSE FAUSSE (corrigée en Vuetify 4).** Vuetify **4** a **restauré le `VCalendar` classique en core** (celui de Vuetify 2) : `:events`, `event-color`, `event-start/end`, `event-margin-bottom`, `event-ripple`, `@click:day`, slots `#day-label`/`#event`, méthodes d'instance `prev()`/`next()` **existent tous**. Donc **aucune réécriture** — le `v-calendar` de l'Agenda est resté tel quel. §1.9 s'est réduit à corriger les erreurs de type (build/type-check) :
>
> - **Vrais bugs runtime** : `moment(value)` → `moment(value.value)` (ref non déballé, ×4 : mois affiché + fetch events) ; `<string>eventDayDialogDate` → `.value`.
> - **Nav mois** : `calendar.value?.prev()/next()` (garde de nullité).
> - **`@click:day`** : émet `[Event, day]` en v4 → `handleClickOnDay(_nativeEvent, day)` (utilise `day.date`).
> - **Types** : `eventTooltipElement` re-typé `ref<Element>()` (+ `nativeEvent.target as Element`), `:start-date-placeholder="… ?? null"`, `:date="… ?? ''"`, cast `$event as EventExtendedModel` du tooltip (désactivé).
>
> **build + type-check OK (0 erreur Agenda).** ⚠️ QA runtime : affichage du calendrier + events, navigation mois (now/précédent/suivant), clic sur un jour → `EventDayDialog`.

`src/views/agenga/Agenda.vue` utilise `<v-calendar>` (L.200-263) avec l'API **Vuetify 2**, qui **n'existe pas** dans le `v-calendar` **labs** de Vuetify 3.

Éléments dépendant de l'ancienne API :

- Props : `:events`, `event-color`, `event-start`, `event-end`, `:event-margin-bottom`, `:event-ripple`, `@click:day` (L.203-212).
- Slots : `#day-label="{ day, present, date }"` (L.213) et `#event="{ event }"` (L.227) — n'existent pas tels quels en labs V3.
- **Script** : `calendar.value.next()` / `calendar.value.prev()` (fonctions `nextMonth`/`previousMonth`, cf. L.164) — ces méthodes d'instance n'existent plus.
- `v-model="value"` avec `value` = string date.

**Décision à prendre** (à valider avec le mainteneur) :

1. **Réimplémenter** avec l'API `vuetify/labs/VCalendar` (props/slots/événements différents — consulter la doc labs), ou
2. **Conserver un calendrier custom** (les styles existent déjà : `:deep(.v-calendar-weekly__day)` dans `Agenda.vue:305` et `App.vue:70`) et ne pas dépendre de `v-calendar`.

Le menu tooltip juste en dessous (L.265-277) est **déjà désactivé** (commentaire L.264) et porte `offset-x` (L.270) → à nettoyer avec le reste (§2.2).

⚠️ QA complète de l'Agenda : navigation mois (`now`/précédent/suivant), affichage des événements, clic sur un jour → `EventDayDialog`.

---

### 1.10 Type `Route` inexistant en Vue Router 4 — ✅ FAIT

`src/router/modules/nonAuth.router.ts` importe `Route` (L.1), type **supprimé** en VR4. Non vu par `yarn build`, mais faux et signalé par `yarn type-check`.

```ts
// AVANT (L.1)
import { Route, RouteRecordRaw } from 'vue-router'
// APRÈS
import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
```

Puis remplacer les 3 annotations `(route: Route)` par `(route: RouteLocationNormalized)` :

- L.34 `props: (route: Route) => ({ email: route.query.email })`
- L.45 `props: (route: Route) => ({ uidb64: route.query.uidb64, token: route.query.token })`
- L.51 idem
- L.57 `props: (route: Route) => ({ token: route.query.token })`

---

### 1.11 `VSelect`/`VAutocomplete`/`VCombobox` : slot `item` → `internalItem` (Vuetify 4) — ✅ FAIT

En Vuetify 4, la prop de slot **`item`** des slots `#item` / `#selection` est renommée **`internalItem`** (l'objet interne Vuetify `{ raw, title, value }`). Seul usage du projet : un `v-autocomplete`.

**`src/views/components/tag/TagSearch.vue`** (L.75 `#item`, L.78 `#selection`) :

```html
<!-- AVANT -->
<template #item="{ item }">
  <TagChip :tag="item" />
</template>
<template #selection="{ item }">
  <!-- Empty to remove search when a tag is selected -->
</template>
<!-- APRÈS -->
<template #item="{ internalItem }">
  <TagChip :tag="internalItem.raw" />
</template>
<template #selection="{ internalItem }">
  <!-- Empty to remove search when a tag is selected -->
</template>
```

> ⚠️ `item` était déjà l'objet interne (pas le `Tag`) → passer `.raw` à `TagChip` corrige aussi l'erreur `vue-tsc` `TagSearch.vue:76` (cf. §3.10). À re-tester : rendu de la liste déroulante + sélection d'un tag.

---

### 1.12 `ProfileAccount.vue` — `useRouter()` appelé hors du scope `setup` — ✅ FAIT

Un composable Vue (`useRouter`, `useRoute`, `useDisplay`…) doit être appelé **pendant l'exécution de `setup()`**, car il résout sa valeur via le contexte d'injection du composant courant. Appelé plus tard, dans un gestionnaire d'événement, ce contexte n'existe plus.

Ici `useRouter()` est appelé **à l'intérieur** de `deleteAccount()` (`src/views/profile/tabs/ProfileAccount.vue:9`) : la redirection finale échoue, alors que le compte a déjà été supprimé, le token effacé et les stores réinitialisés. L'utilisateur reste sur une page morte, non authentifié, sans indication.

```ts
// AVANT (L.8-18)
function deleteAccount(): void {
  const router = useRouter() // ❌ hors du scope setup
  userApi
    .deleteAccount()
    .then(() => {
      authService.removeToken()
      authService.resetStore()
      router.push({ name: 'login' }) // ne s'exécute pas correctement
    })
    .catch(error => console.error(error))
}

// APRÈS
const router = useRouter() // ✅ au niveau du <script setup>

function deleteAccount(): void {
  userApi
    .deleteAccount()
    .then(() => {
      authService.removeToken()
      authService.resetStore()
      router.push({ name: 'login' })
    })
    .catch(error => console.error(error))
}
```

**Fichier à modifier :**
| Fichier | Ligne | Action |
|---|---|---|
| `src/views/profile/tabs/ProfileAccount.vue` | 8-9 | Remonter `const router = useRouter()` avant `function deleteAccount()` |

**Vérifier qu'il n'y a pas d'autres occurrences du même défaut :**

```bash
# tout appel de composable à l'intérieur d'une fonction est suspect
grep -rn "  const .* = use\(Router\|Route\|Display\|TemplateRef\)()" src --include='*.vue'
```

⚠️ QA restante : supprimer un compte de test → doit rediriger vers `/login`. Le correctif est appliqué (composable remonté au niveau `<script setup>`) mais n'a **pas** été validé à l'exécution (il faut détruire un compte).

</details>

---

<details>
<summary><strong>2. 🟠 Iso-visuel — pour ne rien changer au style — 12/14 faits, 1 annulé</strong></summary>

### 2.1 `variant` des inputs (défaut V3 = `filled`, on veut `underlined`) — ✅ FAIT

En Vuetify 2, les inputs étaient soulignés ; en V3 le défaut est `filled`. Certains inputs ont **déjà** `variant="underlined"` (ex. `Login.vue:59/66`, `Register.vue:156/169/181/194`, `ResetPasswordRequest.vue:65`), d'autres non → rendu **incohérent**.

**Correctif recommandé (une seule modif)** : dans `src/plugins/vuetify.ts`, ajouter un bloc `defaults` :

```ts
defaults: {
  VTextField: { variant: 'underlined' },
  VTextarea: { variant: 'underlined' },
  VSelect: { variant: 'underlined' },
  VAutocomplete: { variant: 'underlined' },
  VCombobox: { variant: 'underlined' },
  VFileInput: { variant: 'underlined' },
}
```

Points de vigilance :

- Les `variant` **locaux** l'emportent sur le défaut → les inputs déjà en `underlined` restent identiques, et **`Feedback.vue:62/72` (`variant="filled"`)** conserve `filled` : confirmer que c'est bien voulu (sinon retirer l'override).
- Après ajout, **passer en revue tous les fichiers à inputs** pour vérifier le rendu : `App.vue`, `ConfirmPasswordDialog.vue`, `Register.vue`, `ResetPassword.vue`, `Login.vue`, `ResetPasswordRequest.vue`, `CollectionFormDialog.vue`, `CollectionSettings.vue`, `DailyTaskForm.vue`, `Feedback.vue`, `ProjectSettings.vue`, `SectionDialog.vue`, `ProjectFormDialog.vue`, `CommonTaskDialog.vue`, `TaskDialog.vue`, `EventDialog.vue`, `TagSearch.vue`, `ProfileEmail.vue`, `TagDialog.vue`, `ProfilePassword.vue`, `ProfileUser.vue`.

### 2.2 `offset-y` / `offset-x` / `offset-overflow` / `nudge-*` supprimés — ✅ FAIT

Sur `v-menu`, ces props n'existent plus. En V3 le menu se place par défaut sous l'activateur ; utiliser `location="…"` et `offset="<px>"` si besoin.

| Fichier                                                | Ligne              | Props à retirer                          |
| ------------------------------------------------------ | ------------------ | ---------------------------------------- |
| `src/views/daily/components/DailyTaskActionChip.vue`   | 36                 | `offset-y offset-overflow`               |
| `src/views/daily/components/DailyTaskFormCard.vue`     | 56                 | `offset-y`                               |
| `src/views/components/tag/TagGroup.vue`                | 79                 | `offset-y offset-overflow`               |
| `src/views/components/task/TaskCard.vue`               | 79                 | `offset-y`                               |
| `src/views/components/common-task/CommonTaskCard.vue`  | 63                 | `offset-y`                               |
| `src/views/components/tag/TagDialog.vue`               | 175-176            | `offset-y` + `nudge-bottom="5"`          |
| `src/views/administration/tabs/AdministrationUser.vue` | 103                | `offset-y offset-x`                      |
| `src/views/components/event/EventDialog.vue`           | 256, 285, 318, 356 | `offset-y` + `nudge-top="30"` (cf. §1.8) |
| `src/views/agenga/Agenda.vue`                          | 270                | `offset-x` (menu désactivé, cf. §1.9)    |

> Comparer le positionnement avant/après ; ajuster via `location`/`offset` si le placement diffère.

### 2.3 Hover mobile — chips & tabs (`src/styles/global.scss`, ex-`App.vue`) — ✅ FAIT

> Le bloc `.v-chip, .v-tab { &:focus::before, &:hover::before { … } }` était du **CSS mort** (vérifié dans `node_modules/vuetify/lib/components/VChip/VChip.sass` et `VTabs.sass`) : `.v-chip` neutralise son survol via un vrai élément **`.v-chip__overlay`** (pas un pseudo-élément), et `.v-tab` délègue au **`.v-btn__overlay`** (un `v-tab` est construit sur `VBtn` en interne). Le `::before` ciblé n'existe plus pour ces deux composants.
>
> Remplacé par `.v-chip:focus .v-chip__overlay, .v-chip:hover .v-chip__overlay { opacity: 0 !important }`. `.v-tab` est sorti du sélecteur : il est déjà couvert par la règle `.v-btn:hover .v-btn__overlay` juste au-dessus, qui, elle, était correcte.
>
> ⚠️ QA restante : sur viewport `sm-and-down`, vérifier qu'aucun survol ne persiste sur les chips ni les onglets.

### 2.4 QA des sélecteurs `:deep()` — ✅ FAIT

> **Vérifié par comparaison automatique** des 15 classes ciblées par un `:deep()` dans `src/` contre l'intégralité des `.sass`/`.css` de `vuetify@4.1.6`. Aucun `::v-deep`/`>>>` résiduel. **14 classes sur 15 existent toujours.**
>
> Une seule avait disparu : **`.v-timeline-item__divider`**, utilisée dans `DailyDetailTaskTimeline.vue` et `DailyDetailEventTimeline.vue` — ses règles `min-width`/`justify-content` ne s'appliquaient donc plus. En V4 le séparateur n'est plus un enfant BEM de l'item mais un composant frère : `.v-timeline-divider` (`VTimeline.sass:103`, même `display: flex; align-items: center`). Renommé dans les deux fichiers.
>
> Classes confirmées présentes : `.v-list-item__overlay`, `.v-slide-group__prev/__next`, `.v-tab`, `.v-stepper-header`, `.v-stepper-window`, `.v-window__container`, `.v-window-item`, `.v-timeline-item__body`, `.v-input__prepend`, `.v-field`, `.v-card__overlay`, `.v-calendar-weekly__head-weekday`, `.v-calendar-weekly__day`.
>
> ⚠️ Reste une QA **visuelle** : l'existence d'une classe ne garantit pas que le rôle de l'élément soit inchangé.

---

### 2.5 Slot `v-hover` : `{ hover }` → `{ isHovering }` (Vuetify 3 — manqué) — ✅ FAIT

En Vuetify 3, le slot par défaut de `<v-hover>` expose **`{ isHovering }`** (et non `{ hover }`). Comme `hover` n'existe pas, le binding vaut `undefined` → l'effet de survol (couleur d'icône/bouton) **ne s'applique jamais**, et `vue-tsc` remonte `Property 'hover' does not exist`.

**Règle** : `<v-hover v-slot="{ hover }">` → `<v-hover v-slot="{ isHovering }">`, puis remplacer chaque `hover` par `isHovering` dans le contenu du slot (ex. `:color="hover ? 'grey' : 'grey darken-3'"` → `isHovering`).

**Fichiers & lignes :**
| Fichier | Ligne(s) |
|---|---|
| `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue` | 193, 234, 274 |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue` | 79 |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue` | 126 |
| `src/views/daily/daily-summary/components/DailyDetail.vue` | 144 |
| `src/views/project/project-detail/components/SectionDialog.vue` | 84 |
| `src/views/components/tag/TagDialog.vue` | 141 |
| `src/views/components/event/EventDialog.vue` | 209 |
| `src/views/components/event/EventItemCard.vue` | 100 |
| `src/views/agenga/Agenda.vue` | 215 |

⚠️ QA : re-tester chaque survol (icônes « open-in-new », boutons delete/edit, etc.).

---

> **Points 2.6 → 2.12 : adaptations Material Design 3 (Vuetify 4).** ✅ La **version est déjà montée en 4.1.6** (build OK, outillage installé : `vite-plugin-vuetify` 2.1.3, `eslint-plugin-vuetify` 2.7.2, `sass` 1.102). Ces points sont les **adaptations runtime/visuelles restantes** (elles ne bloquent pas le build).
>
> **Décisions à trancher** : (1) breakpoints — figer les anciens seuils _(recommandé, §2.7)_ ou adopter MD3 ; (2) typo — renommage des classes `text-*` **non confirmé** (le codemod tranchera, §2.6) ; (3) `v-btn` uppercase — accepter le défaut ou rétablir (§2.9).
> Outils officiels : `npx vuetify-codemods` + MCP Vuetify (`get_v4_breaking_changes`).

### 2.6 (Vuetify 4) Typographie MD3 (~91 occurrences, 51 fichiers) — ✅ FAIT

> **Réalisé.** Renommage confirmé (guide officiel [Typography Migration](https://vuetifyjs.com/en/getting-started/typography-migration/)) : `h1-h3`→`display-*`, `h4-h6`→`headline-*`/`title-large`, `subtitle-1`/`body-1`→`body-large`, `subtitle-2`/`button`→`title-small`/`label-large`, `body-2`→`body-medium`, `caption`→`body-small`, `overline`→`label-medium` (+ `text-uppercase` ajouté pour compenser la perte des majuscules par défaut, seule occurrence dans `SettingsTags.vue`). Appliqué par script sur les **91 occurrences / 51 fichiers**, y compris les variantes responsive (`text-sm-*`, `text-md-*`, etc., qui suivent la même convention en MD3).
>
> **Effet de bord découvert et corrigé** : Vuetify 4 a aussi réduit son reset CSS (`h1`-`h6`/`p` n'ont plus `margin: 0` par défaut) → règle de reset restaurée dans `src/styles/global.scss`, correctement wrappée en `@layer vuetify-core.reset` pour ne pas gagner sur les classes utilitaires `mb-*`/`mt-*` (cf. §2.10). `p` a aussi une marge par défaut `margin-bottom: 16px` ajoutée (choix produit, hors reset MD2).
>
> **build + type-check OK.** ⚠️ QA visuelle recommandée (tailles légèrement différentes, cf. tableau de correspondance ci-dessous).

Repérer les fichiers : `grep -rlE "text-(h[1-6]|subtitle-[12]|body-[12]|button|caption|overline)\b" src/`.
Occurrences par classe : `text-body-1` (23), `text-h5` (19), `text-h6` (18), `text-subtitle-1` (8), `text-body-2` (8), `text-subtitle-2` (7), `text-h4` (3), `text-caption` (3), `text-h1` (1), `text-overline` (1). Concentrées dans `MainTitle/SecondaryTitle/TertiaryTitle.vue`, `TheHeader/TheNavbar`, et la quasi-totalité des vues.

### 2.7 (Vuetify 4) Breakpoints réduits → `useDisplay`

> **Décision prise (implicite)** : les seuils MD3 par défaut (`md: 840`, `lg: 1145`, `xl: 1545`, `xxl: 2138`) ont été **adoptés tels quels**, pas figés à l'ancien découpage. Ça a d'ailleurs servi de piste de diagnostic pour un bug de layout `DailyDetail.vue` (bascule tabs ↔ 2-colonnes à une largeur différente qu'avant). Reste à faire : la **QA responsive complète** `xs`→`xl` n'a pas été menée systématiquement — cocher la case seulement après un passage écran par écran.

Les seuils par défaut sont réduits (MD3) → tout le responsive se décale. **~30 fichiers** utilisent `useDisplay()` + le composable central `src/composables/useDialogWidth.ts` (consommé par ~20 dialogs/cartes). Repérer : `grep -rl "useDisplay" src/`.

**Recommandé** : **figer les anciens seuils** dans `src/plugins/vuetify.ts` pour un responsive identique (aucun re-test) :

```ts
display: {
  thresholds: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920, xxl: 2560 },
}
```

Sinon (adopter MD3) : re-tester `xs`→`xl` sur chaque écran (dialogs plein écran, tailles boutons, colonnes, ProgressWheel).

### 2.8 (Vuetify 4) `fill-height` / VContainer — ⛔ ANNULÉ

> **Point abandonné**, aucune action ne sera menée. Le rendu obtenu convient tel quel : aucun des écrans listés n'attendait réellement le centrage vertical que `fill-height` fournissait en V2.

`VContainer fill-height` **ne centre plus verticalement** ; max-widths réduits (md 900→700, lg 1200→1000). Fichiers concernés à l'époque du relevé :

- `src/views/agenga/Agenda.vue`, `src/views/components/event/EventDayDialog.vue`, `src/views/settings/Settings.vue`, `src/views/settings/components/SettingsTagList.vue`, `src/views/settings/tabs/SettingsCommonTasks.vue`, `src/views/settings/tabs/SettingsTags.vue`.

Action envisagée puis écartée : réintroduire `d-flex align-center` là où un centrage vertical était attendu.

### 2.9 (Vuetify 4) VBtn : uppercase supprimé + layout grid → flex — ✅ FAIT

> **Réalisé** — via la variable Sass officielle plutôt qu'une classe (`src/styles/settings.scss`) :
>
> ```scss
> @use 'vuetify/settings' with (
>   $button-colored-disabled: false,
>   $button-text-transform: uppercase
> );
> ```
>
> Vérifié par compilation directe (`sass` CLI sur `VBtn.sass`) : `.v-btn { text-transform: uppercase; }` bien généré. Le passage grid→flex est **purement interne** à Vuetify (aucun override custom du projet n'en dépendait) → aucune action requise sur ce point. ⚠️ QA visuelle : alignement icône + texte sur les boutons avec `<v-icon start/end>`.

Les libellés des **89 `<v-btn>`** ne sont plus en MAJUSCULES par défaut, et le layout interne passe de grid à flexbox.

### 2.10 (Vuetify 4) CSS Layers obligatoires + `!important` — ✅ FAIT (cas connu traité)

> **Réalisé pour le cas identifié** : bug concret rencontré sur le reset `h1`-`h6`/`p` (§2.6) — une règle `margin: 0` non-layered dans `global.scss` gagnait **systématiquement** sur les classes utilitaires Vuetify (`mb-3`, etc.), même wrappées dans un layer, car **une règle hors layer bat toujours une règle layered, quelle que soit la spécificité**. Confirmé par le guide officiel ([Upgrade guide — Layers](https://vuetifyjs.com/en/getting-started/upgrade-guide/#layers)) et corrigé en reproduisant exactement le snippet recommandé, avec le bon sous-layer :
>
> ```scss
> @layer vuetify-core.reset {
>   h1,
>   h2,
>   h3,
>   h4,
>   h5,
>   h6 {
>     margin: 0;
>   }
>   p {
>     margin: 0 0 16px;
>   }
> }
> ```
>
> **Les 48 autres `!important` du projet n'ont pas ce problème** : ils sont eux aussi non-layered, mais leur but est justement de **gagner** face à Vuetify (neutraliser un défaut, forcer une dimension) — le mécanisme « non-layered gagne toujours » joue alors **en leur faveur**, pas besoin d'y toucher. Seul un `!important` qui doit explicitement **perdre** face à une classe utilitaire Vuetify (comme le cas du reset) a besoin d'être repassé en `@layer`.
> **`overflow-y` retiré du reset** (Vuetify) : non vérifié spécifiquement, à surveiller si un scroll casse quelque part.

Vuetify 4 impose les CSS layers → la spécificité des overrides change.

- Overrides `:deep()` à revérifier : `global.scss` (ex-`App.vue`) (`.v-stepper__*`, `.v-window__*`, `.v-calendar-weekly*`, `.v-btn__overlay`, `.v-chip`/`.v-tab` — cf. §2.3 pour ce dernier point, confirmé cassé), `Settings/CollectionDetail/ProjectDetail/ProjectSection/Profile/DailyUpdateProjectListItem`, timelines, `TheHeader`.

### 2.11 (Vuetify 4) Variables Sass renommées/supprimées — ✅ FAIT

`src/styles/settings.scss` fait `@use 'vuetify/settings' with ($button-colored-disabled: false)`.

- ✅ **`$button-colored-disabled` existe toujours en v4.1.6** (le `yarn build` passe sans erreur Sass). Aucune action requise ici. _(D'autres variables sont supprimées — `$grid-gutters`, `$form-grid-gutter`, `$counter-color`… — mais non utilisées par le projet.)_

### 2.12 (Vuetify 4) Grille VRow/VCol (gap) — ✅ FAIT (clos sans action)

Refonte (marges négatives → CSS `gap`, certaines classes/comportements changent). **Surface recomptée, plus faible qu'estimé** : 1 `v-container` (`AuthenticatedLayout.vue:34`), 2 `v-row` (`DailyDetail.vue:204`, `ProjectSectionItem.vue:124`), 4 `v-col`, aucun `offset-*`. Aucun renommage nécessaire, point clos sans modification.

> Note d'investigation : un bug de layout signalé dans `DailyDetail.vue` (cards qui ne remplissaient plus la largeur disponible) faisait initialement suspecter ce point (`v-row`/`v-col`), mais la cause réelle était ailleurs (`.v-timeline-item__body`, cf. §3.10/timelines). `v-row`/`v-col` en tant que tel reste non vérifié pour ce qui est du `gap`.

---

### 2.13 (Vuetify 4) Blocs CSS morts dans `global.scss` — ✅ FAIT

Ces sélecteurs ciblaient des classes internes qui **n'existent plus dans Vuetify 4**. Les règles ne matchaient donc rien, **sans aucune erreur ni avertissement** — deux correctifs visuels étaient silencieusement désactivés depuis la montée de version.

> **Correction du diagnostic initial** : le remplaçant de `.v-application--wrap` n'est **pas** `.v-application` mais **`.v-application__wrap`** (vérifié dans `node_modules/vuetify/lib/components/VApp/VApp.css`). V4 y applique déjà `min-height: 100dvh` ; l'override ne sert donc plus qu'à préférer `svh` (hauteur stable, barre d'URL visible) à `dvh` (qui reflue au scroll) — c'est le comportement d'avant migration, conservé.

> Les 4 sélecteurs `.v-stepper__*` n'étaient pas seulement à supprimer : 3 ont un équivalent V4 et un effet réel (V4 met une `elevation-1` sur `.v-stepper-header` et `margin: 1.5rem` sur `.v-stepper-window`). Correspondance retenue : `__header` → `.v-stepper-header` ; `__items` (`flex-grow`) + `__content` (`height`/`padding`) → fusionnés sur `.v-stepper-window` (`flex-grow: 1`, `min-height: 0`, `margin: 0`) ; `__wrapper` → supprimé, son rôle est tenu par `.v-window__container`.

> `.daily-update-stepper` n'étant utilisé que par `DailyUpdate.vue`, le bloc a été **déplacé dans le `<style scoped>` de ce composant**, les descendants passant par `:deep()` (la racine `.daily-update-stepper` porte l'attribut de scope du parent, ses enfants non).

Vérification faite pour chaque classe (`grep -rl "<classe>" node_modules/vuetify/lib/`) :

| Sélecteur                         | Ligne   | Existe en V4 ?                                | Conséquence réelle                                                                                            |
| --------------------------------- | ------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.v-application--wrap`            | 176-178 | ❌ (classe **Vuetify 2**)                     | `min-height: 100svh` inactif → **la hauteur ne compense plus la barre de navigation des navigateurs mobiles** |
| `.v-stepper__header`              | 203     | ❌                                            | `box-shadow: none` + `margin-bottom` inactifs                                                                 |
| `.v-stepper__items`               | 208     | ❌                                            | `flex-grow: 1` inactif                                                                                        |
| `.v-stepper__content`             | 212     | ❌                                            | `height: 100%` + `padding: 0` inactifs                                                                        |
| `.v-stepper__wrapper`             | 217     | ❌                                            | `height: 100%` inactif                                                                                        |
| `.v-window__container`            | 218     | ✅                                            | conservé                                                                                                      |
| `.v-window-item`                  | 222     | ✅                                            | conservé                                                                                                      |
| `.v-chip` / `.v-tab` + `::before` | 235-240 | ❌ (pseudo-élément → **élément** `__overlay`) | **le survol n'est plus neutralisé sur mobile** — c'est le §2.3, déjà tracé                                    |

**Marche à suivre :**

1. **Hauteur mobile** — remplacer le sélecteur V2 par le conteneur racine réel de Vuetify 4 :

   ```scss
   /* AVANT (L.176-178) */
   .v-application--wrap {
     min-height: 100svh !important;
   }

   /* APRÈS — vérifier dans l'inspecteur quel élément porte la hauteur */
   .v-application {
     min-height: 100svh !important;
   }
   ```

   ⚠️ **À valider dans l'inspecteur** : je n'ai pas confirmé que `.v-application` est le bon
   porteur en V4 — vérifier sur mobile réel (ou émulation avec barre d'URL) avant de conclure.

2. **Stepper** — le bloc `.daily-update-stepper` (L.195-227) a été écrit pour l'ancien stepper. Depuis §1.5, le composant utilise `v-stepper-window` / `v-stepper-window-item`. **Supprimer les 4 sélecteurs `.v-stepper__*` morts** et vérifier visuellement le wizard daily : s'il s'affiche correctement sans eux, le bloc est simplement à réduire aux deux sélecteurs encore valides.

3. **Survol chips/tabs** — traité par **§2.3** (même correctif). Ne pas le faire deux fois.

**Fichier à modifier :**
| Fichier | Lignes | Action |
|---|---|---|
| `src/styles/global.scss` | 176-178 | Remplacer `.v-application--wrap` par le sélecteur V4 valide |
| `src/styles/global.scss` | 195-227 | Supprimer les 4 sélecteurs `.v-stepper__*` ; garder `.v-window__container` et `.v-window-item` |
| `src/styles/global.scss` | 229-242 | Voir §2.3 |

**Méthode de vérification d'un sélecteur avant de l'écrire :**

```bash
grep -rl "v-nom-de-classe" node_modules/vuetify/lib/ | head -1   # vide = classe inexistante
```

⚠️ QA : hauteur de page sur mobile (barre d'URL visible/masquée) ; wizard daily (`/daily/<aujourd'hui>/update/task`) ; survol des chips et onglets sur viewport `sm-and-down`.

---

### 2.14 (Vuetify 4) Modificateurs de nuance `lighten-*` / `darken-*` silencieusement perdus — ✅ FAIT

> **L'inventaire ci-dessous était incomplet** : 6 occurrences manquaient, toutes traitées — `ProjectSettings.vue` (176-179 en `c`, 181 en `a`), `CommonTaskCard.vue:49` et `TaskCard.vue:38` (`'green darken-2'`), `EventItemCard.vue:83`.
>
> **Choix retenus** — `collection lighten-2` (3 sites) → **`color="collection"`** : aucune option `variations` n'est déclarée dans `src/plugins/vuetify.ts`, donc les tokens de thème n'ont **aucune** nuance générée, et en V2 les nuances étaient des sélecteurs composés réservés à la palette Material. Ce code **n'a donc jamais fonctionné** : retirer la nuance est un no-op visuel. Obtenir réellement un olive plus clair demanderait d'activer `variations` — c'est un choix de design, pas de la migration. Idem `accent variant-1` → `color="accent"` (`variant-1` n'existe dans aucune version).
>
> **Deux corrections changent le rendu actuel** parce que le code était déjà mort avant la migration : `EventItemCard.vue:83` (`'grey-text'`, un seul tiret — ni V2 ni V4) et `ProjectSettings.vue:176-179` (état mixte `text-grey` V4 + `text--lighten-2` V2). Les deux ont été alignées sur l'intention lisible du code.

En Vuetify 2, `color="grey darken-3"` fonctionnait parce que `.darken-3` existait comme **classe autonome**. En Vuetify 4, les nuances sont **fusionnées dans le nom de la classe** (`.bg-grey-darken-3`), et les classes autonomes ont disparu.

Vérifié dans `node_modules/vuetify/lib/styles/colors.css` :

| Classe                                     | V4              |
| ------------------------------------------ | --------------- |
| `.darken-3`, `.lighten-2`, `.variant-1`    | ❌ **absentes** |
| `.bg-grey-darken-3`, `.text-grey-darken-3` | ✅ présentes    |

**Mécanique de la régression** — `computeColor()` (`node_modules/vuetify/lib/composables/color.js`) ne reconnaît pas `'grey darken-3'` comme une couleur CSS, donc il produit `class="bg-grey darken-3"` → **deux** classes : `bg-grey` s'applique, `darken-3` ne correspond à rien. **Résultat : la couleur de base s'affiche, la nuance est perdue** — sans erreur.

Trois formes distinctes à traiter, avec des conséquences différentes :

**a. Prop `color` avec nuance** — s'affiche, mais dans la mauvaise nuance :

```html
<!-- AVANT -->
:color="isHovering ? 'grey' : 'grey darken-3'"
<!-- APRÈS -->
:color="isHovering ? 'grey' : 'grey-darken-3'"
```

| Fichier                                                                                | Lignes                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`                          | 200, 243, 285                                                            |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue` | 86                                                                       |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue`    | 133                                                                      |
| `src/views/daily/components/DailyTaskCard.vue`                                         | 25 (`'green darken-2'`)                                                  |
| `src/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue`                 | 66 (`'green darken-2'`)                                                  |
| `src/views/daily/daily-summary/components/DailyDetail.vue`                             | 151 (`'grey lighten-1'` / `'grey darken-3'`)                             |
| `src/components/FilterChip.vue`                                                        | 10 (`'grey darken-4'`)                                                   |
| `src/views/daily/daily-summary/components/DailySummaryCard.vue`                        | 17 (rampe `'green darken-4'`…)                                           |
| `src/utils/daily-task.utils.ts`                                                        | 20, 22, 24 (`'teal lighten-3'`, `'purple lighten-3'`, `'red lighten-3'`) |

**b. Nuance appliquée à un token de thème** — cas particulier : un token custom **n'a pas** de nuances générées (aucune option `variations` dans `src/plugins/vuetify.ts`). `bg-collection` s'applique, la nuance est ignorée. Choisir : soit retirer la nuance, soit déclarer une vraie couleur de thème dédiée.

| Fichier                                                                                | Ligne | Valeur                                                                                 |
| -------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `src/views/collection/components/CollectionCard.vue`                                   | 24    | `color="collection lighten-2"`                                                         |
| `src/views/collection/collection-detail/tabs/CollectionGeneral.vue`                    | 181   | `color="collection lighten-2"`                                                         |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue` | 59    | `color="collection lighten-2"`                                                         |
| `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`                          | 163   | `color="accent variant-1"` — `variant-1` n'existe dans **aucune** version, à supprimer |

**c. Classes de texte V2 (`--text` / `text--`)** — celles-ci ne s'affichent **pas du tout** :

```
'grey--text text--lighten-3'  →  'text-grey-lighten-3'
'white--text'                 →  'text-white'
```

| Fichier                                                    | Lignes         |
| ---------------------------------------------------------- | -------------- |
| `src/utils/daily-task.utils.ts`                            | 33, 35, 37     |
| `src/views/components/event/EventItemCard.vue`             | 80, 81, 82, 87 |
| `src/views/daily/components/DailyTaskActionChip.vue`       | 53             |
| `src/views/administration/tabs/AdministrationFeedback.vue` | 56, 57         |

**Détection exhaustive :**

```bash
# a + b : nuance dans une prop color (espace entre le nom et le modificateur)
grep -rnE "color=\"[a-zA-Z-]+ (lighten|darken|accent|variant)-[0-9]" src --include='*.vue'
grep -rnE "'[a-zA-Z-]+ (lighten|darken|accent|variant)-[0-9]'" src --include='*.vue' --include='*.ts'
# c : classes de texte V2
grep -rn -- "--text\|text--" src --include='*.vue' --include='*.ts'
```

> À traiter avec les **tokens de thème morts** relevés au passage : `taskCompleted` (`#497549`) et `taskInCreation` (`#181b1f`) sont déclarés dans `src/plugins/vuetify.ts` et utilisés **nulle part** ; et `error` n'est déclaré que dans le thème `light`, donc le thème `dark` (le seul atteignable) utilise le rouge par défaut de Vuetify.

⚠️ QA : écrans daily (wizard + résumé + timelines), cartes de collection, chips d'action, table de feedback en administration.

</details>

---

<details>
<summary><strong>3. 🟡 Nettoyage / dette technique — 15/15 faits, 1 annulé</strong></summary>

### 3.1 Hack `loginGuard` (`nonAuth.router.ts`) — ✅ FAIT

Trois routes enveloppent inutilement le guard. En VR4, `beforeEnter` accepte directement la fonction.

```ts
// AVANT (L.16-19, 24-28, 34-38 selon la route)
beforeEnter: (to, from, next): void => {
  loginGuard(to, from, next)
},
// APRÈS
beforeEnter: loginGuard,
```

Concerne les routes `login`, `register`, `password-reset-request`. Supprimer les commentaires « Hack for the loginGuard » (L.16, 25, 35) et « When updated to Vue Router 4 remove the loginGuard hack » (L.10).

### 3.2 Typer les fichiers `src/api/*.api.ts` restants — ✅ FAIT

La **plupart** sont déjà typés (`auth` sauf `login`, `collection`, `common-task`, `daily-task`, `event`). À compléter, via le générique d'Axios (`axiosInstance.get<T>(…)`) + type de retour `Promise<T>` :

| Fichier                      | Fonctions sans type de retour                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/project.api.ts`     | `getProjectList` (L.5), `getProjectListDetailed` (L.11), `getProjectById` (L.17), `createProject` (L.23), `updateProject` (L.27), `deleteProject` (L.33) |
| `src/api/tag.api.ts`         | `getTagList` (L.18), `isNameUnique` (L.22), `createTag` (L.26), `updateTag` (L.30), `deleteTag` (L.36)                                                   |
| `src/api/task.api.ts`        | `createTask` (L.5), `updateTaskById` (L.9), `deleteTaskById` (L.15)                                                                                      |
| `src/api/section.api.ts`     | `createSection` (L.5), `updateSection` (L.9), `deleteSection` (L.14)                                                                                     |
| `src/api/user.api.ts`        | toutes (L.22-72)                                                                                                                                         |
| `src/api/preferences.api.ts` | `getPreferences` (L.5), `updatePreferences` (L.9)                                                                                                        |
| `src/api/feedback.api.ts`    | `getFeedback` (L.6), `createFeedback` (L.10), `setFeedbackReadProperty` (L.14), `deleteFeedback` (L.22)                                                  |
| `src/api/auth.api.ts`        | `login` (L.18) uniquement                                                                                                                                |

Exemple :

```ts
// AVANT (project.api.ts:17)
export function getProjectById(projectId: number) {
  return axiosInstance
    .get(apiRoutes.projectById.replace(':projectId', projectId.toString()))
    .then(response => response.data)
}
// APRÈS
export function getProjectById(projectId: number): Promise<ProjectDetail> {
  return axiosInstance
    .get<ProjectDetail>(apiRoutes.projectById.replace(':projectId', projectId.toString()))
    .then(response => response.data)
}
```

### 3.3 Husky — `husky install` déprécié (v9) — ✅ FAIT

> **Ce point n'était pas une dépréciation cosmétique : les deux hooks ne s'exécutaient pas du tout.**
>
> `husky/bin.js` (v9) se termine par :
>
> ```js
> if (a == 'install') d(a) // affiche « DEPRECATED »
> p.stdout.write(i(a == 'install' ? undefined : a)) // ⬅ l'argument est jeté
> ```
>
> Avec la sous-commande `install`, husky appelle `i(undefined)` et retombe sur son défaut `.husky`. L'argument `frontend/.husky` du script `prepare` était donc **ignoré** : `core.hooksPath` valait `.husky/_` **à la racine du dépôt**, où aucun script de hook n'existe. Le runner `_/h` fait `[ ! -f "$s" ] && exit 0` — il sortait silencieusement avec le code 0. Vérifié en exécutant le shim directement avant correction : code 0, rien d'exécuté.
>
> **Conséquence** : ni `pretty-quick`, ni `lint-staged`, ni `commitlint` ne tournaient. Le seul garde-fou automatique décrit dans `CLAUDE.md` était inopérant, ce qui explique l'accumulation de fichiers non formatés et d'erreurs de lint sur la branche.
>
> **Correctif** : `"prepare": "cd .. && husky frontend/.husky"` (sans `install`, l'argument est transmis), suppression des deux lignes dépréciées dans `pre-commit` et `commit-msg`, et suppression du dossier parasite `/.husky/` à la racine.
>
> **Vérifié après coup, pas seulement configuré** — c'est précisément le piège qui a rendu ce dispositif muet : `core.hooksPath` vaut désormais `frontend/.husky/_` ; le shim `commit-msg` accepte `fix(front): …` (code 0) et rejette `message invalide` (code 1, 2 problèmes commitlint) ; le shim `pre-commit` exécute bien `lint-staged` et **échoue** sur les erreurs existantes.
>
> ⚠️ **Effet de bord assumé** : le hook étant réanimé, les 10 erreurs `eslint` préexistantes bloquent désormais tout commit touchant les fichiers concernés (`common.model.ts`, `project.router.ts`, `Agenda.vue`, `TagDialog.vue`, `DailyTaskFormCard.vue`, `DailyDetail.vue`, `Register.vue`, `ProfileEmail.vue`). À traiter avant de committer ces fichiers.

État actuel : `package.json:12` `"prepare": "cd .. && husky install frontend/.husky"` ; `.husky/pre-commit` contient les lignes dépréciées (`#!/bin/sh` + `. "$(dirname "$0")/_/husky.sh"`) ; le dossier `.husky/_/` (avec `husky.sh`) existe.

- `package.json:12` → `"prepare": "husky"` (husky v9 n'utilise plus `install`). Adapter le chemin selon l'endroit d'initialisation (le repo est un mono-repo ; husky s'initialise côté `frontend/`).
- `.husky/pre-commit` : retirer les 2 premières lignes (shebang + source `husky.sh`), ne garder que :
  ```sh
  cd frontend
  npx pretty-quick --staged && npx lint-staged --quiet
  ```
- `.husky/commit-msg` : même nettoyage (retirer le source de `husky.sh`).
- Après migration, le dossier `.husky/_/` est régénéré par husky v9 ; ne pas le committer manuellement.

### 3.4 Props booléennes verbeuses `:x="true"` / `:x="false"` (cosmétique) — ✅ FAIT

Simplifier `:prop="true"` → `prop` et `:prop="false"` → à supprimer (défaut) **uniquement** sur des props réellement booléennes de composants où elles existent encore :

- `src/views/daily/components/DailyTaskForm.vue:68` — `:editable="true"` → `editable`
- `src/views/daily/components/DailyTaskFormCard.vue:83` — `:editable="true"` → `editable`
- `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue` — `:exact="true"` (L.193/235/276) → `exact` (voir aussi §3.5) ; `:transition="false"` (L.187/229/270/292/295) est traité par §1.6.

> ⚠️ Ne pas toucher les `:small="true"`, `:completable="false"`, `:display-options="false"`, `:editable="false"` sur les **composants custom** (`TaskCard`, `CommonTaskCard`…) : ce sont des props internes légitimes.

### 3.5 Liens `exact` sur `v-tab` (VR4) — ⛔ ANNULÉ, PRÉMISSE FAUSSE

> **Re-vérifié sur Vuetify 4.1.6** : `exact` est toujours déclaré (`vuetify/lib/composables/router.js` — `makeRouterProps` L.68 : `exact: Boolean`) et toujours consommé (L.42 : `if (!props.exact) return link.value.isActive?.value ?? false`). La conclusion ci-dessous tient donc aussi en V4. **Point définitivement clos, ne rien retirer.**

> **Correction** : contrairement à ce que dit ce point, `exact` **est toujours pris en compte par Vuetify 3** (cf. `vuetify/lib/composables/router.js` : `if (!props.exact) return isActive ; return isExactActive`). Sans `exact`, un `v-tab :to="/parent"` reste actif sur toutes les routes enfant `/parent/xxx` (match par préfixe) → onglet parent surligné en permanence + indicateur mal placé. `exact` a donc été **rétabli** sur les onglets `Profile`, `Settings`, `Administration`, `CollectionDetail` et le `Description` de `ProjectDetail`. Ne PAS retirer `exact` de ces onglets.

En VR4, `exact` n'a plus d'effet (matching géré via `exact-active-class`). Retirer `exact` des `<v-tab :to="…">` et **vérifier le surlignage de l'onglet actif** après coup :

- `src/views/settings/Settings.vue:19, 23, 27`
- `src/views/collection/collection-detail/CollectionDetail.vue:40, 41`
- `src/views/project/project-detail/ProjectDetail.vue:42`
- `src/views/profile/Profile.vue:22, 26, 30, 34`
- `src/views/administration/Administration.vue:19, 23`
- `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue:193, 235, 276` (`:exact="true"`)

### 3.6 Bugs `formRef` sans `.value` (refs jamais résolues) — ✅ FAIT

`useTemplateRef('form')` renvoie un ref → il faut `formRef.value.…`. Deux fichiers appellent la méthode **directement sur le ref** (donc `undefined` → erreur runtime) :

- `src/views/project/project-detail/components/SectionDialog.vue:45` — `formRef.resetValidation()` → `formRef.value?.resetValidation()`
- `src/views/components/common-task/CommonTaskDialog.vue:54` — `formRef.resetValidation()` → `formRef.value?.resetValidation()`

### 3.7 `v-list-item-icon` — déjà migré — ✅ FAIT

Aucune occurrence de `v-list-item-icon` : migration vers `v-list-item` + slots `#prepend`/`#append` **déjà faite**. Rien à modifier, confirmer visuellement.

---

### 3.8 Dette de type : `string | null` → `string | undefined` — ✅ FAIT

> **Clos par §3.13.** Les 6 occurrences restantes ont été traitées dans la passe qui a amené `yarn type-check` à 0 : `ProjectCard`, `Feedback`, `SectionDialog`, `DailyUpdateTaskList`, `DailySummary`, `DailySummaryCard`.

Des props (couleur/taille) reçoivent `string | null` alors que Vuetify attend `string | undefined` (`vue-tsc` : `Type 'null' is not assignable to type 'string | undefined'`). Aligner le type **source** (computed/prop) sur `string | undefined`, ou passer `?? undefined`.

- ✅ `src/views/daily/daily-summary/components/DailyDetailEventTimeline.vue:35` — corrigé en même temps que le bug de couleur du dot de timeline (`isPassed(event) ? 'passedEvent' : 'event'` au lieu de `null`).
- Restent ouverts (vérifié via `yarn type-check`, toujours en erreur) : `src/views/project/components/ProjectCard.vue:19`, `src/views/feedback/Feedback.vue:45`, `src/views/project/project-detail/components/SectionDialog.vue:86`, `src/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue:64`, `src/views/daily/daily-summary/DailySummary.vue:145`, `src/views/daily/daily-summary/components/DailySummaryCard.vue:39`.

### 3.9 Dette de type : Vue Router 5 — ✅ FAIT

> **Clos par §3.13.** Les 3 chips sont typés en `RouteLocationRaw | undefined` et `collection.router.ts:17` enveloppe le paramètre dans `String()`. Le doute exprimé ci-dessous sur les « nouvelles erreurs amplifiées par vue-router 5.2.0 » est levé : le `No overload matches this call` et le `Expected 0 arguments, but got 1` de `SectionChip` n'avaient rien à voir avec la montée de version — le premier venait de `RouteLocation` (type d'une route _résolue_, incompatible avec un littéral), le second d'un `click($event)` sur un handler sans paramètre.

Les types VR5 sont plus stricts :

- ✅ **`src/router/guards/auth.guard.ts`** — corrigé (traité avec la refonte des guards en `NavigationGuard` sans `next()`, cf. §3.1) : `NON_AUTH_ROUTES` typé en `RouteRecordNameGeneric[]` au lieu de `(string|null|undefined)[]`.
- Restent ouverts (vérifié via `yarn type-check`) :
  - **`src/components/ProjectChip.vue`, `SectionChip.vue`, `CollectionChip.vue`** (L.28 + L.42/44) : `detailLocation` renvoie `RouteLocation | null`, incompatible avec la prop `:to` → typer en `RouteLocationRaw | undefined` (retourner `undefined` au lieu de `null`). Nouvelles erreurs apparues aussi sur ces 3 fichiers (`No overload matches this call`, `SectionChip.vue:52` `Expected 0 arguments, but got 1`) — probablement amplifiées par la montée vue-router 5.2.0, à re-diagnostiquer.
  - **`src/router/modules/collection.router.ts:17`** : `route.params.id` est `string | string[]` → `String(route.params.id)` ou garde de type `Array`.

### 3.10 Dette de type : `EventDialog`/events & divers — ✅ FAIT (reliquat clos)

> **Reliquat entièrement clos.** Il a été résorbé en deux temps : d'abord en corrigeant des bugs remontés à l'usage (`TagSearch.vue:79`, les headers de `v-data-table` d'`AdministrationUser`/`AdministrationFeedback`), puis dans la passe §3.13 pour le reste (`DailyTaskActionChip`, `*Chip.vue:28`, `CommonTaskDialog:48`, `DailyUpdateTask` `sectionId`, `DailyUpdateTaskList` `Patch`/`Post`, `ResetPassword:52`, `SettingsTags:7`, `EventDayDialog:32`). `DailyUpdateProjectListItem.vue:206` n'apparaît plus : la prop numérique en chaîne avait déjà été corrigée.
>
> À noter, deux entrées de ce reliquat n'étaient pas de simples soucis de typage mais de **vrais bugs runtime** : `ResetPassword.vue:52` appelait `this.validatePasswordMatch()` dans un `<script setup>`, où `this` vaut `undefined` — la validation levait une `TypeError` à chaque frappe ; et `TagSearch.vue:79` faisait planter la recherche de tags.

- ✅ **Prop `startDatePlaceholder` manquante** — corrigé : rendue optionnelle (`string`, plus de `| null`) dans `EventDialog.vue`, câblée avec la vraie date de contexte dans `DailyUpdateEvent.vue` (`:start-date-placeholder="date"`, un vrai bug UX corrigé au passage : le formulaire de création s'ouvrait sur « aujourd'hui » au lieu du jour du daily-update), omise proprement dans `EventItemCard.vue`/`ProjectEvent.vue` où elle n'a pas de sens (mode édition / pas de contexte de jour).
- ✅ **`EventDialog.vue` interne** — plus aucune erreur `vue-tsc` sur ce fichier (corrigé avec la réécriture des date/time pickers, §1.8 : `emit('update', { id: event.id, ... })` au lieu de `eventToSubmit.id`).
- ✅ **`EventItemCard.vue`** — plus aucune erreur : `cardColor` typé proprement (`'passedEvent'` au lieu du `'null'` littéral), `relatedToDate` retypé `string` (au lieu de `boolean`, faute de frappe d'origine).
- ✅ **`DailyTaskCard.vue` (27/72/76/80)** — corrigé : `cardColor` computed (plus de `null` littéral sur `:color`), `z-index="300"` → `:z-index="300"` (×3, string→number).
- ✅ **`DailyDetail.vue:144`** — corrigé avec le slot `v-hover` (§2.5).
- ✅ **`DailyUpdateEvent.vue:128`** — plus d'erreur sur ce fichier (effet de bord du retypage `relatedToDate`/`startDatePlaceholder` ci-dessus).
- ✅ **Agenda / `v-calendar`** — 0 erreur sur `Agenda.vue` (traité avec §1.9).
- **Reliquat encore ouvert** (vérifié via `yarn type-check`) : `DailyUpdateProjectListItem.vue:206` (`string`→`number`), `DailyTaskActionChip.vue` (29/50), `TagSearch.vue:79` (`Property 'raw' does not exist on type Tag` — reformulation du souci de §1.11, à revérifier), `*Chip.vue:28` (`withDefaults`/`No overload matches`), `CommonTaskDialog.vue:48`, `DailyUpdateTask.vue:312` (`sectionId` optionnel), `DailyUpdateTaskList.vue:78/85` (`DailyTaskPatch` vs `DailyTaskPost`), `src/views/non-auth/ResetPassword.vue:52` (`this` implicite), `src/views/settings/tabs/SettingsTags.vue:7` (`SettingsTagList` utilisé comme type → `typeof`), `AdministrationUser.vue:72` + `AdministrationFeedback.vue:67/98` (typage des headers `v-data-table`), et une nouvelle erreur `EventDayDialog.vue:32` (`scrollTop` n'existe pas sur le type du ref `v-card`).
- **`src/plugins/vuetify.ts:28`** (typage thème/couleurs custom) : n'apparaît plus dans `yarn type-check` — semble non-bloquant en pratique, pas d'action nécessaire.

### 3.11 (Vuetify 4) Divers 🟡 — ✅ FAIT (aucune action requise)

- **Elevation** : MD3 réduit à ~6 niveaux (0-5). Aucun `elevation` > 5 utilisé ; seul un commentaire SCSS `App.vue:171` (« elevation-8 ») à revoir si le shadow custom en dépendait.
- **VDatePicker `multiple="range"`** n'émet plus les dates intermédiaires — vérifier `EventDialog.vue` (a priori sélection simple).
- **Thème défaut `system`** → sans impact (`vuetify.ts` force `dark`).
- **Labs stabilisés en core** (`VDatePicker`, `VTimePicker`, `VCalendar`) → auto-import via `vite-plugin-vuetify` conservé ; à recouper avec §1.8 (`EventDialog`) et §1.9 (`Agenda`).
- **Sans usage** (aucune action) : VImg (attrs passthrough), VForm (slot props déballés), VSnackbar (`multi-line`), nested (`branch`).

### 3.12 Montée de **Vite** 6 → dernière stable — ✅ FAIT

> **Réalisé : `vite@6.0.1` → `8.2.0`**, soit deux majeures, avec `@vitejs/plugin-vue@5.1.4` → `6.0.8`. `vite-plugin-vuetify@2.1.3` était déjà la dernière version. Contrôles : `yarn build` ✓ (9,0 s contre 13,5 s avant), `yarn dev` ✓ (démarrage 251 ms, index + modules servis en 200), `yarn type-check` 0, `eslint` inchangé.
>
> **Breaking changes réellement concernés.** Sur les 12 de Vite 7, seuls 3 touchent le projet : Node 20.19+/22.12+ (on est en 22.23.1) ; `build.target` passé à `baseline-widely-available` (Chrome 87→107, Safari 14→16 — **décision produit acceptée**) ; suppression de l'API Sass _legacy_ (sans effet, le projet ne définit aucun `css.preprocessorOptions` et était déjà sur l'API moderne). Sur les 3 de Vite 8 : `import.meta.hot.accept` (aucune occurrence), cible navigateur relevée à nouveau, et **la fusion Rolldown** — qui remplace Rollup comme bundler. Les formats `system`/`amd` qu'elle abandonne ne sont pas utilisés, et `vite.config.ts` n'a aucun bloc `build`.
>
> **Deux corrections rendues nécessaires par la montée :**
>
> - **`tsconfig.json` : `moduleResolution: "node"` → `"bundler"`.** Vite 8 est ESM pur et expose ses types via une carte `exports` sans champ `types` racine ; la résolution Node10 ne sait pas la lire, d'où `TS2307: Cannot find module 'vite'`. `"bundler"` est ce qu'utilisent les templates Vite et se combine avec le `module: "esnext"` déjà en place.
> - **`vite.config.ts` : `__dirname` → `import.meta.dirname`.** Vite 8 avertit que `__dirname` sera incompatible avec le `configLoader: 'native'`, futur défaut.
>
> **Un bug préexistant révélé au passage.** Le scan de dépendances de Vite 8 échouait sur `DailySummaryCard.vue:3`, qui importait `'src/models/daily-summary.model'` **sans l'alias `@/`** — la même faute que `SectionChip.vue` (corrigée en §3.13). Elle passait inaperçue parce que `DailySummary` n'y sert que de type : `vue/compiler-sfc` efface l'import à la compilation, donc le build n'a jamais eu à le résoudre. Seul le scanner, qui lit la source brute, le voyait. C'était la dernière occurrence du projet (`grep -rn "from 'src/" src` ne renvoie plus rien) — un rappel que la règle « toujours passer par l'alias `@` » n'est vérifiée par aucun linter.

Vite est en **`^6.0.1`**. Monter vers la dernière stable (≥ 7, désormais permis par Node 22).

- ⚠️ **Vérifier la version cible exacte et ses breaking changes au moment de le faire** (Rolldown, options de build, plugins). Confirmer la compat de `@vitejs/plugin-vue` (^5) et `vite-plugin-vuetify` avec la Vite cible.
- Fichiers potentiellement impactés : `vite.config.ts`, `package.json` (scripts/deps), éventuels réglages `build.rollupOptions`.
- Migration **indépendante** de Vuetify 4 ; à faire séparément avec `yarn build` + `yarn dev` de contrôle.

---

### 3.13 Amener `yarn type-check` à 0 erreur — ✅ FAIT

> **`yarn type-check` renvoie 0 erreur.** Les 28 du relevé initial ont toutes été traitées : 6 en corrigeant des bugs signalés à l'usage (`TagSearch`, `SectionDialog`, les tableaux d'administration), les 22 restantes en une passe. `type-check` peut désormais devenir bloquant (hook `pre-commit` ou CI) — c'est le prérequis pour que le typage protège réellement des régressions.
>
> **Correctifs par groupe :**
>
> - **A, chips d'entité (7)** — `computed<RouteLocation | null>` → `computed<RouteLocationRaw | undefined>`. `RouteLocation` est le type d'une route _résolue_ (`matched`, `fullPath`…), d'où le `TS2769` sur le littéral ; `:to` attend `RouteLocationRaw`. Au passage dans `SectionChip` : import `src/models/…` → `@/models/…`, et `click($event)` → `click()` (la fonction ne prend aucun argument).
> - **B, `null` sur props Vuetify (3)** — `DailySummaryCard`, `Feedback`, `ProjectCard` : Vuetify attend `string | undefined`.
> - **C, chaîne `DailyTaskActionChip` (3)** — modèle élargi en `DailyTaskAction | null | undefined` (et les deux helpers de `daily-task.utils.ts` avec), plutôt que de contraindre les deux appelants dont les types diffèrent (`DailyTask.action` est `| undefined`, `DailyTaskPatch.action` est `| null | undefined`). Plus `:key="option.value ?? 'none'"` — une clé de `v-for` doit être un `PropertyKey`.
> - **D/E, `DailyTaskPost` vs `DailyTaskPatch` (2)** — `DailyUpdateTaskList` déclarait `Post` là où `DailyTaskFormCard` émet un `Patch`. **`DailyTaskPost.action` a été élargi à `DailyTaskAction | null`** : `DailyTaskForm` est partagé entre création et édition et a `action: null` pour défaut, donc un POST de création envoie déjà `null` aujourd'hui. Normaliser en `undefined` aurait modifié le corps de la requête ; élargir le modèle décrit la réalité sans rien changer au runtime.
> - **F, divers (7)** — `parseInt(String(route.params.id))` ; `watch(show, value => …)` (`defineModel<boolean>()` produit `boolean | undefined`) ; `(scrollableElement.value.$el as HTMLElement).scrollTop` (le ref pointe un `v-card-text`, pas un élément) ; `dailyDetailDialogInput(value?: boolean)` ; `sectionId?: number` dans `select` ; `this.validatePasswordMatch()` → `validatePasswordMatch()` ; `useTemplateRef<InstanceType<typeof SettingsTagList>>` (+ `?.` sur l'appel, que le ref correctement typé a révélé nullable).
>
> ⚠️ **Aucun de ces correctifs n'a été validé à l'écran.** Plusieurs touchent des props réellement utilisées (`:to` des chips, `scrollTop` du dialog jour, chaîne d'action du daily) — une QA manuelle reste à faire.

Cet inventaire **remplace** les listes partielles de §3.8, §3.9 et §3.10, qui datent d'un relevé antérieur. Relevé de référence : `yarn type-check` sur la branche `migrate-to-vue3`.

**Pourquoi le faire** : tant que le compteur n'est pas à 0, `type-check` ne peut pas devenir bloquant (hook ou CI) et **rien ne protège contre les régressions de typage**. Le critère de travail intermédiaire est donc _« mon changement n'ajoute pas d'erreur »_ :

```bash
yarn type-check 2>&1 | grep -c "error TS"   # 0 aujourd'hui
```

#### Groupe A — Chips d'entité : `:to` et `withDefaults` (7 erreurs)

Les trois chips partagent le même code copié-collé. `detailLocation` renvoie `RouteLocation | null`, incompatible avec la prop `:to`.

```ts
// AVANT
const detailLocation = computed<RouteLocation | null>(() => { … return null })
// APRÈS
const detailLocation = computed<RouteLocationRaw | undefined>(() => { … return undefined })
```

| Fichier                             | Lignes     | Erreur                                                                                  |
| ----------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `src/components/CollectionChip.vue` | 28, 42     | `No overload matches this call` + `RouteLocationGeneric \| null` non assignable à `:to` |
| `src/components/ProjectChip.vue`    | 28, 42     | idem                                                                                    |
| `src/components/SectionChip.vue`    | 28, 44, 52 | idem + `Expected 0 arguments, but got 1` (L.52)                                         |

Note : `SectionChip.vue:2` importe aussi `from 'src/models/section.model'` au lieu de `@/models/…` — à corriger au passage.

#### Groupe B — `string | null` → `string | undefined` (5 erreurs)

Vuetify attend `string | undefined` sur `color`/`size`. Aligner le type **source** (le `computed` ou la prop), ou passer `?? undefined` au point d'usage. Pattern déjà appliqué avec succès en §1.8 et sur `DailyDetailEventTimeline.vue`.

| Fichier                                                                      | Ligne |
| ---------------------------------------------------------------------------- | ----- |
| `src/views/daily/daily-summary/components/DailySummaryCard.vue`              | 39    |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue` | 64    |
| `src/views/feedback/Feedback.vue`                                            | 45    |
| `src/views/project/components/ProjectCard.vue`                               | 19    |
| `src/views/project/project-detail/components/SectionDialog.vue`              | 86    |

#### Groupe C — En-têtes de `v-data-table` (3 erreurs)

La forme des en-têtes a changé : `{ text, value }` (V2) → `{ title, key }` (V3+). `AdministrationUser` utilise encore `text`, et le slot `#item.x` n'expose plus `headers`.

| Fichier                                                    | Ligne | Correctif                                                                     |
| ---------------------------------------------------------- | ----- | ----------------------------------------------------------------------------- |
| `src/views/administration/tabs/AdministrationUser.vue`     | 72    | `text:` → `title:`, `value:` → `key:` ; typer en `readonly DataTableHeader[]` |
| `src/views/administration/tabs/AdministrationFeedback.vue` | 67    | `value:` → `key:` ; typer de même                                             |
| `src/views/administration/tabs/AdministrationFeedback.vue` | 98    | `headers` absent du slot `ItemSlot` → retirer sa déstructuration              |

#### Groupe D — `DailyTaskActionChip` (2 erreurs)

Bug réel doublé d'une erreur de type : `emit('update', action)` envoie **le ref**, pas sa valeur (cf. commentaire `// We send both event to meet all possibilities`, L.29). Le consommateur construit le corps du PATCH avec (`DailyTaskFormCard.vue:85`), donc un objet `Ref` partait dans la requête.

```ts
// AVANT (L.29)
emit('update', action)
// APRÈS
emit('update', action.value)
```

| Fichier                                              | Lignes                                                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/views/daily/components/DailyTaskActionChip.vue` | 29 (`ModelRef` non assignable), 50 (`DailyTaskAction \| null` non assignable à `PropertyKey`) |

#### Groupe E — `DailyTaskPatch` vs `DailyTaskPost` (2 erreurs)

`DailyTaskPatch.action` accepte `null`, `DailyTaskPost.action` non ; `Patch` a `completed` que `Post` n'a pas. La chaîne d'émission mélange les deux (`DailyTaskForm` émet un `Patch`, `DailyUpdateTaskList` déclare `Post`).

| Fichier                                                                      | Lignes | Correctif                                                                                             |
| ---------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue` | 78, 85 | Aligner les types d'`emits` : `create: [DailyTaskPost]` mais `update: [{ id, data: DailyTaskPatch }]` |

#### Groupe F — Divers (9 erreurs)

| Fichier                                                                             | Ligne | Erreur                                      | Correctif                                                                                                                                 |
| ----------------------------------------------------------------------------------- | ----- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/router/modules/collection.router.ts`                                           | 17    | `string \| string[]` → `parseInt`           | `String(route.params.id)` (cf. §3.9)                                                                                                      |
| `src/views/components/common-task/CommonTaskDialog.vue`                             | 48    | `No overload matches this call`             | inspecter le `withDefaults`                                                                                                               |
| `src/views/components/event/EventDayDialog.vue`                                     | 32    | `scrollTop` absent du type du ref `v-card`  | `(scrollableElement.value?.$el as HTMLElement).scrollTop`                                                                                 |
| `src/views/components/tag/TagSearch.vue`                                            | 79    | `Property 'raw' does not exist on type Tag` | le slot `#item` de Vuetify 4 expose `item` = valeur brute **et** `internalItem` = objet interne ; utiliser `internalItem.raw` (cf. §1.11) |
| `src/views/daily/daily-summary/DailySummary.vue`                                    | 145   | `boolean \| undefined` → `boolean`          | valeur par défaut ou `?? false`                                                                                                           |
| `src/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue` | 206   | `string` → `number`                         | binder la valeur (`:prop="300"` au lieu de `prop="300"`)                                                                                  |
| `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`                       | 312   | `sectionId?: number` vs requis              | rendre `sectionId` optionnel dans la signature de `select` (cf. §3.10)                                                                    |
| `src/views/non-auth/ResetPassword.vue`                                              | 52    | `this` implicite `any`                      | remplacer la fonction par une arrow, ou annoter `this`                                                                                    |
| `src/views/settings/tabs/SettingsTags.vue`                                          | 7     | valeur utilisée comme type                  | `typeof SettingsTagList`                                                                                                                  |

**Ordre conseillé** : A (7 erreurs, un seul pattern sur 3 fichiers jumeaux) → B (5, mécanique) → C (3) → D/E (4, corrigent aussi de vrais bugs runtime) → F (9, cas par cas).

⚠️ Après chaque groupe : `yarn type-check` (le compteur doit baisser, jamais monter) **et** test manuel de l'écran — plusieurs de ces correctifs touchent des props réellement utilisées.

---

### 3.14 Supprimer le service worker non fonctionnel — ✅ FAIT

> **Réalisé.** Le comportement décrit ci-dessous a été **re-vérifié sur un `yarn build` réel** avant suppression : le bundle contenait `CV={}` puis ``register(`${CV.BASE_URL}service-worker.js`, …)``, soit une requête vers `"undefinedservice-worker.js"` à chaque chargement en production.
>
> **Origine** : le fichier provient du scaffold Vue CLI et est présent depuis le tout premier commit du dossier (`eb66d1a feat: Add frontend folder`). Vue CLI le générait en pariant sur `@vue/cli-plugin-pwa` pour produire le `service-worker.js` correspondant — plugin qui n'a jamais été installé ici. Vue CLI a par ailleurs entièrement disparu du projet (ni `vue.config.js`, ni `babel.config.js`).
>
> Supprimés : `src/registerServiceWorker.ts`, la dépendance `register-service-worker`, l'import et son TODO dans `main.ts`, ainsi que le bootstrap Vue 2 commenté. Après suppression, `grep -c service-worker dist/assets/*.js` renvoie **0**.

`src/registerServiceWorker.ts` est un reliquat de **Vue CLI** : il utilise `process.env.NODE_ENV` et `process.env.BASE_URL`, conventions webpack que Vite ne fournit pas.

Comportement réel, vérifié :

| Environnement | Ce qui se passe                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `yarn dev`    | Vite remplace `process.env.NODE_ENV` → la condition devient `if (false)`, code inerte                                       |
| `yarn build`  | Vite remplace `process.env` par un **objet vide** → `register('undefined/service-worker.js')` → **404 à chaque chargement** |

Vérifié dans le bundle : `dist/assets/index-*.js` contient ``CV(`${DV.BASE_URL}service-worker.js`)`` avec `DV = {}`.

De plus **aucun `service-worker.js` n'est généré** (absent de `public/` et de `dist/`) et il n'y a **aucun manifeste PWA** : il n'y a donc rien à enregistrer, même en corrigeant la variable.

**Marche à suivre :**

```bash
rm src/registerServiceWorker.ts
yarn remove register-service-worker
```

Puis retirer l'import et son TODO dans `src/main.ts` :

```ts
// AVANT (L.3-4)
// TODO : See if we can remove registerServiceWorker dependency
import './registerServiceWorker'
// APRÈS — les deux lignes supprimées
```

**Fichiers à modifier :**
| Fichier | Action |
|---|---|
| `src/registerServiceWorker.ts` | **supprimer** |
| `src/main.ts` | supprimer L.3 (TODO) et L.4 (import) |
| `package.json` | retirer `register-service-worker` des `dependencies` |
| `src/main.ts` | _(au passage)_ supprimer le bootstrap Vue 2 commenté, L.19-26 |

> Si un PWA est souhaité un jour, passer par un plugin Vite dédié (`vite-plugin-pwa`), qui génère le service worker **et** le manifeste — ce n'est pas une remise en service de ce fichier.

⚠️ QA : `yarn build` puis `yarn serve` → la console ne doit plus contenir de 404 sur `service-worker.js`. Vérifier aussi qu'aucun service worker déjà enregistré ne subsiste dans le navigateur (DevTools → Application → Service Workers → Unregister).

---

### 3.15 Renommer `src/views/agenga/` → `src/views/agenda/` — ✅ FAIT

> **Réalisé** via `git mv` (historique préservé) + correction de l'unique import `src/router/index.ts:1`. `grep -rn "agenga" src/` ne renvoie plus rien, `yarn build` et `yarn type-check` passent.

Faute de frappe dans le nom du dossier. Tout le reste écrit correctement « agenda » : le fichier (`Agenda.vue`), le chemin de route (`/agenda`), le nom de route (`agenda`), le libellé du menu et le titre de page. Introduite par le commit `2fcb59b`.

**Un seul import à corriger** (vérifié : `grep -rn "agenga" src/`) :

```ts
// AVANT — src/router/index.ts:1
import Agenda from '@/views/agenga/Agenda.vue'
// APRÈS
import Agenda from '@/views/agenda/Agenda.vue'
```

**Marche à suivre :**

```bash
git mv src/views/agenga src/views/agenda
# puis corriger l'unique import
grep -rn "agenga" src/          # doit ne rien renvoyer
```

**Fichiers à modifier :**
| Fichier | Action |
|---|---|
| `src/views/agenga/` → `src/views/agenda/` | `git mv` (préserve l'historique) |
| `src/router/index.ts` | ligne 1 : corriger le chemin d'import |

> ⚠️ Sur macOS (système de fichiers insensible à la casse) le `git mv` fonctionne ici car les deux noms diffèrent par plus que la casse — pas de précaution particulière.

⚠️ QA : `yarn dev` puis naviguer sur `/agenda` ; `yarn build` doit passer.

---

### 3.16 Remplacer le fork local `eslint-plugin-vuetify` par le paquet npm — ✅ FAIT

> **Réalisé.** Le montage manuel décrit plus bas a été appliqué tel quel, et le piège du « plugin désactivé en silence » écarté par un test de déclenchement : un fichier témoin contenant `color="primary lighten-1"`, `class="white--text"` et `<v-list-item-icon>` remonte bien 3 erreurs `vuetify/no-deprecated-colors` et `vuetify/no-deprecated-components`. Le faux positif `first-day-of-week` a disparu (compteur à 0).
>
> **⚠️ Une prémisse de ce point était fausse.** Le fork n'était **pas vendored** : `frontend/eslint-plugin-vuetify/` était un **clone git manuel**, avec son propre `.git` pointant sur `jewpaltz/eslint-plugin-vuetify`, et **ignoré** par `.gitignore:4` à la racine. Aucun script ne l'approvisionnait. Conséquence : sur un clone frais du dépôt, le dossier n'existait pas et `eslint.config.mjs` importait un chemin inexistant — **`yarn lint` était donc cassé pour quiconque n'avait pas cloné le fork à la main**. Le gain de ce point est plus large qu'annoncé : il répare le lint d'un checkout neuf. Nettoyage effectué : suppression du clone local, de l'entrée `.gitignore` racine, de `"eslint-plugin-vuetify"` dans `tsconfig.json:exclude`, et de l'entrée `ignores` d'`eslint.config.mjs`.
>
> **Version** : `eslint-plugin-vuetify@2.7.2` était déjà installé et **est la dernière stable publiée** (`npm view` → `latest: 2.7.2`) — aucune montée à faire. Comparaison des règles entre le fork 2.4.0 et le paquet :
>
> | Config                              | Règles                                                                                                                                                    |
> | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `base` (celle utilisée)             | **identique au fork** : `no-deprecated-classes/colors/components/events/imports/props/slots` (7) + `vue/valid-v-slot`                                     |
> | `recommended`                       | ajoute `grid-unknown-attributes`                                                                                                                          |
> | `recommended-v4`                    | ajoute `no-deprecated-snackbar`, `no-deprecated-typography`, `no-elevation-overflow`, `no-legacy-grid-props`                                              |
> | activées par aucune config (opt-in) | `custom-deprecated-components/events/props/slots`, `icon-button-variant`, `no-border-prop`, `no-elevation-prop`, `no-legacy-utilities`, `no-rounded-prop` |
>
> Seule `base` a été montée ici. Les 4 règles de `recommended-v4` remonteront de nouvelles erreurs relevant de §2.6 et §2.12 — à traiter avec ces points, pas ici.

Le dossier `frontend/eslint-plugin-vuetify/` (84 fichiers, 1 Mo) est un **fork en version 2.4.0**, chargé explicitement par `eslint.config.mjs:11`. Le TODO en tête du fichier dit d'attendre le support d'ESLint 9 en amont.

**Cette condition est remplie** : le paquet npm `eslint-plugin-vuetify@2.7.2` est **déjà installé** (`devDependencies`) et fournit des configs flat. Deux bénéfices concrets, vérifiés :

1. **Le fork produit un faux positif.** Il signale `'first-day-of-week' has been removed` sur `EventDialog.vue:290` et `:353` — or cette prop **existe bien en Vuetify 4** (déclarée avec son `type` et son `default` dans `node_modules/vuetify/lib/components/VDatePicker/VDatePicker.d.ts:327-335`). La version npm ne la signale pas. Ces 2 erreurs de lint disparaîtront.
2. **La version npm apporte 4 règles spécifiques Vuetify 4** absentes du fork, directement utiles aux points restants :

   | Règle (config `flat/recommended-v4`) | Utile pour                        |
   | ------------------------------------ | --------------------------------- |
   | `vuetify/no-deprecated-typography`   | §2.6 (classes typographiques MD3) |
   | `vuetify/no-legacy-grid-props`       | §2.12 (grille VRow/VCol)          |
   | `vuetify/no-deprecated-snackbar`     | §3.11                             |
   | `vuetify/no-elevation-overflow`      | §3.11                             |

   Les 8 règles de `base` sont **identiques** entre le fork et la version npm (mêmes noms, vérifié).

**⚠️ Ce n'est pas un remplacement direct.** Deux pièges rencontrés en testant :

- `eslint-plugin-vuetify/lib/configs/flat/base.js` **redéclare le plugin `vue`**, ce qui entre en conflit avec `pluginVue.configs['flat/recommended']` déjà présent → `ConfigError: Key "plugins": Cannot redefine plugin "vue"`.
- Le fork restreint sa portée par `files: ['*.vue', '**/*.vue']` ; l'omettre change les fichiers analysés.

**Marche à suivre :**

1. Remplacer l'import et construire le bloc à la main, en reprenant la forme du fork sans sa redéclaration de `vue` :

   ```ts
   // AVANT — eslint.config.mjs:9-11
   // TODO : when eslint-plugin-vuetify support eslint v9, remove this subfolder and install the package from
   // https://github.com/vuetifyjs/eslint-plugin-vuetify/issues/93
   import pluginVuetify from './eslint-plugin-vuetify/src/configs/flat/base.js'

   // APRÈS
   import vuetify from 'eslint-plugin-vuetify'
   import vuetifyBase from 'eslint-plugin-vuetify/lib/configs/base.js'

   const pluginVuetify = {
     files: ['*.vue', '**/*.vue'],
     plugins: { vuetify },
     rules: { ...vuetifyBase.rules },
   }
   ```

2. **Vérifier que les règles se déclenchent encore** — c'est l'étape critique, un mauvais montage désactive le plugin **en silence**. Test de non-régression sur une occurrence connue :

   ```bash
   # doit signaler les slots/props dépréciés du projet — si la sortie est vide, le plugin est inactif
   npx eslint src/views/daily/daily-update/steps/task/DailyUpdateTask.vue
   npx eslint src --ext .vue 2>&1 | grep -c "vuetify/"
   ```

   > Lors de mes essais, une variante du montage a fait tomber ce compteur à 0 **sans erreur** : ne pas conclure au succès sur la seule absence d'erreur ESLint.

3. Une fois le compteur non nul confirmé, **ajouter les règles V4** :

   ```ts
   import vuetifyV4 from 'eslint-plugin-vuetify/lib/configs/recommended-v4.js'
   // puis fusionner vuetifyV4.rules dans le bloc de règles
   ```

   ⚠️ Ces 4 règles vont **remonter de nouvelles erreurs** (typographie, grille) : les traiter avec §2.6 et §2.12, pas dans ce point.

4. Supprimer le fork et nettoyer les exclusions devenues inutiles.

**Fichiers à modifier :**
| Fichier | Action |
|---|---|
| `eslint.config.mjs` | L.9-11 : remplacer l'import du fork (+ supprimer le TODO) ; L.55-57 : supprimer l'entrée `ignores: ['eslint-plugin-vuetify/']` |
| `eslint-plugin-vuetify/` | **supprimer le dossier** (`git rm -r`) |
| `tsconfig.json` | retirer `"eslint-plugin-vuetify"` de `exclude` |
| `.prettierignore` | retirer l'entrée du fork si présente |
| `package.json` | rien à faire — `eslint-plugin-vuetify@^2.7.2` est déjà en `devDependencies` |

⚠️ QA : `yarn lint` doit tourner sans `ConfigError`, remonter au moins les mêmes catégories de règles `vuetify/*` qu'avant, et **ne plus** signaler `first-day-of-week`.

</details>

---

<details>
<summary><strong>4. ⚪ Optionnel / améliorations (hors « iso-fonctionnel ») — non requis pour l'iso-fonctionnel</strong></summary>

- ✅ **`:model-value` → `v-model`** : converti sur `HalfDialog.vue` et `CommonTaskDialog.vue` (les deux exposent `show` via `defineModel()`, donc un ref inscriptible). `ConfirmDialog.vue` **n'était pas** un candidat : son `@update:model-value` appelle `setDialogStateTo()`, qui met à jour **deux** refs. Non touchés (lecture seule) : `ProgressDisk.vue:21`, `ProgressWheel.vue:43`, `ProjectCard.vue:22`, `CollectionCard.vue:23`, `ProjectSectionItem.vue:229`.
- ⬜ **Vuelidate** : remplacer la validation manuelle des forms — change le fonctionnement, hors lot iso-fonctionnel. **Reporté.**
- ✅ **Calls API via les stores** : audit fait. Seuls 3 appels directs subsistent dans un composant — `ProjectSettings.vue:92` (`deleteProject`), `ProjectList.vue:35/43` (`getProjectList`/`createProject`) — et tous portent sur la liste ou la suppression, hors périmètre des stores (qui ne gèrent que `currentProject`/`currentCollection`). Rien à corriger.
- ✅ **Getters Pinia « completed tasks »** : le prédicat « terminée » était réécrit 7 fois dans 4 fichiers, et l'aplatissement projet+sections 3 fois sous deux orthographes (`concat(...map())` vs `concat(map().flat())`). Factorisé dans `src/utils/task.utils.ts` : `filterCompleted()`, `filterUncompleted()`, `flattenProjectTasks()`, consommés par `project.store.ts`, `collection.store.ts`, `ProjectSectionItem.vue` et `DailyUpdateProjectListItem.vue`. Le préfixe `filter` est imposé par `no-shadow` (le nom `completed` entre en collision avec les déstructurations de tâche existantes).
- ✅ **Bug latent corrigé** `src/store/project.store.ts:117` : `{ ...this.currentProject, ...response }` — le spread manquant créait une clé littérale `response` au lieu de fusionner.
- ✅ **Bug latent corrigé** `src/views/components/event/EventDialog.vue` : `emit('update', { id: eventToSubmit.id, … })` utilisait le mauvais id — corrigé en `emit('update', { id: event.id, ... })` avec la réécriture des date/time pickers (§1.8/§3.10).

</details>

---

<details>
<summary><strong>5. Checklist QA finale — à faire (QA manuelle)</strong></summary>

- [ ] `vue-tsc` installé + `yarn type-check` : 0 erreur.
- [ ] `yarn lint` : 0 warning `eslint-plugin-vuetify`.
- [ ] Revue de `vuetifyjs.com/en/getting-started/upgrade-guide`.
- [ ] Responsive `xs`→`xl` sur chaque écran (dépend de §1.1) : dialogs plein écran, tailles de boutons, layout navbar, titres.
- [ ] Daily : summary, update (stepper §1.5, onglets §1.6, sélection tâche §1.7).
- [ ] Événements : `EventDialog` complet (§1.8) ; Agenda/calendar (§1.9).
- [ ] Formulaires : soumission bloquée si invalide (§1.4), reset des dialogs (§3.6), register, reset password, profil.
- [ ] Menus/dialogs : ouverture via activator (§1.2), positionnement (§2.2).
- [ ] Onglets actifs correctement surlignés (§3.5), styles `:deep` intacts (§2.4).
- [ ] Hover neutralisé sur mobile pour btn/chip/tab (§2.3).
- [ ] Inputs : variant homogène (§2.1).

</details>

---

<details open>
<summary><strong>6. 📦 Montée de versions des dépendances (2026-07) — ✅ FAIT</strong></summary>

> Fusion de l'ancien `MIGRATION-DEPS.md`. Recherche recoupée avec npm + Context7 + **MCP officiel Vuetify**.

### 6.1 — ✅ Fait (une ligne par point)

- **Node 18.19.1 → 22.23.1** : pin Volta, `Dockerfile` dev (`node:22-bullseye`) et prod (`node:22-alpine`) — Node 18 était EOL, 22 débloque vue-router 5.
- **vue 3.5.12 → 3.5.40** : patch, aucun changement de code.
- **vue-router 4.6.3 → 5.2.0** : « boring release » (routes déclaratives inchangées) ; nécessitait Node ≥ 20.19.
- **pinia 2.2.6 → 4.0.2** : + ajout de `@vue/devtools-api@^8.1.5` (peer obligatoire, non auto-installé par Yarn 1).
- **axios 1.7.7 → 1.18.1** : ferme 6 CVE, aucun changement de code.
- **vuetify 3.11.2 → 4.1.6** (+ `vite-plugin-vuetify` 2.1.3, `eslint-plugin-vuetify` 2.7.2, `sass` 1.102) : **version montée, `build` OK**. Les adaptations MD3 (runtime/visuel) restent à faire — §2.5–§2.12, §3.11.
- **`vue-tsc@3.3.8` + script `yarn type-check`** ajoutés ; `tsconfig.json` : retrait de `"types": ["jest"]` (reliquat Vue 2 qui bloquait vue-tsc).
- **`yarn build` OK** ; `type-check` : 76 erreurs de type préexistantes (détaillées en **§2.5** et **§3.8–§3.10**), **inchangées** par les montées (aucune régression).

_(Migration Vuetify 3→4, dette de type et montée de Vite : voir les points détaillés §1.11, §2.5–§2.12, §3.8–§3.12 ci-dessus.)_

</details>
