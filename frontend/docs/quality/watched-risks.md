# Faiblesses et risques surveillés

Items **sans intention d'agir aujourd'hui**. Chacun porte une **condition de déclenchement**
explicite : c'est elle qui rouvre le sujet, pas une impression. Ce qu'on a l'intention de
corriger est dans [refactoring-backlog.md](refactoring-backlog.md).

Ne rien faire est souvent le bon choix pour une application mono-développeur à faible volume — la
raison est indiquée pour chaque item.

> **Cycle de vie** : si un déclencheur est atteint, **déplacer l'item vers le backlog**. Si un
> item est résolu, **supprimer sa ligne et sa section**.

| ID | Titre | Nature | Déclencheur |
|---|---|---|---|
| W1 | Aucun test automatisé | Fiabilité | > 1 développeur, ou 2 régressions sur un même écran |
| W2 | Aucune règle de frontière outillée | Architecture | Une violation d'import atteint `master` |
| W3 | Aucun garde-fou en CI | Fiabilité | Un commit cassant `yarn build` atteint `master` |
| W4 | Pas de timeout sur les requêtes | Robustesse | Un signalement d'écran figé |
| W5 | 401 global appliqué aux endpoints d'auth | Sécurité / UX | Un signalement de déconnexion pendant un formulaire |
| W6 | Divergences modèle ↔ API | Fiabilité | Voir [ADR 0003](../adr/0003-hand-written-api-models.md) |
| W7 | Aucun découpage de bundle | Performance | Bundle initial > 1,5 Mo ou FCP > 3 s en 4G |
| W8 | Token en `localStorage`, expiration ignorée | Sécurité | Passage à des données multi-utilisateurs ou audit de sécurité |
| W9 | Aucun retour d'erreur à l'utilisateur | UX | Un signalement de « rien ne se passe » |
| W10 | Aucune route 404 | UX | Un signalement de page blanche |
| W12 | Polices et icônes chargées depuis des CDN | Robustesse | Besoin de fonctionnement hors ligne ou d'un déploiement intranet |
| W13 | Cycles d'imports entre axios, services, router | Architecture | Une erreur d'initialisation de module |

---

## W1 — Aucun test automatisé

- **Origine** : `package.json` (aucun script de test), aucun fichier de test dans le dépôt.
- **Contexte** : ni unitaire, ni composant, ni e2e, ni régression visuelle. La seule vérification
  est le test manuel de l'écran modifié. Le `tsconfig.json` référence pourtant un dossier
  `tests/**/*.ts` inexistant, et l'ancien README documentait `test:unit` / `test:e2e` — des
  vestiges du template Vue CLI.
- **Décision** : ne pas agir. Projet mono-développeur, itérations courtes, écrans testés à la
  main au fil du développement. Le coût d'installation et de maintenance d'une suite serait
  aujourd'hui supérieur au risque réel.
- **Déclencheur** : un 2ᵉ développeur contributeur, **ou** deux régressions constatées sur le même
  écran en moins de deux releases. Commencer alors par du test de composant sur le domaine daily,
  qui concentre les invariants implicites (voir [../domain/daily-rules.md](../domain/daily-rules.md)).

## W2 — Aucune règle de frontière outillée

- **Origine** : `eslint.config.mjs` — aucun `no-restricted-imports`, aucun plugin `import` ou
  `boundaries`.
