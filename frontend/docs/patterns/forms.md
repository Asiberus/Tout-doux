# Formulaires

**Problème** — aucune librairie de validation n'est utilisée. Tous les formulaires suivent le
même montage manuel autour de `v-form` et d'un type `Form<T>` maison. S'en écarter casse
l'activation du bouton de soumission.

## Recette

1. **Un seul `ref` typé `Form<T>`** (`src/models/common.model.ts:1`) qui porte l'état complet :

   ```ts
   import { Form } from '@/models/common.model'

   const form = ref<Form<UserPatch>>({
     valid: false,        // écrit par v-form via v-model
     pending: false,      // requête en cours (optionnel)
     data: { username: '', firstName: '' },
     rules: {
       username: [
         (value: string): boolean | string => !!value || 'Username is required',
         (value: string): boolean | string => value.length <= 100 || 'Max 100 characters',
       ],
     },
   })
   ```

   Une règle renvoie `true` si valide, sinon **la chaîne du message d'erreur**.
   Exemple réel : `src/views/profile/tabs/ProfileUser.vue:20`.

2. **Brancher `v-form`** sur `form.valid` et les règles sur chaque champ :

   ```html
   <v-form ref="form" v-model="form.valid">
     <v-text-field v-model="form.data.username" :rules="form.rules?.username" />
   </v-form>
   ```

3. **Conditionner la soumission** par un `computed`, pas par un test inline :

   ```ts
   const canSubmit = computed<boolean>(
     () => form.value.valid && !form.value.pending && !isFormUntouched.value
   )
   ```

   Le garde `isFormUntouched` (comparaison champ par champ avec la valeur d'origine) est la
   convention pour les écrans d'édition — voir `ProfileUser.vue:35`.

4. **Réinitialiser via le ref de template** — ⚠️ `useTemplateRef` renvoie un **ref**, donc
   `.value` est obligatoire :

   ```ts
   const formRef = useTemplateRef('form')
   formRef.value?.resetValidation()
   ```

## Appeler `validate()` — asynchrone

En Vuetify 3+, `v-form.validate()` renvoie une **`Promise`**. Tester sa valeur de retour
directement ne bloque **jamais** (une promesse est toujours *truthy*) :

```ts
// ❌ ne bloque rien
if (!formRef.value.validate()) return

// ✅
const { valid } = await formRef.value.validate()
if (!valid) return
```

Deux fichiers seulement appellent `validate()` explicitement
(`ResetPasswordRequest.vue:36`, `ProfileEmail.vue:58`) ; partout ailleurs on se repose sur
`form.valid` mis à jour en continu par `v-model`.

## Validation d'unicité côté serveur (debounce)

Pattern pour les champs uniques (nom d'utilisateur, e-mail, nom de tag, nom de common task) :
un `ref` d'erreur séparé + un timer, remis à zéro à chaque frappe.

```ts
const usernameUniqueError = ref<string | null>(null)
let usernameValidationTimer: ReturnType<typeof setTimeout> | undefined = undefined
```

Le message n'est pas une `rule` (il est asynchrone) : il est passé en `:error-messages` et
combiné à `canSubmit`. Exemples : `ProfileUser.vue:33`,
`src/views/components/tag/TagDialog.vue`, `src/views/non-auth/Register.vue`.
Les endpoints correspondants renvoient `UniqueResponse { unique: boolean }`.

## Actions sensibles : confirmation par mot de passe

Suppression de compte, changement d'e-mail → encapsuler dans `ConfirmPasswordDialog`
(`src/components/ConfirmPasswordDialog.vue`), qui valide le mot de passe via
`authApi.checkPassword` et émet `password-confirmed`. Voir
[dialogs.md](dialogs.md).

⚠️ Le backend renvoyant un **401** sur mot de passe erroné, l'intercepteur global purge le token
et redirige — voir [../quality/watched-risks.md](../quality/watched-risks.md).

## Écarts assumés

- **`Form<T>.rules` est typé avec `any`** (`common.model.ts:5`) — seul `any` de la couche
  modèles, nécessaire pour accepter tous les types de valeur de champ.
- **`Form<T>` vit dans `src/models/`** alors que c'est un type de présentation, pas un contrat
  d'API. Idem pour `DailyUpdateTaskTab` (`daily-task.model.ts:49`).
- **Pas de Vuelidate ni de librairie de schéma** : décision de non-adoption, voir
  [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) pour l'état de la
  question.
- **Pas de retour d'erreur serveur dans le formulaire** : un échec de soumission part en
  `console.error`, le formulaire reste tel quel sans message.

## Voir aussi

- [dialogs.md](dialogs.md) — la plupart des formulaires vivent dans un dialog
- [../architecture/api-layer.md](../architecture/api-layer.md) — pourquoi il n'y a pas d'erreur
  typée à afficher
