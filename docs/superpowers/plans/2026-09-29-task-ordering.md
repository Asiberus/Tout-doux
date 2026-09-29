# Tri manuel des tâches et des daily tasks — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** rendre l'ordre des tâches (par liste) et des daily tasks (par jour) persistant, décidé
par le backend, et livrer la couche de déplacement que l'interface de drag and drop appellera.

**Architecture :** une clé texte `position` (fractional indexing, base 62, collation `C`) sur
`Task` et `DailyTask`. Le backend est seul à calculer les clés : à la création dans `save()`, au
déplacement via `POST …/{id}/move/` avec des ancres relatives, sous verrou de liste. Le front ne
fait que placer les éléments d'après les réponses du serveur et recharger la liste au moindre
échec.

**Tech stack :** Django 6.1, DRF 3.18, PostgreSQL 16, Python 3.14, `fractional-indexing==0.1.3` ;
Vue 3, Pinia, Vitest, axios.

**Spec :** `docs/superpowers/specs/2026-09-29-task-ordering-design.md` (amendée par la tâche 0).

## Contraintes globales

- **Aucune commande git qui modifie le dépôt** (`add`, `commit`, `rm`, `mv`, `checkout`…). Le
  mainteneur indexe et commite lui-même. Pas d'étape de commit par tâche : un seul message, rédigé
  à la tâche 11.
- **Aucun fichier modifié sans que son contenu ait été présenté et validé.** Le code de ce plan
  vaut présentation ; tout écart par rapport à lui se présente avant d'être appliqué.
- **Commentaires** : uniquement ce qui n'est pas lisible dans le code. Le plan n'en contient que
  pour les deux verrous (`lock_list`, `lock_day_list`), la borne droite de `ordering.move`, le
  contrat d'appel de `copy_daily_tasks_to_today`, le tri sur `*_id` de la migration 0011 et la
  comparaison `<` du front. Ne pas en ajouter.
- `fractional-indexing==0.1.3`, épinglée. `db_collation='C'` sur chaque champ `position`.
- Champs d'API en camelCase déclarés avec `source=`. Messages d'API et textes d'interface en
  anglais. Docstrings et documentation en français.
- Les trois gestes de cloisonnement (`backend/docs/patterns/ownership-and-scoping.md`) : les
  ancres sont cherchées dans la liste **et** parmi les lignes de l'utilisateur.
- La documentation touchée par une tâche est mise à jour **dans cette tâche**.
- Commandes backend : `docker exec tout_doux_backend python manage.py …` (conteneurs de dev
  démarrés). Commandes front : depuis `frontend/`, `yarn …`.

## Carte des fichiers

| Fichier                                                      | Responsabilité                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `backend/requirements.txt`                                   | dépendance `fractional-indexing`                                                                               |
| `backend/tout_doux/models/task.py`                           | champ, contraintes, ordre, `list_queryset()`, `lock_list()`, clé en tête dans `save()`                         |
| `backend/tout_doux/models/daily_task.py`                     | champ, contrainte, ordre, `lock_day_list()`, clé en fin dans `save()`                                          |
| `backend/tout_doux/migrations/0010_position.py`              | ajout nullable (généré)                                                                                        |
| `backend/tout_doux/migrations/0011_backfill_position.py`     | reprise des clés                                                                                               |
| `backend/tout_doux/migrations/0012_position_constraints.py`  | `NOT NULL`, contraintes, ordre (généré)                                                                        |
| `backend/tout_doux/services/ordering.py`                     | `move()` : ancres, voisins, borne droite, écriture                                                             |
| `backend/tout_doux/serializers/move/`                        | `MoveSerializer` (corps `{afterId, beforeId}`)                                                                 |
| `backend/tout_doux/exceptions.py`                            | `StaleListError` (409)                                                                                         |
| `backend/tout_doux/views/task.py`, `views/daily_task.py`     | actions `move`, verrou du report                                                                               |
| `backend/tout_doux/test_migrations.py`                       | reprise des clés (nouveau)                                                                                     |
| `backend/tout_doux/test_ordering.py`                         | création, ordre, contraintes, `move` (nouveau)                                                                 |
| `frontend/src/models/ordering.model.ts`                      | `MoveAnchors`, `OrderPosition`                                                                                 |
| `frontend/src/utils/ordering.utils.ts`                       | `anchorsAt`, `applyMove`, `insertByPosition`, `repositionAfterToggle`, `moveFailureMessage`, `createMoveQueue` |
| `frontend/src/store/project.store.ts`, `collection.store.ts` | `editTask` sans tri, `moveTask`                                                                                |
| `frontend/src/composables/useDailyTaskMove.ts`               | déplacement d'une daily task (nouveau)                                                                         |

---

### Tâche 0 : amender la spec

La conception a changé sur six points en écrivant ce plan. La spec doit les refléter avant le
code.

**Fichier :** Modify `docs/superpowers/specs/2026-09-29-task-ordering-design.md`

- [ ] **Étape 1 : § 1 « Champs »** — remplacer

```markdown
`Task.position` et `DailyTask.position` : `CharField(max_length=255, db_collation='C')`.
```

par

```markdown
`Task.position` et `DailyTask.position` : `CharField(max_length=255, db_collation='C',
editable=False)`. `editable=False` retire le champ des `ModelSerializer` : aucun sérialiseur
d'écriture ne peut le recevoir.
```

- [ ] **Étape 2 : § 1 « Reprise des clés »** — remplacer

```markdown
- Tâches : regroupées par triplet, **toutes tâches confondues**, triées par `-pk` ; clés données
```

par

```markdown
- Tâches : regroupées par triplet (tri sur `project_id`, `section_id`, `collection_id` : trier sur
  le nom d'une FK suivrait le `Meta.ordering` du modèle lié), **toutes tâches confondues**,
  triées par `-pk` ; clés données
```

- [ ] **Étape 3 : § 2 « Création et report »** — remplacer le tableau et la phrase qui le suit par

```markdown
La clé d'une ligne **créée sans position** est posée par `save()` du modèle, pas par les
sérialiseurs : toute création par l'ORM (fixtures de test, scripts) échouerait sinon sur le
`NOT NULL`, et la règle ne vaudrait que pour l'API.

| Opération                        | Clé                                                                                                                                                                           | Requêtes en plus |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `Task.save()` à la création      | verrou du conteneur, puis `generate_key_between(None, min de la liste)` : **en tête**                                                                                         | +2               |
| `DailyTask.save()` à la création | verrou `User`, puis `generate_key_between(max du jour, None)` : **en fin**                                                                                                    | +2               |
| `POST daily-task/carry-over/`    | `bulk_create` n'appelle pas `save()` : verrou `User` **avant** la lecture des candidats, candidats dans l'ordre d'hier, `generate_n_keys_between(max d'aujourd'hui, None, n)` | +2               |

Le min et le max portent sur toute la liste, terminées comprises.
```

- [ ] **Étape 4 : § 3, tableau de `utils/ordering.utils.ts`** — remplacer les lignes
      `moveAfter` et `repositionAfterUpdate` par

```markdown
| `applyMove(list, id, anchors)` | Placement optimiste **par identifiant** dans le tableau complet |
| `repositionAfterToggle(list, task)` | Appelée **seulement quand l'état coché change** : tâche cochée, première du groupe des terminées ; tâche décochée, `insertByPosition`. Renommer une tâche terminée ne la déplace pas |
| `moveFailureMessage(error)` | Texte de la snackbar : liste modifiée ailleurs (403, 404, 409) ou échec générique |
```

et remplacer la ligne `createMoveQueue(reload)` par

```markdown
| `createMoveQueue(onFailure)` | File de déplacements (voir ci-dessous). Une file par store et par instance du composable : le rechargement porte de toute façon sur tout le projet ou tout le jour |
```

- [ ] **Étape 5 : § 3 « Stores »** — remplacer

```markdown
- `editTask` : `repositionAfterUpdate`.
```

par

```markdown
- `editTask` : `repositionAfterToggle`, seulement si `completed` a changé.
```

et remplacer `moveTask(taskId, afterId, beforeId, sectionId?)` par
`moveTask(taskId, anchors, sectionId?)`, `anchors` étant un `MoveAnchors`.

- [ ] **Étape 6 : § 3 « Wizard daily »** — remplacer

```markdown
- Nouvelle action `moveDailyTask` : rechargement par `retrieveDailyTaskList()`.
```

par

```markdown
- Le déplacement vit dans un composable, `useDailyTaskMove(dailyTaskList, reload)`, que le lot
  drag and drop branchera avec `retrieveDailyTaskList`. Une fonction inutilisée dans un
  `<script setup>` ferait échouer eslint en CI.
```

- [ ] **Étape 7 : § 5 « Tests », partie backend** — ajouter en tête de liste

```markdown
- Migration 0011 (`test_migrations.py`, `MigrationExecutor`) : ordre repris par liste et par
  jour, réversibilité.
```

---

### Tâche 1 : dépendance, champ nullable et reprise des clés (0010, 0011)

**Fichiers :**

- Modify : `backend/requirements.txt`
- Modify : `backend/tout_doux/models/task.py`, `backend/tout_doux/models/daily_task.py`
- Create : `backend/tout_doux/migrations/0010_position.py` (généré),
  `backend/tout_doux/migrations/0011_backfill_position.py`
- Create : `backend/tout_doux/test_migrations.py`
- Modify : `backend/docs/workflows/development.md`

**Interfaces :**

- Produit : colonne `position` nullable sur `tout_doux_task` et `tout_doux_dailytask`, remplie
  pour toutes les lignes existantes.

- [ ] **Étape 1 : ajouter la dépendance**

Dans `backend/requirements.txt`, après `django-anymail[mailjet]==15.1` :

```
fractional-indexing==0.1.3
```

Dans `backend/docs/workflows/development.md`, remplacer « `requirements.txt` n'épingle que 8
dépendances directes » par « `requirements.txt` n'épingle que 9 dépendances directes ».

- [ ] **Étape 2 : reconstruire l'image de dev**

Run : `./td.sh build dev && ./td.sh start dev` (depuis la racine du dépôt)
Puis : `docker exec tout_doux_backend python -c "from fractional_indexing import generate_key_between; print(generate_key_between(None, None))"`
Expected : `a0`

- [ ] **Étape 3 : champ nullable sur les deux modèles**

Dans `backend/tout_doux/models/task.py`, après `collection = models.ForeignKey(…)` :

```python
    position = models.CharField(max_length=255, null=True, db_collation='C', editable=False)
```

Dans `backend/tout_doux/models/daily_task.py`, après `completed = models.BooleanField(default=False)` :

```python
    position = models.CharField(max_length=255, null=True, db_collation='C', editable=False)
```

- [ ] **Étape 4 : générer 0010 et une migration vide pour 0011**

Run :

```bash
docker exec tout_doux_backend python manage.py makemigrations tout_doux --name position
docker exec tout_doux_backend python manage.py makemigrations tout_doux --empty --name backfill_position
```

Expected : `0010_position.py` (deux `AddField`) et `0011_backfill_position.py` (aucune opération).

- [ ] **Étape 5 : écrire le test de migration**

Create `backend/tout_doux/test_migrations.py` :

