# CLAUDE.md

Guidage pour Claude Code sur le dossier `backend/`.

Ce fichier ne contient **que** ce qui doit être immédiatement disponible pour produire du code
correct. Tout le reste est dans **[`docs/`](docs/)** — et **la doc est la source de vérité**, pas
ce fichier.

## Contexte

`backend` est l'API de **Tout-Doux** (organisation personnelle : projets, collections,
planification journalière). **Django 6.1 + DRF 3.18 + Knox 5**, PostgreSQL, une seule application
`tout_doux` (12 modèles, 41 sérialiseurs, 17 tests de fumée, 44 tests de non-régression, 0 test
métier). Monorepo :
`../frontend` (SPA Vue 3, doc propre dans [`../frontend/docs/`](../frontend/docs/)),
`../docker-compose.yml`, `../td.sh`.

Une montée Django 3.2 → 6.1 / DRF 3.12 → 3.18 / Python 3.9 → 3.14 est **en cours** :
[docs/workflows/django-6-migration.md](docs/workflows/django-6-migration.md).

## Commandes

Tout passe par Docker — **il n'existe pas de mode Python local** (ni venv, ni instructions).

```bash
./td.sh install dev            # depuis la racine : génère .conf/development/conf.env
./td.sh build dev              # puis start / quit / update / reset
docker exec -it tout_doux_backend python manage.py createsuperuser
docker exec tout_doux_backend python manage.py check
docker exec tout_doux_backend python manage.py makemigrations --check --dry-run
docker exec tout_doux_backend python manage.py test tout_doux
docker exec tout_doux_backend python manage.py show_urls      # django_extensions
```

Les migrations sont jouées **automatiquement** au démarrage du conteneur. Le code est monté en
volume : pas de rebuild sauf si `requirements.txt` change.

**17 tests de fumée** couvrent la plomberie (`tout_doux/tests.py`), et **44 tests de
non-régression** gèlent le contrat d'API et le nombre de requêtes SQL pour le chantier N+1
(`test_api_contract.py`, `test_query_counts.py` — voir
[docs/workflows/n-plus-one-optimization.md](docs/workflows/n-plus-one-optimization.md)).
**Toujours aucun test métier, aucun linter, aucun formateur, aucune CI.** Le reste passe par la
procédure manuelle de [docs/workflows/verification.md](docs/workflows/verification.md).

## Règles à respecter en écrivant du code

**Trois gestes obligatoires pour toute écriture** (en oublier un ouvre une fuite entre comptes) :
`get_queryset()` restreint à `self.request.user.<related_name>` · `user =
HiddenField(default=CurrentUserDefault())` dans `Meta.fields` · un `validate_<champ>` par
relation entrante. Détail : [docs/patterns/ownership-and-scoping.md](docs/patterns/ownership-and-scoping.md).

**Imports** — `models/` s'importe entre eux **par module concret**, tout le reste passe par les
**barrels** `tout_doux.models`, `tout_doux.serializers.<x>`, `tout_doux.views`. ⚠️ **Ne pas
réordonner les lignes d'un `__init__.py` de `serializers/`** : un cycle réel n'est résolu que par
cet ordre. ⚠️ **Aucune de ces règles n'est vérifiée par un linter.**

**Nommage** — un fichier par sérialiseur ; suffixes `List` / `Detail` / `Extended` / `Post` /
`Patch` / `PostOrPatch`. Chemins d'URL en kebab-case, champs d'API en camelCase déclarés à la
main avec `source=`.

**Commits** — en-tête conventionnel (`feat(back):`, `fix(back):`, `chore(back):`), puis un sujet
par ligne en texte brut, sans tiret ni puce.

**Pièges à connaître avant d'écrire :**

| Sujet                  | Piège                                                                                                                      | Où                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Appartenance           | Le code existant écrit `is not` sur des `pk` : **c'est un bug**, écrire `!=`                                               | [R1](docs/quality/refactoring-backlog.md)                            |
| Réponse d'écriture     | Un POST/PATCH répond avec **un autre sérialiseur** que ses champs d'entrée (`to_representation`)                           | [docs/architecture/serializers.md](docs/architecture/serializers.md) |
| Archivage              | Un projet/collection archivé fige son contenu — garde à écrire **3 fois** : création, modification, suppression            | [docs/patterns/archive-guards.md](docs/patterns/archive-guards.md)   |
| `limit_choices_to`     | **Ne protège rien** hors admin et `ModelForm`. Ne jamais s'y fier                                                          | [docs/architecture/data-model.md](docs/architecture/data-model.md)   |
| Sérialiseur de lecture | `ReadOnlyModelSerializer` neutralise `create`/`update` — un `save()` échoue **en silence**                                 | [docs/architecture/serializers.md](docs/architecture/serializers.md) |
| Fuseau                 | Le conteneur est en **UTC**, `TIME_ZONE` vaut Europe/Paris. `date.today()` ≠ aujourd'hui la nuit                           | [R4](docs/quality/refactoring-backlog.md)                            |
| Daily task             | Cocher un daily ne clôt la tâche source que si l'action est vide ou `FI`                                                   | [docs/domain/daily-rules.md](docs/domain/daily-rules.md)             |
| Événements             | `takesWholeDay: true` **efface silencieusement** heures et date de fin ; un projet lié ne peut plus être changé ni détaché | [docs/domain/events.md](docs/domain/events.md)                       |
| Pagination             | `size=0` renvoie **tout**. `event/` et `daily-task/summary/` ne sont **pas** paginés                                       | [docs/architecture/api-surface.md](docs/architecture/api-surface.md) |
| Admin                  | L'admin Django et `/api-auth/login/` sont **inaccessibles** (`AUTHENTICATION_BACKENDS` n'accepte que `email=`)             | [R11](docs/quality/refactoring-backlog.md)                           |

