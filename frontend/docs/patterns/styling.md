# Styles et couleurs

**Problème** — Vuetify 4 impose les **CSS cascade layers**. La règle de priorité n'est plus
l'ordre ni la spécificité : un style **hors layer bat tout style dans un layer**. Écrire un
override au mauvais endroit produit soit un style sans effet, soit un style impossible à
surcharger.

## Où écrire un style

| Portée                                | Emplacement                                            | Notes                             |
| ------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| Un seul composant                     | `<style scoped lang="scss">` du SFC                    | Le cas par défaut                 |
| Interne d'un composant Vuetify enfant | `:deep(.v-xxx)` dans le SFC                            | ⚠️ voir le piège ci-dessous       |
| Utilitaire réutilisable               | `src/styles/global.scss`                               | `gap-*`, `cursor-*`, `text-link`… |
| Variable Sass Vuetify                 | `src/styles/settings.scss`                             | Compilé **dans** Vuetify          |
| Couleur métier                        | `theme.themes.dark.colors` de `src/plugins/vuetify.ts` | Voir tokens ci-dessous            |

## Piège 1 — `:deep()` ne cible pas la racine du composant

`:deep(.v-card)` se compile en `[data-v-hash] .v-card` : un **combinateur descendant**. Si
`.v-card` est l'élément **racine** du composant (celui qui porte l'attribut de scope), la règle
ne matche jamais — un élément ne peut pas être son propre descendant.

```scss
/* ❌ sans effet si la v-card est la racine du SFC */
:deep(.v-card.caret) {
  overflow: visible;
}

/* ✅ sélecteur scoped normal → .v-card.caret[data-v-hash] */
.v-card.caret {
  overflow: visible;
}
```

`:deep()` est **réservé aux internes d'un composant enfant** (`:deep(.v-timeline-item__body)`,
`:deep(.v-card__overlay)`).

## Piège 2 — surcharger un défaut Vuetify : utiliser le bon layer

Pour qu'un style **perde** volontairement face aux classes utilitaires Vuetify (`mb-3`, `pa-4`…),
il doit être **dans** un layer. Exemple réel, le reset des marges de titres dans
`src/styles/global.scss` :

```scss
@layer vuetify-core.reset {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
  }
  p {
    margin: 0 0 16px;
  }
}
```

Sans le `@layer`, cette règle gagnait sur `mb-3` et rendait toutes les classes de marge
inopérantes sur les titres.

À l'inverse, un override qui doit **gagner** contre Vuetify se place hors layer (c'est le cas des
31 `!important` de `global.scss`, qui fonctionnent précisément pour cette raison).

Ordre des layers Vuetify 4 : `vuetify-core` → `vuetify-components` → `vuetify-overrides` →
`vuetify-utilities` → `vuetify-final`.

Entre les deux, `vuetify-overrides` est le layer prévu pour surcharger un composant Vuetify tout
en restant surchargeable par les utilitaires. C'est ce qu'utilise le pointillé des champs
désactivés (ci-dessous) — préférer ce layer au hors-layer + `!important` quand c'est possible.

## Champs désactivés : le soulignement pointillé est réécrit

`src/styles/global.scss` redessine le soulignement des champs `disabled` (variantes `underlined`
et `filled`). Deux raisons cumulées, vérifiées dans le DOM :

1. **Contraste.** Vuetify 4 empile trois opacités là où Vuetify 2 n'en appliquait qu'une :
   `.v-field--disabled { opacity }` (nouveau en v3/v4, `0.5` en dark), `::before { opacity }`
   (`$field-outline-opacity`, `0.38`) et la couleur du dégradé (`on-surface` ×
   `--v-disabled-opacity`). Soit ≈ `0.09` d'alpha effectif contre `0.38` en Vuetify 2 : sur le
   fond `#121212` les points se confondent avec le fond.
2. **Firefox.** La règle d'origine
   (`node_modules/vuetify/lib/components/VField/VField.sass`) passe par `border-image` avec un
   `repeating-linear-gradient` dont la couleur est un `color-mix()`. Ça s'affiche sur Chrome,
   pas sur Firefox. L'override n'utilise ni l'un ni l'autre : `background-image` +
   `background-size: 100% 1px`, rendu identique et sans dépendance à ces deux features.

