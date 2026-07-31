# Dialogs

**Problème** — l'app est massivement construite sur des dialogs (création, édition,
confirmation, détail). Trois briques réutilisables existent ; en écrire un « à la main » produit
un comportement responsive et un scroll incohérents.

## Choisir la brique

| Besoin | Utiliser | Fichier |
|---|---|---|
| Formulaire de création/édition | `v-dialog` + `useDialogWidth` | pattern ci-dessous |
| Demander une confirmation | `ConfirmDialog` | `src/components/ConfirmDialog.vue` |
| Confirmer par mot de passe (action sensible) | `ConfirmPasswordDialog` | `src/components/ConfirmPasswordDialog.vue` |
| Panneau latéral (détail contextuel) | `HalfDialog` | `src/components/HalfDialog.vue` |

## Recette — dialog de formulaire

1. **Largeur responsive** via le composable, jamais en dur :

   ```ts
   import { useDialogWidth } from '@/composables/useDialogWidth'
   const { dialogWidth, dialogFullscreen } = useDialogWidth()
   ```

   ```html
   <v-dialog v-model="taskDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
   ```

   `dialogWidth` vaut `undefined` (= plein écran) en `smAndDown`, `'80%'` en `mdAndDown`, `'60%'`
   au-delà. Le couple `confirmDialogWidth`/`confirmDialogFullscreen` est plus étroit et bascule
   en plein écran seulement en `xs`.

2. **Séparer le contenu du dialog** dans un composant dédié (`*Dialog.vue`) qui reçoit
   `isDialogOpen` et émet `submit` / `close`, plutôt que d'inliner le formulaire.
   Exemples : `src/views/components/task/TaskDialog.vue`,
   `src/views/components/event/EventDialog.vue`,
   `src/views/project/project-detail/components/SectionDialog.vue`.

3. **Ouverture par slot `activator`** quand le déclencheur appartient au dialog :

   ```html
   <ConfirmDialog @confirm="deleteItem(id)">
     <template #activator="{ props }">
       <v-btn v-bind="props" icon variant="text" density="comfortable">
         <v-icon>mdi-trash-can</v-icon>
       </v-btn>
     </template>
   </ConfirmDialog>
   ```

   ⚠️ **Vuetify 3+ expose `{ props }`**, pas `{ attrs, on }` — il faut `v-bind="props"` sur
   l'élément déclencheur, sinon **le clic n'ouvre rien** sans aucune erreur.
   Exemple réel : `src/views/administration/tabs/AdministrationFeedback.vue:83`.

4. **Neutraliser le scroll du fond** si le dialog est plein écran : `hideScroll()` /
   `showScroll()` de `@/utils/document.utils`. `HalfDialog` le fait déjà ; `DailyDetail.vue:44`
   le fait à la main, et `DailySummary.vue` le restaure défensivement à l'`onUnmounted`.

## Variantes légitimes

- **Dialog piloté par l'URL** — quand l'état ouvert doit survivre au rafraîchissement et que le
  bouton « retour » du navigateur doit le fermer. Un seul cas :
  `src/views/daily/daily-summary/DailySummary.vue` pousse/retire le param `:date` de la route,
  et `DailyDetail` s'ouvre/se ferme d'après ce param. À réserver aux dialogs de « détail
  d'entité » qui méritent une URL propre.
- **`ConfirmDialog` avec ou sans activator** — le slot est optionnel ; on peut aussi le piloter
  par `v-model` depuis le parent (`src/views/components/task/TaskCard.vue`).

## Écarts assumés / non migrés

- **`HalfDialog` ne passe pas par `useDialogWidth`** : il gère sa largeur en CSS
  (`.half-dialog` dans `src/styles/global.scss`, avec des `!important` et 4 media queries) et
  choisit sa transition d'après `width < 400`. C'est volontaire — c'est un panneau latéral, pas
  un dialog centré — mais ça signifie que sa responsivité ne suit pas la même source de vérité.
- **`ProjectSection.vue:14`** ne destructure que `dialogWidth` et utilise son propre `smAndDown`
  pour `:fullscreen`, alors que les ~19 autres appelants prennent `dialogFullscreen`.
- **`useDialogWidth` fuit des refs Vuetify inscriptibles** : `dialogFullscreen` et
  `confirmDialogFullscreen` sont les refs globales de `useDisplay()` renvoyées telles quelles
  (pas de `readonly()`). Ne jamais écrire dedans.

## Voir aussi

- [responsive.md](responsive.md) — le piège de déballage de `useDisplay`, dont `useDialogWidth`
  est la parade
- [forms.md](forms.md) — le contenu de ces dialogs
- [../architecture/ui-layer.md](../architecture/ui-layer.md) — où placer un nouveau `*Dialog.vue`
