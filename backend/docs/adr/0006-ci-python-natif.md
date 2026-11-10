# 0006 — CI en Python natif plutôt que dans Docker

- **Statut** : accepté
- **Date** : 2026-09

## Contexte

Le backend n'a **aucun mode Python local** : [../workflows/development.md](../workflows/development.md)
et `td.sh` ne décrivent que Docker, et il n'existe ni venv ni instructions pour en créer un.
Mettre en place une CI oblige donc à choisir un chemin d'exécution pour `manage.py test`.

## Décision

`.github/workflows/ci.yml` installe Python 3.14 avec `actions/setup-python`, `libpq-dev` par
`apt`, puis `requirements-dev.txt`, contre un service Postgres 16 de GitHub. `settings.py` lit
toute sa configuration depuis l'environnement, donc aucun fichier `.conf` n'est nécessaire : le
workflow exporte les variables directement.

## Alternatives écartées

- **`docker compose` en CI** — un seul chemin d'exécution, fidèle à la production. Écarté : 3 à
  5 minutes de build par PR, et il faut fabriquer un `.conf/development/conf.env` avec des
  secrets factices dans le workflow.
- **Image Docker dédiée aux tests** — mêmes Python et libs que la production sans la stack
  complète. Écarté comme prématuré : le gain de fidélité ne se paie qu'à partir du moment où une
  divergence a réellement mordu.

## Conséquences

- La CI démarre en ~40 s et le cache pip garde la roue `uWSGI` compilée entre les runs.
- **Un second chemin d'exécution existe désormais** à côté de Docker. Une divergence de version
  entre `.conf/production/backend/Dockerfile` (`python:3.14-alpine`) et le `python-version` du
  workflow serait invisible : les deux sont à tenir alignés à la main.
- `uWSGI` est installé en CI sans y servir à rien. Le scinder de `requirements.txt` toucherait
  les deux Dockerfiles de production pour gagner une minute au premier run : pas fait.
- `requirements-dev.txt` n'est lu que par la CI ; les images de production continuent
  d'installer `requirements.txt` seul.

## Preuve

`.github/workflows/ci.yml`, `backend/requirements-dev.txt`, `backend/.coveragerc`.
`settings.py:24-101` pour la configuration entièrement pilotée par l'environnement.