```python
from datetime import date

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class PositionBackfillMigrationTest(TransactionTestCase):
    """0011 recopie l'ordre visible avant le tri manuel : `-pk` par liste pour les tâches, `pk`
    par jour pour les daily tasks."""

    before = [('tout_doux', '0010_position')]
    after = [('tout_doux', '0011_backfill_position')]

    def migrate(self, targets):
        executor = MigrationExecutor(connection)
        executor.migrate(targets)
        return executor.loader.project_state(targets).apps

    def setUp(self):
        apps = self.migrate(self.before)
        user = apps.get_model('tout_doux', 'User').objects.create(
            username='owner', email='owner@example.com', password='x'
        )
        project = apps.get_model('tout_doux', 'Project').objects.create(user=user, name='P')
        section = apps.get_model('tout_doux', 'Section').objects.create(
            user=user, name='S', project=project
        )
        collection = apps.get_model('tout_doux', 'Collection').objects.create(user=user, name='C')

        Task = apps.get_model('tout_doux', 'Task')
        self.direct = [
            Task.objects.create(user=user, name=f'D{index}', project=project).pk
            for index in range(3)
        ]
        self.in_section = [
            Task.objects.create(
                user=user, name=f'S{index}', section=section, completed=index == 1
            ).pk
            for index in range(3)
        ]
        self.in_collection = [
            Task.objects.create(user=user, name=f'C{index}', collection=collection).pk
            for index in range(2)
        ]

        DailyTask = apps.get_model('tout_doux', 'DailyTask')
        self.today = [
            DailyTask.objects.create(user=user, name=f'J{index}', date=date(2026, 9, 29)).pk
            for index in range(3)
        ]
        self.tomorrow = [
            DailyTask.objects.create(user=user, name=f'L{index}', date=date(2026, 9, 30)).pk
            for index in range(2)
        ]

        self.apps = self.migrate(self.after)

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

    def ordered(self, model_name, identifiers):
        model = self.apps.get_model('tout_doux', model_name)
        return list(
            model.objects.filter(pk__in=identifiers).order_by('position').values_list('pk', flat=True)
        )

    def test_tasks_keep_their_visible_order_newest_first(self):
        for identifiers in (self.direct, self.in_section, self.in_collection):
            self.assertEqual(self.ordered('Task', identifiers), sorted(identifiers, reverse=True))

    def test_completed_tasks_are_numbered_with_their_list(self):
        Task = self.apps.get_model('tout_doux', 'Task')
        self.assertFalse(Task.objects.filter(position__isnull=True).exists())

    def test_each_list_starts_its_own_sequence(self):
        Task = self.apps.get_model('tout_doux', 'Task')
        firsts = {
            Task.objects.filter(pk__in=identifiers).order_by('position').first().position
            for identifiers in (self.direct, self.in_section, self.in_collection)
        }
        self.assertEqual(firsts, {'a0'})

    def test_daily_tasks_keep_their_creation_order_per_day(self):
        for identifiers in (self.today, self.tomorrow):
            self.assertEqual(self.ordered('DailyTask', identifiers), sorted(identifiers))

    def test_the_migration_can_be_reversed_and_replayed(self):
        self.migrate([('tout_doux', '0009_alter_dailytask_date_to_localdate')])
        self.apps = self.migrate(self.after)
        self.assertEqual(self.ordered('DailyTask', self.today), sorted(self.today))
```

- [ ] **Étape 6 : vérifier l'échec**

Run : `docker exec tout_doux_backend python manage.py test tout_doux.test_migrations -v 2`
Expected : FAIL — les positions restent `NULL` (0011 est vide).

- [ ] **Étape 7 : écrire la reprise**

Remplacer le contenu de `backend/tout_doux/migrations/0011_backfill_position.py` :

```python
from itertools import groupby

from django.db import migrations
from fractional_indexing import generate_n_keys_between


def assign_positions(model, list_columns, order):
    # `project_id` et non `project` : trier sur le nom d'une FK suit le Meta.ordering du modèle lié.
    rows = model.objects.order_by(*list_columns, order)
    updated = []
    for _, siblings in groupby(rows, key=lambda row: tuple(getattr(row, column) for column in list_columns)):
        siblings = list(siblings)
        for row, position in zip(siblings, generate_n_keys_between(None, None, len(siblings))):
            row.position = position
            updated.append(row)
    model.objects.bulk_update(updated, ['position'], batch_size=500)


def backfill_positions(apps, schema_editor):
    assign_positions(
        apps.get_model('tout_doux', 'Task'), ('project_id', 'section_id', 'collection_id'), '-pk'
    )
    assign_positions(apps.get_model('tout_doux', 'DailyTask'), ('user_id', 'date'), 'pk')


class Migration(migrations.Migration):
    dependencies = [
        ('tout_doux', '0010_position'),
    ]

    operations = [
        migrations.RunPython(backfill_positions, migrations.RunPython.noop),
    ]
```

- [ ] **Étape 8 : vérifier le succès et l'absence de régression**

Run : `docker exec tout_doux_backend python manage.py test tout_doux.test_migrations -v 2`
Expected : 5 tests OK.
Run : `docker exec tout_doux_backend python manage.py test tout_doux`
Expected : OK.
Run : `docker exec tout_doux_backend python manage.py makemigrations --check --dry-run`
Expected : `No changes detected`.

---

### Tâche 2 : clé obligatoire, contraintes, ordre, création et report

**Fichiers :**

- Modify : `backend/tout_doux/models/task.py`, `backend/tout_doux/models/daily_task.py`
- Create : `backend/tout_doux/migrations/0012_position_constraints.py` (généré)
- Modify : `backend/tout_doux/serializers/task/task.py`, `serializers/task/task_extended.py`,
  `serializers/daily_task/daily_task.py`
- Modify : `backend/tout_doux/views/daily_task.py` (report)
- Create : `backend/tout_doux/test_ordering.py`
- Modify : `backend/tout_doux/test_api_contract.py`, `backend/tout_doux/test_query_counts.py`
- Modify : `backend/docs/architecture/data-model.md`, `backend/docs/domain/glossary.md`,
  `backend/docs/domain/daily-rules.md`, `backend/docs/workflows/verification.md`
- Create : `backend/docs/adr/0007-ordre-par-fractional-indexing.md`

**Interfaces :**

- Consomme : colonne `position` remplie (tâche 1).
- Produit :

  - `Task.list_queryset() -> QuerySet[Task]` : la liste de la tâche (triplet), tous utilisateurs ;
  - `Task.lock_list() -> Project | Section | Collection | None` : conteneur verrouillé (la
    `Section` porte son `project` préchargé) ;
  - `DailyTask.list_queryset() -> QuerySet[DailyTask]` : `(user, date)` ;
  - `DailyTask.lock_day_list(user_id: int) -> None` et `DailyTask.lock_list() -> None` ;
  - champ `position` dans `TaskSerializer`, `TaskExtendedSerializer`, `DailyTaskSerializer`.

- [ ] **Étape 1 : écrire les tests de création, d'ordre et de contraintes**

Create `backend/tout_doux/test_ordering.py` :

```python
"""Tri manuel des listes (docs/superpowers/specs/2026-09-29-task-ordering-design.md)."""
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone

from tout_doux.models import DailyTask, Task
from tout_doux.test_api_contract import DataFixtureTestCase


class TaskPositionTest(DataFixtureTestCase):
    def create_task(self, **owner):
        response = self.client.post(
            reverse('task-list'), {'name': 'Nouvelle', **owner}, format='json'
        )
        self.assertEqual(response.status_code, 201, response.data)
        return response.data

    def open_section_ids(self):
        response = self.client.get(reverse('project-detail', args=[self.project.pk]))
        self.assertEqual(response.status_code, 200, response.data)
        return [task['id'] for task in response.data['sections'][0]['tasks'] if not task['completed']]

    def test_a_new_task_goes_first_among_the_open_tasks_of_its_list(self):
        created = self.create_task(sectionId=self.section.pk)
        self.assertEqual(self.open_section_ids()[0], created['id'])

    def test_a_new_task_leaves_the_other_lists_untouched(self):
        before = list(Task.objects.filter(project=self.project).values_list('pk', 'position'))
        self.create_task(sectionId=self.section.pk)
        after = list(Task.objects.filter(project=self.project).values_list('pk', 'position'))
        self.assertEqual(after, before)

    def test_the_payload_exposes_the_position(self):
        created = self.create_task(collectionId=self.collection.pk)
        self.assertEqual(created['position'], Task.objects.get(pk=created['id']).position)

    def test_open_tasks_come_first_in_position_order(self):
        response = self.client.get(reverse('list-detail', args=[self.collection.pk]))
        tasks = response.data['tasks']
        self.assertEqual([task['completed'] for task in tasks], sorted(task['completed'] for task in tasks))
        positions = [task['position'] for task in tasks if not task['completed']]
        self.assertEqual(positions, sorted(positions))

    def test_completed_tasks_come_newest_first(self):
        older, newer = Task.objects.filter(collection=self.collection, completed=True).order_by('pk')
        Task.objects.filter(pk=older.pk).update(completed_at=timezone.now() - timedelta(days=1))
        Task.objects.filter(pk=newer.pk).update(completed_at=timezone.now())

        response = self.client.get(reverse('list-detail', args=[self.collection.pk]))
        completed = [task['id'] for task in response.data['tasks'] if task['completed']]
        self.assertEqual(completed, [newer.pk, older.pk])


class TaskConstraintTest(DataFixtureTestCase):
    def test_a_task_without_a_container_is_refused_by_the_database(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Task.objects.create(user=self.user, name='Orpheline')

    def test_a_task_with_two_containers_is_refused_by_the_database(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Task.objects.create(
                user=self.user, name='Double', project=self.project, section=self.section
            )

    def test_two_tasks_of_a_list_cannot_share_a_position(self):
        taken = Task.objects.filter(collection=self.collection).first().position
        with self.assertRaises(IntegrityError), transaction.atomic():
            Task.objects.create(
                user=self.user, name='Doublon', collection=self.collection, position=taken
            )


class DailyTaskPositionTest(DataFixtureTestCase):
    def plan(self, **payload):
        response = self.client.post(reverse('daily_task-list'), payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        return response.data

    def day_names(self, day):
        response = self.client.get(reverse('daily_task-list'), {'date': day.isoformat(), 'size': 0})
        self.assertEqual(response.status_code, 200, response.data)
        return [line['name'] for line in response.data['content']]

    def test_a_new_line_goes_last_of_its_day(self):
        self.plan(name='un')
        self.plan(name='deux')
        self.assertEqual(self.day_names(timezone.localdate()), ['un', 'deux'])

    def test_each_day_has_its_own_sequence(self):
        self.plan(name='aujourd\'hui')
        tomorrow = timezone.localdate() + timedelta(days=1)
        self.assertEqual(self.plan(name='demain', date=tomorrow.isoformat())['position'], 'a0')

    def test_the_carry_over_keeps_yesterdays_order_after_todays_lines(self):
        yesterday = timezone.localdate() - timedelta(days=1)
        lines = [DailyTask.objects.create(user=self.user, name=f'L{index}', date=yesterday) for index in range(3)]
        DailyTask.objects.filter(pk=lines[2].pk).update(position='Zz')
        self.plan(name='deja')

        response = self.client.post(reverse('daily_task-carry-over'))
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.day_names(timezone.localdate()), ['deja', 'L2', 'L0', 'L1'])
```

Dans `backend/tout_doux/test_api_contract.py`, `DailyTaskContractTest.test_response_keys_are_unchanged` :

```python
            {'id', 'date', 'task', 'commonTask', 'name', 'tags', 'action', 'completed', 'position'},
```

et, dans la docstring de `make_tasks`, remplacer `le tri ('-completed_at', '-pk') du modèle` par
`le tri des terminées par date du modèle`.

- [ ] **Étape 2 : écrire les tests de nombre de requêtes à l'écriture**

Dans `backend/tout_doux/test_query_counts.py`, ajouter une méthode à `QueryCountTestCase`, après
`assert_within_budget` :

```python
    def count_write_queries(self, route, payload, args=()):
        with CaptureQueriesContext(connection) as captured:
            response = self.client.post(reverse(route, args=args), payload, format='json')
            self.assertIn(response.status_code, (200, 201), response.data)
        return len(captured)
```

et, en fin de fichier :

```python
class WriteQueryCountTest(QueryCountTestCase):
    def test_task_creation_does_not_grow_with_the_list(self):
        payload = {'name': 'N', 'sectionId': self.section.pk}
        before = self.count_write_queries('task-list', payload)
        self.make_tasks(20, completed=5, section=self.section)
        self.assertEqual(self.count_write_queries('task-list', payload), before)

    def test_daily_task_creation_does_not_grow_with_the_day(self):
        before = self.count_write_queries('daily_task-list', {'name': 'libre'})
        for index in range(20):
            self.count_write_queries('daily_task-list', {'name': f'L{index}'})
        self.assertEqual(self.count_write_queries('daily_task-list', {'name': 'fin'}), before)
```

- [ ] **Étape 3 : vérifier l'échec**

Run : `docker exec tout_doux_backend python manage.py test tout_doux.test_ordering tout_doux.test_api_contract.DailyTaskContractTest -v 2`
Expected : FAIL (`KeyError: 'position'`, nouvelles tâches avec `position` à `NULL`, contraintes
absentes).

- [ ] **Étape 4 : modèle `Task`**

Dans `backend/tout_doux/models/task.py`, remplacer les imports par :

```python
from django.db import models, transaction
from django.db.models import F, Min, Q
from django.dispatch import receiver
from fractional_indexing import generate_key_between

from tout_doux.models.collection import Collection
from tout_doux.models.project import Project
from tout_doux.models.section import Section
from tout_doux.models.tag import Tag
from tout_doux.models.user import UserRelatedModel
```

remplacer le champ `position` de la tâche 1 par :

```python
    position = models.CharField(max_length=255, db_collation='C', editable=False)
```

remplacer `class Meta` par :

```python
    class Meta:
        ordering = ('completed', F('completed_at').desc(nulls_last=True), 'position', '-pk')
        constraints = (
            models.UniqueConstraint(
                fields=('project', 'section', 'collection', 'position'),
                nulls_distinct=False,
                name='unique_task_position_per_list',
            ),
            models.CheckConstraint(
                condition=(
                    Q(project__isnull=False, section__isnull=True, collection__isnull=True)
                    | Q(project__isnull=True, section__isnull=False, collection__isnull=True)
                    | Q(project__isnull=True, section__isnull=True, collection__isnull=False)
                ),
                name='task_exactly_one_container',
            ),
        )
```

