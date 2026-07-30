# Migration Vue 2 → Vue 3 — Tâches restantes

> **But** : terminer la migration (Vue 2→3, Vuetify 2→3, Vuex→Pinia, Vue-Router 3→4) sans **aucune** différence de fonctionnement ni de style entre avant et après.
> **Public** : ce document doit permettre à une personne qui **ne connaît pas le projet** de traiter chaque tâche. Chaque point donne les fichiers, les **numéros de ligne**, et le code **avant → après**.
> **Légende priorité** : 🔴 Bloquant (casse le fonctionnement) · 🟠 Iso-visuel (casse le style) · 🟡 Dette/nettoyage · ⚪ Optionnel.

## ✅ Avancement de la migration

> Suivi mis à jour au fil de l'eau. Chaque tâche réalisée est cochée ici **et** son titre de section reçoit le marqueur « — ✅ FAIT ».

### 1. 🔴 Bloquants
- [x] §0 — `vue-tsc@3.3.8` + script `type-check` ajoutés (+ fix `tsconfig` : retrait `types:["jest"]`)
- [x] 1.1 — `useDisplay()` : refs déballés (composable `useDialogWidth`)
- [x] 1.2 — Slot activator `{ attrs, on }` → `{ props }` *(+ correctif wrappers `:props`)*
- [x] 1.3 — `$vuetify.breakpoint` → `$vuetify.display`
- [x] 1.4 — `v-form.validate()` asynchrone
- [x] 1.5 — `v-stepper` V2 → V3
- [x] 1.6 — `v-tabs-items`/`v-tab-item` → `v-tabs-window`/`-item` *(+ correctif flex barre d'onglets)*
- [x] 1.7 — `@click.native` → `@click` *(+ `.stop` interne aux chips)*
- [x] 1.8 — `EventDialog.vue` : date/time pickers (Vuetify 4)
- [x] 1.9 — `v-calendar` (Agenda) *(API classique restaurée en Vuetify 4 → pas de rewrite, juste correctifs de types)*
- [x] 1.10 — Type `Route` (Vue Router 4)
- [x] 1.11 — VAutocomplete : slot `item` → `internalItem` (Vuetify 4)

### 2. 🟠 Iso-visuel
- [x] 2.1 — `variant` des inputs (`underlined`)
- [x] 2.2 — `offset-*` / `nudge-*` supprimés
- [ ] 2.3 — Hover mobile chips & tabs *(⚠️ confirmé cassé : voir §2.3)*
- [ ] 2.4 — QA des sélecteurs `:deep()`
- [x] 2.5 — slot `v-hover` `{ hover }` → `{ isHovering }` (Vuetify 3 manqué)
- [x] 2.6 — (Vuetify 4) Typographie MD3 *(91 occurrences renommées, 51 fichiers)*
- [ ] 2.7 — (Vuetify 4) Breakpoints réduits (`useDisplay`) *(décision prise : MD3 adopté tel quel, cf. §2.7)*
- [ ] 2.8 — (Vuetify 4) `fill-height` / VContainer
- [x] 2.9 — (Vuetify 4) VBtn (uppercase + grid→flex)
- [x] 2.10 — (Vuetify 4) CSS Layers + `!important` *(cas connu traité, cf. §2.10)*
- [x] 2.11 — (Vuetify 4) Variables Sass (`settings.scss`)
- [ ] 2.12 — (Vuetify 4) Grille VRow/VCol

### 3. 🟡 Nettoyage / dette
- [x] 3.1 — Hack `loginGuard`
- [x] 3.2 — Typer `src/api/*.api.ts`
- [ ] 3.3 — Husky v9
- [x] 3.4 — Props booléennes verbeuses
- [~] 3.5 — `exact` sur `v-tab` *(PRÉMISSE DU DOC FAUSSE : `exact` reste actif en Vuetify 3 → nécessaire sur les onglets dont le `:to` est un chemin parent. Retrait annulé/rétabli.)*
- [x] 3.6 — `formRef` sans `.value` *(+ `inputNameRef.focus()` corrigé)*
- [x] 3.7 — `v-list-item-icon` *(déjà migré, confirmé : aucune occurrence)*
- [ ] 3.8 — Dette de type : `string | null` → `string | undefined` *(1/7 corrigé, cf. §3.8)*
- [~] 3.9 — Dette de type : Vue Router 5 (`:to` chips, `auth.guard`, params) *(`auth.guard.ts` corrigé, reste `*Chip.vue`/`collection.router.ts`, cf. §3.9)*
- [x] 3.10 — Dette de type : `EventDialog`/events & divers *(la majorité corrigée en traitant les bugs runtime associés, reliquat listé en §3.10)*
- [x] 3.11 — (Vuetify 4) Divers 🟡 (elevation, date range, thème `system`, labs) *(chaque sous-point conclut « aucune action requise »)*
- [ ] 3.12 — Montée de **Vite** 6 → dernière stable

### 4. ⚪ Optionnel
- [ ] §4 — Améliorations optionnelles

### 5. Checklist QA finale
- [ ] §5 — QA finale

### 6. 📦 Montée de versions (2026-07) — ✅ FAIT
- [x] 6.1 — Node 18→22, vue→3.5.40, vue-router→5.2.0, pinia→4.0.2 (+`@vue/devtools-api`), axios→1.18.1, **vuetify→4.1.6** (+ `vite-plugin-vuetify` 2.1.3, `eslint-plugin-vuetify` 2.7.2, `sass` 1.102), `vue-tsc`+`type-check` *(build OK)*

*(La **version** Vuetify est montée en 4.x — build OK. Restent les **adaptations MD3** runtime/visuelles : §2.5–§2.12 et §3.11. La dette de type `vue-tsc` (§3.8–§3.10) et la montée de Vite (§3.12) sont aussi détaillées ci-dessous.)*

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
<summary><strong>1. 🔴 Bloquants — cassent le comportement — ✅ Terminé (11/11)</strong></summary>

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
<v-dialog v-model="taskDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
```

**Fichiers appelant `getDialogWidth()`** (import + `:width="getDialogWidth()"` + `:fullscreen="display.smAndDown"`) :

| Fichier | Ligne import | Ligne `:width` / `:fullscreen` |
|---|---|---|
| `src/views/settings/components/SettingsTagList.vue` | 7 | 95 |
| `src/views/collection/collection-list/CollectionList.vue` | 8 | 66 (fullscreen 67) |
| `src/views/collection/collection-detail/tabs/CollectionGeneral.vue` | 9 | 78 |
| `src/views/daily/daily-update/steps/event/DailyUpdateEvent.vue` | 7 | 99 |
| `src/views/project/project-detail/tabs/ProjectSection.vue` | 7 | 109 |
| `src/views/project/project-detail/tabs/ProjectEvent.vue` | 8 | 58 |
| `src/views/project/project-detail/tabs/ProjectDescription.vue` | 10 | 122 et 148 |
| `src/views/project/project-detail/components/ProjectSectionItem.vue` | 10 | 97 et 139 |
| `src/views/project/project-list/ProjectList.vue` | 8 | 69 |
| `src/views/components/common-task/CommonTaskDialog.vue` | 9 | 125 (fullscreen 126) |
| `src/views/components/task/TaskCard.vue` | 6 | 135 |
| `src/views/components/event/EventItemCard.vue` | 9 | 193 |
| `src/views/components/tag/TagCard.vue` | 4 | 41 |
| `src/views/agenga/Agenda.vue` | 10 | 280 |

**Fichiers appelant `getConfirmDialogWidth()`** → `confirmDialogWidth` / `confirmDialogFullscreen` :

| Fichier | Ligne import | Ligne `:width` / `:fullscreen` |
|---|---|---|
| `src/components/ConfirmDialog.vue` | 2 | 37 (fullscreen 38 : `display.xs`) |
| `src/components/ConfirmPasswordDialog.vue` | 5 | 76 (fullscreen 77 : `display.xs`) |

#### 1.1.b — Bugs JS purs (`display.x` sans `.value` dans computed/fonctions)

Ces fichiers utilisent `display.x` dans du code JS → **toujours _truthy_**. Appliquer la règle (déstructurer + `.value` dans le script). Les lignes de **template** du même fichier passent sans `.value`.

| Fichier | Ligne `const` | Lignes **script** (→ `.value`) | Lignes **template** (→ sans `.value`) | Clés à déstructurer |
|---|---|---|---|---|
| `src/components/MainTitle.vue` | 5 | 12 (`sm`), 13 (`mdAndUp`) | — | `sm, mdAndUp` |
| `src/views/settings/tabs/SettingsPreferences.vue` | 9 | 13 (`xs`), 14 (`smAndDown`), 15 (`width`) | — | `xs, smAndDown, width` |
| `src/views/collection/collection-detail/tabs/CollectionGeneral.vue` | 15 | 21, 36 (`xs`), 37 (`smAndDown`), 38 (`mdAndDown`), 39 (`lgAndDown`) | 78 (`smAndDown`), 82, 83 (`xs`) | `xs, smAndDown, mdAndDown, lgAndDown` |
| `src/views/daily/daily-summary/components/DailyDetail.vue` | 15 | 39 (`smAndUp`), 40 (`xs`), 95 (`mdAndDown`) | 173 (`mdAndDown`) | `xs, smAndUp, mdAndDown` |
| `src/views/project/project-detail/tabs/ProjectDescription.vue` | 16 | 23, 48 (`xs`), 49 (`smAndDown`), 50 (`mdAndDown`), 51 (`lgAndDown`) | 121, 152 (`xs`), 122/148 (`smAndDown`), 147 (`smAndUp`) | `xs, smAndUp, smAndDown, mdAndDown, lgAndDown` |
| `src/views/project/project-detail/components/ProjectSectionItem.vue` | 15 | 46 (`smAndDown`), 47 (`mdAndDown`), 48 (`lgAndDown`) | 85, 126 (`xs`), 97/141 (`smAndDown`), 102/119 (`mdAndDown`), 117/127/212/217 (`smAndUp`) | `xs, smAndUp, smAndDown, mdAndDown, lgAndDown` |
| `src/views/components/event/EventDayDialog.vue` | 10 | 35, 36 (`width`), 38 (`xs`) | 60, 61 (`xs`), 65 (`smAndUp`) | `xs, smAndUp, width` |
| `src/views/components/event/EventItemCard.vue` | 13 | 38 (`xs`) | 111 (`smAndUp`), 185 (`xs`), 193 (`smAndDown`) | `xs, smAndUp, smAndDown` |
| `src/views/profile/tabs/ProfileUser.vue` | 9 | 48 (`xs`), 49 (`sm`), 50 (`md`), 51 (`width`) | 87 (`smAndDown`), 126 (`xs`), 132 (`mdAndUp`) | `xs, sm, md, smAndDown, mdAndUp, width` |

#### 1.1.c — `display.x` uniquement dans le template

Appliquer la règle (déstructurer + template sans `.value`). Aucune ligne de script à modifier ici.

| Fichier | Ligne `const` | Lignes template | Clés |
|---|---|---|---|
| `src/components/ConfirmDialog.vue` | 6 | 38 | `xs` |
| `src/components/HalfDialog.vue` | 6 | 23 | `width` |
| `src/components/ConfirmPasswordDialog.vue` | 9 | 77 | `xs` |
| `src/views/settings/Settings.vue` | 5 | 15 | `mdAndUp` |
| `src/views/settings/components/SettingsTagList.vue` | 11 | 95 | `smAndDown` |
| `src/views/collection/collection-list/CollectionList.vue` | 15 | 67 | `smAndDown` |
| `src/views/collection/collection-detail/CollectionDetail.vue` | 7 | 21 (`xs`), 24 (`smAndUp`) | `xs, smAndUp` |
| `src/views/collection/collection-detail/tabs/CollectionSettings.vue` | 12 | 85, 107, 168 | `xs` |
| `src/views/daily/daily-update/steps/task/DailyUpdateTask.vue` | 24 | 164 (`mdAndUp`), 165 (`smAndDown`) | `mdAndUp, smAndDown` |
| `src/views/daily/daily-update/steps/event/DailyUpdateEvent.vue` | 12 | 99 (`smAndDown`), 102/103 (`smAndUp`) | `smAndUp, smAndDown` |
| `src/views/daily/daily-summary/components/DailyDetailEventTimeline.vue` | 9 | 38 | `xs` |
| `src/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue` | 8 | 65, 69, 72 | `xs` |
| `src/views/feedback/Feedback.vue` | 9 | 45 (`smAndUp`), 80 (`xs`) | `xs, smAndUp` |
| `src/views/project/project-detail/ProjectDetail.vue` | 7 | 26 (`xs`), 29 (`smAndUp`) | `xs, smAndUp` |
| `src/views/project/project-detail/tabs/ProjectSection.vue` | 15 | 100, 109 (`smAndDown`) | `smAndDown` |
| `src/views/project/project-detail/tabs/ProjectSettings.vue` | 16 | 110, 132, 204 | `xs` |
| `src/views/project/project-detail/tabs/ProjectEvent.vue` | 13 | 58 (`smAndDown`), 63 (`xs`) | `xs, smAndDown` |
| `src/views/project/project-detail/components/SectionDialog.vue` | 6 | 87 | `xs` |
| `src/views/project/project-list/ProjectList.vue` | 15 | 69 | `smAndDown` |
| `src/views/components/common-task/CommonTaskDialog.vue` | 13 | 126 | `smAndDown` |
| `src/views/components/task/TaskCard.vue` | 10 | 135 | `smAndDown` |
| `src/views/components/tag/TagCard.vue` | 8 | 41 | `smAndDown` |
| `src/views/profile/Profile.vue` | 6 | 18 | `mdAndUp` |
| `src/views/agenga/Agenda.vue` | 15 | 175, 178, 185, 193 (`xs`), 195 (`smAndUp`), 280 (`smAndDown`) | `xs, smAndUp, smAndDown` |
| `src/views/administration/Administration.vue` | 5 | 15 | `mdAndUp` |

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
<template #activator="{ props }">
  <v-btn v-bind="props">
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
  <v-btn v-bind="props" color="error" :block="$vuetify.display.xs">
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
<v-stepper :value="dailyStepper" non-linear alt-labels class="daily-update-stepper"
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

</details>

---

<details>
<summary><strong>2. 🟠 Iso-visuel — pour ne rien changer au style — 7/12 faits</strong></summary>

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

| Fichier | Ligne | Props à retirer |
|---|---|---|
| `src/views/daily/components/DailyTaskActionChip.vue` | 36 | `offset-y offset-overflow` |
| `src/views/daily/components/DailyTaskFormCard.vue` | 56 | `offset-y` |
| `src/views/components/tag/TagGroup.vue` | 79 | `offset-y offset-overflow` |
| `src/views/components/task/TaskCard.vue` | 79 | `offset-y` |
| `src/views/components/common-task/CommonTaskCard.vue` | 63 | `offset-y` |
| `src/views/components/tag/TagDialog.vue` | 175-176 | `offset-y` + `nudge-bottom="5"` |
| `src/views/administration/tabs/AdministrationUser.vue` | 103 | `offset-y offset-x` |
| `src/views/components/event/EventDialog.vue` | 256, 285, 318, 356 | `offset-y` + `nudge-top="30"` (cf. §1.8) |
| `src/views/agenga/Agenda.vue` | 270 | `offset-x` (menu désactivé, cf. §1.9) |

> Comparer le positionnement avant/après ; ajuster via `location`/`offset` si le placement diffère.

### 2.3 Hover mobile — chips & tabs (`src/styles/global.scss`, ex-`App.vue`)

> **⚠️ CONFIRMÉ CASSÉ** (vérifié dans `node_modules/vuetify/lib/components/VChip/VChip.sass` et `VTabs.sass`) : `.v-chip` neutralise son survol via un vrai élément **`.v-chip__overlay`** (pas un pseudo-élément), et `.v-tab` délègue au **`.v-btn__overlay`** (un `v-tab` est construit sur `VBtn` en interne). La règle actuelle `.v-chip, .v-tab { &:focus::before, &:hover::before { opacity: 0 !important } }` cible un `::before` qui n'existe plus pour ces deux composants → **du CSS mort, sans effet**. Seule la règle `.v-btn:hover .v-btn__overlay { opacity: 0 !important }` (déjà présente juste au-dessus) reste correcte et couvre `.v-tab` par ricochet (même classe interne).
>
> **Correctif à faire** : remplacer le bloc `.v-chip, .v-tab { &:focus::before, ... }` par `.v-chip:hover .v-chip__overlay, .v-chip:focus .v-chip__overlay { opacity: 0 !important }`.

Le fichier a été extrait de `App.vue` vers `src/styles/global.scss` (voir aussi §2.10). Le bloc chips/tabs cible `.v-chip` / `.v-tab` via `&:focus::before, &:hover::before` — **structure V2/V3, obsolète en V4** comme détaillé ci-dessus. Tester sur viewport `sm-and-down` une fois corrigé.

### 2.4 QA des sélecteurs `:deep()`

Aucun `::v-deep`/`>>>` résiduel (déjà en `:deep()`). **Pas de changement de code**, mais re-tester visuellement que les classes internes ciblées existent encore en V3 (elles ont pu être renommées) :
- `.v-slide-group__prev/__next`, `.v-tab` : `Settings.vue:51/57`, `CollectionDetail.vue:52/58`, `ProjectDetail.vue:57/63`, `ProjectSection.vue:127`, `Profile.vue:58/64`, `DailyUpdateProjectListItem.vue:228/234`
- `.v-timeline-item__body/__divider` : `DailyDetailTaskTimeline.vue:120/124`, `DailyDetailEventTimeline.vue:89/93`
- `.v-list-item__overlay` : `TheHeader.vue:106/110/116`
- `.v-calendar-weekly__day` : `Agenda.vue:305`, `App.vue:70` (lié à §1.9)

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
> **Décisions à trancher** : (1) breakpoints — figer les anciens seuils *(recommandé, §2.7)* ou adopter MD3 ; (2) typo — renommage des classes `text-*` **non confirmé** (le codemod tranchera, §2.6) ; (3) `v-btn` uppercase — accepter le défaut ou rétablir (§2.9).
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

### 2.8 (Vuetify 4) `fill-height` / VContainer

`VContainer fill-height` **ne centre plus verticalement** ; max-widths réduits (md 900→700, lg 1200→1000). Fichiers :
- `src/views/agenga/Agenda.vue`, `src/views/components/event/EventDayDialog.vue`, `src/views/settings/Settings.vue`, `src/views/settings/components/SettingsTagList.vue`, `src/views/settings/tabs/SettingsCommonTasks.vue`, `src/views/settings/tabs/SettingsTags.vue`.

Action : réintroduire `d-flex align-center` là où un centrage vertical était attendu.

### 2.9 (Vuetify 4) VBtn : uppercase supprimé + layout grid → flex — ✅ FAIT

> **Réalisé** — via la variable Sass officielle plutôt qu'une classe (`src/styles/settings.scss`) :
> ```scss
> @use 'vuetify/settings' with (
>     $button-colored-disabled: false,
>     $button-text-transform: uppercase,
> );
> ```
> Vérifié par compilation directe (`sass` CLI sur `VBtn.sass`) : `.v-btn { text-transform: uppercase; }` bien généré. Le passage grid→flex est **purement interne** à Vuetify (aucun override custom du projet n'en dépendait) → aucune action requise sur ce point. ⚠️ QA visuelle : alignement icône + texte sur les boutons avec `<v-icon start/end>`.

Les libellés des **89 `<v-btn>`** ne sont plus en MAJUSCULES par défaut, et le layout interne passe de grid à flexbox.

### 2.10 (Vuetify 4) CSS Layers obligatoires + `!important` — ✅ FAIT (cas connu traité)

> **Réalisé pour le cas identifié** : bug concret rencontré sur le reset `h1`-`h6`/`p` (§2.6) — une règle `margin: 0` non-layered dans `global.scss` gagnait **systématiquement** sur les classes utilitaires Vuetify (`mb-3`, etc.), même wrappées dans un layer, car **une règle hors layer bat toujours une règle layered, quelle que soit la spécificité**. Confirmé par le guide officiel ([Upgrade guide — Layers](https://vuetifyjs.com/en/getting-started/upgrade-guide/#layers)) et corrigé en reproduisant exactement le snippet recommandé, avec le bon sous-layer :
> ```scss
> @layer vuetify-core.reset {
>   h1, h2, h3, h4, h5, h6 { margin: 0; }
>   p { margin: 0 0 16px; }
> }
> ```
> **Les 48 autres `!important` du projet n'ont pas ce problème** : ils sont eux aussi non-layered, mais leur but est justement de **gagner** face à Vuetify (neutraliser un défaut, forcer une dimension) — le mécanisme « non-layered gagne toujours » joue alors **en leur faveur**, pas besoin d'y toucher. Seul un `!important` qui doit explicitement **perdre** face à une classe utilitaire Vuetify (comme le cas du reset) a besoin d'être repassé en `@layer`.
> **`overflow-y` retiré du reset** (Vuetify) : non vérifié spécifiquement, à surveiller si un scroll casse quelque part.

Vuetify 4 impose les CSS layers → la spécificité des overrides change.
- Overrides `:deep()` à revérifier : `global.scss` (ex-`App.vue`) (`.v-stepper__*`, `.v-window__*`, `.v-calendar-weekly*`, `.v-btn__overlay`, `.v-chip`/`.v-tab` — cf. §2.3 pour ce dernier point, confirmé cassé), `Settings/CollectionDetail/ProjectDetail/ProjectSection/Profile/DailyUpdateProjectListItem`, timelines, `TheHeader`.

### 2.11 (Vuetify 4) Variables Sass renommées/supprimées — ✅ FAIT

`src/styles/settings.scss` fait `@use 'vuetify/settings' with ($button-colored-disabled: false)`.
- ✅ **`$button-colored-disabled` existe toujours en v4.1.6** (le `yarn build` passe sans erreur Sass). Aucune action requise ici. *(D'autres variables sont supprimées — `$grid-gutters`, `$form-grid-gutter`, `$counter-color`… — mais non utilisées par le projet.)*

### 2.12 (Vuetify 4) Grille VRow/VCol (gap)

Refonte (marges négatives → CSS `gap`, certaines classes/comportements changent). **Surface faible** : 2 `v-container`, 4 `v-row`, 8 `v-col` (aucun `offset-*`). Action : re-tester les espacements de ces écrans ; pas de renommage systématique.

> Note d'investigation : un bug de layout signalé dans `DailyDetail.vue` (cards qui ne remplissaient plus la largeur disponible) faisait initialement suspecter ce point (`v-row`/`v-col`), mais la cause réelle était ailleurs (`.v-timeline-item__body`, cf. §3.10/timelines). `v-row`/`v-col` en tant que tel reste non vérifié pour ce qui est du `gap`.

</details>

---

<details>
<summary><strong>3. 🟡 Nettoyage / dette technique — 7/12 faits, 2 partiels</strong></summary>

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

| Fichier | Fonctions sans type de retour |
|---|---|
| `src/api/project.api.ts` | `getProjectList` (L.5), `getProjectListDetailed` (L.11), `getProjectById` (L.17), `createProject` (L.23), `updateProject` (L.27), `deleteProject` (L.33) |
| `src/api/tag.api.ts` | `getTagList` (L.18), `isNameUnique` (L.22), `createTag` (L.26), `updateTag` (L.30), `deleteTag` (L.36) |
| `src/api/task.api.ts` | `createTask` (L.5), `updateTaskById` (L.9), `deleteTaskById` (L.15) |
| `src/api/section.api.ts` | `createSection` (L.5), `updateSection` (L.9), `deleteSection` (L.14) |
| `src/api/user.api.ts` | toutes (L.22-72) |
| `src/api/preferences.api.ts` | `getPreferences` (L.5), `updatePreferences` (L.9) |
| `src/api/feedback.api.ts` | `getFeedback` (L.6), `createFeedback` (L.10), `setFeedbackReadProperty` (L.14), `deleteFeedback` (L.22) |
| `src/api/auth.api.ts` | `login` (L.18) uniquement |

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

### 3.3 Husky — `husky install` déprécié (v9)

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

### 3.5 Liens `exact` sur `v-tab` (VR4) — ⚠️ PRÉMISSE FAUSSE, RETRAIT ANNULÉ

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

### 3.8 Dette de type : `string | null` → `string | undefined` (1/7 corrigé)

Des props (couleur/taille) reçoivent `string | null` alors que Vuetify attend `string | undefined` (`vue-tsc` : `Type 'null' is not assignable to type 'string | undefined'`). Aligner le type **source** (computed/prop) sur `string | undefined`, ou passer `?? undefined`.
- ✅ `src/views/daily/daily-summary/components/DailyDetailEventTimeline.vue:35` — corrigé en même temps que le bug de couleur du dot de timeline (`isPassed(event) ? 'passedEvent' : 'event'` au lieu de `null`).
- Restent ouverts (vérifié via `yarn type-check`, toujours en erreur) : `src/views/project/components/ProjectCard.vue:19`, `src/views/feedback/Feedback.vue:45`, `src/views/project/project-detail/components/SectionDialog.vue:86`, `src/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue:64`, `src/views/daily/daily-summary/DailySummary.vue:145`, `src/views/daily/daily-summary/components/DailySummaryCard.vue:39`.

### 3.9 Dette de type : Vue Router 5 (partiel)

Les types VR5 sont plus stricts :
- ✅ **`src/router/guards/auth.guard.ts`** — corrigé (traité avec la refonte des guards en `NavigationGuard` sans `next()`, cf. §3.1) : `NON_AUTH_ROUTES` typé en `RouteRecordNameGeneric[]` au lieu de `(string|null|undefined)[]`.
- Restent ouverts (vérifié via `yarn type-check`) :
  - **`src/components/ProjectChip.vue`, `SectionChip.vue`, `CollectionChip.vue`** (L.28 + L.42/44) : `detailLocation` renvoie `RouteLocation | null`, incompatible avec la prop `:to` → typer en `RouteLocationRaw | undefined` (retourner `undefined` au lieu de `null`). Nouvelles erreurs apparues aussi sur ces 3 fichiers (`No overload matches this call`, `SectionChip.vue:52` `Expected 0 arguments, but got 1`) — probablement amplifiées par la montée vue-router 5.2.0, à re-diagnostiquer.
  - **`src/router/modules/collection.router.ts:17`** : `route.params.id` est `string | string[]` → `String(route.params.id)` ou garde de type `Array`.

### 3.10 Dette de type : `EventDialog`/events & divers — ✅ FAIT (majorité), reliquat listé

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

### 3.12 Montée de **Vite** 6 → dernière stable

Vite est en **`^6.0.1`**. Monter vers la dernière stable (≥ 7, désormais permis par Node 22).
- ⚠️ **Vérifier la version cible exacte et ses breaking changes au moment de le faire** (Rolldown, options de build, plugins). Confirmer la compat de `@vitejs/plugin-vue` (^5) et `vite-plugin-vuetify` avec la Vite cible.
- Fichiers potentiellement impactés : `vite.config.ts`, `package.json` (scripts/deps), éventuels réglages `build.rollupOptions`.
- Migration **indépendante** de Vuetify 4 ; à faire séparément avec `yarn build` + `yarn dev` de contrôle.

</details>

---

<details>
<summary><strong>4. ⚪ Optionnel / améliorations (hors « iso-fonctionnel ») — non requis pour l'iso-fonctionnel</strong></summary>

- **`:model-value` → `v-model`** : convertir **uniquement** quand `:model-value="x"` **+** `@update:model-value="x = $event"` portent sur la **même** valeur (ex. `HalfDialog.vue:21/24`, `ConfirmDialog.vue:36/39`, `CommonTaskDialog.vue:124/127`). **Ne pas** toucher : les `:model-value` en lecture seule (`ProgressDisk.vue:21`, `ProgressWheel.vue:43`, `ProjectCard.vue:22`, `CollectionCard.vue:23`, `ProjectSectionItem.vue:229`) ni les `@update:model-value` qui appellent une fonction (validation) sans liaison bidirectionnelle.
- **Vuelidate** : remplacer la validation manuelle des forms — change le fonctionnement, hors lot iso-fonctionnel.
- **Calls API via les stores** : `project`/`collection` passent déjà par leurs stores Pinia. Auditer si des composants appellent directement `*.api.ts` alors qu'un store existe.
- **Getters Pinia « completed tasks »** du `currentProject` : factorisation.
- **Bug latent** `src/store/project.store.ts:62` : `this.currentProject = { ...this.currentProject, response }` crée une clé littérale `response` au lieu de fusionner (`...response`). À corriger si la mise à jour des propriétés projet ne se reflète pas dans l'UI.
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

*(Migration Vuetify 3→4, dette de type et montée de Vite : voir les points détaillés §1.11, §2.5–§2.12, §3.8–§3.12 ci-dessus.)*

</details>
