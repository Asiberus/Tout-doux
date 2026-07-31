# 0002 — Périmètre restreint des stores Pinia

- **Statut** : accepté
- **Date** : inconnue — décision matérialisée par le commit `e0b598e` « chore: rewrite all
  components in vue3 composition api », qui a converti les modules Vuex
  (`src/store/modules/*.store.ts`) en stores Pinia (`src/store/*.store.ts`)

## Contexte

L'application compte ~40 écrans et 65 fonctions d'API. Vuex, puis Pinia, aurait pu servir de
cache de données global. La migration Vue 2 → Vue 3 a été l'occasion de reconsidérer le périmètre.

## Décision

Le store n'est **pas** la voie d'accès par défaut aux données. Un store existe uniquement pour :

1. les **agrégats de page détail** mutés par morceaux depuis plusieurs composants enfants —
   `currentProject`, `currentCollection` ;
2. les **singletons applicatifs** chargés une fois au démarrage — `user`, `preferences` ;
3. l'**orchestration** de ces singletons — `app`.

Tout le reste (listes, données éphémères, back-office, écrans non authentifiés) appelle `@/api`
**directement depuis le composant** : c'est le cas de 27 composants.

Le token d'authentification **n'est pas** dans un store : il est géré exclusivement par
`src/services/auth.service.ts` (mécanisme de stockage décrit dans
[../architecture/state.md](../architecture/state.md)).

## Alternatives écartées

- **Un store par domaine, cache global des listes** — écarté : la plupart des listes sont
  consommées par un seul écran et rechargées à chaque visite. Un cache aurait imposé une
  stratégie d'invalidation sans bénéfice utilisateur mesuré.
- **Une couche « repository » entre composants et API** — écarté : `api/` remplit déjà ce rôle,
  une couche supplémentaire aurait été purement cérémonielle.
- **Le token dans un store Pinia** — une implémentation existe (`src/store/auth.store.ts`) mais
  n'a **jamais été branchée** et est auto-signalée `// TODO: Not used ?`. Elle duplique
  intégralement `auth.service.ts`, y compris une seconde constante `TOKEN_KEY`.
  **L'implémentation vivante est le service.** Le store mort reste à supprimer.

*Rationale inféré* : aucun commit ne motive explicitement le périmètre ; il est déduit de la
régularité du découpage (2 agrégats + 2 singletons, 27 appels directs).

## Conséquences

- ✅ Peu d'état global, donc peu de risque d'incohérence entre écrans.
- ✅ Un écran simple se lit de bout en bout dans son propre fichier.
- ⚠️ **Duplication de fetch** : le wizard daily recharge `getProjectListDetailed` /
  `getCollectionListDetailed` dans des refs locales, alors que les stores projet/collection
  détiennent déjà ces types. Aucun partage, aucune invalidation entre les deux.
- ⚠️ **Aucun store n'a d'état `loading` ni `error`** : les échecs partent en `console.error` et
  l'UI ne les signale pas.
- ⚠️ Les getters `loadedX` **lèvent une exception** si l'état n'est pas chargé et sont appelés
  depuis les templates — ils dépendent d'un `v-if` parent pour rester sûrs.
- ⚠️ Deux écrans **contournent** leur propre store pour la suppression
  (`ProjectSettings.vue`, `CollectionSettings.vue` appellent l'API en direct).

## Preuve

`src/store/` (6 fichiers), `src/services/auth.service.ts:5`, `src/store/auth.store.ts:20-22`,
commit `e0b598e`.

## Voir aussi

- [../architecture/state.md](../architecture/state.md) — le critère opérationnel « store ou appel
  direct »
- [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) — suppression du store
  mort
