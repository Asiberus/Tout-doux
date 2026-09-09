# Backlog de refactoring

Items avec **intention d'agir**. Ce qui est signalé ici est **cassé, mort ou faux** : ne pas le
prendre comme modèle. Les faiblesses qu'on assume sans agir sont dans
[watched-risks.md](watched-risks.md).

> **Cycle de vie** : quand un item est résolu, **supprimer sa ligne et sa section**. Ne pas le
> marquer « Fait » — `git log` est déjà le registre du corrigé.

| ID  | Titre                                                              | Priorité  | Raison de la priorité                                                 |
| --- | ------------------------------------------------------------------ | --------- | --------------------------------------------------------------------- |
| R1  | Dockerfile de production cassé (`package-lock.json` inexistant)    | **haute** | Le build de prod ne peut pas aboutir                                  |
| R2  | Intercepteur 401 : `error.response` déréférencé sans garde         | **haute** | Masque toute erreur réseau par un `TypeError`                         |
| R5  | Dérive doc↔code des fichiers d'instruction                        | moyenne   | Cause de code erroné généré ; c'est ce que `docs/` corrige            |
| R6  | `src/store/auth.store.ts` : code mort dupliquant le service d'auth | moyenne   | Deux implémentations d'auth, risque de confusion                      |
| R12 | « Aujourd'hui » figé au rendu dans tout le domaine daily           | moyenne   | Une page ouverte au passage de minuit laisse écrire sur un jour passé |
| R10 | `README.md` du dossier `frontend/` obsolète                        | basse     | Traité en même temps que R5                                           |

> **Items transférés au tracker de migration.** Sept items relevant du chantier Vuetify 4 ont été
> déplacés vers [../workflows/vuetify-4-migration.md](../workflows/vuetify-4-migration.md), qui est
> le tracker actif de ce chantier et où ils sont décrits avec leur marche à suivre complète et la
> liste des fichiers à modifier. Ils y sont suivis par les cases à cocher de la section
> « Avancement ».
>
> | Ancien ID | Devenu | Sujet                                                  |
> | --------- | ------ | ------------------------------------------------------ |
> | R3        | §1.12  | `ProfileAccount` : `useRouter()` hors du scope `setup` |
> | R7        | §2.13  | Blocs CSS morts dans `global.scss`                     |
> | R9        | §2.14  | Modificateurs de nuance `lighten-*`/`darken-*` perdus  |
> | R8        | §3.13  | Amener `type-check` à 0 erreur (inventaire des 28)     |
> | R4        | §3.14  | Service worker non fonctionnel                         |
> | R11       | §3.15  | Dossier `src/views/agenga/`                            |
> | W11       | §3.16  | Fork local `eslint-plugin-vuetify`                     |
>
> **À la suppression du tracker de migration** (quand le chantier atterrit), tout item encore
> ouvert doit être **réinscrit ici** avant de supprimer le fichier.

---

## R1 — Dockerfile de production cassé

- **Origine** : `.conf/production/frontend/Dockerfile`, comparé au contenu réel de `frontend/`.
- **Contexte** : le Dockerfile fait `COPY ./frontend/package.json ./frontend/package-lock.json ./`
  puis `npm install`. Or **`package-lock.json` n'existe pas** — le projet utilise Yarn
  (`yarn.lock`, Volta épingle `yarn 1.22.19`). Un `COPY` dont la source est absente **fait échouer
  le build**. Le Dockerfile de développement, lui, utilise correctement `yarn install`.
- **Décision** : agir. Aligner la prod sur Yarn (`COPY yarn.lock`, `yarn install --frozen-lockfile`).
  À vérifier en lançant `yarn docker:prod:build` — je n'ai pas exécuté ce build, la conclusion
  repose sur la lecture des fichiers.

## R2 — Intercepteur 401 : `error.response` déréférencé sans garde

- **Origine** : `src/axios/axios-instance.ts:20`.
- **Contexte** : `if (error.response.status === 401)`. Sur une erreur réseau, un échec DNS/CORS ou
  une requête annulée, `error.response` est `undefined` : l'intercepteur **lève lui-même un
  `TypeError`**, qui remplace l'erreur axios d'origine pour tous les appelants. Le message affiché
  en console n'a alors plus aucun rapport avec la cause.
- **Décision** : agir. `error.response?.status === 401`. Correctif d'une ligne, gain de
  diagnosticabilité important.

## R5 — Dérive doc↔code des fichiers d'instruction

- **Origine** : comparaison de `CLAUDE.md` et `README.md` avec le code, pendant la mise en place
  de `docs/`.
