# 0007 — La configuration d'environnement est injectée au démarrage du conteneur

- **Statut** : accepté
- **Date** : 2026-09

## Contexte

L'[ADR 0001](0001-config-via-meta-tags.md) a retenu les balises `<meta>` comme mécanisme de
configuration, en visant « un artefact, plusieurs environnements ». Ce bénéfice n'était pas
atteint : en production le `sed` s'exécutait **avant** `yarn build`, donc `API_URL` était figée à
la construction de l'image. Une image portait son domaine.

Le passage au déploiement continu rend ce défaut coûteux. Les images sont construites par GitHub
Actions et tirées depuis GHCR : revenir à une image ancienne ressusciterait le domaine de
l'époque, et la CI devrait connaître le domaine de production pour pouvoir construire.

## Décision

Séparer les deux valeurs selon ce qu'elles décrivent, et nommer les scripts d'après le moment où
ils s'exécutent.

| Valeur    | Décrit                                    | Script                 | Moment                    |
| --------- | ----------------------------------------- | ---------------------- | ------------------------- |
| `VERSION` | l'artefact — une image _est_ la version X | `set-meta-at-build.sh` | avant `yarn build`        |
| `API_URL` | l'environnement où l'image tourne         | `set-meta-at-run.sh`   | au démarrage du conteneur |

`set-meta-at-run.sh` est déposé dans `/docker-entrypoint.d/40-set-meta-at-run.sh`. L'image nginx
officielle exécute ce répertoire avant de lancer nginx — mécanisme dont le projet dépendait déjà
pour appliquer `envsubst` à `default.conf.tpl` via `NGINX_ENVSUBST_TEMPLATE_SUFFIX`. Aucun
entrypoint personnalisé n'est nécessaire.

Les deux scripts échouent explicitement (`: "${VAR:?…}"`) si leur variable est absente, au lieu
d'écrire une balise vide.

## Alternatives écartées

- **Garder l'injection au build pour les deux valeurs** — c'est le défaut que cet ADR corrige.
- **Un seul script paramétré** — écarté après essai : le nom du script ne disait plus à quel
  moment il s'exécutait, ce qui est justement l'information non évidente ici.
- **Injecter aussi `VERSION` au démarrage** — écarté : la version décrit l'artefact, et gravée
  elle ne peut pas mentir. Voir [0006](0006-version-from-git-tag.md).

## Conséquences

- ✅ Un retour arrière est sûr : n'importe quelle image ancienne prend la configuration courante.
- ✅ La CI n'a jamais besoin de connaître le domaine de production.
- ✅ La même image servirait un environnement de recette sans reconstruction.
- ✅ Vérifié sur `nginx:1.24-alpine` : l'entrypoint utilise `set -e` et un script en échec
  **interrompt réellement le démarrage** (code de sortie 2, nginx jamais lancé). Un `API_URL`
  absent donne donc un échec franc, pas une balise vide.
- ⚠️ Le préfixe `40-` place le script après les trois scripts officiels (`10-`, `20-`, `30-`).
  Descendre sous `20-` le ferait tourner avant `envsubst` : sans effet ici, mais sans raison.
- ⚠️ Le développement conserve `setup-config.sh`, qui injecte les deux valeurs au build : il
  construit localement, l'artefact n'est jamais déplacé d'un environnement à un autre.

## Preuve

`.conf/production/frontend/set-meta-at-build.sh`, `.conf/production/frontend/set-meta-at-run.sh`,
`.conf/production/frontend/Dockerfile`, `docker-compose.prod.yml` (`API_URL` en `environment`).

## Voir aussi

- [0001-config-via-meta-tags.md](0001-config-via-meta-tags.md) — le mécanisme des balises `<meta>`
- [0006-version-from-git-tag.md](0006-version-from-git-tag.md) — d'où vient `VERSION`