⚠️ La règle Vuetify d'origine ne cible **que** `underlined` et `filled`. Un champ passé en
`outlined` ou `solo` n'a aucun pointillé à l'état désactivé — ni avant ni après cet override.
Les défauts du projet (`src/plugins/vuetify.ts`) mettent tous les champs en `underlined`.

## Couleurs : deux systèmes coexistent

1. **Tokens de thème** — noms métier déclarés dans `vuetify.ts`, utilisables en prop
   (`color="event"`) ou en CSS via `rgb(var(--v-theme-event))`. Liste et statut :
   [../architecture/ui-layer.md](../architecture/ui-layer.md#thème-et-tokens).
2. **Palette Material générique** — `green-darken-2`, `grey-lighten-1`… classes codées en dur
   dans Vuetify, **sans** variable CSS associée.

⚠️ **La nuance fait partie du nom** : `color="grey-darken-3"`, jamais `color="grey darken-3"`.
`computeColor()` produit `` `bg-${couleur}` `` sans interpréter l'espace → `class="bg-grey darken-3"`,
soit deux classes dont une inexistante : **la couleur de base s'affiche, la nuance est perdue, sans
erreur**. Et une nuance ne s'applique qu'à la palette Material : les **tokens de thème n'en ont
aucune** (pas d'option `variations` dans `vuetify.ts`).

⚠️ **Ne pas construire un nom de variable CSS à partir d'une couleur dynamique** : ça ne marche
que pour les tokens de thème, et casse silencieusement pour la palette générique.

```ts
// ❌ il n'existe aucun --v-theme-green-darken-2
const caretColor = computed(() => `rgb(var(--v-theme-${cardColor.value}))`)
```

Préférer `background-color: inherit` sur le pseudo-élément, ou une classe conditionnelle.

**Syntaxe Vuetify 2 (`'grey--text text--lighten-1'`, `'green darken-2'`) : entièrement éliminée**
du code. La forme moderne est `text-grey-lighten-1` en classe, `grey-lighten-1` en prop `color`.
Ne pas réintroduire les formes en `--text` / `text--` : elles n'appliquent **rien**.

## Typographie

Vuetify 4 a renommé toutes les classes typographiques (MD2 → MD3). Les anciennes
(`text-h1`…`text-h6`, `text-subtitle-*`, `text-body-1|2`, `text-caption`, `text-overline`)
**n'existent plus** et n'appliquent rien.

| Ancien                            | Nouveau                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| `text-h2` / `text-h3`             | `text-display-large` / `text-display-medium`                       |
| `text-h4` / `text-h5` / `text-h6` | `text-headline-large` / `text-headline-small` / `text-title-large` |
| `text-subtitle-1` / `text-body-1` | `text-body-large`                                                  |
| `text-subtitle-2`                 | `text-title-small`                                                 |
| `text-body-2`                     | `text-body-medium`                                                 |
| `text-caption`                    | `text-body-small`                                                  |
| `text-overline`                   | `text-label-medium` + `text-uppercase`                             |

Les variantes responsive suivent la même convention (`text-sm-headline-large`). Pour les titres,
préférer les composants `MainTitle` / `SecondaryTitle` / `TertiaryTitle`.

## Écarts assumés / code mort

Bloc de `global.scss` qui cible encore des classes **disparues en Vuetify 4** (vérifié dans
`node_modules/vuetify/lib/`) — sans effet aujourd'hui : `.v-chip / .v-tab { &:hover::before }`,
la neutralisation du survol mobile (Vuetify utilise désormais `.v-chip__overlay` et
`.v-btn__overlay`). Détail et impact :
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).

**Méthode pour vérifier un sélecteur interne avant de l'écrire** :

```bash
grep -rl "v-nom-de-classe" node_modules/vuetify/lib/ | head -1   # vide = classe inexistante
```

## Voir aussi

- [../architecture/ui-layer.md](../architecture/ui-layer.md) — tokens, défauts globaux,
  organisation des fichiers de style
- [responsive.md](responsive.md) — breakpoints en SCSS
- [../workflows/vuetify-4-migration.md](../workflows/vuetify-4-migration.md) — l'état de la
  migration Vuetify 4