et ajouter, après `__str__` :

```python
    def list_queryset(self):
        return Task.objects.filter(
            project_id=self.project_id,
            section_id=self.section_id,
            collection_id=self.collection_id,
        )

    def lock_list(self):
        """Verrouille le conteneur jusqu'à la fin de la transaction : deux écritures d'ordre sur
        la même liste calculeraient sinon leur clé sur le même état."""
        if self.section_id is not None:
            return (
                Section.objects.select_related('project')
                .select_for_update(of=('self',))
                .get(pk=self.section_id)
            )
        if self.project_id is not None:
            return Project.objects.select_for_update().get(pk=self.project_id)
        if self.collection_id is not None:
            return Collection.objects.select_for_update().get(pk=self.collection_id)
        return None

    def save(self, *args, **kwargs):
        if not self._state.adding or self.position:
            return super().save(*args, **kwargs)

        with transaction.atomic():
            self.lock_list()
            first = self.list_queryset().aggregate(first=Min('position'))['first']
            self.position = generate_key_between(None, first)
            super().save(*args, **kwargs)
```

- [ ] **Étape 5 : modèle `DailyTask`**

Dans `backend/tout_doux/models/daily_task.py`, remplacer les imports par :

```python
from django.db import models, transaction
from django.db.models import Max
from django.utils import timezone
from fractional_indexing import generate_key_between

from tout_doux.models.common_task import CommonTask
from tout_doux.models.tag import Tag
from tout_doux.models.task import Task
from tout_doux.models.user import User, UserRelatedModel
```

remplacer le champ `position` de la tâche 1 par :

```python
    position = models.CharField(max_length=255, db_collation='C', editable=False)
```

remplacer `class Meta` par :

```python
    class Meta:
        ordering = ('date', 'position')
        constraints = (
            models.UniqueConstraint(fields=('date', 'task'), name='unique_task_for_date'),
            models.UniqueConstraint(fields=('date', 'common_task'), name='unique_common_task_for_date'),
            models.UniqueConstraint(
                fields=('user', 'date', 'position'), name='unique_daily_task_position_per_day'
            ),
        )
```

et ajouter, à la fin de la classe :

```python
    @staticmethod
    def lock_day_list(user_id):
        """Verrouille la ligne de l'utilisateur : un jour encore vide n'a aucune ligne à
        verrouiller, et deux écritures d'ordre sur ce jour calculeraient sinon la même clé."""
        User.objects.select_for_update().only('pk').get(pk=user_id)

    def list_queryset(self):
        return DailyTask.objects.filter(user_id=self.user_id, date=self.date)

    def lock_list(self):
        DailyTask.lock_day_list(self.user_id)

    def save(self, *args, **kwargs):
        if not self._state.adding or self.position:
            return super().save(*args, **kwargs)

        with transaction.atomic():
            self.lock_list()
            last = self.list_queryset().aggregate(last=Max('position'))['last']
            self.position = generate_key_between(last, None)
            super().save(*args, **kwargs)
```

- [ ] **Étape 6 : générer 0012**

Run : `docker exec tout_doux_backend python manage.py makemigrations tout_doux --noinput --name position_constraints`
Expected : `0012_position_constraints.py` avec deux `AlterField` (`position` non nullable), deux
`AlterModelOptions` (ordres) et trois `AddConstraint`. L'avertissement sur les lignes à `NULL`
est attendu : 0011 les a toutes remplies.

- [ ] **Étape 7 : exposer `position`**

- `serializers/task/task.py` : ajouter `'position',` après `'completedAt',` dans `Meta.fields`.
- `serializers/task/task_extended.py` : ajouter `'position',` après `'completedAt',`.
- `serializers/daily_task/daily_task.py` : ajouter `'position',` après `'completed',`.

`editable=False` suffit : le champ sort en lecture seule, sans déclaration explicite.

- [ ] **Étape 8 : clés du report**

Dans `backend/tout_doux/views/daily_task.py`, ajouter les imports :

```python
from django.db.models import Max
from fractional_indexing import generate_n_keys_between
```

Dans la docstring de `copy_daily_tasks_to_today`, ajouter en dernier paragraphe :

```
    Les copies prennent des clés à la suite de la dernière ligne du jour, dans l'ordre reçu :
    l'appelant tient le verrou du jour et passe les lignes dans l'ordre de la veille.
```

