# Développer sur le backend

**Quand** — installer le projet, le lancer, jouer une migration, lire un e-mail envoyé en local.

Tout passe par Docker. **Il n'existe pas de mode « Python en local »** : ni virtualenv, ni
`.python-version`, ni instructions pour en créer un. `requirements.txt` n'épingle que 8
dépendances directes, sans lockfile.

## Prérequis

`docker` et `docker compose`. Rien d'autre — Python 3.9 vit dans l'image
(`.conf/development/backend/Dockerfile`).

## Étapes

```bash
./td.sh install dev     # crée .conf/development/conf.env (interactif, gitignored)
./td.sh build dev
./td.sh start dev
docker exec -it tout_doux_backend python manage.py createsuperuser   # 1er démarrage
```

`td.sh` est à la racine du monorepo ; ses autres verbes : `edit`, `update` (quit + build +
start), `quit`, `reset [-i|--images] [-v|--volumes]`, `help`.

Quatre conteneurs :

| Conteneur            | Port hôte | Rôle                                              |
| -------------------- | --------- | ------------------------------------------------- |
| `tout_doux_backend`  | 8000      | Django `runserver`, code monté depuis `./backend` |
| `tout_doux_frontend` | 8080      | Vite                                              |
| `tout_doux_db`       | 5432      | PostgreSQL 16-alpine, volume `td_db`              |
| `tout_doux_adminer`  | 8081      | Adminer, pour inspecter la base                   |

Le conteneur backend exécute au démarrage : `wait_for_db` → `migrate` → `runserver`. **Les
migrations sont donc jouées automatiquement à chaque démarrage.**

Le code est monté en volume (`./backend:/backend`) : l'autoreload de `runserver` suffit, pas
besoin de rebuild pour modifier du Python. **Un rebuild est nécessaire** si `requirements.txt`
change.

## Configuration

`settings.py` ne lit **que** des variables d'environnement, sans fichier par environnement.
`docker-compose.yml` les transmet depuis `.conf/development/conf.env`, généré par `td.sh` et
**gitignored** — le modèle versionné est `.conf/development/conf.tpl.env`.

| Variable                          | Effet dans `settings.py`                                      | Valeur de dev              |
| --------------------------------- | ------------------------------------------------------------- | -------------------------- |
| `SECRET_KEY`                      | ligne 24 — **défaut `'secret'` si absente**                   | `secretKeyHasToBeChanged!` |
| `DEBUG`                           | ligne 27, `bool(int(...))` — donc `0`/`1`, pas `true`/`false` | `1`                        |
| `ALLOWED_HOSTS`                   | ligne 30, séparé par des **`;`**                              | `*`                        |
| `SERVER_URL`                      | ligne 32 — base des liens d'e-mail, **doit finir par `/`**    | `http://localhost:8080/`   |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | ligne 87                                                      |                            |
| `BACKEND_USE_EMAIL_FILE_SYSTEM`   | ligne 137 — `1` écrit sur disque au lieu d'envoyer            | `1`                        |
| `MAILJET_API_KEY` / `_SECRET`     | ligne 142, ignorées si la précédente vaut `1`                 |                            |

## Lire les e-mails envoyés en local

Avec `BACKEND_USE_EMAIL_FILE_SYSTEM=1`, chaque e-mail est écrit dans
`backend/tmp/email/<horodatage>.log` (dossier gitignored, déjà peuplé de fixtures d'anciennes
sessions). Le corps HTML est en clair dans le fichier ; le lien d'activation ou de
réinitialisation s'y récupère au copier-coller.

```bash
ls -t backend/tmp/email | head -1
```

## Migrations

```bash
docker exec -it tout_doux_backend python manage.py makemigrations
docker exec -it tout_doux_backend python manage.py migrate
docker exec -it tout_doux_backend python manage.py makemigrations --check --dry-run   # doit être vide
```

Les 4 migrations existantes sont des **squashs par release** (`0003_release_v0_3`,
`0004_release_v0_4`) : la convention est de regrouper, pas d'accumuler une migration par
changement. Une migration intermédiaire créée pendant le développement d'une release a vocation
à être fusionnée avant le merge.

## Commandes `manage.py` maison

| Commande      | Effet                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `wait_for_db` | boucle jusqu'à ce que PostgreSQL réponde — utilisée au démarrage des conteneurs                   |
| `backupdb`    | `dumpdata` complet (JSON, clés naturelles) **sur la sortie standard** — rediriger vers un fichier |

`django_extensions` est installé : `shell_plus`, `show_urls`, `graph_models` sont disponibles.
`show_urls` est le moyen le plus rapide de vérifier une route après un changement de routeur.

## Production — ce qu'il faut savoir en développant

Chaîne réelle : nginx (conteneur frontend) → socket **uwsgi** → Django, 4 workers,
`--enable-threads` (nécessaire aux e-mails asynchrones, voir
[../adr/0005-fire-and-forget-emails.md](../adr/0005-fire-and-forget-emails.md)).
`.conf/production/backend/run.sh` enchaîne `wait_for_db`, `collectstatic`, `migrate`, puis
uwsgi.

Deux différences qui changent le comportement du code :

- `DEBUG=0` : le fichier statique n'est plus servi par Django mais par nginx
  (`STATIC_ROOT=/vol/web/static`, volume partagé `td_static_files`, exposé par nginx en
  `/static`) ;
- `BACKEND_USE_EMAIL_FILE_SYSTEM=0` : Mailjet devient le transport, et un échec d'envoi devient
  silencieux.

Le déploiement (`.github/workflows/deployment.yml`) tourne sur un runner auto-hébergé et est en
**`workflow_dispatch` uniquement** : le déclenchement sur `push` est commenté. **Aucun test,
aucun lint n'est exécuté** par cette CI, qui ne fait que reconstruire et relancer les images.

## Pièges

- **`DEBUG=true` ne marche pas.** `bool(int(os.environ.get('DEBUG', 0)))` attend `0` ou `1` ;
  toute autre valeur lève un `ValueError` au démarrage.
- **`ALLOWED_HOSTS` est séparé par des points-virgules**, pas des virgules.
- **Un clone frais n'a pas de `conf.env`** (gitignored). Sans `./td.sh install dev`, les
  conteneurs démarrent avec des variables vides et `SECRET_KEY` retombe sur `'secret'`.
- **`backupdb` écrit sur stdout** : `docker exec tout_doux_backend python manage.py backupdb >
backup.json`, sinon le dump défile dans le terminal.
- **Le conteneur est en UTC** alors que `TIME_ZONE = 'Europe/Paris'`. Les endpoints qui
  s'appuient sur `date.today()` (daily task) changent de jour à 00:00 UTC, soit 02:00 à Paris en
  été — [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R4.

## Voir aussi

- [verification.md](verification.md) — comment vérifier un changement (il n'y a pas de test)
- [../architecture/auth.md](../architecture/auth.md) — les e-mails et leurs liens
