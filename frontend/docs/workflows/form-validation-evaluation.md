# Évaluation — librairie de validation de formulaires

> ⚠️ **Document temporaire d'aide à la décision.** Il n'est pas une règle de référence : quand
> l'arbitrage sera rendu, il **doit être supprimé** et remplacé par un ADR court dans
> [../adr/](../adr/), et [../patterns/forms.md](../patterns/forms.md) doit être réécrit sur la
> solution retenue.
>
> **Date de la recherche : 2026-08-15.** Les chiffres de maintenance ci-dessous vieillissent
> vite ; les revérifier avant de trancher si la décision est repoussée de plusieurs mois.
>
> **Aucun code de ce document n'a été exécuté.** Les extraits « APRÈS » sont écrits d'après la
> documentation de chaque librairie et servent à comparer l'ergonomie, pas à être copiés tels
> quels. Le choix doit être confirmé par un POC sur un écran réel.

## 1. Ce qui motive la question — et ce qui n'est pas en cause

**Ce qui n'est pas cassé.** La validation actuelle fonctionne, y compris pour les erreurs
asynchrones. Vérifié dans `node_modules/vuetify/lib/composables/validation.js:62` : un champ
dont `error-messages` est non vide renvoie `isValid === false`, et `form.js:60-69` propage cette
invalidité au `v-form`. Les erreurs d'unicité **bloquent donc bien** le bouton de soumission.
Personne ne doit adopter une librairie en croyant réparer ça.

**Ce qui est réellement coûteux**, mesuré sur le code :

| Grief                         | Preuve                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Debounce écrit à la main      | `Register.vue` : 4 timers, 4 fonctions `validateX` + 4 fonctions `isXUnique`, ~80 lignes pour 4 champs. Même montage dans `TagDialog`, `CommonTaskDialog`, `ProfileUser`, `ProfilePassword`, `ResetPassword` |
| Course sur `form.pending`     | `Register.vue` : 4 validateurs concurrents écrivent le **même** booléen ; le premier `.finally()` le remet à `false` alors qu'un autre appel est encore en vol                                               |
| Règles non typées             | `ValidationRule = (value: any)` côté Vuetify, d'où le seul `any` de la couche modèles (`common.model.ts:9`), écart déjà assumé dans `patterns/forms.md`                                                      |
| Cross-field bricolé           | `validatePasswordMatch()` passe par un `setTimeout` de 300 ms alors qu'aucun appel réseau n'est en jeu                                                                                                       |
| Aucune règle réutilisable     | 18 blocs `rules:` recopiés dans 19 SFC ; « required » et « max 100 caractères » sont réécrits à l'identique une dizaine de fois                                                                              |
| Rien n'est testable isolément | Les règles sont des closures anonymes dans un `ref` de composant. Le projet n'a par ailleurs aucun test (cf. [../quality/watched-risks.md](../quality/watched-risks.md), W1)                                 |

## 2. Le périmètre à couvrir

Toute solution retenue doit couvrir **ce que le code fait déjà**, sinon la migration est une
régression fonctionnelle :

| Besoin                              | Où                                                                             | Volume      |
| ----------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| Règles synchrones simples           | 19 SFC avec `<v-form>`                                                         | 18 blocs    |
| Validation async serveur + debounce | unicité pseudo/e-mail/tag/common task, force du mot de passe                   | 6 écrans    |
| Cross-field                         | concordance des mots de passe (`Register`, `ResetPassword`, `ProfilePassword`) | 3 écrans    |
| État « en cours de validation »     | `form.pending`, qui conditionne `canSubmit`                                    | tous        |
| Réinitialisation à la réouverture   | `formRef.value?.resetValidation()` dans les dialogs                            | ~10 dialogs |
| Détection de formulaire non modifié | `isFormUntouched` (comparaison `deep-equal`) sur les écrans d'édition          | 4 écrans    |
| Affichage dans les champs Vuetify   | `:rules` et `:error-messages` de `v-text-field`                                | partout     |

