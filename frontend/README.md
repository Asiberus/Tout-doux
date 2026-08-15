# Tout-Doux — frontend

Client web de Tout-Doux, application d'organisation personnelle (projets, collections,
planification journalière). SPA **Vue 3 + Vuetify 4 + Pinia + Vue Router**, en TypeScript,
buildée par Vite.

Ce dossier fait partie d'un monorepo (`../backend` en Django, `../docker-compose.yml`) mais se
développe de façon autonome depuis ici.

## Démarrer

```sh
yarn          # installer (Node 22 / Yarn 1 épinglés via Volta)
yarn dev      # serveur de dev sur http://localhost:3000
```

Un backend doit être accessible — par défaut `http://localhost:8000/`, configuré dans une balise
`<meta>` de `index.html` et **non** dans un `.env`.

| Commande          | Effet                                                           |
| ----------------- | --------------------------------------------------------------- |
| `yarn dev`        | Serveur de développement (port 3000)                            |
| `yarn build`      | Build de production dans `dist/` — **ne vérifie pas les types** |
| `yarn type-check` | `vue-tsc --noEmit`                                              |
| `yarn lint`       | `eslint --fix`                                                  |
| `yarn format`     | `prettier --write`                                              |

Détail, configuration Docker et pièges :
[docs/workflows/development.md](docs/workflows/development.md).

## Documentation

Toute la documentation de référence est dans **[`docs/`](docs/)** :

| Pour…                                         | Aller à                                                          |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Comprendre l'organisation du code             | [docs/architecture/overview.md](docs/architecture/overview.md)   |
| Comprendre le vocabulaire métier              | [docs/domain/glossary.md](docs/domain/glossary.md)               |
| Ajouter un endpoint, un dialog, un formulaire | [docs/patterns/](docs/patterns/)                                 |
| Savoir ce qui est vérifié avant un commit     | [docs/workflows/verification.md](docs/workflows/verification.md) |
| Savoir ce qui est cassé ou risqué             | [docs/quality/](docs/quality/)                                   |
| Comprendre pourquoi un choix a été fait       | [docs/adr/](docs/adr/)                                           |

Le contrat de maintenance de cette doc (quand créer ou mettre à jour quoi) est dans
[docs/README.md](docs/README.md).

## État du projet

Une migration Vue 2 → Vue 3 → Vuetify 4 est **en cours** sur la branche `migrate-to-vue3` :
[docs/workflows/vuetify-4-migration.md](docs/workflows/vuetify-4-migration.md).

Il n'y a **aucun test automatisé** et **aucun contrôle qualité en CI** ; le seul garde-fou est le
hook `pre-commit` (eslint + prettier + commitlint). Ces choix sont assumés et documentés avec leur
condition de réexamen dans [docs/quality/watched-risks.md](docs/quality/watched-risks.md).