Remplacer le début du corps (jusqu'au `bulk_create` inclus) par :

```python
    if not daily_tasks:
        return []

    last = DailyTask.objects.filter(
        user_id=daily_tasks[0].user_id, date=timezone.localdate()
    ).aggregate(last=Max('position'))['last']
    positions = generate_n_keys_between(last, None, len(daily_tasks))

    copies = DailyTask.objects.bulk_create([
        DailyTask(
            user_id=daily_task.user_id,
            task_id=daily_task.task_id,
            common_task_id=daily_task.common_task_id,
            name=daily_task.name,
            action=daily_task.action,
            position=position,
        )
        for daily_task, position in zip(daily_tasks, positions)
    ])
```

Dans `carry_over`, remplacer le bloc `with transaction.atomic():` par :

```python
        with transaction.atomic():
            DailyTask.lock_day_list(request.user.pk)
            created = copy_daily_tasks_to_today(daily_carry_over_candidates(self.get_queryset()))
```

- [ ] **Étape 9 : vérifier**

Run : `docker exec tout_doux_backend python manage.py test tout_doux -v 2`
Expected : OK, y compris `test_migrations` (son `tearDown` rejoue désormais 0012).
Run : `docker exec tout_doux_backend python manage.py makemigrations --check --dry-run`
Expected : `No changes detected`.
Run : `docker exec tout_doux_backend python manage.py check`
Expected : `System check identified no issues`.

- [ ] **Étape 10 : documentation**

`backend/docs/architecture/data-model.md` :

- En tête, remplacer « Les **7 migrations** de `tout_doux/migrations/` font foi » par « Les
  migrations de `tout_doux/migrations/` font foi ».
- Dans « Contraintes et invariants réellement en base », ajouter trois lignes :

```markdown
| `Task` | `UniqueConstraint(project, section, collection, position, nulls_distinct=False)` : une clé par liste | `models/task.py` |
| `Task` | `CheckConstraint` : exactement un de `project`, `section`, `collection` | `models/task.py` |
| `DailyTask` | `UniqueConstraint(user, date, position)` : une clé par jour | `models/daily_task.py` |
```

- Remplacer la phrase « **l'exclusivité n'est garantie que par le sérialiseur** » et la suite du
  paragraphe par : « L'exclusivité est garantie par la base (`task_exactly_one_container`),
  vérifiée à la fin de chaque instruction : un changement de conteneur doit poser la nouvelle FK
  et vider l'ancienne dans le même `UPDATE`. »
- Dans « Ordonnancements par défaut », lignes `Task` et `DailyTask` :

```markdown
| `DailyTask` | `('date', 'position')` | ordre manuel du jour |
| `Task` | `('completed', F('completed_at').desc(nulls_last=True), 'position', '-pk')` | **voir ci-dessous** |
```

et retirer `DailyTask` de la ligne `CommonTask, DailyTask, Tag`.

- Remplacer le paragraphe « **`Task` — l'ordre dépend du moteur.** … » par :

```markdown
**`Task` et `DailyTask` — l'ordre est manuel.** `position` est une clé de _fractional indexing_
(base 62, bibliothèque `fractional-indexing`), triée octet par octet grâce à
`db_collation='C'` : la collation de la base, `en_US.utf8`, mêlerait majuscules et minuscules.
Les tâches non terminées suivent leur clé ; les terminées, leur date de complétion, `NULL` en
dernier. Une ligne créée sans clé la reçoit dans `save()`, sous verrou de liste : **en tête**
pour une tâche, **en fin** pour une daily task. `bulk_create` n'appelle pas `save()` : le report
de la veille pose ses clés lui-même. Voir [../adr/0007-ordre-par-fractional-indexing.md](../adr/0007-ordre-par-fractional-indexing.md).
```

`backend/docs/domain/glossary.md` :

- Dans « Entités », après la ligne **Task**, ajouter :

```markdown
| **Liste** | Les tâches d'un même conteneur (tâches directes d'un projet, d'une section ou d'une collection), ou les daily tasks d'un même jour. Chacune a son propre ordre | projet \| section \| collection \| jour |
| **Position** | Clé texte qui fixe l'ordre d'une ligne dans sa liste. Calculée **uniquement** par le serveur ; unique dans la liste | tâche \| daily task |
```

- Dans « Ce que le serveur refuse », ajouter :

```markdown
| Une tâche sans conteneur, ou avec plusieurs, **quel que soit le chemin d'écriture** | contrainte base `task_exactly_one_container` | erreur d'intégrité (500) |
```

`backend/docs/domain/daily-rules.md` :

- Dans « À la création », après le tableau : « La ligne est placée **en fin** de son jour
  (`DailyTask.save()`). »
- Dans « Le report de la veille », remplacer « Les copies conservent l'ordre de la veille
  (`Meta.ordering = ('pk',)`). » par « Les copies conservent l'ordre de la veille et prennent
  place **après** les lignes déjà planifiées aujourd'hui. Le report verrouille le jour avant de
  lire les candidats. »

`backend/docs/workflows/verification.md` — ajouter avant « ## `check --deploy` » :

````markdown
## Répéter une migration sur les données de production

Pour une migration qui réécrit des données (0011, reprise des positions), la jouer d'abord sur
une copie de la dernière sauvegarde, dans une base jetable. La sauvegarde contient des données
personnelles : elle ne passe jamais par le dépôt.

```bash
# Valeurs de DB_HOST et DB_USER : .conf/development/conf.env
docker exec "$DB_HOST" createdb -U "$DB_USER" tout_doux_rehearsal
docker cp sauvegarde.json tout_doux_backend:/tmp/rehearsal.json

docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py migrate tout_doux 0009
docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py migrate admin
docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py loaddata /tmp/rehearsal.json

# Avant 0012 : aucune tâche sans exactement un conteneur. Doit afficher 0.
docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py shell -c "
from django.db.models import Q
from tout_doux.models import Task
one = (Q(project__isnull=False, section__isnull=True, collection__isnull=True)
       | Q(project__isnull=True, section__isnull=False, collection__isnull=True)
       | Q(project__isnull=True, section__isnull=True, collection__isnull=False))
print(Task.objects.exclude(one).count())"

docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py migrate

# L'ordre repris est l'ordre d'avant. Doit afficher 0.
docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py shell -c "
from itertools import groupby
from tout_doux.models import DailyTask, Task
tasks = Task.objects.filter(completed=False).order_by('project_id', 'section_id', 'collection_id', 'position')
days = DailyTask.objects.order_by('user_id', 'date', 'position')
bad = sum(1 for _, rows in groupby(tasks, lambda t: (t.project_id, t.section_id, t.collection_id))
          if (ids := [t.pk for t in rows]) != sorted(ids, reverse=True))
bad += sum(1 for _, rows in groupby(days, lambda d: (d.user_id, d.date))
           if (ids := [d.pk for d in rows]) != sorted(ids))
print(bad)"

# Aller-retour
docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py migrate tout_doux 0009
docker exec -e DB_NAME=tout_doux_rehearsal tout_doux_backend python manage.py migrate

docker exec tout_doux_backend rm /tmp/rehearsal.json
docker exec "$DB_HOST" dropdb -U "$DB_USER" tout_doux_rehearsal
```

**Retour arrière après une migration réussie en production** : d'abord
`migrate tout_doux 0009` avec la **nouvelle** image, puis `./td.sh rollback prod <version>`. Un
rollback d'image seul laisse `position` en `NOT NULL`, et l'ancien code ne sait plus créer de
tâche.
````

Create `backend/docs/adr/0007-ordre-par-fractional-indexing.md` :

```markdown
# 0007 — Ordre manuel par fractional indexing

- **Statut** : accepté
- **Date** : 2026-09

## Contexte

Les tâches d'une liste (tâches directes d'un projet, d'une section, d'une collection) et les
daily tasks d'un jour doivent pouvoir être réordonnées à la main, par glisser-déposer. L'ordre
doit être persistant, identique sur tous les écrans, et décidé par le serveur.

## Décision

Une clé texte `position` par ligne, générée par la bibliothèque `fractional-indexing` (0.1.3,
PyPI, compatible octet pour octet avec l'implémentation JS de référence de rocicorp). Entre deux
clés, il en existe toujours une troisième : un déplacement réécrit **une seule ligne**. La
colonne est en collation `C`. Le client envoie les voisins qu'il voit (`afterId`, `beforeId`) ;
le serveur vérifie qu'ils sont encore voisins, sous verrou de liste, et refuse en 409 sinon.

## Alternatives écartées

- **Entier dense avec décalage** — lisible et sans dépendance, mais un déplacement réécrit toutes
  les lignes entre l'ancienne et la nouvelle place, dans un ordre qui ne viole pas l'unicité.
- **Entier avec trous** — deux chemins de code, dont une renumérotation rare donc peu testée.
- **Flottant** — la précision s'épuise après une cinquantaine d'insertions au même endroit.
- **Tableau d'identifiants sur le parent** — donnée dénormalisée sur trois modèles, sans
  intégrité en base, triée en Python.
- **Liste chaînée** — lecture par CTE récursif, et un seul pointeur corrompu casse la liste.
- **`Meta.order_with_respect_to`** — une seule FK, or une tâche a trois conteneurs possibles.
- **`django-ordered-model`** — dernière version stable pour Django 3 et 4.
- **`fractional-indexing` 4.0.0** — publiée sur GitHub mais pas sur PyPI. Les clés Base62 sont
  identiques : la montée se fera sans effet sur les données quand elle y sera.

## Conséquences

- ✅ Un déplacement = un `UPDATE` d'une ligne ; création en tête ou en fin sans toucher aux autres.
- ✅ Une tâche décochée reprend sa place : sa clé n'a pas changé.
- ⚠️ Les clés s'allongent d'environ un caractère toutes les six insertions au même endroit.
  Voir [../quality/watched-risks.md](../quality/watched-risks.md) W14.
- ⚠️ Toute comparaison de clés doit être octet par octet : collation `C` en base, `<` natif en
  JS, jamais `localeCompare`.

## Preuve

`models/task.py`, `models/daily_task.py`, `services/ordering.py`, migrations 0010 à 0012.
```

---

### Tâche 3 : déplacer une tâche (`POST task/{id}/move/`)

**Fichiers :**

- Modify : `backend/tout_doux/exceptions.py`
- Create : `backend/tout_doux/serializers/move/__init__.py`, `backend/tout_doux/serializers/move/move.py`
- Create : `backend/tout_doux/services/ordering.py`
- Modify : `backend/tout_doux/views/task.py`
- Modify : `backend/tout_doux/test_ordering.py`, `backend/tout_doux/test_query_counts.py`
- Modify : `backend/docs/architecture/api-surface.md`, `backend/docs/architecture/serializers.md`,
  `backend/docs/patterns/archive-guards.md`, `backend/docs/patterns/ownership-and-scoping.md`,
  `backend/docs/patterns/query-optimization.md`, `backend/docs/quality/watched-risks.md`,
  `backend/CLAUDE.md`

**Interfaces :**

- Consomme : `Task.list_queryset()`, `Task.lock_list()` (tâche 2).
- Produit :

  - `StaleListError` (409) dans `tout_doux.exceptions` ;
  - `MoveSerializer` dans `tout_doux.serializers.move`, `validated_data` = `{'after_id': int | None, 'before_id': int | None}` ;
  - `tout_doux.services.ordering.move(item, after_id, before_id, anchor_filter=None) -> None` :
    l'appelant tient le verrou ; lève `StaleListError` ;
  - route `task-move`, réponse `{'id': int, 'position': str}`.

- [ ] **Étape 1 : écrire les tests**

Ajouter à `backend/tout_doux/test_ordering.py` (import supplémentaire : `from tout_doux.models import Collection, Project`) :

```python
class TaskMoveTest(DataFixtureTestCase):
    """La section de la fixture reçoit trois tâches ouvertes de plus : cinq à déplacer."""

    def setUp(self):
        super().setUp()
        self.make_tasks(3, completed=0, section=self.section)
        self.a, self.b, self.c, self.d, self.e = self.open_ids()

    def open_ids(self):
        return list(
            Task.objects.filter(section=self.section, completed=False).values_list('pk', flat=True)
        )

    def move(self, task_id, after=None, before=None):
        return self.client.post(
            reverse('task-move', args=[task_id]), {'afterId': after, 'beforeId': before}, format='json'
        )

    def toggle(self, task_id, completed):
        response = self.client.patch(
            reverse('task-detail', args=[task_id]), {'completed': completed}, format='json'
        )
        self.assertEqual(response.status_code, 200, response.data)

    def test_the_last_task_moves_to_the_top(self):
        response = self.move(self.e, before=self.a)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(set(response.data), {'id', 'position'})
        self.assertEqual(self.open_ids(), [self.e, self.a, self.b, self.c, self.d])

    def test_the_first_task_moves_to_the_bottom(self):
        self.assertEqual(self.move(self.a, after=self.e).status_code, 200)
        self.assertEqual(self.open_ids(), [self.b, self.c, self.d, self.e, self.a])

    def test_a_task_moves_between_two_neighbours(self):
        self.assertEqual(self.move(self.e, after=self.a, before=self.b).status_code, 200)
        self.assertEqual(self.open_ids(), [self.a, self.e, self.b, self.c, self.d])

    def test_a_drop_in_place_writes_nothing(self):
        before = Task.objects.get(pk=self.b).position
        self.assertEqual(self.move(self.b, after=self.a, before=self.c).status_code, 200)
        self.assertEqual(Task.objects.get(pk=self.b).position, before)

    def test_the_only_open_task_can_be_dropped_on_itself(self):
        collection = Collection.objects.create(user=self.user, name='Seule', description='')
        [task] = self.make_tasks(1, completed=0, collection=collection)
        self.assertEqual(self.move(task.pk).status_code, 200)

    def test_a_hidden_completed_task_returns_to_its_place(self):
        self.toggle(self.b, True)
        self.assertEqual(self.move(self.e, after=self.a, before=self.c).status_code, 200)
        self.toggle(self.b, False)
        self.assertEqual(self.open_ids(), [self.a, self.e, self.b, self.c, self.d])

    def test_anchors_that_are_no_longer_neighbours_are_a_409(self):
        self.assertEqual(self.move(self.e, after=self.a, before=self.c).status_code, 409)

    def test_a_completed_anchor_is_a_409(self):
        Task.objects.filter(pk=self.b).update(completed=True)
        self.assertEqual(self.move(self.e, after=self.a, before=self.b).status_code, 409)

    def test_a_missing_anchor_is_a_409(self):
        self.assertEqual(self.move(self.e, after=self.a, before=999999).status_code, 409)

    def test_an_anchor_from_another_list_is_a_409(self):
        other = Task.objects.filter(project=self.project, completed=False).first()
        self.assertEqual(self.move(self.e, after=other.pk).status_code, 409)

    def test_an_anchor_of_another_user_is_a_409(self):
        project = Project.objects.create(user=self.other, name='Autrui', description='')
        foreign = Task.objects.create(user=self.other, name='Autrui', project=project)
        self.assertEqual(self.move(self.e, after=foreign.pk).status_code, 409)

    def test_a_completed_task_cannot_be_moved(self):
        Task.objects.filter(pk=self.e).update(completed=True)
        self.assertEqual(self.move(self.e, before=self.a).status_code, 409)

    def test_a_task_cannot_be_its_own_anchor(self):
        self.assertEqual(self.move(self.e, after=self.e).status_code, 400)

    def test_both_anchors_cannot_be_the_same_task(self):
        self.assertEqual(self.move(self.e, after=self.a, before=self.a).status_code, 400)

    def test_both_anchors_are_required(self):
        response = self.client.post(reverse('task-move', args=[self.e]), {}, format='json')
        self.assertEqual(response.status_code, 400, response.data)

    def test_a_task_of_an_archived_project_cannot_be_moved(self):
        Project.objects.filter(pk=self.project.pk).update(archived=True)
        self.assertEqual(self.move(self.e, before=self.a).status_code, 403)

    def test_another_users_task_is_a_404(self):
        project = Project.objects.create(user=self.other, name='Autrui', description='')
        foreign = Task.objects.create(user=self.other, name='Autrui', project=project)
        self.assertEqual(self.move(foreign.pk).status_code, 404)
```

Dans `backend/tout_doux/test_query_counts.py`, ajouter après `BUDGETS` :

```python
WRITE_BUDGETS = {
    'task-move': 7,
}
```

et à `WriteQueryCountTest` :

```python
    def move_last_to_top(self):
        open_ids = list(
            Task.objects.filter(section=self.section, completed=False).values_list('pk', flat=True)
        )
        return self.count_write_queries(
            'task-move', {'afterId': None, 'beforeId': open_ids[0]}, args=[open_ids[-1]]
        )

    def test_task_move_stays_within_budget_whatever_the_list_size(self):
        before = self.move_last_to_top()
        self.assertLessEqual(before, WRITE_BUDGETS['task-move'])
        self.make_tasks(20, completed=5, section=self.section)
        self.assertEqual(self.move_last_to_top(), before)
```

Le budget de 7 compte 5 requêtes utiles (tâche, verrou, ancres, agrégation, `UPDATE`) plus le
`SAVEPOINT` / `RELEASE SAVEPOINT` de `atomic()` dans un `TestCase`. Si la première exécution
donne un autre nombre, comprendre l'écart avant de toucher au budget.

- [ ] **Étape 2 : vérifier l'échec**

Run : `docker exec tout_doux_backend python manage.py test tout_doux.test_ordering.TaskMoveTest tout_doux.test_query_counts.WriteQueryCountTest -v 2`
Expected : FAIL — `NoReverseMatch: 'task-move'`.

- [ ] **Étape 3 : l'exception 409**

Ajouter à `backend/tout_doux/exceptions.py` :

```python
class StaleListError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This list changed since it was loaded'
```

- [ ] **Étape 4 : le sérialiseur de déplacement**

Create `backend/tout_doux/serializers/move/__init__.py` :

```python
from .move import MoveSerializer
```

Create `backend/tout_doux/serializers/move/move.py` :

```python
from rest_framework import serializers


class MoveSerializer(serializers.Serializer):
    afterId = serializers.IntegerField(source='after_id', allow_null=True)
    beforeId = serializers.IntegerField(source='before_id', allow_null=True)

    def validate(self, data):
        if data['after_id'] is not None and data['after_id'] == data['before_id']:
            raise serializers.ValidationError('afterId and beforeId must differ')

        return data
```

- [ ] **Étape 5 : le service**

Create `backend/tout_doux/services/ordering.py` :

```python
from django.db.models import Min
from fractional_indexing import generate_key_between

from tout_doux.exceptions import StaleListError


def move(item, after_id, before_id, anchor_filter=None):
    """Place `item` entre les voisins que le client voit.

    L'appelant tient le verrou de la liste. Les ancres sont cherchées parmi les lignes affichées
    (`anchor_filter`) ; la borne droite, dans toute la liste, pour que la clé ne prenne jamais
    celle d'une ligne cachée.
    """
    siblings = item.list_queryset().exclude(pk=item.pk)
    anchors = siblings.filter(user_id=item.user_id)
    if anchor_filter is not None:
        anchors = anchors.filter(anchor_filter)

    wanted = [pk for pk in (after_id, before_id) if pk is not None]
    positions = dict(anchors.filter(pk__in=wanted).values_list('pk', 'position')) if wanted else {}
    if len(positions) != len(wanted):
        raise StaleListError()

    left, expected = positions.get(after_id), positions.get(before_id)
    if left is not None and expected is not None and left >= expected:
        raise StaleListError()

    following = siblings.filter(position__gt=left) if left is not None else siblings
    bounds = following.aggregate(
        right=Min('position'),
        next_anchor=Min('position', filter=anchor_filter) if anchor_filter is not None else Min('position'),
    )
    if bounds['next_anchor'] != expected:
        raise StaleListError()

    right = bounds['right']
    if (left is None or left < item.position) and (right is None or item.position < right):
        return

    item.position = generate_key_between(left, right)
    item.save(update_fields=['position'])
```

- [ ] **Étape 6 : l'action**

Remplacer `backend/tout_doux/views/task.py` par :

```python
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from tout_doux.exceptions import StaleListError
from tout_doux.models import Section
from tout_doux.serializers.move import MoveSerializer
from tout_doux.serializers.task import TaskSerializer, TaskPostSerializer, TaskPatchSerializer
from tout_doux.services import ordering


class TaskViewSet(mixins.CreateModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskPostSerializer
        elif self.action in ['partial_update', 'update']:
            return TaskPatchSerializer
        elif self.action == 'move':
            return MoveSerializer
        else:
            return TaskSerializer

    def get_queryset(self):
        return self.request.user.tasks.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (instance.project and instance.project.archived) \
                or (instance.section and instance.section.project.archived) \
                or (instance.collection and instance.collection.archived):
            raise PermissionDenied('This task is related to either an archived project or an archived collection')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        after_id = serializer.validated_data['after_id']
        before_id = serializer.validated_data['before_id']

        with transaction.atomic():
            task = self.get_object()
            if task.pk in (after_id, before_id):
                raise ValidationError('A task cannot be its own anchor')

            container = task.lock_list()
            owner = container.project if isinstance(container, Section) else container
            if owner.archived:
                raise PermissionDenied('This task is related to either an archived project or an archived collection')
            if task.completed:
                raise StaleListError()

            ordering.move(task, after_id, before_id, anchor_filter=Q(completed=False))

        return Response({'id': task.pk, 'position': task.position})
```

- [ ] **Étape 7 : vérifier**

Run : `docker exec tout_doux_backend python manage.py test tout_doux -v 2`
Expected : OK.
Run : `docker exec tout_doux_backend python manage.py show_urls | grep move`
Expected : `/task/<pk>/move/`.

- [ ] **Étape 8 : documentation**

`backend/docs/architecture/api-surface.md`, tableau « Ressources », après `task/{pk}/` :

```markdown
| `task/{pk}/move/` | POST | `Move` | | corps `{afterId, beforeId}`, répond `{id, position}` ; **403** archivé, **409** liste périmée |
```

`backend/docs/architecture/serializers.md` :

- tableau des suffixes, ajouter : `| \`Move\` | corps d'un déplacement \`{afterId, beforeId}\`, sans modèle | \`serializers.Serializer\` nu |` ;
- ligne Task du tableau des ressources, colonne « Écriture » : `` `TaskPost`, `TaskPatch`, `Move` `` ;
- à la fin de « 2. Les sérialiseurs d'écriture répondent avec **un autre** sérialiseur » :
  « Exception : les actions `move` répondent `{id, position}`, sans la forme de lecture — le
  client n'a besoin que de la clé. »

`backend/docs/patterns/archive-guards.md` :

- tableau des actions, après « Supprimer une section, une tâche ou un événement dedans » :

```markdown
| Déplacer une tâche dedans | **refusé** (403) | `This task is related to either an archived project or an archived collection` |
```

- tableau des sites : `| \`views/task.py\` | \`move\` | déplacement |`.

`backend/CLAUDE.md`, ligne « Archivage » des pièges : remplacer « garde à écrire **3 fois** :
création, modification, suppression » par « garde à écrire **à chaque écriture** : création,
modification, suppression, déplacement ».

`backend/docs/patterns/ownership-and-scoping.md`, tableau des sites :
`| \`services/ordering.py\` | \`move\` | ancres, cherchées dans la liste **et** parmi les lignes de l'utilisateur |`.

`backend/docs/patterns/query-optimization.md` :

- tableau des sites : `| \`services/ordering.py\` | une agrégation \`Min\` (borne droite et voisin attendu) ; verrou \`select_for_update\` posé par l'appelant |` ;
- tableau des mesures : `| \`POST /task/{pk}/move/\` | — | aucune | 5 |`.

`backend/docs/quality/watched-risks.md` — ligne d'index et section :

```markdown
| W14 | Clés d'ordre limitées à 255 caractères | Robustesse | Une `position` de plus de 100 caractères en base |
```

```markdown
## W14 — Clés d'ordre limitées à 255 caractères

- **Origine** : `models/task.py`, `models/daily_task.py` — `position = CharField(max_length=255)`.
- **Contexte** : chaque insertion au même endroit coupe l'intervalle en deux ; un caractère base
  62 porte environ 6 bits, soit un caractère de plus toutes les six insertions consécutives au
  même point. Au-delà de 255 caractères, l'écriture lève une `DataError` (500).
- **Décision** : ne pas agir — il faut plus d'un millier d'insertions consécutives au même point.
  Le remède, régénérer les clés d'une liste avec `generate_n_keys_between`, tient en quelques
  lignes.
- **Déclencheur** : `SELECT max(length(position)) FROM tout_doux_task` (ou `tout_doux_dailytask`)
  dépasse 100.
```

---

### Tâche 4 : déplacer une daily task (`POST daily-task/{id}/move/`)

**Fichiers :**

- Modify : `backend/tout_doux/views/daily_task.py`
- Modify : `backend/tout_doux/test_ordering.py`, `backend/tout_doux/test_query_counts.py`
- Modify : `backend/docs/architecture/api-surface.md`, `backend/docs/domain/daily-rules.md`,
  `backend/docs/patterns/query-optimization.md`, `backend/docs/quality/watched-risks.md`

**Interfaces :**

- Consomme : `DailyTask.lock_list()` (tâche 2), `MoveSerializer`, `ordering.move` (tâche 3).
- Produit : route `daily_task-move`, réponse `{'id': int, 'position': str}`.

- [ ] **Étape 1 : écrire les tests**

Ajouter à `backend/tout_doux/test_ordering.py` :

```python
class DailyTaskMoveTest(DataFixtureTestCase):
    def setUp(self):
        super().setUp()
        self.today = timezone.localdate()
        self.l0, self.l1, self.l2, self.l3 = [self.plan(name=f'L{index}')['id'] for index in range(4)]

    def plan(self, **payload):
        response = self.client.post(reverse('daily_task-list'), payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        return response.data

    def day_ids(self, day=None):
        response = self.client.get(
            reverse('daily_task-list'), {'date': (day or self.today).isoformat(), 'size': 0}
        )
        return [line['id'] for line in response.data['content']]

    def move(self, line_id, after=None, before=None):
        return self.client.post(
            reverse('daily_task-move', args=[line_id]), {'afterId': after, 'beforeId': before}, format='json'
        )

    def complete(self, line_id):
        response = self.client.patch(
            reverse('daily_task-detail', args=[line_id]), {'completed': True}, format='json'
        )
        self.assertEqual(response.status_code, 200, response.data)

    def test_the_last_line_moves_to_the_top(self):
        response = self.move(self.l3, before=self.l0)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(set(response.data), {'id', 'position'})
        self.assertEqual(self.day_ids(), [self.l3, self.l0, self.l1, self.l2])

    def test_a_completed_line_can_be_moved(self):
        self.complete(self.l1)
        self.assertEqual(self.move(self.l1, after=self.l3).status_code, 200)
        self.assertEqual(self.day_ids(), [self.l0, self.l2, self.l3, self.l1])

    def test_completed_lines_count_as_neighbours(self):
        self.complete(self.l1)
        self.assertEqual(self.move(self.l3, after=self.l0, before=self.l2).status_code, 409)

    def test_a_line_of_another_day_is_not_an_anchor(self):
        tomorrow = self.today + timedelta(days=1)
        other_day = self.plan(name='demain', date=tomorrow.isoformat())['id']
        self.assertEqual(self.move(self.l3, after=other_day).status_code, 409)

    def test_a_future_day_can_be_reordered(self):
        tomorrow = (self.today + timedelta(days=1)).isoformat()
        first, second = self.plan(name='A', date=tomorrow)['id'], self.plan(name='B', date=tomorrow)['id']
        self.assertEqual(self.move(second, before=first).status_code, 200)

    def test_a_past_day_is_frozen(self):
        DailyTask.objects.filter(pk__in=[self.l0, self.l1, self.l2, self.l3]).update(
            date=self.today - timedelta(days=1)
        )
        self.assertEqual(self.move(self.l3, before=self.l0).status_code, 403)

    def test_another_users_line_is_a_404(self):
        foreign = DailyTask.objects.create(user=self.other, name='Autrui')
        self.assertEqual(self.move(foreign.pk).status_code, 404)
```

Dans `backend/tout_doux/test_query_counts.py`, ajouter `'daily_task-move': 7,` à `WRITE_BUDGETS`
et à `WriteQueryCountTest` :

```python
    def swap_the_last_two_lines(self):
        penultimate, last = [
            self.client.post(reverse('daily_task-list'), {'name': f'L{index}'}, format='json').data['id']
            for index in range(2)
        ]
        return self.count_write_queries(
            'daily_task-move', {'afterId': last, 'beforeId': None}, args=[penultimate]
        )

    def test_daily_task_move_stays_within_budget_whatever_the_day_size(self):
        before = self.swap_the_last_two_lines()
        self.assertLessEqual(before, WRITE_BUDGETS['daily_task-move'])
        for index in range(20):
            self.client.post(reverse('daily_task-list'), {'name': f'M{index}'}, format='json')
        self.assertEqual(self.swap_the_last_two_lines(), before)
```

`swap_the_last_two_lines` crée deux lignes en fin de jour, puis place l'avant-dernière après la
dernière : l'ancre est la fin du jour quel que soit le nombre de lignes au-dessus. (Envoyer
`afterId: null` voudrait dire « en tête du jour », ce que ces lignes ne sont pas.)