Contrainte structurante : **Vuetify possède déjà la moitié du problème**. Ses champs affichent
les erreurs via `:rules` (son propre moteur) _ou_ via `:error-messages` (source externe). Une
librairie tierce s'intègre donc par `:error-messages`, en abandonnant `:rules`. Mélanger les
deux sur un même champ, c'est avoir deux moteurs de vérité.

## 3. Tri des candidates

Critères imposés : **bien maintenue**, **réputée**, **sans bug notoire**. Données relevées le
2026-08-15 (npm registry + API GitHub).

| Librairie         | Dernière version stable                 | Activité du dépôt                                                                                      | Adoption                                        | Verdict                                                                           |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| **Regle**         | `@regle/core` 1.29.1, 2026-08-13        | push 2026-08-13, 320 versions publiées, stable depuis 2025-03-24, 11 contributeurs, 14 issues ouvertes | 492 ★, 52 k dl/sem                              | ✅ **retenue**                                                                    |
| **TanStack Form** | `@tanstack/vue-form` 1.33.5, 2026-08-13 | push 2026-08-14, portée par une organisation                                                           | 6,7 k ★ (monorepo tous frameworks), 56 k dl/sem | ✅ **retenue**                                                                    |
| vee-validate      | 4.15.1, **2025-06-07**                  | dernier commit 2026-03-04 (correctifs CI) ; v5 en beta depuis 2025-08, une seule beta publiée depuis   | 11,3 k ★, 1,1 M dl/sem                          | ❌ 14 mois sans version stable ; Snyk la classe « Inactive »                      |
| Vuelidate         | `@vuelidate/core` 2.0.3, **2023-06-29** | push 2025-06-10, 212 issues ouvertes                                                                   | 6,9 k ★                                         | ❌ abandonnée de fait ; Regle se présente comme son successeur                    |
| FormKit           | 2.1.2, 2026-07-24                       | actif                                                                                                  | 4,8 k ★                                         | ❌ fournit ses **propres composants de champ** : conflit frontal avec Vuetify     |
| Formwerk          | actif (même auteur que vee-validate)    | push 2026-08-14                                                                                        | 420 ★                                           | ❌ s'adresse aux constructeurs de design system : remplacerait les champs Vuetify |

**Deux candidates seulement** satisfont les critères, pas trois. Compléter la liste jusqu'à
trois obligerait à retenir une librairie que le premier critère élimine.

**Sur l'écart le plus surprenant — vee-validate.** C'est de loin la plus téléchargée et la plus
citée dans les comparatifs en ligne, mais l'essentiel de ces comparatifs date de 2023-2024 et ne
reflète plus l'état du projet. Son auteur consacre désormais son activité à Formwerk, un autre
projet. Une librairie à 1,1 M de téléchargements ne disparaîtra pas demain, mais l'adopter
aujourd'hui, c'est parier sur une v5 en beta depuis un an et sur une v4 figée depuis juin 2025.

## 4. Option 0 — rester sans librairie, en exploitant Vuetify 4

À comparer en premier : **Vuetify 4 embarque deux mécanismes que le projet n'utilise pas**.

**a. Le plugin de règles** (`vuetify/labs/rules`) fournit des aliases prêts à l'emploi —
`required`, `email`, `number`, `integer`, `capital`, `maxLength`, `minLength`, `strictLength`,
`exclude`, `notEmpty`, `pattern` — dont les messages passent par l'i18n de Vuetify
(`node_modules/vuetify/lib/labs/rules/rules.js`). Les aliases sont personnalisables. Sans le
plugin, une règle écrite sous forme d'alias est **silencieusement ignorée** (`rules.js:89` :
`rules?.resolve(fn) ?? toRef(fn)`).

**b. Les règles asynchrones natives** : `ValidationRule` accepte déjà
`(value: any) => PromiseLike<ValidationResult>` (`validation.d.ts:5`), et le champ expose un
état `isValidating`.

### Sur `Register.vue`

