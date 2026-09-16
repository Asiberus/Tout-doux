# Développement

**Quand** — installer le projet, le lancer, comprendre d'où vient sa configuration.

## Prérequis

- **Node 22.23.1** et **Yarn 1.22.19**, épinglés via Volta (`package.json:77`). Avec Volta
  installé, les bonnes versions sont sélectionnées automatiquement.
- **Yarn, jamais npm** (présence de `yarn.lock`, aucun `package-lock.json`).
- Un backend Django accessible — par défaut `http://localhost:8000/`.

## Commandes

| Commande            | Effet                                    | Remarque                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `yarn`              | Installe les dépendances                 |                                                         |
| `yarn dev`          | Serveur Vite, port **3000**, host exposé |                                                         |
| `yarn build`        | Build de production dans `dist/`         | **ne vérifie aucun type**                               |
| `yarn type-check`   | `vue-tsc --noEmit`                       | ne bloque rien, voir [verification.md](verification.md) |
| `yarn lint`         | `eslint --fix`                           |                                                         |
| `yarn format`       | `prettier --write`                       |                                                         |
| `yarn test`         | Vitest en mode veille                    |                                                         |
| `yarn test:ci`      | `vitest run --coverage`                  | ce que lance la CI                                      |
| `yarn lint:check`   | `eslint` sans `--fix`                    | constate au lieu de corriger ; utilisé par la CI        |
| `yarn format:check` | `prettier --check`                       | idem                                                    |
| `yarn serve`        | Prévisualise le build                    | ⚠️ pas le serveur de dev                                |

Docker (depuis `frontend/`, utilise les fichiers du monorepo parent) :
`yarn docker:build`, `yarn docker:up`, `yarn docker:prod:build`, `yarn docker:prod:up`.

## Configuration runtime — pas de `.env`

La config **n'est pas** injectée par `import.meta.env`. Elle est lue depuis des balises `<meta>`
de `index.html` :

```html
<meta property="VERSION" content="dev" />
<meta property="API_URL" content="http://localhost:8000/" />
```

`src/config/config.loader.ts` les lit au chargement du module, `src/config/index.ts` les expose.
**Deux valeurs seulement.** Pour changer l'URL de l'API en local, éditer `index.html`.

En dev, `.conf/development/frontend/setup-config.sh` réécrit les deux balises par `sed` au
build, depuis les variables fournies par `docker-compose.yml` ; `VERSION` n'est saisie nulle part,
`td.sh` la dérive du dernier tag git et l'exporte. En production les deux valeurs sont séparées :
`set-meta-at-build.sh` grave `VERSION` dans l'image, `set-meta-at-run.sh` injecte `API_URL` au
démarrage du conteneur. Le pourquoi :
[../adr/0001-config-via-meta-tags.md](../adr/0001-config-via-meta-tags.md),
[../adr/0006-version-from-git-tag.md](../adr/0006-version-from-git-tag.md) et
[../adr/0007-runtime-config-at-container-start.md](../adr/0007-runtime-config-at-container-start.md).

## Pièges

- **Une valeur de config manquante est silencieuse** : `getConfigValue` renvoie `undefined`, sans
  erreur ni avertissement. Un `API_URL` absent donne `baseURL: undefined`, donc des requêtes
  relatives à l'origine de l'app → des 404 en HTML au lieu d'une erreur de configuration claire.
- **Ne pas « corriger » `package.json:3` ni `index.html:7`** : `0.0.0` et `dev` sont des valeurs
  neutres, délibérées. La version réelle vient du tag git — voir
  [../adr/0006-version-from-git-tag.md](../adr/0006-version-from-git-tag.md).
- **`yarn build` ne typecheck pas** (`vite build` transpile via esbuild). Lancer
  `yarn type-check` séparément.
- **Les tests vivent à côté de leur source** (`src/**/*.spec.ts`), pas dans un dossier dédié.
  Les helpers partagés sont dans `src/test/` (`setup.ts` épingle `TZ=UTC`, `fixtures.ts`).
- **Le cache de pré-bundling Vite peut devenir périmé** après une montée de version d'une
  dépendance : le code servi ne correspond alors plus à `node_modules`, avec des symptômes
  incompréhensibles (une prop de slot qui reste `undefined`, par exemple). Remède :
  `rm -rf node_modules/.vite` puis relancer `yarn dev`.
- **MDI et Roboto viennent de CDN** (`index.html:12-17`) : sans réseau, icônes et police
  manquent.

## Conventions de commit

Commitlint en configuration conventionnelle (`commitlint.config.js`), vérifié par un hook
`commit-msg`. Portée usuelle du projet : `feat(front):`, `fix(front):`, `chore(front):`.

## Voir aussi

- [verification.md](verification.md) — ce qui est réellement contrôlé avant un commit
- [vuetify-4-migration.md](vuetify-4-migration.md) — la migration en cours
- [../architecture/overview.md](../architecture/overview.md) — où poser du nouveau code