- [ ] **Étape 2 : vérifier l'échec**

Run : `docker exec tout_doux_backend python manage.py test tout_doux.test_ordering.DailyTaskMoveTest -v 2`
Expected : FAIL — `NoReverseMatch: 'daily_task-move'`.

- [ ] **Étape 3 : l'action**

Dans `backend/tout_doux/views/daily_task.py` :

- imports : `ValidationError` ajouté à `from rest_framework.exceptions import …`, puis
  `from tout_doux.serializers.move import MoveSerializer` et
  `from tout_doux.services import ordering` ;
- dans `get_queryset`, remplacer `if self.action != 'destroy':` par
  `if self.action not in ('destroy', 'move'):` et le commentaire qui le précède par
  `# \`destroy\` et \`move\` ne lisent que la ligne elle-même ; les autres actions répondent toutes`
`# avec la chaîne imbriquée complète, y compris les écritures via \`to_representation\`.` ;
- dans `get_serializer_class`, avant le `else` : `elif self.action == 'move': return MoveSerializer` ;
- ajouter après `destroy` :

```python
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        after_id = serializer.validated_data['after_id']
        before_id = serializer.validated_data['before_id']

        with transaction.atomic():
            daily_task = self.get_object()
            if daily_task.pk in (after_id, before_id):
                raise ValidationError('A daily task cannot be its own anchor')
            if daily_task.date < timezone.localdate():
                raise PermissionDenied('The daily task is related to a past day')

            daily_task.lock_list()
            ordering.move(daily_task, after_id, before_id)

        return Response({'id': daily_task.pk, 'position': daily_task.position})
```

- [ ] **Étape 4 : vérifier**

Run : `docker exec tout_doux_backend python manage.py test tout_doux -v 2`
Expected : OK.

- [ ] **Étape 5 : documentation**

`backend/docs/architecture/api-surface.md`, après `daily-task/{pk}/` :

```markdown
| `daily-task/{pk}/move/` | POST | `Move` | | corps `{afterId, beforeId}`, répond `{id, position}` ; **403** jour passé, **409** liste périmée |
```

`backend/docs/domain/daily-rules.md` — nouvelle section avant « ## La suppression » :

```markdown
## L'ordre du jour — `daily-task/{pk}/move/`

Chaque jour a son propre ordre. Une ligne créée va **en fin** de son jour ; le report ajoute les
copies après les lignes existantes, dans l'ordre de la veille.

Une ligne se déplace, **terminée ou non**, sur un jour présent ou futur. Un jour passé est figé
(403, comme la suppression). Le client envoie les voisins qu'il voit, terminées comprises
puisqu'elles restent affichées ; si ce ne sont plus des voisins, le serveur répond 409 et le
client recharge le jour.
```

`backend/docs/patterns/query-optimization.md`, tableau des mesures :
`| \`POST /daily-task/{pk}/move/\` | — | aucune | 5 |`; tableau des sites, ligne`views/daily_task.py`: remplacer « hors`destroy`» par « hors`destroy`et`move` ».

`backend/docs/quality/watched-risks.md` — ligne d'index et section :

```markdown
| W15 | Double planification simultanée d'une même tâche : 500 | Robustesse | Une `IntegrityError` sur `unique_task_for_date` dans les logs |
```

```markdown
## W15 — Double planification simultanée d'une même tâche

- **Origine** : `serializers/daily_task/daily_task_post.py`, garde `exists()` de `validate()`.
- **Contexte** : la garde anti-doublon lit la base **avant** que `DailyTask.save()` ne prenne le
  verrou du jour. Deux onglets qui planifient la même tâche au même instant passent tous deux la
  garde ; le second bute sur `unique_task_for_date` et répond 500 au lieu de 409.
- **Décision** : ne pas agir — il faut deux clics simultanés sur la même tâche, et aucune donnée
  n'est abîmée.
- **Déclencheur** : une `IntegrityError` sur `unique_task_for_date` ou
  `unique_common_task_for_date` dans les logs.
```

---

### Tâche 5 : modèles, fixtures et fonctions d'ordre du front

**Fichiers :**

- Create : `frontend/src/models/ordering.model.ts`
- Modify : `frontend/src/models/task.model.ts`, `frontend/src/models/daily-task.model.ts`
- Modify : `frontend/src/test/fixtures.ts`
- Create : `frontend/src/utils/ordering.utils.ts`, `frontend/src/utils/ordering.utils.spec.ts`

