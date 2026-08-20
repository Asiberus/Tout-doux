---
description: Compare le diff de la branche à docs/ et liste les fichiers de doc à mettre à jour
---

Tu vérifies si la documentation de `frontend/docs/` a dérivé du code, pour le travail en cours.

Cette commande est **autonome** : ne présuppose aucun contexte de conversation.

## 1. Établir le périmètre du diff

```sh
cd frontend
git merge-base HEAD origin/develop 2>/dev/null || git merge-base HEAD origin/master
```

Puis, avec ce SHA comme base :

```sh
git diff --stat <base>...HEAD -- . ':!docs'
git diff --name-only <base>...HEAD -- . ':!docs'
git status --porcelain
```

Inclure les modifications non commitées : la doc doit être à jour **dans le même changement**,
donc avant le commit.

Si le diff est vide, s'arrêter et le dire.

## 2. Mapper chaque fichier modifié vers sa doc

Table de correspondance (identique à celle de `frontend/CLAUDE.md`) :

| Fichier modifié                                                                                      | Doc à vérifier                                                                                                |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/router/**`, `src/main.ts`                                                                       | `docs/architecture/routing.md` — ⚠️ table des routes **maintenue à la main**                                  |
| `src/store/**`                                                                                       | `docs/architecture/state.md`                                                                                  |
| `src/axios/**`, `src/api-routes.ts`, `src/api/**`                                                    | `docs/architecture/api-layer.md`, `docs/patterns/adding-an-endpoint.md`                                       |
| `src/plugins/vuetify.ts`, `src/styles/**`                                                            | `docs/architecture/ui-layer.md` — ⚠️ table des tokens **maintenue à la main** — et `docs/patterns/styling.md` |
| `src/components/**`, `src/layout/**`, `src/views/components/**`                                      | `docs/architecture/ui-layer.md`                                                                               |
| `src/models/**`, `src/utils/*.utils.ts`                                                              | `docs/domain/glossary.md`, `daily-rules.md`, `events.md`                                                      |
| `src/views/daily/**`                                                                                 | `docs/domain/daily-rules.md`                                                                                  |
| `src/views/components/event/**`                                                                      | `docs/domain/events.md`                                                                                       |
| `src/composables/**`                                                                                 | `docs/patterns/responsive.md`, `docs/patterns/dialogs.md`                                                     |
| `package.json`, `.husky/**`, `eslint.config.mjs`, `vite.config.ts`, `tsconfig.json`, `../.github/**` | `docs/workflows/development.md`, `docs/workflows/verification.md`                                             |
| `src/config/**`, `index.html`, `../.conf/**`                                                         | `docs/adr/0001-config-via-meta-tags.md`, `docs/workflows/development.md`                                      |

## 3. Vérifier chaque doc candidate

Pour chaque fichier de doc identifié, **le lire** et vérifier concrètement :

1. **Faits périmés** — toute affirmation, chemin, nom de symbole ou nom de commande cité qui ne
   correspond plus au code. Vérifier l'existence réelle (`grep`, `ls`), ne pas supposer.
2. **Tables maintenues à la main** — routes (`routing.md`), tokens de thème (`ui-layer.md`) :
   comparer ligne à ligne avec le code.
3. **Liens relatifs** — chaque lien résout-il vers un fichier existant ?
4. **Registre qualité** — le diff **corrige-t-il** un item de
   `docs/quality/refactoring-backlog.md` ou `watched-risks.md` ? Si oui, sa ligne d'index **et**
   sa section doivent être **supprimées** (pas marquées « fait »).
5. **Déclencheur atteint** — le diff atteint-il la condition de déclenchement d'un risque
   surveillé (`watched-risks.md`) ? Si oui, l'item doit passer au backlog.
6. **Nouvelle faiblesse** — le diff introduit-il une dette assumée, un contrat implicite ou une
   règle non outillée ? Elle doit être inscrite dans `docs/quality/`.
7. **Décision structurante** — le diff prend-il une décision qui contraint durablement le code
   (mécanisme, périmètre de couche, renoncement) ? Un ADR est-il nécessaire ?
8. **Nouveau pattern** — la même solution technique apparaît-elle pour la 3ᵉ fois dans le code ?
   Elle mérite alors une fiche `docs/patterns/`.

Le format et le déclencheur exact de chaque type de doc sont dans `frontend/docs/README.md`.

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
