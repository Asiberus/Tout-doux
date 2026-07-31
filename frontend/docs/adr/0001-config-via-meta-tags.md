# 0001 — Configuration runtime par balises `<meta>`

- **Statut** : accepté
- **Date** : 2022-03 (déduite des commits `1c89dc1` « build: configure docker for local and prod »
  et `05133e2` « refactor: set version in env file »)

## Contexte

Le front est livré en image Docker et servi par nginx en production. Deux valeurs doivent varier
selon l'environnement : `API_URL` et `VERSION`. À l'époque, le projet était bâti sur Vue CLI
(webpack) ; il a depuis migré vers Vite.

## Décision

La configuration est lue depuis des balises `<meta property>` de `index.html`, pas depuis les
variables d'environnement du bundler.

```html
<meta property="VERSION" content="0.4.1" />
<meta property="API_URL" content="http://localhost:8000/" />
```

`src/config/config.loader.ts` les lit par `document.querySelector`, `src/config/index.ts` expose
l'objet `config`. Les scripts `.conf/{development,production}/frontend/setup-config.sh` réécrivent
ces balises par `sed` à partir des variables d'environnement fournies par `docker-compose*.yml`.

## Alternatives écartées

- **`.env` + `import.meta.env` (ou `process.env` à l'époque)** — écarté parce que ces valeurs sont
  **inlinées à la compilation** : il aurait fallu un build par environnement. La substitution
  d'une balise HTML permet, en théorie, de reconfigurer un artefact déjà construit.
- **Endpoint `/config.json` chargé au démarrage** — aurait ajouté un aller-retour réseau bloquant
  avant le premier rendu.

*Rationale inféré* : aucun commit n'explicite le raisonnement, il est déduit du montage Docker
(`ARG` → `ENV` → `sed` sur `index.html`).

## Conséquences

- ✅ La configuration ne dépend pas du bundler : la migration Vue CLI → Vite n'a rien changé ici.
- ⚠️ **En production, la substitution a lieu au moment du `build` de l'image** (le `sed` précède
  `npm run build` dans `.conf/production/frontend/Dockerfile`), pas au démarrage du conteneur. Le
  bénéfice « un artefact, plusieurs environnements » n'est donc **pas** réellement obtenu.
- ⚠️ **Une valeur manquante est silencieuse** : `getConfigValue` renvoie `undefined`, sans
  avertissement. Un `API_URL` absent donne `baseURL: undefined` → toutes les requêtes deviennent
  relatives à l'origine de l'app.
- ⚠️ **`VERSION` est dupliqué à la main** entre `package.json` et `index.html`, sans synchronisation.
- ⚠️ Le sélecteur `meta[property=${key}]` est construit **sans quotes ni échappement** : une clé
  contenant un tiret, un point ou un chiffre initial ferait lever `querySelector`.
- La lecture a lieu à l'import du module, donc `document` doit exister : incompatible SSR (non
  pertinent aujourd'hui, l'app est une SPA pure).
- L'attribut utilisé est `property` (convention OpenGraph) plutôt que `name`.

## Preuve

`src/config/config.loader.ts`, `src/config/index.ts`, `index.html:7-8`,
`.conf/development/frontend/setup-config.sh`, `.conf/production/frontend/Dockerfile`,
`docker-compose.yml` (args `ARG_VERSION` / `ARG_API_URL`).

## Voir aussi

- [../workflows/development.md](../workflows/development.md) — comment changer la config en local
- [../architecture/api-layer.md](../architecture/api-layer.md) — où `API_URL` est consommé