**Interfaces :**

- Produit :

  - `MoveAnchors { afterId: number | null; beforeId: number | null }`,
    `OrderPosition { id: number; position: string }` ;
  - `anchorsAt(displayed: { id: number }[], movedId: number, newIndex: number): MoveAnchors | null` ;
  - `applyMove<T extends { id: number }>(list: T[], id: number, anchors: MoveAnchors): void` ;
  - `insertByPosition<T extends Positioned>(list: T[], item: T): void` ;
  - `repositionAfterToggle<T extends Positioned>(list: T[], item: T): void` ;
  - `moveFailureMessage(error: unknown): string` ;
  - `createMoveQueue(onFailure: (error: unknown) => void): MoveQueue`, avec
    `MoveQueue.enqueue(request: () => Promise<void>): Promise<void>` ;
  - fixtures `makeDailyTask(overrides)` et `makeAxiosError(status)`.

- [ ] **Étape 1 : modèles**

Create `frontend/src/models/ordering.model.ts` :

```ts
export interface MoveAnchors {
  afterId: number | null;
  beforeId: number | null;
}

export interface OrderPosition {
  id: number;
  position: string;
}
```

Dans `frontend/src/models/task.model.ts`, interface `Task`, après `completedAt: string` :
`position: string`. Dans `frontend/src/models/daily-task.model.ts`, interface `DailyTask`, après
`completed: boolean` : `position: string`.

- [ ] **Étape 2 : fixtures**

Dans `frontend/src/test/fixtures.ts` :

- imports : `import { AxiosError, AxiosHeaders } from 'axios'` et
  `import { DailyTask } from '@/models/daily-task.model'` ;
- dans `makeTask`, après `completedAt: '',` : `position: 'a0',` ;
- en fin de fichier :

```ts
export function makeDailyTask(overrides: Partial<DailyTask> = {}): DailyTask {
  return {
    id: 1,
    date: "2026-09-29",
    tags: [],
    completed: false,
    position: "a0",
    ...overrides,
  };
}

export function makeAxiosError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    config,
    undefined,
    {
      status,
      statusText: "",
      headers: {},
      config,
      data: {},
    },
  );
}
```

- [ ] **Étape 3 : écrire les tests**

Create `frontend/src/utils/ordering.utils.spec.ts` :

```ts
import { describe, expect, it, vi } from "vitest";
import {
  anchorsAt,
  applyMove,
  createMoveQueue,
  insertByPosition,
  moveFailureMessage,
  repositionAfterToggle,
} from "@/utils/ordering.utils";
import { makeAxiosError, makeTask } from "@/test/fixtures";

const ids = (list: { id: number }[]) => list.map(({ id }) => id);

describe("anchorsAt", () => {
  const displayed = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it("donne les voisins de la place d’arrivée, sans compter l’élément déplacé", () => {
    expect(anchorsAt(displayed, 3, 0)).toEqual({ afterId: null, beforeId: 1 });
    expect(anchorsAt(displayed, 1, 2)).toEqual({ afterId: 3, beforeId: null });
    expect(anchorsAt(displayed, 3, 1)).toEqual({ afterId: 1, beforeId: 2 });
  });

  it("ne renvoie rien pour un dépôt à la même place", () => {
    expect(anchorsAt(displayed, 2, 1)).toBeNull();
  });
});

describe("applyMove", () => {
  it("place l’élément juste après son ancre du dessus", () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    applyMove(list, 1, { afterId: 3, beforeId: null });
    expect(ids(list)).toEqual([2, 3, 1]);
  });

  it("place l’élément juste avant son ancre du dessous quand il va en tête", () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    applyMove(list, 3, { afterId: null, beforeId: 1 });
    expect(ids(list)).toEqual([3, 1, 2]);
  });

  it("laisse l’élément en place si l’ancre a disparu", () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    applyMove(list, 2, { afterId: 99, beforeId: null });
    expect(ids(list)).toEqual([1, 2, 3]);
  });

  it("reste dans le groupe des tâches à faire, avant les terminées", () => {
    const list = [
      makeTask({ id: 1 }),
      makeTask({ id: 2 }),
      makeTask({ id: 3, completed: true }),
    ];
    applyMove(list, 1, { afterId: 2, beforeId: null });
    expect(ids(list)).toEqual([2, 1, 3]);
  });
});

describe("insertByPosition", () => {
  it("compare les clés octet par octet : Zz vient avant a0", () => {
    const list = [makeTask({ id: 1, position: "a0" })];
    insertByPosition(list, makeTask({ id: 2, position: "Zz" }));
    expect(ids(list)).toEqual([2, 1]);
  });

  it("insère parmi les tâches à faire, jamais après une terminée", () => {
    const list = [
      makeTask({ id: 1, position: "a0" }),
      makeTask({ id: 3, completed: true, position: "a1" }),
    ];
    insertByPosition(list, makeTask({ id: 2, position: "a5" }));
    expect(ids(list)).toEqual([1, 2, 3]);
  });
});

describe("repositionAfterToggle", () => {
  it("place une tâche cochée en tête des terminées", () => {
    const list = [
      makeTask({ id: 1, position: "a0" }),
      makeTask({ id: 2, position: "a1" }),
      makeTask({ id: 3, completed: true }),
    ];
    list[0].completed = true;
    repositionAfterToggle(list, list[0]);
    expect(ids(list)).toEqual([2, 1, 3]);
  });

  it("remet une tâche décochée à sa place parmi les tâches à faire", () => {
    const list = [
      makeTask({ id: 1, position: "a0" }),
      makeTask({ id: 3, position: "a2" }),
      makeTask({ id: 2, completed: true, position: "a1" }),
    ];
    list[2].completed = false;
    repositionAfterToggle(list, list[2]);
    expect(ids(list)).toEqual([1, 2, 3]);
  });
});

describe("moveFailureMessage", () => {
  it.each([403, 404, 409])(
    "signale une liste modifiée ailleurs sur un %i",
    (status) => {
      expect(moveFailureMessage(makeAxiosError(status))).toBe(
        "This list changed elsewhere and has been reloaded",
      );
    },
  );

  it("signale un échec générique sinon", () => {
    expect(moveFailureMessage(makeAxiosError(500))).toBe(
      "Could not save the new order",
    );
    expect(moveFailureMessage(new Error("réseau"))).toBe(
      "Could not save the new order",
    );
  });
});

describe("createMoveQueue", () => {
  it("envoie les requêtes l’une après l’autre", async () => {
    const calls: string[] = [];
    const queue = createMoveQueue(vi.fn());
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const first = queue.enqueue(async () => {
      await gate;
      calls.push("first");
    });
    const second = queue.enqueue(async () => {
      calls.push("second");
    });

    await Promise.resolve();
    expect(calls).toEqual([]);
    release();
    await Promise.all([first, second]);
    expect(calls).toEqual(["first", "second"]);
  });

  it("abandonne les requêtes en attente et prévient une seule fois après un échec", async () => {
    const onFailure = vi.fn();
    const queue = createMoveQueue(onFailure);
    const pending = vi.fn();
    const error = makeAxiosError(409);

    await Promise.all([
      queue.enqueue(() => Promise.reject(error)),
      queue.enqueue(pending),
    ]);

    expect(pending).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledOnce();
    expect(onFailure).toHaveBeenCalledWith(error);
  });

  it("reprend normalement après un échec", async () => {
    const queue = createMoveQueue(vi.fn());
    await queue.enqueue(() => Promise.reject(new Error("échec")));
    const next = vi.fn(async () => {});
    await queue.enqueue(next);
    expect(next).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Étape 4 : vérifier l'échec**

Run : `yarn vitest run src/utils/ordering.utils.spec.ts`
Expected : FAIL — `Failed to resolve import "@/utils/ordering.utils"`.

- [ ] **Étape 5 : implémenter**

Create `frontend/src/utils/ordering.utils.ts` :

```ts
import { isAxiosError } from "axios";
import { MoveAnchors } from "@/models/ordering.model";

interface Identified {
  id: number;
}

interface Positioned extends Identified {
  position: string;
  completed: boolean;
}

export interface MoveQueue {
  enqueue(request: () => Promise<void>): Promise<void>;
}

const STALE_LIST_STATUSES = [403, 404, 409];

export function anchorsAt(
  displayed: Identified[],
  movedId: number,
  newIndex: number,
): MoveAnchors | null {
  const oldIndex = displayed.findIndex(({ id }) => id === movedId);
  if (oldIndex === -1 || oldIndex === newIndex) return null;

  const others = displayed.filter(({ id }) => id !== movedId);
  return {
    afterId: others[newIndex - 1]?.id ?? null,
    beforeId: others[newIndex]?.id ?? null,
  };
}

function targetIndex(
  list: Identified[],
  { afterId, beforeId }: MoveAnchors,
): number {
  if (afterId !== null) {
    const after = list.findIndex(({ id }) => id === afterId);
    return after === -1 ? -1 : after + 1;
  }
  if (beforeId !== null) return list.findIndex(({ id }) => id === beforeId);
  return -1;
}

export function applyMove<T extends Identified>(
  list: T[],
  id: number,
  anchors: MoveAnchors,
): void {
  const from = list.findIndex((item) => item.id === id);
  if (from === -1) return;

  const [item] = list.splice(from, 1);
  const to = targetIndex(list, anchors);
  list.splice(to === -1 ? from : to, 0, item);
}

export function insertByPosition<T extends Positioned>(
  list: T[],
  item: T,
): void {
  // `<` compare les codes de caractères, comme la collation `C` de la base ; `localeCompare`
  // ignore la casse et placerait `a0` avant `Zz`.
  const index = list.findIndex(
    (other) => other.completed || item.position < other.position,
  );
  list.splice(index === -1 ? list.length : index, 0, item);
}

export function repositionAfterToggle<T extends Positioned>(
  list: T[],
  item: T,
): void {
  const from = list.findIndex(({ id }) => id === item.id);
  if (from === -1) return;
  list.splice(from, 1);

  if (!item.completed) {
    insertByPosition(list, item);
  } else {
    const firstCompleted = list.findIndex(({ completed }) => completed);
    list.splice(firstCompleted === -1 ? list.length : firstCompleted, 0, item);
  }
}

export function moveFailureMessage(error: unknown): string {
  return isAxiosError(error) &&
    STALE_LIST_STATUSES.includes(error.response?.status ?? 0)
    ? "This list changed elsewhere and has been reloaded"
    : "Could not save the new order";
}

export function createMoveQueue(
  onFailure: (error: unknown) => void,
): MoveQueue {
  let tail: Promise<void> = Promise.resolve();
  let generation = 0;

  return {
    enqueue(request) {
      const enqueuedIn = generation;
      tail = tail.then(async () => {
        if (enqueuedIn !== generation) return;
        try {
          await request();
        } catch (error) {
          generation++;
          onFailure(error);
        }
      });
      return tail;
    },
  };
}
```

- [ ] **Étape 6 : vérifier**

Run : `yarn vitest run src/utils/ordering.utils.spec.ts`
Expected : PASS.
Run : `yarn test:ci`
Expected : PASS.

---

### Tâche 6 : routes et fonctions d'API

**Fichiers :**

- Modify : `frontend/src/api-routes.ts`, `frontend/src/api/task.api.ts`,
  `frontend/src/api/daily-task.api.ts`, `frontend/src/api/api.spec.ts`
- Modify : `frontend/docs/architecture/api-layer.md`

**Interfaces :**

- Consomme : `MoveAnchors`, `OrderPosition` (tâche 5).
- Produit : `taskApi.moveTask(taskId: number, anchors: MoveAnchors): Promise<OrderPosition>`,
  `dailyTaskApi.moveDailyTask(dailyTaskId: number, anchors: MoveAnchors): Promise<OrderPosition>`.

- [ ] **Étape 1 : écrire les tests**

Dans `frontend/src/api/api.spec.ts`, ajouter à `parameterisedRoutes`, après la ligne
`taskApi.deleteTaskById` :

```ts
  {
    label: 'taskApi.moveTask',
    route: 'taskMove',
    verb: 'post',
    run: () => taskApi.moveTask(7, { afterId: 3, beforeId: null }),
    args: ['task/7/move/', { afterId: 3, beforeId: null }],
  },
```

et après `dailyTaskApi.deleteDailyTask` :

```ts
  {
    label: 'dailyTaskApi.moveDailyTask',
    route: 'dailyTaskMove',
    verb: 'post',
    run: () => dailyTaskApi.moveDailyTask(7, { afterId: null, beforeId: 3 }),
    args: ['daily-task/7/move/', { afterId: null, beforeId: 3 }],
  },
