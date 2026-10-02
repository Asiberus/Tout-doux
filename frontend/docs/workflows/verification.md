# Vérifier un changement

**Quand** — avant chaque commit, et avant de considérer un travail comme terminé.

## Ce qui est réellement contrôlé

| Contrôle                                         | Où                                                          | Bloquant ?                                                        |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `eslint` (sans `--fix`) sur les fichiers indexés | hook `pre-commit` → `lint-staged`                           | ✅ **oui**                                                        |
| `prettier --write`                               | hook `pre-commit` → `pretty-quick --staged` + `lint-staged` | ✅ oui (reformate)                                                |
| Message de commit conventionnel                  | hook `commit-msg` → `commitlint`                            | ✅ oui                                                            |
| `yarn lint:check` + `yarn format:check`          | CI, job `Frontend`, à chaque PR                             | ✅ oui — rattrape un `commit --no-verify`                         |
| `yarn test:ci` (105 tests Vitest)                | CI, job `Frontend` + `yarn test` en local                   | ✅ oui                                                            |
| `vue-tsc` (`yarn type-check`)                    | —                                                           | ❌ **non** — 2 erreurs préexistantes (`api/api.spec.ts`), hors CI |

Le hook `pre-commit` reste le garde-fou **local** ; la CI est le garde-fou **partagé**. Le hook
est fonctionnel (testé), même si `.husky/pre-commit` utilise encore la syntaxe dépréciée de
husky v8 (`. "$(dirname "$0")/_/husky.sh"`).

⚠️ **La CI ne bloque un merge que si la protection de branche l'exige** (Settings → Branches sur
GitHub, pas dans ce dépôt). Sans elle, une PR rouge reste mergeable — et depuis que
`release.yml` publie `latest` au merge, une release rouge se déploie seule dans les dix minutes.

**Rien ne vérifie les frontières entre couches** : `eslint.config.mjs` ne contient aucune règle
`no-restricted-imports` ni plugin `import`/`boundaries`. Les règles de
[../architecture/overview.md](../architecture/overview.md) sont de la discipline pure.

## Procédure

1. `yarn type-check`
   **État actuel : 2 erreurs préexistantes** (`api/api.spec.ts`). Ce n'est pas 0, donc le
   critère utile est _« mon changement n'en ajoute pas »_. Comparer avant/après :

   ```sh
   yarn type-check 2>&1 | grep -c "error TS"
   ```

   Les erreurs connues sont recensées dans
   [vuetify-4-migration.md](vuetify-4-migration.md) (§3.8–§3.10) et
   [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md).

2. `yarn lint` — attention, ce script applique `--fix`. Le hook, lui, lance `eslint` **sans**
   `--fix` : un problème non auto-corrigeable bloque le commit.

3. `yarn test` — couvre `utils/`, `pipes/`, `api/`, `axios/`, l'ordre dans les stores `project` et
   `collection`, `useDailyTaskMove`, et le contrat avec `@dnd-kit` (`dnd-kit.spec.ts`). **Les
   composants, le reste des stores et des composables, et les guards ne sont pas couverts** : voir
   [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R13.

4. **Test manuel de l'écran touché.** Toujours nécessaire pour tout ce que la suite ne couvre
   pas — il n'y a ni e2e, ni test de régression visuelle.

5. **Mettre à jour la doc** si le changement correspond à un déclencheur de
   [../README.md](../README.md) — dans le **même** commit.

## Listes réordonnables

**Quand** — tout changement dans `src/components/sortable/`, dans une carte qui porte une
poignée, ou une montée de version de `@dnd-kit/*`. jsdom n'a pas de mise en page : aucun test ne
voit un glisser.

Sur les quatre listes (tâches générales d'un projet, section, collection, « Tasks of the day » du
wizard) :

1. **Souris** : la poignée apparaît au survol de la carte ; prise immédiate par elle, appui de
   150 ms sur le corps ; glisser tout de suite sur le nom le sélectionne ; case à cocher, menu et chips ne soulèvent rien. Les
   voisines s'écartent sans à-coup.
2. **Hors de la liste** (au-delà de 50 px, y compris par le côté) : la liste se referme et la
   carte se réduit à plat ; lâcher remet la carte à sa place, et aucune requête `move` ne part.
   La poignée s'efface si le pointeur n'est plus sur la carte.
3. **Clavier** : Tab jusqu'à la poignée, Espace, flèches, Espace ; Échap annule. Les annonces
   s'écrivent dans les régions `aria-live` de la page.
4. **Liste périmée** : la même liste dans deux onglets ; supprimer une tâche dans le second, puis
   déplacer une carte à côté d'elle dans le premier. Attendu : « This list changed elsewhere and
   has been reloaded » et la liste rechargée.
5. **Pas de poignée** : projet ou collection archivé, vue « Completed », liste d'une tâche, jour
   passé du wizard.
6. **Move to top** : la carte remonte par-dessus les autres, qui glissent vers leur nouvelle place,
   y compris en diagonale dans la grille d'un projet.

Puis sur un **vrai téléphone**, iOS et Android : le repère de la poignée est visible dans la
marge ; la page défile quand le doigt ou le stylet bouge avant 250 ms ; ni menu contextuel ni
sélection de texte à l'appui long ; vibration à la prise (Android) ; la navbar ne s'ouvre pas
pendant un glisser latéral ; dans le wizard, feuille déployée, tirer une carte vers le bas ne
déplace pas la feuille ; fluidité.

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
