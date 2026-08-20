# Vérifier un changement

**Quand** — avant chaque commit, et avant de considérer un travail comme terminé.

## Ce qui est réellement contrôlé

| Contrôle                                         | Où                                                          | Bloquant ?                                                              |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `eslint` (sans `--fix`) sur les fichiers indexés | hook `pre-commit` → `lint-staged`                           | ✅ **oui**                                                              |
| `prettier --write`                               | hook `pre-commit` → `pretty-quick --staged` + `lint-staged` | ✅ oui (reformate)                                                      |
| Message de commit conventionnel                  | hook `commit-msg` → `commitlint`                            | ✅ oui                                                                  |
| `vue-tsc` (`yarn type-check`)                    | —                                                           | ❌ **non** — nulle part                                                 |
| Tests                                            | —                                                           | ❌ **aucun test n'existe**                                              |
| CI                                               | `.github/workflows/deployment.yml`                          | ❌ déploiement **manuel** (`workflow_dispatch`), aucun contrôle qualité |

**Le hook pre-commit est le seul garde-fou automatique du projet.** Il est fonctionnel (testé),
même si `.husky/pre-commit` utilise encore la syntaxe dépréciée de husky v8
(`. "$(dirname "$0")/_/husky.sh"`).

**Rien ne vérifie les frontières entre couches** : `eslint.config.mjs` ne contient aucune règle
`no-restricted-imports` ni plugin `import`/`boundaries`. Les règles de
[../architecture/overview.md](../architecture/overview.md) sont de la discipline pure.

## Procédure

1. `yarn type-check`
   **État actuel : 28 erreurs préexistantes.** Ce n'est pas 0, donc le critère utile est
   _« mon changement n'en ajoute pas »_. Comparer avant/après :

   ```sh
   yarn type-check 2>&1 | grep -c "error TS"
   ```

   Les erreurs connues sont recensées dans
   [vuetify-4-migration.md](vuetify-4-migration.md) (§3.8–§3.10) et
   [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).

2. `yarn lint` — attention, ce script applique `--fix`. Le hook, lui, lance `eslint` **sans**
   `--fix` : un problème non auto-corrigeable bloque le commit.

3. **Test manuel de l'écran touché.** C'est le seul filet contre les régressions : il n'y a ni
   test unitaire, ni e2e, ni test de régression visuelle.

4. **Mettre à jour la doc** si le changement correspond à un déclencheur de
   [../README.md](../README.md) — dans le **même** commit.

## Pièges

- **`yarn build` ne typecheck pas** : un build vert ne dit rien sur les types.
- **Un `!important` peut ne plus l'emporter** et un sélecteur peut ne plus rien cibler depuis le
  passage à Vuetify 4 — sans erreur d'aucune sorte. Vérifier visuellement tout changement de
  style, voir [../patterns/styling.md](../patterns/styling.md).
- **Le plugin `eslint-plugin-vuetify` est vendored** dans `frontend/eslint-plugin-vuetify/`
  (fork local en attente du support ESLint 9, cf. le TODO en tête de `eslint.config.mjs`) alors
  qu'une version npm est **aussi** installée. C'est le fork local qui est chargé.
- **La QA responsive n'a pas été refaite** après la réduction des breakpoints en Vuetify 4 —
  voir [../patterns/responsive.md](../patterns/responsive.md).

## Voir aussi

- [development.md](development.md) · [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md)