```

- [ ] **Étape 2 : vérifier l'échec**

Run : `yarn vitest run src/api/api.spec.ts`
Expected : FAIL (`moveTask is not a function`, et erreurs de type sur `taskMove`).

- [ ] **Étape 3 : implémenter**

Dans `frontend/src/api-routes.ts`, après `taskById: 'task/:taskId/',` :
`taskMove: 'task/:taskId/move/',` ; après `dailyTaskById: 'daily-task/:dailyTaskId/',` :
`dailyTaskMove: 'daily-task/:dailyTaskId/move/',`.

Dans `frontend/src/api/task.api.ts`, import
`import { MoveAnchors, OrderPosition } from '@/models/ordering.model'`, puis en fin de fichier :

```ts
export function moveTask(
  taskId: number,
  anchors: MoveAnchors,
): Promise<OrderPosition> {
  return http.post<OrderPosition>(
    apiRoutes.taskMove.replace(":taskId", taskId.toString()),
    anchors,
  );
}
```

Dans `frontend/src/api/daily-task.api.ts`, même import, puis en fin de fichier :

```ts
export function moveDailyTask(
  dailyTaskId: number,
  anchors: MoveAnchors,
): Promise<OrderPosition> {
  const url = apiRoutes.dailyTaskMove.replace(
    ":dailyTaskId",
    dailyTaskId.toString(),
  );
  return http.post<OrderPosition>(url, anchors);
}
```

- [ ] **Étape 4 : vérifier**

Run : `yarn vitest run src/api/api.spec.ts`
Expected : PASS, y compris « couvre toutes les routes à paramètre déclarées ».

- [ ] **Étape 5 : documentation**

`frontend/docs/architecture/api-layer.md`, section « Contraintes non évidentes », ajouter :

```markdown
- **`moveTask` et `moveDailyTask` répondent `{ id, position }`**, pas la tâche. Le corps porte
  les voisins **affichés** (`afterId`, `beforeId`, `null` en tête ou en fin) ; le serveur répond
  403, 404 ou 409 quand la liste a changé ailleurs. Voir `utils/ordering.utils.ts`.
```

---

### Tâche 7 : stores `project` et `collection`

**Fichiers :**

- Modify : `frontend/src/store/project.store.ts`, `frontend/src/store/collection.store.ts`
- Modify : `frontend/src/utils/task.utils.ts`, `frontend/src/utils/task.utils.spec.ts`
- Create : `frontend/src/store/project.store.spec.ts`, `frontend/src/store/collection.store.spec.ts`
- Modify : `frontend/docs/architecture/state.md`, `frontend/docs/workflows/verification.md`,
  `frontend/docs/quality/refactoring-backlog.md`

**Interfaces :**

- Consomme : `applyMove`, `repositionAfterToggle`, `createMoveQueue`, `moveFailureMessage`
  (tâche 5), `taskApi.moveTask` (tâche 6).
- Produit : `useProjectStore().moveTask(taskId: number, anchors: MoveAnchors, sectionId?: number): Promise<void>`,
  `useCollectionStore().moveTask(taskId: number, anchors: MoveAnchors): Promise<void>`.
  `sortTasks`, `sortTask` et `sortByCompletionDate` disparaissent.

- [ ] **Étape 1 : écrire les tests du store projet**

Create `frontend/src/store/project.store.spec.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/api", () => ({
  taskApi: { moveTask: vi.fn(), updateTaskById: vi.fn() },
  projectApi: { getProjectById: vi.fn() },
  sectionApi: {},
  eventApi: {},
}));

import { projectApi, taskApi } from "@/api";
import { useNotificationStore } from "@/store/notification.store";
import { useProjectStore } from "@/store/project.store";
import {
  makeAxiosError,
  makeProjectDetail,
  makeSection,
  makeTask,
} from "@/test/fixtures";

const ids = (list: { id: number }[]) => list.map(({ id }) => id);