## Documentation

| Besoin                                        | Fichier                                                              |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Organisation du code, sens des imports        | [docs/architecture/overview.md](docs/architecture/overview.md)       |
| **La liste des endpoints**                    | [docs/architecture/api-surface.md](docs/architecture/api-surface.md) |
| Conventions de sérialisation                  | [docs/architecture/serializers.md](docs/architecture/serializers.md) |
| Modèles, contraintes, signaux                 | [docs/architecture/data-model.md](docs/architecture/data-model.md)   |
| Jetons, permissions, e-mails de compte        | [docs/architecture/auth.md](docs/architecture/auth.md)               |
| Recettes (endpoint, cloisonnement, archivage) | [docs/patterns/](docs/patterns/)                                     |
| Vocabulaire métier et garanties du serveur    | [docs/domain/glossary.md](docs/domain/glossary.md)                   |
| Lancer, configurer, migrer, vérifier          | [docs/workflows/](docs/workflows/)                                   |
| Pourquoi un choix a été fait                  | [docs/adr/](docs/adr/)                                               |
| **Ce qui est cassé / risqué — ne pas imiter** | [docs/quality/](docs/quality/)                                       |

⚠️ `docs/quality/` décrit ce qui est **cassé ou fragile**. Ne jamais y prendre un exemple comme
modèle : les modèles sont dans `docs/patterns/`.

## Mettre à jour la doc — dans le MÊME changement

Quand une modification change quelque chose que `docs/` décrit, **mettre à jour le fichier
concerné dans le même commit**. Correspondances :

| Si tu modifies…                                                                       | Mets à jour                                                                                                                            |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tout_doux/urls.py`, un `@action`, une permission, un filtre                          | [docs/architecture/api-surface.md](docs/architecture/api-surface.md) — la table des endpoints est **maintenue à la main**              |
| un modèle, une contrainte, un signal, une migration                                   | [docs/architecture/data-model.md](docs/architecture/data-model.md) + [docs/domain/glossary.md](docs/domain/glossary.md)                |
| un sérialiseur (convention, `to_representation`, effet de bord)                       | [docs/architecture/serializers.md](docs/architecture/serializers.md)                                                                   |
| une validation métier                                                                 | [docs/domain/glossary.md](docs/domain/glossary.md), [daily-rules.md](docs/domain/daily-rules.md) ou [events.md](docs/domain/events.md) |
| un contrôle d'appartenance                                                            | [docs/patterns/ownership-and-scoping.md](docs/patterns/ownership-and-scoping.md) — table des sites **maintenue à la main**             |
| un garde d'archivage                                                                  | [docs/patterns/archive-guards.md](docs/patterns/archive-guards.md) — table des sites **maintenue à la main**                           |
| `settings.py`, `requirements.txt`, `.conf/*/backend/`, `td.sh`, `docker-compose*.yml` | [docs/workflows/development.md](docs/workflows/development.md)                                                                         |
| une commande `manage.py`, un test, un linter, la CI                                   | [docs/workflows/verification.md](docs/workflows/verification.md)                                                                       |
| l'authentification, une permission, un e-mail                                         | [docs/architecture/auth.md](docs/architecture/auth.md)                                                                                 |
| **tu corriges un item de `quality/`**                                                 | **Supprimer** sa ligne et sa section — ne pas la marquer « fait »                                                                      |
| tu découvres une faiblesse ou une règle non outillée                                  | L'inscrire dans [docs/quality/](docs/quality/) (backlog si on agit, risques surveillés sinon)                                          |
| une décision structurante                                                             | Nouvel ADR dans [docs/adr/](docs/adr/)                                                                                                 |

Le format attendu de chaque type de fichier (squelette markdown, convention de nommage,
déclencheur précis) est dans **[docs/README.md](docs/README.md)** — le lire avant de créer un
fichier de doc.

Pour vérifier qu'un changement n'a rien laissé dériver : commande `/sync-docs`
(`.claude/commands/sync-docs.md`).