```ts
// AVANT — pour le seul champ « username » (≈ 20 lignes, × 4 champs)
const usernameUniqueError = ref<string | null>(null)
let usernameValidationTimer: ReturnType<typeof setTimeout> | undefined = undefined

function validateUsername(value: string): void {
  clearTimeout(usernameValidationTimer)
  if (value === '') {
    usernameUniqueError.value = null
    return
  }
  form.value.pending = true
  usernameValidationTimer = setTimeout(() => isUsernameUnique(value), 300)
}

function isUsernameUnique(value: string): void {
  userApi
    .isUsernameUnique({ username: value })
    .then(response => {
      usernameUniqueError.value = !response.unique ? 'This username is already used' : null
    })
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}
```

```ts
// APRÈS — règle asynchrone native, plus de timer ni d'état d'erreur séparé
async function usernameIsFree(value: string): Promise<true | string> {
  if (!value) return true
  const { unique } = await userApi.isUsernameUnique({ username: value })
  return unique || 'This username is already used'
}
```

```html
<!-- APRÈS — aliases pour les règles triviales, fonction pour l'async -->
<v-text-field
  v-model="form.data.username"
  :rules="['required', ['maxLength', 100], usernameIsFree]"
  validate-on="blur" />
```

Activation du plugin (`src/plugins/vuetify.ts` + `main.ts`), qui réclame l'instance de locale :

```ts
import { createRulesPlugin } from 'vuetify/labs/rules'

app.use(
  createRulesPlugin(
    {
      aliases: {
        /* règles maison */
      },
    },
    vuetify.locale
  )
)
```

**Avantages** — aucune dépendance ajoutée ; supprime la duplication de « required » et
« max 100 caractères » dans 19 SFC ; messages traduits par l'i18n déjà configurée ; aucune
réécriture de template au-delà de l'attribut `:rules` ; réversible fichier par fichier.

**Inconvénients** — **pas de debounce** : en `validate-on="input"` (le défaut), une règle async
part à chaque frappe ; il faut basculer les champs concernés en `validate-on="blur"`, ce qui
change l'UX actuelle (l'erreur d'unicité apparaît aujourd'hui pendant la saisie). Le module est
en **`labs`**, donc sans garantie de stabilité d'API entre versions mineures. Les règles restent
typées `(value: any)`. Rien pour le cross-field : la concordance des mots de passe reste
manuelle. Aucune validation possible hors composant (pas de règle testable côté store).

## 5. Option A — Regle

Model-based et _headless_ : les règles sont déclarées sur la donnée, pas dans le template ;
l'affichage reste entièrement à la charge de Vuetify.

### Sur `Register.vue`

```ts
// APRÈS — déclaration unique, les 4 timers disparaissent
import { useRegle } from '@regle/core'
import { required, maxLength, email, sameAs, withAsync, withMessage } from '@regle/rules'

const form = ref<RegisterPost>({ username: '', email: '', password: '', confirmPassword: '' })

const { r$ } = useRegle(form, {
  username: {
    required,
    maxLength: maxLength(100),
    unique: withMessage(
      withAsync(
        async (value: string) => (await userApi.isUsernameUnique({ username: value })).unique
      ),
      'This username is already used'
    ),
  },
  email: { required, email, maxLength: maxLength(100) },
  password: { required, maxLength: maxLength(64) },
  confirmPassword: { required, sameAs: sameAs(() => form.value.password) },
})
```

```html
<!-- APRÈS — Vuetify n'affiche plus que ce que Regle calcule -->
<v-text-field
  v-model="r$.username.$value"
  :error-messages="r$.username.$errors"
  :loading="r$.username.$pending" />

<v-btn :disabled="r$.$invalid || r$.$pending" type="submit">Register</v-btn>
```

Ce que la librairie apporte nativement sur les griefs du §1 : debounce de 200 ms sur les règles
async (réglable par le modificateur `$debounce`) ; `$pending` **par champ**, ce qui supprime la
course sur le booléen partagé ; « un champ ne peut pas être en erreur tant qu'il est _pending_ » ;
`sameAs` pour le cross-field ; `$errors`, `$dirty`, `$edited` (qui couvre le besoin de
`isFormUntouched`), `$reset()`.

