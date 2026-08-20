# Développement

**Quand** — installer le projet, le lancer, comprendre d'où vient sa configuration.

## Prérequis

- **Node 22.23.1** et **Yarn 1.22.19**, épinglés via Volta (`package.json:77`). Avec Volta
  installé, les bonnes versions sont sélectionnées automatiquement.
- **Yarn, jamais npm** (présence de `yarn.lock`, aucun `package-lock.json`).
- Un backend Django accessible — par défaut `http://localhost:8000/`.

## Commandes

| Commande          | Effet                                    | Remarque                                                |
| ----------------- | ---------------------------------------- | ------------------------------------------------------- |
| `yarn`            | Installe les dépendances                 |                                                         |
| `yarn dev`        | Serveur Vite, port **3000**, host exposé |                                                         |
| `yarn build`      | Build de production dans `dist/`         | **ne vérifie aucun type**                               |
| `yarn type-check` | `vue-tsc --noEmit`                       | ne bloque rien, voir [verification.md](verification.md) |
| `yarn lint`       | `eslint --fix`                           |                                                         |
| `yarn format`     | `prettier --write`                       |                                                         |
| `yarn serve`      | Prévisualise le build                    | ⚠️ pas le serveur de dev                                |

Docker (depuis `frontend/`, utilise les fichiers du monorepo parent) :
`yarn docker:build`, `yarn docker:up`, `yarn docker:prod:build`, `yarn docker:prod:up`.

## Configuration runtime — pas de `.env`

La config **n'est pas** injectée par `import.meta.env`. Elle est lue depuis des balises `<meta>`
de `index.html` :

```html
<meta property="VERSION" content="0.4.1" />
<meta property="API_URL" content="http://localhost:8000/" />
```

`src/config/config.loader.ts` les lit au chargement du module, `src/config/index.ts` les expose.
**Deux valeurs seulement.** Pour changer l'URL de l'API en local, éditer `index.html`.

En Docker, `.conf/{development,production}/frontend/setup-config.sh` réécrit ces balises par
`sed` à partir des variables d'environnement `VERSION` / `API_URL` fournies par
`docker-compose*.yml`. Le pourquoi :
[../adr/0001-config-via-meta-tags.md](../adr/0001-config-via-meta-tags.md).

## Pièges

- **Une valeur de config manquante est silencieuse** : `getConfigValue` renvoie `undefined`, sans
  erreur ni avertissement. Un `API_URL` absent donne `baseURL: undefined`, donc des requêtes
  relatives à l'origine de l'app → des 404 en HTML au lieu d'une erreur de configuration claire.
- **`VERSION` est dupliqué à la main** entre `package.json:3` et `index.html:7`. Aucun script ne
  les synchronise : penser aux deux lors d'un bump de version.
- **`yarn build` ne typecheck pas** (`vite build` transpile via esbuild). Lancer
  `yarn type-check` séparément.
- **Aucun test** n'est configuré (pas de script `test`), malgré ce que suggèrent
  `tsconfig.json:include` (qui référence un dossier `tests/` inexistant) et l'ancien README.
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