function loadSection() {
  const store = useProjectStore();
  store.currentProject = makeProjectDetail({
    id: 5,
    sections: [
      makeSection({
        id: 10,
        tasks: [
          makeTask({ id: 1, position: "a0" }),
          makeTask({ id: 2, position: "a1" }),
          makeTask({ id: 3, position: "a2" }),
        ],
      }),
    ],
  });
  return store;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe("moveTask", () => {
  it("déplace la tâche tout de suite puis recopie la position du serveur", async () => {
    vi.mocked(taskApi.moveTask).mockResolvedValue({ id: 3, position: "Zz" });
    const store = loadSection();

    const pending = store.moveTask(3, { afterId: null, beforeId: 1 }, 10);
    expect(ids(store.sections[0].tasks)).toEqual([3, 1, 2]);

    await pending;
    expect(taskApi.moveTask).toHaveBeenCalledWith(3, {
      afterId: null,
      beforeId: 1,
    });
    expect(store.sections[0].tasks[0].position).toBe("Zz");
  });

  it("recharge le projet et prévient quand la liste a changé ailleurs", async () => {
    vi.mocked(taskApi.moveTask).mockRejectedValue(makeAxiosError(409));
    vi.mocked(projectApi.getProjectById).mockResolvedValue(
      makeProjectDetail({ id: 5 }),
    );
    const store = loadSection();

    await store.moveTask(3, { afterId: null, beforeId: 1 }, 10);

    expect(projectApi.getProjectById).toHaveBeenCalledWith(5);
    expect(useNotificationStore().queue).toEqual([
      {
        text: "This list changed elsewhere and has been reloaded",
        color: "error",
      },
    ]);
  });

  it("abandonne les déplacements en attente après un échec", async () => {
    vi.mocked(taskApi.moveTask).mockRejectedValueOnce(makeAxiosError(409));
    vi.mocked(projectApi.getProjectById).mockResolvedValue(
      makeProjectDetail({ id: 5 }),
    );
    const store = loadSection();

    await Promise.all([
      store.moveTask(3, { afterId: null, beforeId: 1 }, 10),
      store.moveTask(2, { afterId: null, beforeId: 3 }, 10),
    ]);

    expect(taskApi.moveTask).toHaveBeenCalledOnce();
  });
});

describe("editTask", () => {
  it("remet une tâche décochée à sa place parmi les tâches à faire", async () => {
    const store = useProjectStore();
    store.currentProject = makeProjectDetail({
      tasks: [
        makeTask({ id: 1, position: "a0" }),
        makeTask({ id: 3, position: "a2" }),
        makeTask({ id: 2, position: "a1", completed: true }),
      ],
    });
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(
      makeTask({ id: 2, position: "a1" }),
    );

    await store.editTask(2, { completed: false });

    expect(ids(store.loadedProject.tasks)).toEqual([1, 2, 3]);
  });

  it("place une tâche cochée en tête des terminées", async () => {
    const store = useProjectStore();
    store.currentProject = makeProjectDetail({
      tasks: [
        makeTask({ id: 1, position: "a0" }),
        makeTask({ id: 2, position: "a1" }),
        makeTask({ id: 3, completed: true }),
      ],
    });
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(
      makeTask({ id: 1, position: "a0", completed: true }),
    );

    await store.editTask(1, { completed: true });

    expect(ids(store.loadedProject.tasks)).toEqual([2, 1, 3]);
  });

  it("ne déplace pas une tâche terminée qu’on renomme", async () => {
    const store = useProjectStore();
    store.currentProject = makeProjectDetail({
      tasks: [
        makeTask({ id: 1 }),
        makeTask({ id: 2, completed: true }),
        makeTask({ id: 3, completed: true }),
      ],
    });
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(
      makeTask({ id: 3, completed: true, name: "Renommée" }),
    );

    await store.editTask(3, { name: "Renommée" });

    expect(ids(store.loadedProject.tasks)).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Étape 2 : écrire les tests du store collection**

Create `frontend/src/store/collection.store.spec.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/api", () => ({
  taskApi: { moveTask: vi.fn(), updateTaskById: vi.fn() },
  collectionApi: { getCollectionById: vi.fn() },
}));

import { collectionApi, taskApi } from "@/api";
import { useCollectionStore } from "@/store/collection.store";
import { makeAxiosError, makeTask } from "@/test/fixtures";
import { CollectionDetail } from "@/models/collection.model";

function makeCollection(
  tasks = [
    makeTask({ id: 1, position: "a0" }),
    makeTask({ id: 2, position: "a1" }),
  ],
): CollectionDetail {
  return {
    id: 8,
    name: "C",
    description: "",
    itemName: "task",
    createdOn: "2026-01-01",
    archived: false,
    tasks,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe("moveTask", () => {
  it("déplace la tâche tout de suite puis recopie la position du serveur", async () => {
    vi.mocked(taskApi.moveTask).mockResolvedValue({ id: 2, position: "Zz" });
    const store = useCollectionStore();
    store.currentCollection = makeCollection();

    const pending = store.moveTask(2, { afterId: null, beforeId: 1 });
    expect(store.loadedCollection.tasks.map(({ id }) => id)).toEqual([2, 1]);

    await pending;
    expect(store.loadedCollection.tasks[0].position).toBe("Zz");
  });

  it("recharge la collection au moindre échec", async () => {
    vi.mocked(taskApi.moveTask).mockRejectedValue(makeAxiosError(500));
    vi.mocked(collectionApi.getCollectionById).mockResolvedValue(
      makeCollection(),
    );
    const store = useCollectionStore();
    store.currentCollection = makeCollection();

    await store.moveTask(2, { afterId: null, beforeId: 1 });

    expect(collectionApi.getCollectionById).toHaveBeenCalledWith(8);
  });
});

describe("editTask", () => {
  it("remet une tâche décochée à sa place", async () => {
    const store = useCollectionStore();
    store.currentCollection = makeCollection([
      makeTask({ id: 1, position: "a0" }),
      makeTask({ id: 3, position: "a2" }),
      makeTask({ id: 2, position: "a1", completed: true }),
    ]);
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(
      makeTask({ id: 2, position: "a1" }),
    );

    await store.editTask(2, { completed: false });

    expect(store.loadedCollection.tasks.map(({ id }) => id)).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Étape 3 : vérifier l'échec**

Run : `yarn vitest run src/store`
Expected : FAIL (`store.moveTask is not a function`, ordre inattendu après `editTask`).

- [ ] **Étape 4 : store projet**

Dans `frontend/src/store/project.store.ts` :

- imports : retirer `sortByCompletionDate` de l'import de `@/utils/task.utils`, puis ajouter

```ts
import { MoveAnchors } from "@/models/ordering.model";
import { useNotificationStore } from "@/store/notification.store";
import {
  applyMove,
  createMoveQueue,
  moveFailureMessage,
  repositionAfterToggle,
} from "@/utils/ordering.utils";
```

- `ProjectStoreActions` : remplacer `sortTasks(sectionId?: number): void` par
  `moveTask(taskId: number, anchors: MoveAnchors, sectionId?: number): Promise<void>` ;
- avant `export const useProjectStore` :

```ts
function tasksOf(
  project: ProjectDetail,
  sectionId?: number,
): Task[] | undefined {
  if (sectionId === undefined) return project.tasks;
  return project.sections.find(({ id }) => id === sectionId)?.tasks;
}

const moveQueue = createMoveQueue((error) => {
  const projectStore = useProjectStore();
  useNotificationStore().notifyError(moveFailureMessage(error));
  if (projectStore.currentProject)
    projectStore.retrieveProject(projectStore.currentProject.id);
});
```

- remplacer l'action `editTask` (avec le `// TODO : test that` qui la précède) et l'action
  `sortTasks` par :

```ts
    async editTask(taskId: number, data: TaskPatch, sectionId?: number): Promise<void> {
      await taskApi.updateTaskById(taskId, data).then(
        (updatedTask: Task) => {
          if (!this.currentProject) return

          const tasks = tasksOf(this.currentProject, sectionId)
          const taskToUpdate = tasks?.find(task => task.id === updatedTask.id)
          if (!tasks || !taskToUpdate) return

          const toggled = taskToUpdate.completed !== updatedTask.completed
          Object.assign(taskToUpdate, updatedTask)
          if (toggled) repositionAfterToggle(tasks, taskToUpdate)
        },
        error => console.error(error)
      )
    },

    moveTask(taskId: number, anchors: MoveAnchors, sectionId?: number): Promise<void> {
      const tasks = this.currentProject && tasksOf(this.currentProject, sectionId)
      if (!tasks) return Promise.resolve()

      applyMove(tasks, taskId, anchors)
      return moveQueue.enqueue(async () => {
        const { position } = await taskApi.moveTask(taskId, anchors)
        const project = this.currentProject
        const task = project && tasksOf(project, sectionId)?.find(({ id }) => id === taskId)
        if (task) task.position = position
      })
    },
```

- [ ] **Étape 5 : store collection**

Dans `frontend/src/store/collection.store.ts` :

- imports : `import { filterCompleted, filterUncompleted } from '@/utils/task.utils'` (sans
  `sortByCompletionDate`), puis

```ts
import { MoveAnchors } from "@/models/ordering.model";
import { useNotificationStore } from "@/store/notification.store";
import {
  applyMove,
  createMoveQueue,
  moveFailureMessage,
  repositionAfterToggle,
} from "@/utils/ordering.utils";
```

- `CollectionStoreActions` : remplacer `sortTask(): void` par
  `moveTask(taskId: number, anchors: MoveAnchors): Promise<void>` ;
- avant `export const useCollectionStore` :

```ts
const moveQueue = createMoveQueue((error) => {
  const collectionStore = useCollectionStore();
  useNotificationStore().notifyError(moveFailureMessage(error));
  if (collectionStore.currentCollection)
    collectionStore.retrieveCollection(collectionStore.currentCollection.id);
});
```

- remplacer l'action `editTask` et l'action `sortTask` par :

```ts
    async editTask(id: number, data: TaskPatch): Promise<void> {
      await taskApi.updateTaskById(id, data).then(
        (updatedTask: Task) => {
          if (!this.currentCollection) return

          const { tasks } = this.currentCollection
          const taskToUpdate = tasks.find(task => task.id === updatedTask.id)
          if (!taskToUpdate) return

          const toggled = taskToUpdate.completed !== updatedTask.completed
          Object.assign(taskToUpdate, updatedTask)
          if (toggled) repositionAfterToggle(tasks, taskToUpdate)
        },
        error => console.error(error)
      )
    },

    moveTask(taskId: number, anchors: MoveAnchors): Promise<void> {
      if (!this.currentCollection) return Promise.resolve()

      applyMove(this.currentCollection.tasks, taskId, anchors)
      return moveQueue.enqueue(async () => {
        const { position } = await taskApi.moveTask(taskId, anchors)
        const task = this.currentCollection?.tasks.find(({ id }) => id === taskId)
        if (task) task.position = position
      })
    },
```

- [ ] **Étape 6 : retirer `sortByCompletionDate`**

Dans `frontend/src/utils/task.utils.ts`, supprimer la fonction `sortByCompletionDate` et
l'import `moment`, devenu inutile. Dans `frontend/src/utils/task.utils.spec.ts`, supprimer
`sortByCompletionDate` de l'import et le bloc `describe('sortByCompletionDate', …)`.

- [ ] **Étape 7 : vérifier**

Run : `yarn vitest run src/store src/utils`
Expected : PASS.
Run : `yarn lint:check && yarn test:ci`
Expected : PASS.
Run : `yarn type-check 2>&1 | grep -E "store/(project|collection)|ordering|task\.utils|fixtures"`
Expected : aucune ligne (les erreurs préexistantes ailleurs ne comptent pas).

- [ ] **Étape 8 : documentation**

`frontend/docs/architecture/state.md`, section « Contraintes non évidentes », ajouter :

```markdown
- **L'ordre des tâches vient du serveur, aucune action ne trie.** `addTask` insère en tête (le
  serveur y place la tâche) ; `editTask` ne replace une tâche que si son état coché change
  (`repositionAfterToggle`) ; `moveTask` applique le déplacement tout de suite puis passe par une
  file. Au premier échec, la file est vidée et le projet ou la collection est rechargé.
```

`frontend/docs/workflows/verification.md` :

- ligne 45 : remplacer « `yarn test` — couvre `utils/`, `pipes/`, `api/` et `axios/`. **Les
  composants, les stores, les composables et les guards ne sont pas couverts** » par « `yarn
test` — couvre `utils/`, `pipes/`, `api/`, `axios/`, l'ordre dans les stores `project` et
  `collection`, et `useDailyTaskMove`. **Les composants, le reste des stores et des composables,
  et les guards ne sont pas couverts** » ;
- ligne 13 : remplacer « (62 tests Vitest) » par le nombre affiché par `yarn test:ci`.

`frontend/docs/quality/refactoring-backlog.md`, section R13 :

- remplacer « 62 tests » par le nombre affiché par `yarn test:ci` ;
- remplacer « les stores Pinia, dont `project.store.ts` (283 lignes) ; » par « le reste des
  stores Pinia — seules les actions d'ordre de `project` et `collection` (`editTask`, `moveTask`)
  et `useDailyTaskMove` sont couvertes ; ».

---

### Tâche 8 : wizard daily et composable de déplacement

**Fichiers :**

- Modify : `frontend/src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`
- Create : `frontend/src/composables/useDailyTaskMove.ts`,
  `frontend/src/composables/useDailyTaskMove.spec.ts`
- Modify : `frontend/docs/domain/daily-rules.md`, `frontend/docs/domain/glossary.md`

**Interfaces :**

- Consomme : `applyMove`, `createMoveQueue`, `moveFailureMessage` (tâche 5),
  `dailyTaskApi.moveDailyTask` (tâche 6).
- Produit : `useDailyTaskMove(dailyTaskList: Ref<DailyTask[]>, reload: () => void): { moveDailyTask(dailyTaskId: number, anchors: MoveAnchors): Promise<void> }`.

- [ ] **Étape 1 : écrire les tests**

Create `frontend/src/composables/useDailyTaskMove.spec.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

vi.mock("@/api", () => ({ dailyTaskApi: { moveDailyTask: vi.fn() } }));

import { dailyTaskApi } from "@/api";
import { useDailyTaskMove } from "@/composables/useDailyTaskMove";
import { useNotificationStore } from "@/store/notification.store";
import { makeAxiosError, makeDailyTask } from "@/test/fixtures";

const lines = () =>
  ref([
    makeDailyTask({ id: 1, position: "a0" }),
    makeDailyTask({ id: 2, position: "a1", completed: true }),
    makeDailyTask({ id: 3, position: "a2" }),
  ]);

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe("useDailyTaskMove", () => {
  it("déplace la ligne tout de suite, terminée ou non, puis recopie la position", async () => {
    vi.mocked(dailyTaskApi.moveDailyTask).mockResolvedValue({
      id: 2,
      position: "a3",
    });
    const list = lines();
    const { moveDailyTask } = useDailyTaskMove(list, vi.fn());

    const pending = moveDailyTask(2, { afterId: 3, beforeId: null });
    expect(list.value.map(({ id }) => id)).toEqual([1, 3, 2]);

    await pending;
    expect(list.value[2].position).toBe("a3");
  });

  it("recharge le jour et prévient au moindre échec", async () => {
    vi.mocked(dailyTaskApi.moveDailyTask).mockRejectedValue(
      makeAxiosError(403),
    );
    const reload = vi.fn();
    const { moveDailyTask } = useDailyTaskMove(lines(), reload);

    await moveDailyTask(3, { afterId: null, beforeId: 1 });

    expect(reload).toHaveBeenCalledOnce();
    expect(useNotificationStore().queue).toEqual([
      {
        text: "This list changed elsewhere and has been reloaded",
        color: "error",
      },
    ]);
  });
});
```

- [ ] **Étape 2 : vérifier l'échec**

Run : `yarn vitest run src/composables/useDailyTaskMove.spec.ts`
Expected : FAIL — `Failed to resolve import "@/composables/useDailyTaskMove"`.

- [ ] **Étape 3 : implémenter**

Create `frontend/src/composables/useDailyTaskMove.ts` :

```ts
import { Ref } from "vue";
import { dailyTaskApi } from "@/api";
import { DailyTask } from "@/models/daily-task.model";
import { MoveAnchors } from "@/models/ordering.model";
import { useNotificationStore } from "@/store/notification.store";
import {
  applyMove,
  createMoveQueue,
  moveFailureMessage,
} from "@/utils/ordering.utils";

export function useDailyTaskMove(
  dailyTaskList: Ref<DailyTask[]>,
  reload: () => void,
): {
  moveDailyTask: (dailyTaskId: number, anchors: MoveAnchors) => Promise<void>;
} {
  const notificationStore = useNotificationStore();
  const queue = createMoveQueue((error) => {
    notificationStore.notifyError(moveFailureMessage(error));
    reload();
  });

  function moveDailyTask(
    dailyTaskId: number,
    anchors: MoveAnchors,
  ): Promise<void> {
    applyMove(dailyTaskList.value, dailyTaskId, anchors);
    return queue.enqueue(async () => {
      const { position } = await dailyTaskApi.moveDailyTask(
        dailyTaskId,
        anchors,
      );
      const dailyTask = dailyTaskList.value.find(
        ({ id }) => id === dailyTaskId,
      );
      if (dailyTask) dailyTask.position = position;
    });
  }

  return { moveDailyTask };
}
```

- [ ] **Étape 4 : nouvelles tâches en tête dans le wizard**

Dans `frontend/src/views/daily/daily-update/steps/task/DailyUpdateTask.vue` :

- `createProjectTask` : `section.tasks.push(response)` devient `section.tasks.unshift(response)`,
  et `project.content.tasks.push(response)` devient `project.content.tasks.unshift(response)` ;
- `createCollectionTask` : `collection.content.tasks.push(response)` devient
  `collection.content.tasks.unshift(response)`.

Les `push` de `dailyTaskList` (création, report) ne changent pas : le serveur place ces lignes en
fin de jour.

- [ ] **Étape 5 : vérifier**

Run : `yarn vitest run src/composables/useDailyTaskMove.spec.ts`
Expected : PASS.
Run : `yarn lint:check && yarn format:check && yarn test:ci`
Expected : PASS.

- [ ] **Étape 6 : documentation**

`frontend/docs/domain/daily-rules.md`, section « Wizard — mécanique », ajouter :

```markdown
- **Ordre.** Une tâche créée depuis le wizard est insérée **en tête** de sa liste, comme sur la
  page projet ; une ligne du jour, créée ou reportée, **en fin**. Le déplacement d'une ligne,
  terminée ou non, passe par `useDailyTaskMove` : au moindre échec, le jour est rechargé.
```

`frontend/docs/domain/glossary.md`, section « Champs pièges », ajouter en fin de liste :

```markdown
- **`position` (`Task`, `DailyTask`) est une clé d'ordre calculée par le serveur.** Elle ne se
  compare qu'avec `<` — `localeCompare` ignore la casse et placerait `a0` avant `Zz` — et ne se
  fabrique jamais côté front.
```

---

### Tâche 9 : vérification de bout en bout

**Fichiers :** aucun, sauf les compteurs de tests de `backend/CLAUDE.md` et
`backend/docs/workflows/verification.md`.

- [ ] **Étape 1 : backend**

```bash
docker exec tout_doux_backend python manage.py check
docker exec tout_doux_backend python manage.py makemigrations --check --dry-run
docker exec tout_doux_backend python manage.py test tout_doux
```

Expected : aucun problème, `No changes detected`, tous les tests OK.

Mettre à jour les compteurs de `backend/CLAUDE.md` (« 17 tests de fumée, 76 tests de
non-régression, 0 test métier ») avec les nombres réels : les tests de `test_ordering.py` et
`test_migrations.py` sont les premiers tests métier.

- [ ] **Étape 2 : front**

```bash
yarn prettier --write src/models/ordering.model.ts src/utils/ordering.utils.ts src/utils/ordering.utils.spec.ts src/store/project.store.spec.ts src/store/collection.store.spec.ts src/composables/useDailyTaskMove.ts src/composables/useDailyTaskMove.spec.ts docs
yarn lint:check
yarn format:check
yarn test:ci
```

Expected : PASS. `prettier --write` ne reformate que ces fichiers et la doc du front ; le hook
`pre-commit` le referait de toute façon sur les fichiers indexés.

- [ ] **Étape 3 : essai manuel dans le navigateur**

Sur la page d'un projet et d'une collection :

1. une tâche créée apparaît **en tête** ;
2. une tâche cochée passe en tête des terminées ; décochée, elle revient à sa place ;
3. après rechargement de la page, l'ordre est identique.

Dans le wizard daily : une tâche créée depuis un projet apparaît en tête de sa liste ; une ligne
du jour, en fin.

---

### Tâche 10 : répétition de la migration sur les données de production

À faire par le mainteneur, avant la release, en suivant la section « Répéter une migration sur
les données de production » ajoutée à `backend/docs/workflows/verification.md` (tâche 2). Les
deux contrôles doivent afficher `0`.

---

### Tâche 11 : message de commit

- [ ] **Étape 1 : rédiger**

Un seul commit, en anglais, sans `Co-Authored-By`. Écrire dans le scratchpad, par exemple :

```
feat: add manual ordering of tasks and daily tasks

enforce exactly one container per task at the database level
```

- [ ] **Étape 2 : valider et copier**

```bash
awk 'length($0) > 100 {print NR}' <fichier>
cd frontend && npx --no-install commitlint --edit <fichier>
pbcopy < <fichier>
```

Remettre le message au mainteneur, avec `git commit -F <fichier>` en repli.