- **Contexte** : le découpage en couches et le sens des dépendances
  ([../architecture/overview.md](../architecture/overview.md)) ne tiennent que par discipline.
  Constat encourageant : les règles sont **de fait respectées** (zéro `axiosInstance` hors de
  `src/axios/`, `api/` n'importe ni store ni composant). Seuls 2 fichiers utilisent un import non
  aliasé et 2 un import profond au lieu du barrel.
- **Décision** : ne pas agir. Le respect spontané montre que la contrainte est intégrée ; ajouter
  la configuration maintenant coûterait plus que ce qu'elle protège.
- **Déclencheur** : une violation de frontière atteint `master` (import d'`axiosInstance` dans un
  composant, ou `api/` important un store). Ajouter alors `no-restricted-imports` par couche.

## W3 — Aucun garde-fou en CI

- **Origine** : `.github/workflows/deployment.yml`.
- **Contexte** : le seul workflow est un déploiement Docker déclenché **manuellement**
  (`workflow_dispatch` ; le trigger `push` est commenté). Aucun lint, type-check ni build en CI.
  Le seul contrôle automatique du projet est le hook `pre-commit` (fonctionnel).
- **Décision** : ne pas agir tant que W1 et le passage de `type-check` à 0 erreur
  ([§3.13 du tracker de migration](../workflows/vuetify-4-migration.md)) sont ouverts — une CI qui
  ne peut lancer ni tests ni `type-check` (non nul aujourd'hui) n'ajouterait qu'un `yarn build`,
  déjà couvert de fait par le développement local.
- **Déclencheur** : un commit cassant `yarn build` atteint `master`, **ou** `type-check` atteint
  0 erreur (il devient alors gatable et la CI prend son sens).

## W4 — Pas de timeout sur les requêtes

- **Origine** : `src/axios/axios-instance.ts` — vérifié, zéro occurrence de
  `timeout|retry|AbortController|CancelToken` dans `src/`.
- **Contexte** : une requête vers un backend qui ne répond pas reste pendante indéfiniment. Aucun
  store n'ayant d'état `loading`, l'écran reste simplement sans réaction, sans indication ni
  possibilité d'annuler.
- **Décision** : ne pas agir. Backend et front sont co-déployés sur le même hôte ; le cas ne s'est
  pas présenté.
- **Déclencheur** : un premier signalement d'écran figé sans erreur, **ou** un déploiement où le
  backend n'est plus sur le même hôte que le front. Ajouter alors un `timeout` global (~10 s) sur
  l'instance.

## W5 — 401 global appliqué aux endpoints d'authentification

- **Origine** : `src/axios/axios-instance.ts:17-27`.
- **Contexte** : l'intercepteur traite **tout** 401 comme une session expirée — purge du token,
  `appStore.exit()`, redirection vers `login`. Il s'applique donc aussi à `auth/login/` et
  `auth/check-password/`. Si le backend répond 401 sur un mot de passe erroné, l'utilisateur est
  déconnecté au milieu d'un formulaire de confirmation (suppression de compte, changement
  d'e-mail). **Comportement non vérifié** : il dépend du code que Django renvoie réellement dans
  ce cas — à confirmer côté backend avant d'agir.
- **Sévérité** : faible (dégradation d'UX, pas de fuite de données). Apparenté à
  [CWE-613](https://cwe.mitre.org/data/definitions/613.html) — gestion de session.
- **Décision** : ne pas agir sans avoir confirmé le comportement backend.
- **Déclencheur** : un signalement de déconnexion inattendue pendant un formulaire, **ou** la
  confirmation que le backend renvoie 401 sur mot de passe erroné. Exclure alors les chemins
  d'auth de l'intercepteur.

## W6 — Divergences modèle ↔ API

- **Origine** : `src/models/`, comparé aux usages ; détail dans
  [../adr/0003-hand-written-api-models.md](../adr/0003-hand-written-api-models.md).
- **Contexte** : les modèles étant écrits à la main, plusieurs sont déjà en désaccord avec le
  comportement réel (`Task.completedAt` non-nullable, `EventExtendedModel.project` non-optionnel,
  nullabilité opposée entre `EventPostOrPatch` et `EventModel`). Les composants compensent par des
  tests défensifs.
- **Décision** : ne pas agir globalement. Corriger un modèle **quand on travaille sur son
  domaine**, plutôt qu'en chantier transversal sans filet de test.
- **Déclencheur** : celui de l'ADR 0003 (schéma OpenAPI maintenu côté backend, ou ≥ 3 bugs de
  production imputés à une divergence sur une même release).

## W7 — Aucun découpage de bundle

- **Origine** : `src/router/` — zéro `() => import()`, toutes les vues importées statiquement.
- **Contexte** : le visiteur anonyme de `/login` télécharge l'intégralité de l'application, y
  compris le back-office d'administration, `EventDialog` (462 lignes) et `DailyUpdateTask`
  (412 lignes). Le code total de `src/` est d'environ 13 500 lignes — modeste.
- **Décision** : ne pas agir. À cette taille, le découpage apporterait peu et ajouterait des
  états de chargement à gérer.
- **Déclencheur** : bundle initial **> 1,5 Mo** (non minifié-gzip mesuré sur `dist/assets/`),
  **ou** First Contentful Paint **> 3 s** en 4G simulée. Commencer alors par les routes
  `/administration/*` et l'agenda.

## W8 — Token en `localStorage`, expiration ignorée

- **Origine** : `src/services/auth.service.ts:5,40` ; `src/models/login.model.ts:7`.
- **Contexte** : le token est stocké en `localStorage` sous la clé `td_token`, donc accessible à
  tout script de la page (exposition XSS). `isAuthenticated()` teste seulement sa **présence** :
  aucune validation d'expiration, alors que `LoginResponse.expiry` est renvoyé par l'API et
  **jamais lu**. Une session expirée n'est découverte qu'au 401 suivant. Par ailleurs quatre
  écrans font `removeToken()` + `resetStore()` **sans** appeler `authApi.logout()` : le token
  reste alors valide côté serveur.
- **Sévérité** : moyenne. [CWE-522](https://cwe.mitre.org/data/definitions/522.html) —
  identifiants insuffisamment protégés ; [CWE-613](https://cwe.mitre.org/data/definitions/613.html)
  — expiration de session insuffisante.
- **Décision** : ne pas agir. Application personnelle, données non sensibles, pas de contenu
  tiers injecté dans la page. Passer à un cookie `HttpOnly` exigerait un changement côté backend.
- **Déclencheur** : l'app héberge des données d'autres utilisateurs que soi, **ou** intègre du
  contenu/script tiers, **ou** un audit de sécurité est demandé. Traiter alors ensemble :
  cookie `HttpOnly`, lecture d'`expiry`, et centralisation de la déconnexion dans
  `authService.logout()`.

## W9 — Aucun retour d'erreur à l'utilisateur

- **Origine** : 85 `console.*` dans `src/`, dont l'essentiel en `.catch(error => console.error(error))`.
- **Contexte** : c'est **la** stratégie de gestion d'erreur du projet. Aucun snackbar global,
  aucun état `error` de store, aucun modèle d'erreur typé. Un échec de sauvegarde est invisible
  pour l'utilisateur : l'écran reste en place, apparemment inchangé.
- **Décision** : ne pas agir maintenant — ce serait un chantier transversal touchant ~40 écrans, à
  faire d'un bloc avec un composant de notification, pas au coup par coup.
- **Déclencheur** : un premier signalement du type « j'ai cliqué et rien ne s'est passé ».
  Introduire alors un snackbar global piloté par un store dédié, branché d'abord sur les mutations
  (POST/PATCH/DELETE).

## W10 — Aucune route 404

- **Origine** : `src/router/index.ts` — aucune route `:pathMatch(.*)*`.
- **Contexte** : une URL inconnue ne correspond à aucun des deux arbres de layout. Un utilisateur
  authentifié obtient une **page blanche** sans message. Un non-authentifié est redirigé vers
  `login` par accident (`to.name` est `undefined`, donc absent de la liste blanche d'`authGuard`).
- **Décision** : ne pas agir. Aucune URL publique partageable n'existe hors des liens e-mail, et
  la navigation interne ne produit jamais d'URL invalide.
- **Déclencheur** : un signalement de page blanche, **ou** l'ouverture de liens profonds
  partageables (URL communiquées à l'extérieur de l'app).

## W12 — Polices et icônes chargées depuis des CDN

- **Origine** : `index.html:12-17`.
- **Contexte** : Roboto (Google Fonts) et Material Design Icons (jsDelivr) sont chargés par
  `<link>`, pas bundlés. Sans accès à ces domaines, l'app perd sa police et **toutes ses icônes**.
  Cela ajoute aussi deux dépendances tierces au chemin critique de rendu.
- **Décision** : ne pas agir. Usage en ligne, sur des CDN fiables.
- **Déclencheur** : besoin d'un fonctionnement hors ligne, d'un déploiement intranet, ou d'une
  contrainte de confidentialité interdisant les requêtes tierces. Installer alors `@mdi/font` et
  `@fontsource/roboto` en dépendances.

## W13 — Cycles d'imports entre axios, services et router

- **Origine** : `src/axios/axios-instance.ts:3-4`, `src/services/auth.service.ts:1,3`.
- **Contexte** : deux cycles réels — `axios-instance → services → api → http → axios-instance`, et
  `axios-instance → router → store/services`. Ils ne fonctionnent que parce que tous les appels
  concernés ont lieu **dans des corps de fonction**, donc après l'initialisation complète du
  graphe de modules.
- **Décision** : ne pas agir. Le montage est stable et le casser demanderait d'introduire une
  indirection (injection ou bus d'événements) disproportionnée pour un seul intercepteur.
- **Déclencheur** : une erreur d'initialisation de module au démarrage (`Cannot access '…' before
  initialization`, import résolvant `undefined`), typiquement après une montée de version de Vite
  ou un changement de format de bundle.
