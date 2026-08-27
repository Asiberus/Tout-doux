# Améliorations possibles — récupération des données

Périmètre : la chaîne de récupération des données de bout en bout — requêtes SQL générées par
`backend/tout_doux/`, surface d'API, et couche de données de `frontend/src/`. Les écrans visés
sont le daily update, `project-list`, `collection-list`, `project-detail` et `collection-detail`.

Version analysée : `0.5.0` — branche `develop`, commit `be2f073`.
Date : 2026-08-27.

> **Statut du document.** Présentation d'améliorations possibles, pas une procédure. Il est
> délibérément à la racine du monorepo et non dans `backend/docs/` ou `frontend/docs/` : il
> couvre les deux, et rien n'y est encore engagé. Il sera affiné, puis scindé en procédures
> dans les `docs/workflows/` de chaque dépôt au moment de passer à l'exécution.
>
> **La partie 1 est faite.** Ce qu'elle a laissé de durable vit dans
> `backend/docs/patterns/query-optimization.md`. Elle reste décrite ici pour que l'enchaînement
> des sept parties se lise d'un bloc.

---

## Sommaire

1. [Le diagnostic](#1-le-diagnostic)
2. [Décisions déjà prises](#2-décisions-déjà-prises)
3. [Les sept parties](#3-les-sept-parties)
4. [À trancher](#4-à-trancher)
5. [Hors périmètre, délibérément](#5-hors-périmètre-délibérément)
6. [Le point faible du plan](#6-le-point-faible-du-plan)

---

## 1. Le diagnostic

Ce qui a été vérifié dans le code, pas supposé. Les deux premiers points expliquent à eux seuls
la lenteur ressentie du daily update.

| Constat                                                                       | Détail                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** `select_related`, `prefetch_related` ou `annotate` dans tout le backend | Ce n'est pas une supposition : c'est écrit dans la fiche `W8` de `backend/docs/quality/watched-risks.md`, avec la mention « ne pas agir ». Le déclencheur qui y est inscrit est aujourd'hui atteint.                                                                                        |
| **~1 040** requêtes SQL pour un seul écran                                    | Le daily update appelle `project/detailed/` et `collection/detailed/` avec `size=0` : chaque projet → ses sections → leurs tâches → _les tags de chaque tâche_ → ses events. Un `SELECT` par tâche, plus 3 requêtes de comptage par projet. Les tags de tâches pèsent ~900 de ces requêtes. |
| **Ø** `GET /task/` et `GET /section/`                                         | `TaskViewSet` et `SectionViewSet` n'exposent que create / update / delete. « Charger les tâches au clic » est donc impossible sans créer ces endpoints.                                                                                                                                     |
| **5** endpoints forcent `size: 0` côté front                                  | La pagination existe côté serveur depuis toujours et n'est utilisée nulle part : `count`, `page`, `first` et `last` ne sont jamais lus.                                                                                                                                                     |
| **300+** cartes Vuetify montées d'un coup sur une grosse collection           | À la volumétrie constatée (< 20 projets/collections, < 1000 tâches), le goulot des pages détail est vraisemblablement _le rendu_, pas le réseau. La pagination le corrige, mais en effet de bord — utile à savoir pour valider le résultat au bon endroit.                                  |

### Détail du calcul des ~1 040 requêtes

`ProjectDetailSerializer(many=True)` déclare quatre relations imbriquées. Pour **un** projet à
3 sections, 45 tâches et 2 events :

| Accès                     | Requêtes |
| ------------------------- | -------- |
| `project.tags.all()`      | 1        |
| `project.sections.all()`  | 1        |
| `section.tasks.all()` × 3 | 3        |
| `task.tags.all()` × 45    | 45       |
| `project.tasks.all()`     | 1        |
| `project.events.all()`    | 1        |
| **Total par projet**      | **52**   |

× 20 projets + 1 requête initiale = **~1 041 requêtes** pour un seul `GET`. Et il y en a un
second en parallèle pour les collections.

---

## 2. Décisions déjà prises

Actées dans la discussion préalable. Elles structurent tout ce qui suit.

| Décision                                   | Raison retenue                                                                                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pinia Colada** plutôt que TanStack Query | Intégration native à Pinia 4, `defineQuery` remplace les stores, et _aucun retry par défaut_ — donc pas d'amplification de l'intercepteur 401. Couvre l'optimiste, le fetch en arrière-plan, `staleTime` et l'invalidation. |
| **Filtre « Completed » côté serveur**      | Deux listes paginées indépendantes. L'ordre reste stable, et on ne charge jamais l'historique complet d'une grosse collection.                                                                                              |
| **Stores vidés de leur rôle « données »**  | `currentProject` et `currentCollection` laissent place à des queries partagées. Sinon on maintient deux caches en parallèle.                                                                                                |
| **Backend d'abord**                        | La correction du N+1 est une partie autonome, livrée avant toute installation de librairie. Sans étape de mesure formelle.                                                                                                  |

---

## 3. Les sept parties

L'ordre est une dépendance, pas une préférence : chaque partie s'appuie sur la précédente. On
peut s'arrêter après n'importe laquelle sans laisser l'application dans un état cassé.

Les considérations sont typées :

| Marque | Signification          |
| ------ | ---------------------- |
| ⚠️     | Piège technique        |
| ◆      | Décision de conception |
| ✓      | Bug attrapé au passage |
| ?      | À trancher (voir §4)   |

---

### Partie 1 — Tuer le N+1

**Backend · contrat inchangé** — _faite : voir `backend/docs/patterns/query-optimization.md`_

**Livrable** : le daily update devient nettement plus rapide sans qu'une seule ligne de front ne
bouge. Plus fort rendement du chantier.

**Actions**

- `ProjectViewSet` / `CollectionViewSet` : `prefetch_related('tags')`, et pour les actions détail
  `prefetch_related('sections__tasks__tags', 'tasks__tags', 'events')`.
- Les 5 `SerializerMethodField` de comptage de `ProjectListSerializer` et
  `CollectionListSerializer` deviennent des annotations.
- `has_uncompleted_task` : `filter(…).distinct()` → `filter(Exists(…))`.
- `DailyTaskViewSet` : `select_related('task__project', 'task__section__project',
'task__collection', 'common_task')` + `prefetch_related('tags', 'task__tags')`.
- `EventViewSet` : `select_related('project').prefetch_related('project__tags')`.
- Doc : suppression de `W8`, mise à jour de `serializers.md`, nouveau
  `docs/patterns/query-optimization.md`.

**Considérations**

⚠️ **Le piège du produit cartésien.** Empiler `Count('tasks')` et `Count('sections__tasks')` sur
le même queryset multiplie les lignes : comptages faux sans `distinct=True`, lents avec. Un
helper `tout_doux/queries.py` avec la recette
`Subquery(qs.values(…).annotate(c=Count('*')).values('c'))` règle le cas — 8 lignes, réutilisées
par project, collection, section et le résumé journalier. Une requête, pas de cartésien.

◆ **Pourquoi `Exists` et pas `distinct`.** Le `.distinct()` actuel est déjà discutable ; il
deviendra un vrai problème dès que la pagination lancera un `COUNT` sur le queryset joint.

✓ **`CollectionListSerializer` n'expose pas `itemName`** alors que le type front
`CollectionList extends Collection` le déclare. Champ à ajouter.

? **`DailySummarySerializer` : dedans ou dehors ?** Il fait 3 requêtes _par jour affiché_ — un
résumé sur 30 jours coûte ~90 requêtes, réductibles à 2 par agrégation groupée. Même racine, même
fichier de doc, correction peu coûteuse. Mais ça n'a pas été signalé comme lent. Voir Q3.

---

### Partie 2 — Les endpoints qui manquent

**Backend · additif seulement**

**Livrable** : tout ce dont le front aura besoin existe côté serveur. Rien n'est retiré :
l'ancien contrat reste valide jusqu'à la partie 7.

**Surface ajoutée**

| Endpoint           | Détail                                                                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /task/`       | `ListModelMixin` + pagination. Filtres `project`, `section`, `collection`, `completed`. `?project=X` ne renvoie que les tâches _directes_ — celles en section ont `project=null`, ce qui correspond exactement à l'onglet « General tasks ». |
| `GET /section/`    | `ListModelMixin` + pagination, filtre `project`. Nouveau `SectionListSerializer` = `id, name, taskCount, completedTaskCount`, **sans les tâches**.                                                                                           |
| `GET /event/`      | Ajout du filtre `project` (2 lignes).                                                                                                                                                                                                        |
| `ProjectDetail`    | **Ajout** de `taskCount`, `completedTaskCount`, `generalTaskCount`, `generalCompletedTaskCount`.                                                                                                                                             |
| `CollectionDetail` | **Ajout** de `taskCount`, `completedTaskCount`.                                                                                                                                                                                              |

**Considérations**

◆ **Pourquoi `generalTaskCount`.** Sans ce compteur, le front devrait déduire le nombre de tâches
générales par soustraction (total − somme des sections) : une arithmétique fragile qui casse dès
qu'une page de sections manque. Deux annotations valent mieux qu'un calcul implicite.

◆ **Rien n'est supprimé en partie 2.** `sections`, `tasks` et `events` restent dans
`ProjectDetail`, `project/detailed/` reste en place. Le retrait n'arrive qu'en partie 7, une fois
le front migré : aucun état intermédiaire cassé.

⚠️ **`size=0` désactivé sur `task/`.** Une collection entière en une requête, c'est exactement ce
qu'on cherche à éviter — l'échappatoire doit être fermée là où elle compte. Ajout aussi d'un
`max_page_size`.

✓ **Deux bugs de pagination, à corriger maintenant qu'on va s'en servir.** `int(size)` lève une
`ValueError` sur `?size=abc` → 500 ; et `?page=999` renvoie silencieusement la dernière page au
lieu d'un 404 (inoffensif ici puisqu'on se fiera à `last`, mais à documenter).

✓ **Cloisonnement : rien à ajouter.** Les nouveaux `get_queryset` partent de
`self.request.user.tasks` / `.sections`, donc un `?project=` étranger renvoie vide. Vérifié —
mais à inscrire dans `ownership-and-scoping.md`, dont la table est maintenue à la main.

◆ **Aucune migration, aucun index.** Pas de changement de modèle. Et à moins de 1000 tâches,
indexer `completed` serait du bruit — un booléen n'a que deux valeurs distinctes, PostgreSQL
préférera un parcours séquentiel.

---

### Partie 3 — Socle Pinia Colada

**Frontend · écran pilote : `project-list`**

**Livrable** : une couche de cache installée, conventionnée et documentée, prouvée sur l'écran le
plus simple.

**Actions**

- `yarn add @pinia/colada`, enregistrement dans `main.ts` _après_ Pinia.
- Nouvelle couche `src/queries/`, barrel `@/queries`, un fichier par domaine.
- `src/queries/keys.ts` : fabrique de clés typée.
- `appStore.exit()` vide le cache au logout.
- Doc : ADR `0006-pinia-colada-as-data-layer.md`, `patterns/data-fetching.md`, mise à jour
  d'`api-layer.md`, `state.md`, `overview.md`, `adding-an-endpoint.md`, `CLAUDE.md`.

**Considérations**

◆ **La règle à écrire noir sur blanc.** `@/api` reste la couche transport et ne change pas ;
`@/queries` est la couche cache, et devient la seule que les composants appellent pour lire. Sans
cette frontière explicite, les deux se mélangent en trois semaines.

⚠️ **Les clés de query font ou cassent l'invalidation.** Des clés écrites à la main dans chaque
composant, c'est la panne garantie : une invalidation qui ne touche pas la bonne entrée ne produit
aucune erreur, juste un écran périmé. D'où la fabrique typée.

✓ **Le retry n'est pas un problème avec Colada.** Le core ne retente pas (c'est un plugin opt-in),
donc aucun conflit avec l'intercepteur 401 global et inconditionnel. Avec TanStack il aurait fallu
poser `retry: false` — un 401 sur un mauvais mot de passe aurait déclenché 3 purges de token.

⚠️ **Vider le cache au logout ne se fait pas tout seul.** C'est une ligne, mais c'est l'oubli
classique : le cache d'un compte qui survit à la déconnexion.

---

### Partie 4 — Infinite scroll sur les listes

**Frontend · `project-list` et `collection-list`**

**Livrable** : les deux listes se chargent par pages. Zéro changement backend : l'enveloppe de
pagination suffit déjà.

```ts
getNextPageParam: (page) => (page.last ? null : page.page + 1);
```

**Considérations**

⚠️ **Le vrai risque de cette partie est CSS, pas data.** Aujourd'hui c'est la fenêtre qui scrolle
(`v-container.h-100` dans `v-main`). Or `VInfiniteScroll` pose _toujours_ `overflow-y: auto` sur sa
racine — vérifié dans son CSS. Il crée son propre conteneur, ce qui transforme la page en
« en-tête fixe + grille qui scrolle ».

? **Composant Vuetify ou sentinelle maison ?** Une sentinelle `IntersectionObserver` d'une
quinzaine de lignes garde le scroll de page actuel, marche à l'identique dans le daily update (qui
a déjà son conteneur en `overflow: auto`), et évite de mêler un chantier de données à un chantier
de mise en page. Voir Q2.

◆ **`archived` entre dans la clé de query.** Basculer le chip réutilise alors le cache au lieu de
refetcher — c'est gratuit, mais seulement si la clé est pensée dès le départ.

---

### Partie 5 — Daily update, chargement paresseux

**Frontend · première réponse optimiste**

**Livrable** : l'écran n'ouvre plus que la liste des projets et collections. Le contenu d'une carte
n'arrive qu'au clic.

**Actions**

- Deux listes en infinite scroll (`GET project/`, `GET collection/`) avec les sérialiseurs légers.
  Les cartes repliées ont déjà tout ce qu'il leur faut : `tags`, `taskCount` et
  `completedTaskCount` sont dans `ProjectList`.
- Au clic : `GET section/?project=X` pour les onglets et leurs `ProgressDisk`, puis
  `GET task/?section=Y&completed=false` paginé.
- L'onglet « General tasks » n'apparaît que si `generalTaskCount > 0`.
- Cliquer une tâche l'ajoute au daily instantanément — `useMutation` avec `onMutate`, rollback sur
  erreur.

**Considérations**

⚠️ **`POST daily-task/` peut répondre 409** quand la tâche y est déjà. Le rollback doit traiter ce
409 comme un succès, exactement comme le fait déjà `useAddTaskToDaily`. Sans ça, l'ajout optimiste
sera annulé sous les yeux de l'utilisateur alors que le résultat est bon.

◆ **La liste des daily tasks du jour reste chargée entière** (`?date=&size=0`). Elle est bornée par
une journée, et `isTaskSelected` en a besoin en totalité pour marquer les tâches déjà prises.

✓ **`project/detailed/` et `collection/detailed/` n'ont qu'un seul appelant** — cet écran. Une fois
la partie 5 finie, ces deux endpoints sont morts et peuvent disparaître.

---

### Partie 6 — Pages détail projet et collection

**Frontend · partie la plus lourde**

**Livrable** : les tâches arrivent par pages, les stores perdent leur rôle de porteurs de données.

**Actions**

- `useProjectQuery(id)`, `useProjectSectionsQuery(id)`,
  `useProjectTasksInfinite({ scope, completed })`, et leurs équivalents collection.
- Les sous-composants (`ProjectSectionItem`, `ProjectDescription`, `CollectionGeneral`) lisent le
  même composable partagé — aucune prop à faire descendre.
- Le chip « Completed » devient un changement de clé de query : deux listes paginées indépendantes.
- Les `ProgressWheel` et `ProgressDisk` lisent les compteurs de la query détail, plus la longueur
  d'un tableau.
- Deviennent morts : `flattenProjectTasks`, `sortByCompletionDate`, et l'usage de `filterCompleted`
  / `filterUncompleted` sur ces écrans.

**Considérations**

◆ **L'ordre redevient stable une fois filtré.** Le tri modèle est `('-completed_at', '-pk')` —
cocher une tâche la déplace, ce qui casserait une pagination par numéro de page. Mais filtré sur
`completed=false`, `completed_at` vaut toujours `null` et l'ordre retombe sur `-pk`. C'est la raison
technique derrière le choix du filtre serveur.

✓ **Le filtre serveur ne change rien à ce qui est affiché.** Vérifié dans les cinq composants qui
rendent des tâches (`CollectionGeneral`, `ProjectDescription`, `ProjectSectionItem`,
`DailyUpdateProjectListItem`, `DailyUpdateCollectionListItem`) : tous filtrent déjà sur
`completed` avant de rendre — soit les terminées, soit les autres, **jamais les deux dans la même
liste**. Seule la charge utile de l'API les mélange aujourd'hui. Déplacer le filtre côté serveur
ne fait donc que supprimer un tri en mémoire, sans aucun changement visible, et rend du même coup
sans objet la dépendance implicite à la position des `NULL` de `completed_at` dans le tri (que
PostgreSQL place en tête et SQLite en queue).

◆ **Optimiste ≠ partout.** Insérer à la main un élément dans les `pages` d'une query infinie est
fragile. Proposition : _optimiste pour les modifications en place_ (cocher, renommer, supprimer) et
_invalidation simple à la création_ — le nouvel élément remonte en tête via l'ordre `-pk`, un
refetch de la première page suffit. Compromis délibéré, discutable.

⚠️ **Cocher une tâche touche trois entrées de cache.** `onMutate` la retire de la liste courante ;
`onSettled` invalide les _deux_ listes **et** la clé détail, parce que les compteurs des jauges
bougent aussi. Oublier la troisième donne une jauge figée — sans aucune erreur.

⚠️ **Les `v-if` de garde doivent être revus, pas supprimés.** Les getters `loadedProject` /
`loadedCollection` lèvent une exception si l'état n'est pas chargé, et ne sont sûrs que grâce aux
`v-if` de `ProjectDetail.vue:24` et `CollectionDetail.vue:19`. Ils disparaissent avec les stores,
mais l'état « pas encore chargé » ne disparaît pas, lui.

✓ **Deux pièges documentés s'évaporent.** L'ordre du spread dans `updateProperties`
(`{ ...currentProject, ...response }` — l'inverser vide l'écran) n'existe plus : on invalide la clé
détail au lieu de fusionner à la main.

---

### Partie 7 — Nettoyage et documentation

**Backend + Frontend**

**Livrable** : plus aucun chemin mort, et une documentation qui ne ment pas.

**Suppressions**

- Endpoints `project/detailed/` et `collection/detailed/`.
- `ProjectDetail.sections` / `.tasks` / `.events` et `CollectionDetail.tasks`.
- `getProjectListDetailed`, `getCollectionListDetailed`.
- `src/store/project.store.ts` et `src/store/collection.store.ts`.

**Considérations**

⚠️ **Trois tables sont maintenues à la main** et ne se régénèrent pas : `api-surface.md`
(endpoints), `ownership-and-scoping.md` (cloisonnement) et `archive-guards.md`. Un endpoint ajouté
sans sa ligne devient invisible pour la prochaine session.

✓ **Des affirmations de `state.md` deviennent fausses** — « pas de store de liste », « aucune mise
en cache des listes ». À réécrire, pas à compléter.

---

## 4. À trancher

Quatre questions restées ouvertes. Aucune ne bloque le démarrage de la partie 1. La mention
**(reco)** marque la recommandation.

### Q1 — Le plan tel quel, ou des ajustements ?

- **(reco)** Validé — rédaction de la spec, relecture, puis plan d'implémentation détaillé.
- Ajustements — périmètre, ordre des parties ou choix techniques à revoir avant d'écrire quoi que
  ce soit.
- Approfondir une partie — la 6 typiquement, la plus lourde.

### Q2 — Infinite scroll : Vuetify ou sentinelle maison ?

- **(reco)** Sentinelle maison — ~15 lignes d'`IntersectionObserver`. Garde le scroll de page
  actuel, aucun changement de mise en page.
- `VInfiniteScroll` — composant officiel, gestion du chargement / erreur / fin de liste incluse.
  Mais impose `overflow-y: auto` sur sa racine : les deux listes passent d'un scroll de fenêtre à
  un scroll interne, à valider visuellement.
- Coder les deux sur `project-list` et trancher sur pièce.

### Q3 — `DailySummary` : dans ou hors de la partie 1 ?

- Dedans — même racine, même fichier de doc. Un résumé sur 30 jours passe de ~90 requêtes à 2.
- Dehors — la partie 1 reste strictement centrée sur ce qui a été signalé comme lent.

### Q4 — Tests backend sur les nouveaux endpoints ?

- **(reco)** Oui, minimal mais réel — exactitude des comptages annotés, cloisonnement par
  utilisateur sur `GET /task/` et `GET /section/`, forme de l'enveloppe paginée.
- Non — procédure manuelle de `backend/docs/workflows/verification.md`, comme le reste du projet.
  Plus rapide, mais une régression de cloisonnement entre comptes ne serait rattrapée par rien.

---

## 5. Hors périmètre, délibérément

Vérifié et laissé dehors. Signalé pour que le choix soit explicite plutôt que subi.

| Sujet                   | Raison                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /event/`           | Non paginé, renvoie un tableau nu. Concerne la page Agenda, hors du périmètre signalé. Risque `W11` déjà surveillé au-delà de 500 événements. |
| `tag/` · `common-task/` | Consommés en `size=0`. Volumes naturellement bornés.                                                                                          |
| Administration          | Listes utilisateurs et feedback, réservées au staff.                                                                                          |
| Vitest côté front       | Il n'existe aucune infrastructure de test frontend. La monter est un chantier en soi, à ne pas mélanger à celui-ci.                           |
| Découpage du bundle     | Risque `W7`, sujet de performance mais sans rapport avec le fetch de données.                                                                 |

---

## 6. Le point faible du plan

**Il n'y a aucun test front, et le back n'a que 13 tests de fumée, zéro test métier.** Un chantier
qui réécrit le contrat de six endpoints et vide deux stores sans filet : c'est là qu'est le vrai
risque, pas dans la technique.

Deux réductions de risque possibles sans transformer le chantier :

1. Un jeu minimal de tests backend dans les parties 1, 2 et 6 — l'infrastructure `manage.py test`
   existe déjà.
2. L'ordre des parties lui-même est une protection : rien n'est supprimé avant la partie 7, donc
   chaque étape reste réversible tant que le nettoyage n'est pas fait.

---

## Voir aussi

- `backend/docs/patterns/query-optimization.md` — ce que la partie 1 a laissé de durable
- `backend/docs/quality/watched-risks.md` — `W8` (N+1), `W11` (`event/` non paginé)
- `backend/docs/architecture/api-surface.md` — la table des endpoints, référence unique
- `frontend/docs/architecture/api-layer.md` — la chaîne de récupération côté client
- `frontend/docs/architecture/state.md` — le périmètre actuel des stores Pinia
