# Tri manuel des tâches et des daily tasks — conception

- **Date** : 2026-09-29
- **Statut** : validé en conversation, à relire avant le plan d'implémentation

## Objectif

Permettre de réordonner à la main les tâches d'une liste et les daily tasks d'un jour. L'ordre
est persistant, décidé **uniquement par le backend**, et restitué à l'identique sur tous les
écrans qui affichent ces listes. L'interface de drag and drop fait l'objet d'un lot ultérieur :
ce lot livre tout ce qu'elle appellera.

## Périmètre

**Inclus**

- Un ordre par liste : tâches directes d'un projet, tâches de chaque section, tâches d'une
  collection, daily tasks d'un jour.
- Seules les tâches **non terminées** sont déplaçables. Les daily tasks le sont, terminées ou non.
- Nouvelle tâche **en tête** ; nouvelle daily task **en fin** ; le report de la veille garde
  l'ordre d'hier ; une tâche décochée **revient à sa place** ; un jour passé est **figé**.
- Couche de déplacement côté front (API, file, rechargement), testée mais non branchée sur une
  interface.

**Exclus**

- L'interface de drag and drop.
- Le chargement différé des tâches terminées (chantier suivant, transverse).
- Le déplacement d'une tâche vers une autre liste (amélioration future, voir § 8).
- Le déplacement d'une daily task vers un autre jour.
- R15 (backlog backend).

## Décisions

| Sujet                     | Décision                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Représentation de l'ordre | **Fractional indexing** : clé texte base 62, un déplacement = un `UPDATE` d'une ligne      |
| Bibliothèque              | `fractional-indexing==0.1.3` (PyPI, CC0), épinglée. Les clés Base62 sont identiques en 4.x |
| Calcul des clés           | **Backend uniquement.** Le front ne fait que lire et comparer les clés reçues              |
| API de déplacement        | `POST …/{id}/move/` avec des **ancres relatives** `afterId` / `beforeId`                   |
| Vue périmée               | Refus **409**, puis rechargement de la liste ; l'utilisateur refait le geste               |
| Concurrence               | **Verrou par liste** (`select_for_update`), la contrainte d'unicité en filet               |
| Réponse de `move`         | `{ id, position }` uniquement                                                              |

## 1. Modèle et migration

### Champs

`Task.position` et `DailyTask.position` : `CharField(max_length=255, db_collation='C',
editable=False)`. `editable=False` retire le champ des `ModelSerializer` : aucun sérialiseur
d'écriture ne peut le recevoir.

La collation `C` est obligatoire : la base est en `en_US.utf8`, qui ne trierait pas ces clés
octet par octet.

### Liste

- **Tâche** : le triplet `(project_id, section_id, collection_id)`, dont exactement un membre
  est renseigné (`CheckConstraint` ci-dessous).
- **Daily task** : le couple `(user_id, date)`.

### Contraintes

| Modèle      | Contrainte                                                                       | Nom                                  |
| ----------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `Task`      | `UniqueConstraint(project, section, collection, position, nulls_distinct=False)` | `unique_task_position_per_list`      |
| `Task`      | `CheckConstraint` : exactement un de `project`, `section`, `collection` non nul  | `task_exactly_one_container`         |
| `DailyTask` | `UniqueConstraint(user, date, position)`                                         | `unique_daily_task_position_per_day` |

`nulls_distinct=False` demande PostgreSQL 15 ou plus : dev et prod sont en 16.

La `CheckConstraint` n'est jamais différable sous PostgreSQL : elle est vérifiée à la fin de
chaque instruction. Elle transforme en garantie de la base une règle que seul
`TaskPostSerializer.validate()` imposait jusqu'ici.

### Ordre par défaut

- `Task.Meta.ordering = ('completed', F('completed_at').desc(nulls_last=True), 'position', '-pk')` :
  les non terminées par clé, puis les terminées de la plus récente à la plus ancienne.
  `nulls_last` rend explicite ce qui reposait sur un défaut de PostgreSQL.
- `DailyTask.Meta.ordering = ('date', 'position')` : la clé n'est unique que par jour, `date`
  rend l'ordre déterministe sur plusieurs jours.

Les prefetch existants (`tasks__tags`, `sections__tasks__tags`) héritent de cet ordre sans
requête supplémentaire.

### Migrations