**Avantages** — de loin la meilleure correspondance avec le code existant : chacun des six
besoins du §2 a une réponse native. Typage complet, ce qui referme l'écart `any` de
`common.model.ts`. Modèle _headless_ : aucun composant imposé, donc zéro friction avec Vuetify —
on abandonne `:rules` au profit de `:error-messages`, qui est déjà le canal utilisé par le
projet pour les erreurs async. Validation déclarable hors composant (utile si des règles
descendent un jour dans un store Pinia). Support des schémas Zod/Valibot si le besoin apparaît.
Rythme de publication soutenu, et `@vue/devtools-api` — sa seule dépendance notable — est **déjà
dans le projet**.

**Inconvénients** — **facteur bus de 1** : un auteur principal, 11 contributeurs, 492 étoiles.
C'est le vrai risque de cette option, à mettre en regard du fait que le projet est mono-développeur.
Écosystème et corpus de réponses en ligne réduits : peu de Stack Overflow, pas de recette
Vuetify officielle. Stable seulement depuis mars 2025. Le nommage `r$.champ.$propriété` est
inhabituel et demande un temps d'adaptation.

## 6. Option B — TanStack Form

Bibliothèque multi-frameworks (React, Vue, Angular, Solid, Lit), pilotée par un store à signaux.

### Sur `Register.vue`

```html
<!-- APRÈS — un composant Field par champ, liaison manuelle vers Vuetify -->
<form.Field
  name="username"
  :async-debounce-ms="300"
  :validators="{
    onChange: ({ value }) => (value ? undefined : 'Username is required'),
    onChangeAsync: async ({ value }) =>
      (await userApi.isUsernameUnique({ username: value })).unique
        ? undefined
        : 'This username is already used',
  }">
  <template #default="{ field }">
    <v-text-field
      :model-value="field.state.value"
      :error-messages="field.state.meta.errors"
      @update:model-value="field.handleChange"
      @blur="field.handleBlur" />
  </template>
</form.Field>
```

**Avantages** — projet porté par une organisation, pas par une personne : c'est la réponse
directe au risque de facteur bus de Regle. Très actif. Debounce async intégré
(`asyncDebounceMs`). Compatible Standard Schema (Zod, Valibot). Compétence transférable hors Vue.

**Inconvénients** — **API pensée pour React** : le champ passe par un composant `<form.Field>` à
slot scopé, ce qui interdit `v-model` et impose de câbler `:model-value` / `@update:model-value`
/ `@blur` à la main sur **chaque** champ Vuetify. Sur les 19 formulaires du projet, c'est une
réécriture de templates bien plus lourde que l'option A, et le résultat s'éloigne des idiomes
Vue que le reste du code respecte. Les règles vivent à nouveau dans le template — le grief
« rien n'est réutilisable » n'est que partiellement traité. Pas d'équivalent direct de `sameAs`
(le cross-field passe par des validateurs liés à déclarer manuellement). Aucune notion de
`$edited`, donc `isFormUntouched` reste à maintenir.

## 7. Synthèse

