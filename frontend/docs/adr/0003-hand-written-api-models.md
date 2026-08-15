# 0003 — Modèles d'API écrits à la main

- **Statut** : accepté (par défaut, jamais formellement tranché)
- **Date** : inconnue — état constaté depuis l'origine du projet

## Contexte

Le backend est une API Django/DRF, dans le même monorepo (`backend/`). Le front expose 65
fonctions d'API et déclare 16 fichiers de modèles dans `src/models/`.

Un fichier `openapi.yaml` existe à la racine du monorepo, mais c'est un **stub de 13 lignes**
décrivant un seul endpoint (`GET /project`), avec ses `servers` commentés. Il n'est référencé par
aucun script et n'est pas maintenu.

## Décision

Les interfaces TypeScript du contrat d'API sont **écrites et maintenues à la main** dans
`src/models/`. Il n'y a **aucune génération de code** (vérifié : zéro occurrence de
`openapi|swagger|codegen|orval|generated` dans `src/`, `package.json`, `vite.config.ts`).

Convention de variantes : `XPost` / `XPatch` / `X` / `XList` / `XDetail`.

## Alternatives écartées

- **Génération depuis un schéma OpenAPI** (`openapi-typescript`, `orval`…) — non mise en place.
  Elle exigerait que le backend expose un schéma complet et fiable ; l'`openapi.yaml` présent
  montre que la tentative a été abandonnée très tôt.
- **Validation runtime par schéma** (`zod`, `io-ts`) — non adoptée. Aurait détecté les divergences
  au prix d'un doublon schéma/type et d'un coût runtime.

_Rationale inféré_ : aucun ADR ni commit ne motive ce choix. Vu la taille du projet (un seul
développeur, front et back dans le même dépôt), le coût d'une chaîne de génération a
vraisemblablement paru supérieur au bénéfice.

## Conséquences

- ✅ Aucune étape de build supplémentaire, aucune dépendance de génération.
- ✅ Les types peuvent être **plus précis** que le schéma (unions littérales comme
  `TagType = 'project' | 'task'`, types conditionnels comme `EventReturn`).
- ⚠️ **Rien ne garantit l'alignement avec le backend.** Une divergence ne se manifeste qu'à
  l'exécution. Divergences déjà identifiées dans le code :
  - `EventPostOrPatch` déclare `description|startTime|endDate|endTime` **requis et nullables**,
    alors que `EventModel` déclare les **mêmes champs optionnels et non-nullables** — on écrit
    `null` et on relit `undefined` ;
  - `Task.completedAt: string` est non-optionnel alors qu'une tâche non complétée n'en a pas ;
  - `EventExtendedModel.project` est non-optionnel alors qu'un événement peut n'avoir aucun projet ;
  - `DailyTaskPost` a **tous ses champs optionnels**, ce qui autorise un corps vide.
- ⚠️ **Les états invalides sont représentables** : `TaskPost` expose trois identifiants de parent
  en optionnel (projet / section / collection) sans union discriminée ; l'exclusivité n'est tenue
  que par les sites d'appel.
- ⚠️ `yarn build` ne typecheckant pas, même une incohérence **interne** aux modèles ne bloque rien
  (voir [../workflows/verification.md](../workflows/verification.md) pour le compteur d'erreurs
  `vue-tsc` en cours).

## Déclencheur de réexamen

Adopter une génération ou une validation runtime si **l'une** de ces conditions survient :

- le backend expose un schéma OpenAPI complet et maintenu (le stub actuel ne compte pas) ;
- ≥ 3 bugs de production sont imputés à une divergence modèle ↔ API sur une même période de
  release ;
- l'équipe passe à plus d'un développeur travaillant simultanément sur front et back.

## Preuve

`src/models/` (16 fichiers), `../openapi.yaml` (13 lignes), `package.json` (aucun script de
génération), `src/models/event.model.ts`, `src/models/task.model.ts:26`.

## Voir aussi

- [../architecture/api-layer.md](../architecture/api-layer.md)
- [../patterns/adding-an-endpoint.md](../patterns/adding-an-endpoint.md)
- [../quality/watched-risks.md](../quality/watched-risks.md)
