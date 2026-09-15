# 0006 — Le tag git est la source du numéro de version

- **Statut** : accepté
- **Date** : 2026-09

## Contexte

Le numéro de version vivait dans quatre fichiers — `frontend/package.json`, `td.sh`,
`frontend/index.html`, et le `conf.env` du serveur — à synchroniser à la main à chaque release.
Rien ne le vérifiait : les gabarits `.conf/*/conf.tpl.env` sont restés à `0.4.1` pendant que le
reste du dépôt passait à `0.7.0`.

Le passage au déploiement continu a tranché : les images sont construites par GitHub Actions, où
aucun `conf.env` n'existe. Le fichier d'environnement ne pouvait donc plus alimenter un build, et
`package.json` n'aurait été qu'une copie de plus à tenir à jour.

## Décision

**Le tag git est la seule autorité sur le numéro de version.** Il est décidé par le titre de la PR
de release (`Release vX.Y.Z - Titre`), puis gravé dans l'image au build sous forme de balise
`<meta property="VERSION">` et de label OCI `org.opencontainers.image.version`.

Les fichiers du dépôt cessent de porter une version :

| Fichier                          | Valeur                           | Raison                                         |
| -------------------------------- | -------------------------------- | ---------------------------------------------- |
| `frontend/package.json`          | `0.0.0`                          | paquet `private`, jamais publié                |
| `frontend/index.html`            | `dev`                            | repli, écrasé dans tous les chemins Docker     |
| `td.sh`                          | `git describe --tags --abbrev=0` | le bandeau suit le dépôt                       |
| `.conf/development/conf.tpl.env` | ligne retirée                    | `td.sh` exporte la variable                    |
| `.conf/production/conf.tpl.env`  | `VERSION=`                       | épingle le tag d'image, écrit par `autoupdate` |

`VERSION` en production n'est pas une copie de la version : c'est la réponse à une autre question —
« quelle version tourne sur cette machine » — et elle sert à épingler le tag d'image tiré de GHCR.

## Alternatives écartées

- **`package.json` comme source unique**, avec un hook Vite et une fonction `syncVersion` dans
  `td.sh` — écarté : synchronise quatre fichiers au lieu d'en supprimer trois, et la CI n'a aucune
  raison de lire un `package.json` pour savoir ce qu'elle construit.
- **Le fichier d'environnement comme source** — impossible depuis que le build a quitté le
  serveur : `conf.env` est ignoré par git et n'existe pas dans le runner.
- **Injecter `VERSION` au démarrage du conteneur**, comme `API_URL` — écarté : la version décrit
  l'artefact, pas l'environnement. Gravée au build, elle ne peut pas mentir, y compris lors d'un
  retour arrière fait à la main.

## Conséquences

- ✅ Aucun geste manuel de synchronisation ; la classe de bug du `0.4.1` oublié disparaît.
- ✅ `docker ps` affiche la version en production, le tag d'image étant épinglé.
- ⚠️ `git show v0.6.0:frontend/package.json` ne renseigne plus sur la version : l'historique vit
  dans les tags et les releases GitHub.
- ⚠️ Un nouveau venu lira `"version": "0.0.0"` et `content="dev"` comme des oublis. C'est la
  raison d'être de cet ADR.
- ⚠️ Le bandeau de `td.sh` sur le serveur reflète le tag du dépôt cloné, pas celui de l'image qui
  tourne. Les deux coïncident tant qu'`autoupdate` fait son `git pull` ; le bandeau reste
  décoratif, l'autorité est la balise `<meta>`.

## Preuve

`td.sh:2-11`, `frontend/package.json:3`, `frontend/index.html:7`,
`.github/workflows/release.yml`, `.github/workflows/build-images.yml`,
`.conf/production/conf.tpl.env`.

## Voir aussi

- [0001-config-via-meta-tags.md](0001-config-via-meta-tags.md) — le mécanisme des balises `<meta>`,
  inchangé ; sa conséquence « `VERSION` est dupliqué à la main » est levée par le présent ADR
- [../workflows/development.md](../workflows/development.md)