| Critère                         | Option 0 — Vuetify labs      | Option A — Regle               | Option B — TanStack Form      |
| ------------------------------- | ---------------------------- | ------------------------------ | ----------------------------- |
| Dépendance ajoutée              | aucune                       | `@regle/core` + `@regle/rules` | `@tanstack/vue-form`          |
| Règles synchrones réutilisables | aliases intégrés             | ✅ + règles composables        | ⚠️ déclarées dans le template |
| Async + debounce                | ⚠️ async oui, debounce non   | ✅ natif (200 ms, réglable)    | ✅ natif (`asyncDebounceMs`)  |
| État _pending_ par champ        | `isValidating`               | ✅ `$pending`                  | ✅ `isValidating`             |
| Cross-field                     | ❌ manuel                    | ✅ `sameAs`                    | ⚠️ validateurs liés manuels   |
| Équivalent `isFormUntouched`    | ❌                           | ✅ `$edited`                   | ❌                            |
| Typage des règles               | `any`                        | ✅ complet                     | ✅ complet                    |
| Friction avec Vuetify           | nulle (c'est Vuetify)        | faible (`:error-messages`)     | élevée (slot scopé par champ) |
| Ampleur de la réécriture        | attribut `:rules` uniquement | script + liaison des champs    | script + template de 19 forms |
| Stabilité de l'API              | ⚠️ `labs`                    | stable depuis 03/2025          | stable depuis 05/2025         |
| Risque de gouvernance           | aucun (cœur Vuetify)         | ⚠️ facteur bus 1               | faible (organisation)         |

## 8. Recommandation

**Procéder en deux temps, et ne pas trancher A/B sur le papier.**

1. **Activer le plugin de règles de Vuetify (option 0) tout de suite.** Le gain — supprimer les
   closures `required` / `maxLength` recopiées dans 19 SFC — est acquis sans dépendance et sans
   engager le choix suivant : les aliases restent valides quelle que soit la librairie retenue
   ensuite, puisque les règles triviales continueront de vivre dans les champs.
2. **POC de Regle sur `Register.vue`**, l'écran le plus dégradé (4 validations async, 1
   cross-field, ~80 lignes de plomberie). C'est le seul moyen de vérifier sur pièce l'ergonomie
   de `r$` avec les champs Vuetify et la réalité de l'affichage du `$pending`. Si le POC
   convainc, migrer les 6 écrans à validation asynchrone, puis les autres.

**Pourquoi Regle plutôt que TanStack Form** : c'est la seule des deux dont chaque primitive
répond à un besoin réellement présent dans ce code — `$pending` par champ contre la course
constatée, `sameAs` contre le `setTimeout` inutile, `$edited` contre `isFormUntouched`. TanStack
Form résout mieux le risque de gouvernance, mais au prix d'une réécriture de template sur 19
formulaires et d'un style qui jure avec le reste du projet.

**Le risque à assumer si l'on part sur Regle** : un projet à un seul mainteneur principal. Il
est atténué par le fait que Regle est _headless_ — la sortie de secours consiste à revenir aux
`:rules` de Vuetify, champ par champ, sans toucher aux templates ni aux modèles.

**Condition d'abandon de tout le lot** : ce projet n'a **aucun test automatisé**
([../quality/watched-risks.md](../quality/watched-risks.md), W1). Migrer la validation de 19
formulaires sans filet est le risque dominant de l'opération, devant le choix de la librairie
lui-même. Si les deux étapes ci-dessus ne sont pas menées écran par écran avec une QA manuelle à
chaque étape, mieux vaut s'en tenir à l'option 0.

## Sources

- [Regle — documentation](https://reglejs.dev/introduction/), [comparaison avec les autres librairies](https://reglejs.dev/introduction/comparisons/) (à lire en gardant en tête qu'elle est écrite par l'auteur de Regle), [validation asynchrone](https://reglejs.dev/common-usage/async-validation), [erreurs externes](https://reglejs.dev/common-usage/external-errors), [propriétés de validation](https://reglejs.dev/core-concepts/validation-properties)
- [TanStack Form — adaptateur Vue](https://tanstack.com/form/latest/docs/framework/vue), [guide de validation](https://tanstack.com/form/latest/docs/framework/vue/guides/validation), [dépôt](https://github.com/TanStack/form)
- [vee-validate — dépôt](https://github.com/logaretm/vee-validate), [fiche Snyk (statut de maintenance)](https://security.snyk.io/package/npm/vee-validate)
- [Vuelidate — dépôt](https://github.com/vuelidate/vuelidate)
- [Comparatif Telerik « Top Validation Libraries for Vue » (2024)](https://www.telerik.com/blogs/top-validation-libraries-vue-project) — exemple de comparatif désormais daté : il recommande Vue Formulate et VueFormGenerator, tous deux morts
- Chiffres d'activité : registre npm (`npm view <pkg> time`) et API GitHub, relevés le 2026-08-15
- Sources internes : `node_modules/vuetify/lib/composables/validation.js`, `.../composables/form.js`, `.../labs/rules/rules.js` (Vuetify 4.1.6)