- **Contexte** : divergences constatées avant restructuration —
  `CLAUDE.md` annonçait « Vuetify 3 » (réel : 4.1.6), « il n'y a pas encore de script de
  type-check » (réel : `yarn type-check` existe), et « les fichiers `api/*.api.ts` appellent
  `axiosInstance` et retournent `response.data` » (réel : ils passent par le wrapper `http` depuis
  le commit `9a5922f`). `README.md` était le README Vue CLI d'origine, documentant
  `npm run serve`, `npm run test:unit` et `npm run test:e2e` — **aucun de ces scripts n'existe**.
  Ces fichiers étant lus pour générer du code, une affirmation fausse s'y propage directement.
- **Décision** : agir, en partie fait — `CLAUDE.md` et `README.md` ont été réduits à des
  pointeurs vers `docs/`, sans duplication de contenu. **Reste à faire** : le respect de la règle
  « mettre à jour `docs/` dans le même changement » n'est vérifié par aucun outil. Voir la
  commande `/sync-docs`.

## R6 — `src/store/auth.store.ts` : code mort

- **Origine** : `src/store/auth.store.ts:22` (`// TODO: Not used ? see if needed`) ; aucun
  `useAuthStore()` dans `src/`.
- **Contexte** : ce store réimplémente intégralement `src/services/auth.service.ts` — token,
  `isAuthenticated`, `login`, `logout`, `resetStore` — y compris une \*\*seconde constante
  `TOKEN_KEY = 'td_token'`. Il est toujours exporté par `src/store/index.ts`, donc découvrable et
  utilisable par erreur. Il contient aussi un piège de nommage : son getter `getToken` masque
  l'import du même nom venant du service.
- **Décision** : agir — supprimer le fichier et son export. Aucun appelant, aucun risque.
  Voir [../adr/0002-pinia-stores-scope.md](../adr/0002-pinia-stores-scope.md).

## R12 — « Aujourd'hui » figé au rendu dans tout le domaine daily

- **Origine** : `DailyUpdate.vue` (`isToday`, `canGoForward`), `DailyUpdateTask.vue` (`isToday`),
  `DailyDetail.vue` (`canGoForward`), `DailyDetailTaskTimeline.vue` (`isPast`, `isFuture`,
  `isToday`), `DailyDetailEventTimeline.vue` (`eventText`), et `DailySummary.vue:31` — où `today`
  et `upcomingCeiling` ne sont même pas des `computed` mais des constantes évaluées une fois dans
  le `setup`.
- **Contexte** : ces valeurs appellent `moment()` au rendu. Rien ne demande à Vue de les
  réévaluer quand l'horloge franchit minuit, et l'écran n'est pas remonté pour autant. Le
  symptôme n'est pas cosmétique depuis l'ouverture de la planification :

  On prépare mardi à 23 h 55 depuis le wizard. À 00 h 05 on est mardi, mais `isToday` croit
  encore qu'on est lundi. **La flèche gauche est donc active** et mène à lundi — un jour
  désormais passé. `dailyUpdateGuard` ne rejouant pas sur un changement de param, rien ne
  redresse la navigation : l'utilisateur crée et édite des lignes sur un jour passé. Le serveur
  les accepte tant que son horloge UTC est encore à lundi, puis les refuse par un **400** que
  l'interface ne sait pas expliquer.

  Corollaires du même figement : le bouton « prepare the day » du résumé continue de pointer sur
  la veille, l'élément « Add a task » du détail se trompe de jour, et le bouton de report
  apparaît ou disparaît à contretemps.

- **Cause racine** : il n'existe **aucune source unique de « aujourd'hui »** côté client.
  `moment()` est appelé au fil de l'eau dans une dizaine de fichiers. Les deux endroits corrects
  le sont par accident : `dailyUpdateGuard` recalcule à chaque navigation, et `useAddTaskToDaily`
  au moment du clic.
- **Décision** : agir. Un composable `useToday()` exposant un `ref` réactif, rafraîchi sur
  `visibilitychange` et sur un intervalle de faible fréquence, consommé par les écrans du daily.
  ⚠️ Le corriger côté client **ne suffit pas** : le serveur calcule son « aujourd'hui » en UTC
  alors que `TIME_ZONE` vaut `Europe/Paris`, les deux horloges divergent donc déjà de 1 à 2 h
  chaque nuit. À traiter avec
  [R4 du backlog backend](../../../backend/docs/quality/refactoring-backlog.md).

## R10 — `README.md` obsolète

Traité avec R5 : réécrit en pointeur. Conservé comme ligne distincte car le fichier a un
public différent (visiteur du dépôt vs assistant IA).
