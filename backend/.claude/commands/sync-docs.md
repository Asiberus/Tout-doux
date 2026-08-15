---
description: Compare le diff de la branche à backend/docs/ et liste les fichiers de doc à mettre à jour
---

Tu vérifies si la documentation de `backend/docs/` a dérivé du code, pour le travail en cours.

Cette commande est **autonome** : ne présuppose aucun contexte de conversation.

## 1. Établir le périmètre du diff

```sh
cd backend
git merge-base HEAD origin/develop 2>/dev/null || git merge-base HEAD origin/master
```

Puis, avec ce SHA comme base :

```sh
git diff --stat <base>...HEAD -- . ':!docs'
git diff --name-only <base>...HEAD -- . ':!docs'
git status --porcelain
```

Inclure aussi les fichiers du monorepo qui déterminent le comportement du backend :

```sh
git diff --name-only <base>...HEAD -- ../.conf ../docker-compose.yml ../docker-compose.prod.yml ../td.sh ../.github
```

Inclure les modifications non commitées : la doc doit être à jour **dans le même changement**,
donc avant le commit.

Si le diff est vide, s'arrêter et le dire.

## 2. Mapper chaque fichier modifié vers sa doc

Table de correspondance (identique à celle de `backend/CLAUDE.md`) :

| Fichier modifié                                                                                                                           | Doc à vérifier                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tout_doux/urls.py`, `backend/urls.py`                                                                                                    | `docs/architecture/api-surface.md` — ⚠️ table des endpoints **maintenue à la main**                   |
| `tout_doux/views/**`                                                                                                                      | `docs/architecture/api-surface.md` (méthodes, permissions, filtres, `@action`)                        |
| `tout_doux/serializers/**`                                                                                                                | `docs/architecture/serializers.md` + le fichier `docs/domain/` correspondant si une validation change |
| `tout_doux/models/**`, `tout_doux/migrations/**`                                                                                          | `docs/architecture/data-model.md`, `docs/domain/glossary.md`                                          |
| `tout_doux/auth/**`, `tout_doux/permissions/**`, `tout_doux/validators/**`, `tout_doux/services/email.py`, `tout_doux/templates/email/**` | `docs/architecture/auth.md`                                                                           |
| `tout_doux/pagination.py`                                                                                                                 | `docs/architecture/api-surface.md`                                                                    |
| `tout_doux/serializers/daily_task/**`, `tout_doux/views/daily_task.py`                                                                    | `docs/domain/daily-rules.md`                                                                          |
| `tout_doux/serializers/event/**`, `tout_doux/views/event.py`                                                                              | `docs/domain/events.md`                                                                               |
| `backend/settings.py`, `requirements.txt`, `../.conf/**`, `../docker-compose*.yml`, `../td.sh`                                            | `docs/workflows/development.md`                                                                       |
| `tout_doux/management/**`, `tout_doux/tests.py`, `../.github/**`, tout nouveau linter                                                     | `docs/workflows/verification.md`                                                                      |
| tout `__init__.py` de `serializers/` ou `views/`                                                                                          | `docs/architecture/overview.md` — ⚠️ **l'ordre des lignes résout un cycle d'imports**                 |

## 3. Vérifier chaque doc candidate

Pour chaque fichier de doc identifié, **le lire** et vérifier concrètement :

1. **Faits périmés** — toute affirmation, chemin, numéro de ligne, nom de symbole ou nom de
   commande cité qui ne correspond plus au code. Vérifier l'existence réelle (`grep`, `ls`, et
   au besoin `docker exec tout_doux_backend python manage.py show_urls`), ne pas supposer.
2. **Tables maintenues à la main** — endpoints (`api-surface.md`), sites d'application des deux
   patterns (`ownership-and-scoping.md`, `archive-guards.md`), énumérations
   (`domain/glossary.md`) : comparer ligne à ligne avec le code.
3. **Liens relatifs** — chaque lien résout-il vers un fichier existant ? Y compris les liens
   croisés vers `../../frontend/docs/`.
4. **Registre qualité** — le diff **corrige-t-il** un item de
   `docs/quality/refactoring-backlog.md` ou `watched-risks.md` ? Si oui, sa ligne d'index **et**
   sa section doivent être **supprimées** (pas marquées « fait »), et toutes les références
   `R<n>` / `W<n>` ailleurs dans `docs/` doivent être retirées.
5. **Déclencheur atteint** — le diff atteint-il la condition de déclenchement d'un risque
   surveillé ? Si oui, l'item passe au backlog.
6. **Nouvelle faiblesse** — le diff introduit-il une dette assumée, un contrat implicite ou une
   règle non outillée ? Elle doit être inscrite dans `docs/quality/`.
7. **Décision structurante** — le diff prend-il une décision qui contraint durablement le code
   (mécanisme d'auth, convention de sérialisation, renoncement) ? Un ADR est-il nécessaire ?
8. **Nouveau pattern** — la même solution technique apparaît-elle pour la 3ᵉ fois ? Elle mérite
   alors une fiche `docs/patterns/`.
9. **Contrat d'API** — le diff change-t-il une forme de requête ou de réponse ? Alors
   `frontend/src/models/` et `frontend/src/api-routes.ts` divergent probablement : le signaler,
   il n'y a **aucune génération de types** (`docs/adr/0004-no-openapi-schema.md`).

Le format et le déclencheur exact de chaque type de doc sont dans `backend/docs/README.md`.

## 4. Rendre le résultat

Un tableau, rien d'autre :

| Fichier de doc | Action                                       | Quoi précisément |
| -------------- | -------------------------------------------- | ---------------- |
| …              | à mettre à jour / à créer / à supprimer / OK | …                |

Puis, **si des mises à jour sont nécessaires** : proposer les modifications et attendre
validation avant d'éditer.

**Ne pas** commiter, ne pas merger, ne pas créer de PR.

Si rien n'a dérivé, répondre simplement que la doc est à jour pour ce diff — ne pas inventer de
travail.