Trois fichiers, chacun dans sa propre transaction. Mélanger écriture de lignes et `ALTER TABLE`
dans une même transaction échoue (« pending trigger events »), à cause des FK différées de Django.

| #    | Contenu                                                                 | Retour arrière                                           |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| 0010 | Ajout de `position`, nullable, `db_collation='C'`, sur les deux modèles | suppression des champs                                   |
| 0011 | `RunPython` : reprise des clés                                          | sans effet                                               |
| 0012 | `NOT NULL`, les deux `UniqueConstraint`, la `CheckConstraint`           | suppression des contraintes, champs de nouveau nullables |

**Reprise des clés (0011)**

- Tâches : regroupées par triplet (tri sur `project_id`, `section_id`, `collection_id` : trier sur
  le nom d'une FK suivrait le `Meta.ordering` du modèle lié), **toutes tâches confondues**,
  triées par `-pk` ; clés données
  par `generate_n_keys_between(None, None, n)`, enregistrées avec `bulk_update`. L'ordre visible
  des non terminées est inchangé (le front les trie aujourd'hui par `createdAt` décroissant). Une
  ancienne tâche terminée qu'on décoche revient à son rang de création.
- Daily tasks : regroupées par `(user_id, date)`, triées par `pk`, l'ordre actuel.

## 2. API

Toute la logique d'ordre vit dans `tout_doux/services/ordering.py` : verrou de liste, résolution
des ancres, vérification des voisins, calcul de clé.

### Déplacement : `POST task/{id}/move/` et `POST daily-task/{id}/move/`

Corps, deux clés **obligatoires** :

```json
{ "afterId": 12, "beforeId": 15 }
```

- `afterId` : voisin du dessus après le drop, ou `null` pour la tête.
- `beforeId` : voisin du dessous après le drop, ou `null` pour la fin.

Les deux sont des `IntegerField(allow_null=True)`, pas des `PrimaryKeyRelatedField`. Une ancre
supprimée doit donner 409, pas le 400 « does not exist » de DRF. L'ancre est résolue dans la liste
de l'utilisateur uniquement.

**Algorithme**, dans `transaction.atomic()` (`ATOMIC_REQUESTS` est désactivé) :

1. `get_object()`, donc 404 si la ligne est absente ou appartient à un autre compte. Côté daily,
   `get_queryset()` exclut `move` des préchargements lourds, comme il le fait pour `destroy`.
2. Verrou de liste :
   - tâche : `select_for_update()` sur la ligne du conteneur (`Project`, `Section` avec
     `select_related('project')`, ou `Collection`), qui donne aussi l'état d'archivage ;
   - daily : `select_for_update()` sur la ligne `User`.
     PostgreSQL interdit `FOR UPDATE` à travers une jointure externe, d'où cette requête dédiée.
3. Gardes :
   - liste archivée, ou jour passé : **403** ;
   - tâche terminée : **409** (côté daily, une ligne terminée reste déplaçable) ;
   - `afterId == id`, `beforeId == id`, ou `afterId == beforeId` non nuls : **400**.
4. Ancres : chargées dans la liste, et, pour les tâches, parmi les non terminées. Une ancre
   manquante donne **409**. Si les deux sont présentes, `after.position < before.position`, sinon
   **409**.
5. Une agrégation sur la liste, tâche déplacée exclue, clés strictement supérieures à la borne
   gauche (toutes si `afterId` est nul) :
   - tâches : `aggregate(right=Min('position'), next_open=Min('position', filter=Q(completed=False)))` ;
     les voisins sont corrects si `next_open` est égal à `before.position`, ou à `None` sans `beforeId` ;
   - daily : `aggregate(right=Min('position'))` ; les voisins sont corrects si `right` est égal
     à `before.position`, ou à `None`.
     Sinon **409**.
6. Si la clé actuelle est déjà strictement entre la borne gauche et `right`, aucune écriture.
7. Sinon, `position = generate_key_between(gauche, right)`, avec
   `save(update_fields=['position'])`.

La borne droite est prise dans la **liste complète**, terminées comprises : la nouvelle clé ne
peut pas prendre la valeur de celle d'une terminée cachée, qui reviendra à sa place une fois
décochée.

**Réponses**

| Code | Cas                                                                                    |
| ---- | -------------------------------------------------------------------------------------- |
| 200  | `{ "id": …, "position": "…" }`                                                         |
| 400  | corps mal formé, ancre égale à la ligne déplacée, ancres identiques                    |
| 403  | liste archivée, jour passé                                                             |
| 404  | ligne introuvable                                                                      |
| 409  | tâche terminée, ancre introuvable ou dans une autre liste, voisins qui ne le sont plus |

Le 409 est une nouvelle `APIException` dans `exceptions.py`, sur le modèle d'`AlreadyInDailyError`.

**Requêtes** : 5 requêtes utiles (ligne, verrou, ancres, agrégation, `UPDATE`). Le test en voit
deux de plus, le `SAVEPOINT` / `RELEASE SAVEPOINT` que `TestCase` place autour de `atomic()`.
`test_query_counts` suit sa convention : un plafond dans `BUDGETS`, et un test qui vérifie que le
nombre ne croît pas avec la taille de la liste. `count_queries` ne faisant que des `GET`, il
reçoit une variante `POST`.

### Création et report

La clé d'une ligne **créée sans position** est posée par `save()` du modèle, pas par les
sérialiseurs : toute création par l'ORM (fixtures de test, scripts) échouerait sinon sur le
`NOT NULL`, et la règle ne vaudrait que pour l'API.

| Opération                        | Clé                                                                                                                                                                           | Requêtes en plus    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `Task.save()` à la création      | verrou du conteneur, puis `generate_key_between(None, min de la liste)` : **en tête** ; ou entre les ancres du POST, vérifiées comme pour `move`                              | +2 (+3 avec ancres) |
| `DailyTask.save()` à la création | verrou `User`, puis `generate_key_between(max du jour, None)` : **en fin**                                                                                                    | +2                  |
| `POST daily-task/carry-over/`    | `bulk_create` n'appelle pas `save()` : verrou `User` **avant** la lecture des candidats, candidats dans l'ordre d'hier, `generate_n_keys_between(max d'aujourd'hui, None, n)` | +2                  |

Le min et le max portent sur toute la liste, terminées comprises.

### Contrat

Uniquement des ajouts : l'ancien front reste fonctionnel pendant la fenêtre de déploiement.

- `position` en lecture seule dans `TaskSerializer`, `TaskExtendedSerializer` (qui redéclare ses
  `Meta.fields`) et `DailyTaskSerializer`.
- Deux actions `move`.
- `POST task/` accepte `afterId` / `beforeId` facultatifs, avec la même validation que `move` :
  le wizard daily s'en sert pour créer une tâche en fin de la liste affichée.
- `PATCH task/` et `PATCH daily-task/` inchangés : cocher ou décocher ne touche pas à la clé.

## 3. Front

**Principe** : le front **ne calcule aucune clé**. Il place les éléments d'après les réponses du
serveur, et ne compare des clés qu'à un seul moment : quand une tâche est décochée.

### Modèles et API

- `position: string` sur `Task` et `DailyTask`.
- Routes `taskMove: 'task/:taskId/move/'` et `dailyTaskMove: 'daily-task/:dailyTaskId/move/'`.
- `taskApi.moveTask(id, anchors)` et `dailyTaskApi.moveDailyTask(id, anchors)`, qui renvoient
  `{ id, position }`.

### `utils/ordering.utils.ts`

| Fonction                                  | Rôle                                                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `anchorsAt(displayed, movedId, newIndex)` | `{ afterId, beforeId }` d'après les voisins dans la liste **affichée** ; `null` si l'élément n'a pas bougé (aucune requête)                                                          |
| `applyMove(list, id, anchors)`            | Placement optimiste **par identifiant** dans le tableau complet                                                                                                                      |
| `insertByPosition(list, task)`            | Insère une tâche décochée parmi les non terminées, par comparaison **native** (`<`) des clés du serveur                                                                              |
| `repositionAfterToggle(list, task)`       | Appelée **seulement quand l'état coché change** : tâche cochée, première du groupe des terminées ; tâche décochée, `insertByPosition`. Renommer une tâche terminée ne la déplace pas |
| `moveFailureMessage(error)`               | Texte de la snackbar : liste modifiée ailleurs (403, 404, 409) ou échec générique                                                                                                    |
| `createMoveQueue(onFailure)`              | File de déplacements (voir ci-dessous). Une file par store et par instance du composable : le rechargement porte de toute façon sur tout le projet ou tout le jour                   |

**La comparaison native** (`<`) compare les codes de caractères, comme la collation `C`.
`localeCompare` ignore la casse et placerait `a0` avant `Zz` : c'est le seul endroit qui mérite
un commentaire dans le code.

**File de déplacements**

1. Le placement optimiste est appliqué tout de suite.
2. Les requêtes d'une même liste partent **l'une après l'autre**.
3. **200** : la `position` reçue est recopiée sur l'élément.
4. **Tout autre résultat** : la file est vidée, la liste est **rechargée depuis le serveur**, et
   un message part dans la snackbar. 403, 404 et 409 signalent une liste modifiée ailleurs (_« This
   list changed elsewhere and has been reloaded »_) ; les autres erreurs passent par `notifyError`.
   Pas de restauration par copie : elle effacerait les mutations faites pendant l'attente.

### Stores `project` et `collection`

- `addTask` : `unshift`, puisque le serveur place la tâche en tête.
- `editTask` : `repositionAfterToggle`, seulement si `completed` a changé.
- `sortTasks` et `sortTask` sont supprimées, ainsi que `sortByCompletionDate` et ses tests.
- Nouvelle action `moveTask(taskId, anchors, sectionId?)`, `anchors` étant un `MoveAnchors`, : rechargement par
  `retrieveProject` ou `retrieveCollection`. Tester `sectionId !== undefined`, jamais la
  vérité de `sectionId` (`0` sert de sentinelle dans le domaine daily).

### Wizard daily (`DailyUpdateTask.vue`)

- `createProjectTask` et `createCollectionTask` : `push` devient `unshift`.
- `dailyTaskList` : création et report restent des `push`.
- Le déplacement vit dans un composable, `useDailyTaskMove(dailyTaskList, reload)`, que le lot
  drag and drop branchera avec `retrieveDailyTaskList`. Une fonction inutilisée dans un
  `<script setup>` ferait échouer eslint en CI.
- Pas d'état central (ADR 0002). La question est rouverte avec le chargement différé.

## 4. Cas limites

| Situation                                          | Traitement                                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Drop à la même place                               | aucune requête ; côté serveur, aucune écriture si la clé est déjà bonne                                              |
| Deux drops rapides                                 | file d'attente par liste                                                                                             |
| Liste modifiée dans un autre onglet                | 409, rechargement                                                                                                    |
| Tâche supprimée ailleurs                           | 404, rechargement                                                                                                    |
| Tâche cochée ailleurs                              | 409, rechargement                                                                                                    |
| Projet ou collection archivé ailleurs              | 403, rechargement                                                                                                    |
| Ancre inexistante ou appartenant à un autre compte | 409, sans fuite d'information                                                                                        |
| Seule tâche non terminée, deux ancres nulles       | 200 sans écriture                                                                                                    |
| Terminée cachée entre les ancres                   | clé placée avant la sienne ; une fois décochée, elle revient juste après la tâche déplacée                           |
| Création pendant un déplacement en cours           | le déplacement peut échouer en 409, puis rechargement — accepté                                                      |
| Décochage pendant un déplacement en cours          | comparaison avec l'ancienne clé de la tâche déplacée, écart local jusqu'au prochain chargement — **limite acceptée** |
| Minuit passe, page daily ouverte                   | 403, rechargement                                                                                                    |
| Report alors qu'aujourd'hui a déjà des lignes      | clés après la plus grande du jour, sous verrou                                                                       |
| Double planification simultanée d'une même tâche   | comportement actuel inchangé (500 possible) — inscrit en risque surveillé                                            |
| 401 pendant un déplacement                         | redirection vers la connexion, file abandonnée                                                                       |
| Clé de plus de 255 caractères                      | `DataError` (500) — risque surveillé, déclencheur à 100 caractères                                                   |
| Ancien front ouvert après le déploiement           | ignore `position` ; ses créations fonctionnent ; seul son tri local reste ancien                                     |

## 5. Tests

**Backend** (`test_api_contract.py`, `test_query_counts.py`, dans le style existant)

- Migration 0011 (`test_migrations.py`, `MigrationExecutor`) : ordre repris par liste et par
  jour, réversibilité.
- Ordre des payloads de projet, de section, de collection et de daily.
- Création en tête (tâches), en fin (daily) ; report dans l'ordre d'hier, y compris quand
  aujourd'hui a déjà des lignes.
- `move` en tête, en fin, au milieu, drop à la même place.
- Chaque cas de 400, 403, 404 et 409.
- Le cas de la terminée cachée : déplacement entre deux voisins qui l'encadrent, décochage, retour
  à sa place.
- `CheckConstraint` : `IntegrityError` sans conteneur, et avec deux conteneurs.
- Requêtes : `move`, création et report à nombre constant quelle que soit la taille de la liste,
  sous leur plafond `BUDGETS`.

**Front** (Vitest)

- `ordering.utils.spec.ts` : `'Zz' < 'a0'` (le piège `localeCompare`), `anchorsAt`, `applyMove`,
  `insertByPosition`, `repositionAfterToggle`, `moveFailureMessage`, file (succès, 409, erreur
  réseau, file vidée).
- Actions `moveTask` des stores, avec une vraie instance Pinia et `vi.mock('@/api')`.

## 6. Documentation à mettre à jour dans le même changement

**Backend**

- `adr/0007-ordre-par-fractional-indexing.md` : le choix de la représentation, les alternatives
  écartées (entier dense, trous, flottant, tableau d'ids, liste chaînée, `order_with_respect_to`,
  `django-ordered-model`) et le choix de la version 0.1.3.
- `architecture/data-model.md` : champs, contraintes, ordonnancements (ligne `Task` réécrite,
  dépendance au tri des `NULL` supprimée), nombre de migrations.
- `domain/glossary.md` : liste, position, règle « exactement un conteneur ».
- `domain/daily-rules.md` : ajout en fin, report dans l'ordre d'hier, jour passé figé pour `move`.
- `architecture/api-surface.md` : les deux actions `move` et leurs codes.
- `architecture/serializers.md` : sérialiseur de déplacement et réponse réduite.
- `patterns/archive-guards.md` : `move` comme 4ᵉ garde.
- `patterns/ownership-and-scoping.md` : ancres résolues dans la liste de l'utilisateur.
- `patterns/query-optimization.md` : budgets de `move`, création et report.
- `workflows/development.md` : dépendance `fractional-indexing`.
- `workflows/verification.md` : répétition de la migration et séquence de retour arrière.
- `quality/watched-risks.md` : longueur des clés (déclencheur à 100 caractères), double
  planification concurrente.

**Front**

- `architecture/state.md` : nouvelles actions, suppression de `sortTasks` et `sortTask`.
- `architecture/api-layer.md` : les deux routes.
- `domain/glossary.md` et `domain/daily-rules.md` : ordre d'une liste.
- `quality/refactoring-backlog.md` : R13 mis à jour (premiers tests de store), pas supprimé.

## 7. Déploiement et retour arrière

**Un seul déploiement.** `run.sh` applique 0010, 0011 et 0012 avant de lancer uWSGI : l'API
ne reçoit aucune requête pendant la migration.

**Avant la release**, avec la dernière sauvegarde de prod (étape faite par le mainteneur,
les données étant personnelles) :

1. requête de contrôle : aucune tâche sans exactement un conteneur ;
2. chargement de la sauvegarde en dev au niveau 0009, puis `migrate` ;
3. contrôle : pour chaque liste, l'ordre par `position` des non terminées est égal à l'ordre par
   `-pk`, et celui des daily à l'ordre par `pk` ;
4. aller-retour `migrate tout_doux 0009`, puis `migrate`.

| Situation                                  | Conduite                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0011 ou 0012 échoue                        | transaction annulée ; le backend ne démarre pas ; `td.sh rollback prod <précédente>` (l'ancien code accepte la colonne nullable)                          |
| Retour arrière après une migration réussie | d'abord `migrate tout_doux 0009` avec la **nouvelle** image, puis `td.sh rollback`. Un rollback d'image seul casserait la création de tâches (`NOT NULL`) |
| Pire cas                                   | sauvegarde JSON faite par `autoupdate` juste avant le déploiement                                                                                         |

## 8. Suites prévues

- **Interface de drag and drop** : appelle `anchorsAt`, puis `moveTask` ou `moveDailyTask`.
- **Déplacement vers une autre liste** : le corps de `move` recevra `sectionId`, `projectId` ou
  `collectionId`. Le changement de conteneur, qui vide aussi l'ancien, et la nouvelle clé doivent
  être écrits **dans le même `UPDATE`** (sinon la `CheckConstraint` refuse l'état
  intermédiaire). Il faudra verrouiller les deux listes, dans un ordre fixe, et appliquer la
  garde d'archivage aux deux.
- **Chargement différé des terminées** : rechargement limité à la liste concernée après un
  échec de `move`.
