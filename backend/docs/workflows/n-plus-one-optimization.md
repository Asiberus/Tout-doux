# Supprimer les requêtes N+1

**Quand** — une fois, avant le chantier de pagination décrit dans
[`../../../AMELIORATIONS-FETCH.md`](../../../AMELIORATIONS-FETCH.md) (partie 1 sur 7). Ce
chantier **ne change pas le contrat d'API** : aucune clé de réponse ajoutée, retirée ni
renommée, aucune valeur modifiée. Le front n'est pas touché.

Ce fichier est une procédure ponctuelle. **Il est supprimé quand le chantier est terminé** —
son avant-dernière étape consiste à extraire ce qui doit survivre vers `patterns/`.

## Objectif

Ramener le nombre de requêtes SQL par endpoint à une valeur **constante**, indépendante du
nombre d'objets renvoyés. Le critère est celui-là, pas une durée : c'est lui qui se teste.

**Mesuré** le 27/08/2026 par `test_query_counts.py` sur le code d'avant chantier — ce ne sont pas
des estimations. La colonne « croissance » est ce qui compte : c'est elle qui doit tomber à zéro.

| Endpoint                    | Avant | Croissance mesurée               | Cible | Après    |
| --------------------------- | ----- | -------------------------------- | ----- | -------- |
| `GET /project/`             | 58    | **+4 par projet**                | 3     | **3** ✅ |
| `GET /project/detailed/`    | 131   | **+10 par projet, +1 par tâche** | 9     | **9** ✅ |
| `GET /collection/`          | 26    | +2 par collection                | 3     | **2** ✅ |
| `GET /collection/detailed/` | 59    | **+1 par tâche**                 | 4     | **4** ✅ |
| `GET /daily-task/`          | 74    | **+6 par daily task**            | 7     | **5** ✅ |
| `GET /event/`               | 27    | +2 par événement                 | 2     | **2** ✅ |

Les valeurs « avant » sont celles du jeu de test après ajout de 10 objets ; seule la croissance
est intrinsèque. Le chiffre le plus parlant : `project/detailed/` passe de **31 à 81** quand on
ajoute 50 tâches — exactement +50, une requête par tâche pour aller chercher ses tags. C'est
ce que le chantier doit ramener à zéro.

Les cibles restent des estimations : c'est `test_query_counts.py` qui fera foi, pas cette table.

## Non-objectifs

- **Pas de nouvel endpoint, pas de pagination réelle.** C'est la partie 2 du plan.
- **Pas d'index, pas de migration.** Django indexe déjà toutes les clés étrangères. Un index
  sur `Task.completed` serait contre-productif : deux valeurs distinctes sur la table, PostgreSQL
  préférera un parcours séquentiel — et à moins de 1 000 lignes tout tient en quelques pages.
- **Pas de `only()` / `defer()`.** Les colonnes les plus lourdes sont des `CharField(500)` : gain
  nul, et un champ différé déclenche une requête à l'accès, ce qui recrée un N+1 par la
  porte de derrière.

## Prérequis

1. Le conteneur tourne : `./td.sh start dev`.
2. **§0 est fait et vert sur le code actuel, sans aucune modification du code applicatif.**
   Sans ce filet, ce chantier n'est pas vérifiable.

## Ce qui est prouvé, ce qui reste à prouver

Le mécanisme central de §2 (`scalar_count`) a été **exécuté** sur des modèles jetables
reproduisant `Project` / `Section` / `Task` / `Collection`, en SQLite, avant d'être écrit ici.

| Affirmation                                                                    | Statut                                        |
| ------------------------------------------------------------------------------ | --------------------------------------------- |
| `scalar_count` donne 7/3 sur le jeu mixte, 2/0 et 2/1 sur les branches isolées | **Exécuté**                                   |
| Sans `Coalesce`, un projet sans tâche renvoie `None`                           | **Exécuté**                                   |
| `Count('tasks') + Count('sections__tasks')` sans `distinct` donne **24**       | **Exécuté**                                   |
| La requête annotée ne contient **aucune jointure** et reste **une** requête    | **Exécuté**                                   |
| Le `.count()` de pagination est **plat** avec `scalar_count`                   | **Exécuté**                                   |
| Le `.count()` de pagination est **enveloppé** avec `Count()`                   | **Exécuté**                                   |
| Les préchargements survivent au `queryset.all()` du mode `size=0`              | **Exécuté**                                   |
| `.count()` sur relation préfetchée n'émet rien ; `.filter().count()` si        | **Exécuté**                                   |
| `add`/`remove`/`clear` purgent le cache de préchargement                       | **Lu** (source)                               |
| L'ordre des `NULL` en tête d'un tri `DESC`                                     | **Sans objet** — voir ci-dessous              |
| Les nombres de requêtes cibles de la table « Objectif »                        | **Estimés** — `test_query_counts.py` fait foi |

**Sur l'ordre des `NULL`** — `Task.Meta.ordering = ('-completed_at', '-pk')`, et `completed_at`
est `NULL` tant que la tâche n'est pas terminée. PostgreSQL place ces `NULL` en tête d'un tri
`DESC`, SQLite en queue : ce n'est ni portable ni explicite dans le code. Mais **aucun écran n'en
dépend**, vérifié dans le front : les cinq composants qui affichent des tâches
(`CollectionGeneral`, `ProjectDescription`, `ProjectSectionItem`,
`DailyUpdateProjectListItem`, `DailyUpdateCollectionListItem`) filtrent tous sur `completed`
avant de rendre — soit les terminées, soit les autres, jamais les deux dans la même liste. Seule
la charge utile de l'API les mélange.

Deux conséquences :

1. Le test d'ordre de §0 n'affirme donc **pas** « les non terminées d'abord ». Il affirme que
   **la sérialisation ne réordonne pas** ce que le modèle a trié — le vrai risque quand on
   ajoute un `prefetch_related` (§4).
2. Ça conforte la décision « filtre `completed` côté serveur » de la partie 6 : chaque liste
   devenant homogène, `-completed_at` ne départage plus rien dans la liste des non terminées
   (l'ordre retombe sur `-pk`, strictement stable) et départage proprement dans celle des
   terminées. Aucune surprise d'ordre à la pagination.

> ⚠️ **Aucun des 30 tests de §0 n'a été exécuté contre la vraie application.** Le harnais ne
> couvrait que l'ORM, pas DRF, pas knox, pas la base réelle. Les faire tourner est la toute
> première chose à faire.

---

## Étapes

Chaque section ci-dessous est un point d'amélioration autonome, dans l'ordre. Chacune indique
ce qui change, comment on vérifie, et ce qui peut mal tourner. On peut s'arrêter après
n'importe laquelle.

---

### §0 — Poser le filet de caractérisation

**Pourquoi** — « rien n'est cassé » ne se démontre que par des tests écrits **avant**, passant
sur le code actuel **sans le modifier**, et repassant à l'identique après. Un test ajusté entre
les deux ne prouve plus rien.

Deux familles, volontairement dans deux fichiers, parce qu'elles n'ont pas le même contrat :

| Fichier                          | Contrat                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `tout_doux/test_api_contract.py` | **Vert avant, vert après, non modifié entre les deux.** C'est la preuve de non-régression |
| `tout_doux/test_query_counts.py` | **Rouge avant, vert après.** C'est la mesure de l'amélioration                            |

Le motif de découverte par défaut de Django est `test*.py` : `manage.py test tout_doux` les
trouve sans configuration. `tests.py` (le filet de la migration Django 6) n'est pas touché.

> **Si un test de `test_api_contract.py` échoue sur le code actuel, c'est l'attente qui est
> fausse, pas le code.** On corrige le test pour qu'il décrive le comportement réel, même
> discutable. C'est la définition d'un test de caractérisation.

#### `tout_doux/test_api_contract.py`

```python
"""
Filet de caractérisation posé avant le chantier N+1 (docs/workflows/n-plus-one-optimization.md).

Ces tests décrivent le comportement OBSERVABLE ACTUEL, y compris ses bizarreries. Ils passent
sur le code d'avant comme sur celui d'après, sans être modifiés entre les deux : c'est leur
seule raison d'être. Un test qui échoue avant le chantier signale une attente fausse.

Ils utilisent force_authenticate : knox est en AUTO_REFRESH, donc une requête authentifiée peut
écrire en base. Ce n'est pas gênant ici, mais test_query_counts.py en dépend, et les deux
fichiers partagent cette classe de base.
"""
from datetime import timedelta

from django.urls import reverse
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from tout_doux.models import Collection, Event, Project, Section, Tag, Task, User

PASSWORD = 'Sm0ke!Test'


class DataFixtureTestCase(TestCase):
    """Jeu de données dont toutes les cardinalités sont distinctes.

    `self.project` : 3 tâches directes (1 terminée) + 4 en section (2 terminées) = 7 / 3.
    Aucun produit cartésien ne peut tomber juste par hasard : mesuré, il donne **24** — la
    jointure produit 3 × 4 = 12 lignes, et chacun des deux `Count` en compte 12.

    Les trois autres projets isolent chaque branche du comptage — c'est ce qui attrape un
    Coalesce oublié sur une seule des deux sous-requêtes.
    """

    def setUp(self):
        self.user = User.objects.create_user('owner', 'owner@example.com', PASSWORD)
        self.other = User.objects.create_user('other', 'other@example.com', PASSWORD)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.project_tag = Tag.objects.create(
            user=self.user, type=Tag.Type.PROJECT, name='urgent', color=Tag.Color.BLUE
        )
        self.task_tag = Tag.objects.create(
            user=self.user, type=Tag.Type.TASK, name='rapide', color=Tag.Color.TEAL
        )

        # 3 directes dont 1 terminée + 4 en section dont 2 terminées
        self.project = Project.objects.create(user=self.user, name='Mixte', description='desc')
        self.project.tags.add(self.project_tag)
        self.make_tasks(3, completed=1, project=self.project)
        self.section = Section.objects.create(user=self.user, name='Section', project=self.project)
        self.make_tasks(4, completed=2, section=self.section)

        # Une seule branche alimentée : détecte un Coalesce manquant sur l'autre
        self.direct_only = Project.objects.create(user=self.user, name='Directes', description='')
        self.make_tasks(2, completed=0, project=self.direct_only)

        self.sections_only = Project.objects.create(user=self.user, name='Sections', description='')
        self.make_tasks(
            2,
            completed=1,
            section=Section.objects.create(
                user=self.user, name='S', project=self.sections_only
            ),
        )

        self.empty_project = Project.objects.create(user=self.user, name='Vide', description='')

        self.collection = Collection.objects.create(
            user=self.user, name='Collec', description='', item_name='item'
        )
        self.make_tasks(5, completed=2, collection=self.collection)
        self.empty_collection = Collection.objects.create(
            user=self.user, name='Vide', description=''
        )

    def make_tasks(self, total, completed, **owner):
        """`completed_at` n'est posé que par TaskPatchSerializer.update(). Une tâche créée
        directement par l'ORM avec completed=True le laisserait à None, et le tri
        ('-completed_at', '-pk') du modèle ne testerait plus rien."""
        now = timezone.now()
        created = []
        for index in range(total):
            is_completed = index < completed
            task = Task.objects.create(
                user=self.user,
                name=f'T{index}',
                completed=is_completed,
                completed_at=now if is_completed else None,
                **owner,
            )
            task.tags.add(self.task_tag)
            created.append(task)
        return created

    def project_payload(self, project=None):
        response = self.client.get(reverse('project-list'), {'size': 0})
        self.assertEqual(response.status_code, 200, response.data)
        target = (project or self.project).pk
        return next(item for item in response.data['content'] if item['id'] == target)

    def collection_payload(self, collection=None):
        # Le routeur enregistre CollectionViewSet sous basename='list' : les noms de route
        # sont 'list-list' et 'list-detailed', pas 'collection-*'.
        response = self.client.get(reverse('list-list'), {'size': 0})
        self.assertEqual(response.status_code, 200, response.data)
        target = (collection or self.collection).pk
        return next(item for item in response.data['content'] if item['id'] == target)


class ProjectListContractTest(DataFixtureTestCase):
    def test_response_keys_are_unchanged(self):
        self.assertEqual(
            set(self.project_payload()),
            {'id', 'name', 'description', 'tags', 'archived', 'createdOn',
             'taskCount', 'completedTaskCount', 'eventsToCome'},
        )

    def test_counts_span_direct_and_section_tasks(self):
        """LE test du chantier. 3 directes + 4 en section = 7, jamais 12."""
        payload = self.project_payload()
        self.assertEqual(payload['taskCount'], 7)
        self.assertEqual(payload['completedTaskCount'], 3)

    def test_counts_with_only_direct_tasks(self):
        payload = self.project_payload(self.direct_only)
        self.assertEqual(payload['taskCount'], 2)
        self.assertEqual(payload['completedTaskCount'], 0)

    def test_counts_with_only_section_tasks(self):
        payload = self.project_payload(self.sections_only)
        self.assertEqual(payload['taskCount'], 2)
        self.assertEqual(payload['completedTaskCount'], 1)

    def test_a_project_without_task_counts_zero_not_null(self):
        """Une sous-requête agrégée sans Coalesce renvoie NULL quand elle ne matche rien.
        Le front calcule completedTaskCount / taskCount : un null produirait un NaN dans la
        barre de progression de ProjectCard.vue."""
        payload = self.project_payload(self.empty_project)
        self.assertEqual(payload['taskCount'], 0)
        self.assertEqual(payload['completedTaskCount'], 0)
        self.assertEqual(payload['eventsToCome'], 0)

    def test_the_api_refuses_a_task_on_both_a_project_and_a_section(self):
        """Ce garde est ce qui rend `directes + sections` équivalent au OR d'origine.
        Le modèle, lui, ne l'interdit pas : voir §2, « Divergence assumée »."""
        response = self.client.post(
            reverse('task-list'),
            {'name': 'T', 'projectId': self.project.pk, 'sectionId': self.section.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 400, response.data)

    def test_queryset_is_scoped_to_the_current_user(self):
        Project.objects.create(user=self.other, name='Pas à moi', description='')
        response = self.client.get(reverse('project-list'), {'size': 0})
        self.assertNotIn(
            'Pas à moi', [item['name'] for item in response.data['content']]
        )

    def test_archived_filter_still_works(self):
        Project.objects.create(user=self.user, name='Archivé', description='', archived=True)
        response = self.client.get(reverse('project-list'), {'size': 0, 'archived': 'true'})
        self.assertEqual([item['name'] for item in response.data['content']], ['Archivé'])


class EventsToComeContractTest(DataFixtureTestCase):
    def setUp(self):
        super().setUp()
        self.today = timezone.localdate()
        self.past = self.today - timedelta(days=10)
        self.future = self.today + timedelta(days=10)

    def make_event(self, start, end=None):
        return Event.objects.create(
            user=self.user, name='E', project=self.project, start_date=start, end_date=end
        )

    def test_a_past_event_is_not_counted(self):
        self.make_event(self.past, self.past)
        self.assertEqual(self.project_payload()['eventsToCome'], 0)

    def test_a_future_event_is_counted(self):
        self.make_event(self.future)
        self.assertEqual(self.project_payload()['eventsToCome'], 1)

    def test_an_event_spanning_today_is_counted(self):
        self.make_event(self.past, self.future)
        self.assertEqual(self.project_payload()['eventsToCome'], 1)

    def test_an_event_starting_today_is_counted(self):
        self.make_event(self.today)
        self.assertEqual(self.project_payload()['eventsToCome'], 1)


class ProjectDetailContractTest(DataFixtureTestCase):
    def detail(self, project=None):
        response = self.client.get(
            reverse('project-detail', args=[(project or self.project).pk])
        )
        self.assertEqual(response.status_code, 200, response.data)
        return response.data

    def test_response_keys_are_unchanged(self):
        self.assertEqual(
            set(self.detail()),
            {'id', 'name', 'description', 'tags', 'archived', 'createdOn',
             'sections', 'tasks', 'events'},
        )

    def test_nested_tasks_carry_their_tags(self):
        payload = self.detail()
        self.assertEqual(len(payload['tasks']), 3)
        self.assertEqual(len(payload['sections']), 1)
        self.assertEqual(len(payload['sections'][0]['tasks']), 4)
        for task in payload['tasks'] + payload['sections'][0]['tasks']:
            with self.subTest(task=task['name']):
                self.assertEqual([tag['name'] for tag in task['tags']], ['rapide'])

    def test_the_payload_preserves_the_model_ordering(self):
        """Un prefetch_related mal posé peut réordonner une relation sans rien casser d'autre :
        c'est le vrai risque de §4.

        On compare à l'ordre du modèle plutôt qu'à une attente en dur. Ce qui est garanti, c'est
        que la sérialisation ne réordonne pas — PAS la place des NULL de `completed_at` dans un
        tri DESC, qui dépend du SGBD (PostgreSQL les met en tête, SQLite en queue) et dont
        aucun écran ne dépend : les cinq composants qui affichent des tâches filtrent tous sur
        `completed`, jamais les deux ensemble."""
        payload = self.detail()
        self.assertEqual(
            [task['id'] for task in payload['tasks']],
            list(Task.objects.filter(project=self.project).values_list('pk', flat=True)),
        )
        self.assertEqual(
            [task['id'] for task in payload['sections'][0]['tasks']],
            list(Task.objects.filter(section=self.section).values_list('pk', flat=True)),
        )

    def test_another_users_project_is_a_404(self):
        foreign = Project.objects.create(user=self.other, name='X', description='')
        response = self.client.get(reverse('project-detail', args=[foreign.pk]))
        self.assertEqual(response.status_code, 404)


class HasUncompletedTaskFilterTest(DataFixtureTestCase):
    def project_ids(self, **params):
        response = self.client.get(
            reverse('project-list'), {'size': 0, 'has_uncompleted_task': 'true', **params}
        )
        return [item['id'] for item in response.data['content']]

    def test_each_project_appears_exactly_once(self):
        """Aujourd'hui garanti par .distinct(), demain par Exists(). `self.project` a 4 tâches
        non terminées réparties sur deux jointures : sans déduplication il sortirait 4 fois."""
        ids = self.project_ids()
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn(self.project.pk, ids)

    def test_a_fully_completed_project_is_excluded(self):
        Task.objects.filter(project=self.project).update(completed=True)
        Task.objects.filter(section=self.section).update(completed=True)
        self.assertNotIn(self.project.pk, self.project_ids())

    def test_a_project_without_any_task_is_excluded(self):
        self.assertNotIn(self.empty_project.pk, self.project_ids())

    def test_it_combines_with_the_archived_filter(self):
        self.assertNotIn(self.project.pk, self.project_ids(archived='true'))

    def test_collections_behave_the_same(self):
        response = self.client.get(
            reverse('list-list'), {'size': 0, 'has_uncompleted_task': 'true'}
        )
        ids = [item['id'] for item in response.data['content']]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn(self.collection.pk, ids)
        self.assertNotIn(self.empty_collection.pk, ids)


class CollectionContractTest(DataFixtureTestCase):
    def test_list_response_keys_are_unchanged(self):
        """`itemName` est ABSENT aujourd'hui alors que le type front CollectionList le déclare.
        §10 le corrige ; c'est la seule étape qui modifie ce test, et elle est optionnelle."""
        self.assertEqual(
            set(self.collection_payload()),
            {'id', 'name', 'description', 'archived', 'createdOn',
             'taskCount', 'completedTaskCount'},
        )

    def test_counts(self):
        payload = self.collection_payload()
        self.assertEqual(payload['taskCount'], 5)
        self.assertEqual(payload['completedTaskCount'], 2)

    def test_an_empty_collection_counts_zero_not_null(self):
        payload = self.collection_payload(self.empty_collection)
        self.assertEqual(payload['taskCount'], 0)
        self.assertEqual(payload['completedTaskCount'], 0)

    def test_detail_carries_tasks_with_their_tags(self):
        response = self.client.get(reverse('list-detail', args=[self.collection.pk]))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data['tasks']), 5)
        for task in response.data['tasks']:
            self.assertEqual([tag['name'] for tag in task['tags']], ['rapide'])

    def test_queryset_is_scoped_to_the_current_user(self):
        Collection.objects.create(user=self.other, name='Pas à moi', description='')
        response = self.client.get(reverse('list-list'), {'size': 0})
        self.assertNotIn('Pas à moi', [item['name'] for item in response.data['content']])


class DailyTaskContractTest(DataFixtureTestCase):
    def setUp(self):
        super().setUp()
        # `completed=False` est explicite : DailyTaskPostSerializer.validate_taskId refuse une
        # tâche terminée. S'en remettre à l'ordre du modèle rendrait ce setUp dépendant de la
        # chose même que ProjectDetailContractTest teste.
        self.task = Task.objects.filter(section=self.section, completed=False).first()
        response = self.client.post(
            reverse('daily_task-list'), {'taskId': self.task.pk}, format='json'
        )
        self.assertEqual(response.status_code, 201, response.data)

    def payload(self):
        response = self.client.get(reverse('daily_task-list'), {'size': 0})
        self.assertEqual(response.status_code, 200, response.data)
        return response.data['content'][0]

    def test_response_keys_are_unchanged(self):
        self.assertEqual(
            set(self.payload()),
            {'id', 'date', 'task', 'commonTask', 'name', 'tags', 'action', 'completed'},
        )

    def test_the_nested_task_carries_its_whole_chain(self):
        """TaskExtendedSerializer imbrique project, section (qui imbrique project) et
        collection, chacun avec ses tags. C'est la chaîne la plus profonde de l'API."""
        task = self.payload()['task']
        self.assertEqual([tag['name'] for tag in task['tags']], ['rapide'])
        self.assertIsNone(task['project'])
        self.assertIsNone(task['collection'])
        self.assertEqual(task['section']['name'], 'Section')
        self.assertEqual(task['section']['project']['name'], 'Mixte')
        self.assertEqual(
            [tag['name'] for tag in task['section']['project']['tags']], ['urgent']
        )


class EventContractTest(DataFixtureTestCase):
    def setUp(self):
        super().setUp()
        self.event = Event.objects.create(
            user=self.user, name='E', project=self.project,
            start_date=timezone.localdate(),
        )

    def test_list_is_a_bare_array_with_the_extended_shape(self):
        response = self.client.get(reverse('event-list'))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsInstance(response.data, list)  # event/ n'est PAS paginé
        self.assertEqual(
            set(response.data[0]),
            {'id', 'name', 'startDate', 'startTime', 'endDate', 'endTime',
             'description', 'takesWholeDay', 'project'},
        )

    def test_the_nested_project_carries_its_tags(self):
        response = self.client.get(reverse('event-list'))
        self.assertEqual([tag['name'] for tag in response.data[0]['project']['tags']], ['urgent'])
```

#### `tout_doux/test_query_counts.py`

```python
"""
Mesure et non-régression de performance (docs/workflows/n-plus-one-optimization.md).

Contrairement à test_api_contract.py, ces tests DOIVENT échouer avant le chantier : c'est ce
qu'ils mesurent. Après, ils empêchent qu'un SerializerMethodField réintroduise le N+1 en
silence — ce qui ne produit aucune erreur, seulement de la lenteur.

`force_authenticate` (hérité de DataFixtureTestCase) est indispensable ici : knox est configuré
en AUTO_REFRESH, donc une requête authentifiée par jeton peut écrire en base selon un intervalle
minimal, et le nombre de requêtes deviendrait non déterministe.

CaptureQueriesContext force lui-même le curseur de debug : il fonctionne avec DEBUG=False.
"""
from datetime import timedelta

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone

from tout_doux.models import Collection, Event, Project, Section, Task
from tout_doux.test_api_contract import DataFixtureTestCase

# Plafonds volontairement larges : ils attrapent un retour au N+1 (des centaines de requêtes),
# pas une requête de plus. À resserrer une fois la première exécution verte connue.
BUDGETS = {
    'project-list': 6,
    'project-detailed': 12,
    'list-list': 6,
    'list-detailed': 8,
    'daily_task-list': 10,
    'event-list': 5,
}


class QueryCountTestCase(DataFixtureTestCase):
    def count_queries(self, route, params=None):
        url = reverse(route)
        with CaptureQueriesContext(connection) as captured:
            response = self.client.get(url, params if params is not None else {'size': 0})
            self.assertEqual(response.status_code, 200, response.data)
        return len(captured)

    def assert_within_budget(self, route, params=None):
        count = self.count_queries(route, params)
        budget = BUDGETS[route]
        self.assertLessEqual(
            count, budget, f'{route} : {count} requêtes SQL (budget {budget})'
        )

    def add_projects(self, how_many, tasks_each=5):
        for index in range(how_many):
            project = Project.objects.create(user=self.user, name=f'P{index}', description='')
            project.tags.add(self.project_tag)
            section = Section.objects.create(user=self.user, name='S', project=project)
            self.make_tasks(tasks_each, completed=1, section=section)


class ProjectQueryCountTest(QueryCountTestCase):
    def test_list_does_not_grow_with_the_number_of_projects(self):
        """La forme qui compte : pas un nombre absolu, mais l'absence de croissance."""
        before = self.count_queries('project-list')
        self.add_projects(10)
        self.assertEqual(before, self.count_queries('project-list'))

    def test_detailed_does_not_grow_with_the_number_of_projects(self):
        before = self.count_queries('project-detailed')
        self.add_projects(10)
        self.assertEqual(before, self.count_queries('project-detailed'))

    def test_detailed_does_not_grow_with_the_number_of_tasks(self):
        """LE test du chantier : les tags de chaque tâche pèsent ~900 des ~1 000 requêtes
        actuelles de cet endpoint. C'est la croissance par tâche, pas par projet."""
        before = self.count_queries('project-detailed')
        self.make_tasks(50, completed=10, section=self.section)
        self.assertEqual(before, self.count_queries('project-detailed'))

    def test_list_stays_within_budget(self):
        self.add_projects(10)
        self.assert_within_budget('project-list')

    def test_detailed_stays_within_budget(self):
        self.add_projects(10)
        self.assert_within_budget('project-detailed')

    def test_has_uncompleted_task_does_not_grow(self):
        params = {'size': 0, 'has_uncompleted_task': 'true'}
        before = self.count_queries('project-list', params)
        self.add_projects(10)
        self.assertEqual(before, self.count_queries('project-list', params))


class CollectionQueryCountTest(QueryCountTestCase):
    def add_collection_tasks(self, how_many):
        self.make_tasks(how_many, completed=0, collection=self.collection)

    def add_collections(self, how_many, tasks_each=5):
        for index in range(how_many):
            collection = Collection.objects.create(
                user=self.user, name=f'C{index}', description=''
            )
            self.make_tasks(tasks_each, completed=2, collection=collection)

    def test_list_does_not_grow_with_the_number_of_collections(self):
        before = self.count_queries('list-list')
        self.add_collections(10)
        self.assertEqual(before, self.count_queries('list-list'))

    def test_detailed_does_not_grow_with_the_number_of_tasks(self):
        before = self.count_queries('list-detailed')
        self.add_collection_tasks(50)
        self.assertEqual(before, self.count_queries('list-detailed'))

    def test_list_stays_within_budget(self):
        # Grossir le jeu AVANT de mesurer : avec les 2 collections de la fixture, le budget
        # passait même sans correction (6 requêtes pour un budget de 6) et ne testait rien.
        self.add_collections(10)
        self.assert_within_budget('list-list')

    def test_detailed_stays_within_budget(self):
        self.add_collection_tasks(50)
        self.assert_within_budget('list-detailed')


class DailyTaskQueryCountTest(QueryCountTestCase):
    def setUp(self):
        super().setUp()
        self.plan(Task.objects.filter(section=self.section, completed=False))

    def plan(self, tasks):
        """Le statut est asserté : une tâche terminée serait refusée en 400, et le test
        mesurerait alors une liste plus courte que prévu sans que rien ne le signale."""
        for task in tasks:
            response = self.client.post(
                reverse('daily_task-list'), {'taskId': task.pk}, format='json'
            )
            self.assertEqual(response.status_code, 201, response.data)

    def test_does_not_grow_with_the_number_of_daily_tasks(self):
        before = self.count_queries('daily_task-list')
        self.plan(self.make_tasks(10, completed=0, section=self.section))
        self.assertEqual(before, self.count_queries('daily_task-list'))

    def test_stays_within_budget(self):
        self.assert_within_budget('daily_task-list')


class EventQueryCountTest(QueryCountTestCase):
    def setUp(self):
        super().setUp()
        self.add_events(3)

    def add_events(self, how_many):
        start = timezone.localdate()
        for index in range(how_many):
            Event.objects.create(
                user=self.user, name=f'E{index}', project=self.project,
                start_date=start + timedelta(days=index),
            )

    def test_does_not_grow_with_the_number_of_events(self):
        # event/ n'est pas paginé : `params={}` et non `{'size': 0}`
        before = self.count_queries('event-list', {})
        self.add_events(10)
        self.assertEqual(before, self.count_queries('event-list', {}))

    def test_stays_within_budget(self):
        self.assert_within_budget('event-list', {})
```

**Vérification de §0**

```bash
docker exec tout_doux_backend python manage.py test tout_doux.test_api_contract -v 2   # doit être VERT
docker exec tout_doux_backend python manage.py test tout_doux.test_query_counts -v 2   # doit être ROUGE
```

Le rouge de `test_query_counts` **est la mesure d'avant** : les messages d'échec citent le
nombre de requêtes constaté. Les reporter dans la table « Objectif » ci-dessus.

> ✅ **§0 est fait** — exécuté le 27/08/2026 sur `tout_doux_backend`.
> `test_api_contract` : **30/30 verts** du premier coup, sur le code non modifié.
> `test_query_counts` : **14/14 rouges**, chiffres reportés dans la table « Objectif ».

ℹ️ **La suite n'était pas verte au départ**, pour une raison étrangère à ce chantier :
`CorsTest.test_the_middleware_still_answers` envoyait `Origin: http://localhost:8080` alors que
`settings.py:83` restreint désormais à `CORS_ALLOWED_ORIGINS = [SERVER_URL]` — le header était
donc omis à juste titre. Le test datait de l'époque où `CORS_ALLOW_ALL_ORIGINS` valait `True`,
réglage supprimé depuis. **Corrigé dans la foulée** : deux tests sous `override_settings` (une
origine autorisée obtient le header, une inconnue ne l'obtient pas), et le risque surveillé
correspondant a été retiré du registre `quality/`.

**Référence pour la suite du chantier** : la suite complète compte **58 tests**, et le seul
échec attendu est celui des **14 tests de `test_query_counts`**. Tout autre rouge est une
régression.

---

### §1 — `has_uncompleted_task` : `filter().distinct()` → `Exists()`

**Pourquoi** — le filtre actuel joint `tasks` **et** `sections__tasks`, produit un projet en
autant d'exemplaires qu'il a de tâches non terminées, puis fait dédupliquer PostgreSQL. Le
travail est fait deux fois. Et `DISTINCT` a deux effets de bord qui deviendront gênants :
il ramène le produit cartésien dès qu'on ajoute un `annotate(Count(...))` (§2), et le `COUNT(*)`
de la pagination devra porter sur l'ensemble dédupliqué le jour où on paginera vraiment.

`EXISTS` est une sous-requête corrélée que le planificateur peut arrêter à la première ligne
trouvée : aucun doublon produit, donc rien à défaire.

**Ce qui change** — `tout_doux/views/project.py`

```python
# AVANT
        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(
                Q(tasks__completed=False) | Q(sections__tasks__completed=False)
            ).distinct()

# APRÈS
        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(Exists(project_tasks(completed=False)))
```

avec, en haut du module :

```python
from django.db.models import Exists, OuterRef, Q

from tout_doux.models import Task


def project_tasks(**filters):
    """Les tâches d'un projet, directes ou via une section, corrélées au projet englobant."""
    return Task.objects.filter(
        Q(project=OuterRef('pk')) | Q(section__project=OuterRef('pk')), **filters
    )
```

`tout_doux/views/collection.py` — le fichier n'importe **rien** de `django.db.models` ni de
`tout_doux.models` aujourd'hui : le bloc d'imports est à créer.

```python
# APRÈS — imports à ajouter en tête de module
from django.db.models import Exists, OuterRef

from tout_doux.models import Task
```

```python
# AVANT
            queryset = queryset.filter(tasks__completed=False).distinct()

# APRÈS
            queryset = queryset.filter(
                Exists(Task.objects.filter(collection=OuterRef('pk'), completed=False))
            )
```

**Vérification** — `HasUncompletedTaskFilterTest` : unicité des identifiants, exclusion d'un
projet entièrement terminé, exclusion d'un projet sans tâche, combinaison avec `archived`,
même comportement côté collection.

**Pièges**

- ⚠️ La chaîne de comparaison `in ['true', 'True']` est conservée telle quelle. Ce n'est pas
  élégant, mais la changer serait un changement de comportement hors périmètre.
- ⚠️ `has_uncompleted_task` est lu dans `get_queryset()`, donc il s'applique aussi à
  `retrieve` et à `get_object()`. Vérifié : sans `distinct()`, un `GET /project/5/` reste
  identique — il n'y a plus de jointure à dédupliquer.

> ✅ **§1 est fait** — SQL généré vérifié sur les deux vues : plus de `DISTINCT`, aucune
> jointure dans la requête externe, `LIMIT 1` dans la sous-requête corrélée.
> Suite : **58 tests, 14 échecs**, tous dans `test_query_counts` — la référence est tenue.
> ℹ️ Aucun compteur ne baisse ici : c'était déjà une requête unique. Le gain est de forme,
> et il conditionne §2 (c'est le `DISTINCT` qui aurait ramené le produit cartésien).

---

### §2 — Compteurs de `ProjectListSerializer` : trois requêtes par projet → zéro

**Pourquoi** — `get_task_count`, `get_completed_task_count` et `get_events_to_come` exécutent
chacun un `SELECT COUNT(*)` par projet sérialisé. Aucun `prefetch_related` ne peut les sauver :
ils interrogent `Task.objects` directement, hors de tout cache.

**Pourquoi des sous-requêtes et pas `Count(..., distinct=True)`** — trois compteurs portent sur
**trois relations vers-plusieurs différentes** (`tasks`, `sections__tasks`, `events`). Trois
`LEFT JOIN` sur la même requête produisent un produit cartésien à trois facteurs : les
comptages sont faux sans `distinct=True`, et coûteux avec. Une sous-requête corrélée n'ajoute
**aucune jointure** à la requête principale : l'invariant tient quel que soit le nombre de
compteurs qu'on ajoutera en partie 2.

Un `annotate` d'agrégat a un **second** coût, moins connu et vérifié à l'exécution : il rend le
`COUNT(*)` de la pagination plus cher. Django enveloppe le comptage dans une sous-requête
groupée dès qu'une annotation contient un agrégat (`sql/query.py`, `has_existing_aggregation`).
Avec des sous-requêtes scalaires — `Subquery.contains_aggregate` vaut `False` — les annotations
sont au contraire **entièrement élidées** du comptage. Mesuré :

| Annotation                     | SQL du `.count()` de pagination                                    |
| ------------------------------ | ------------------------------------------------------------------ |
| `scalar_count` (sous-requêtes) | `SELECT COUNT(*) FROM project` — plat, sous-requêtes non exécutées |
| `Count('tasks')`               | `SELECT COUNT(*) FROM (… LEFT JOIN task … GROUP BY collection.id)` |

Le critère à retenir, et à réutiliser :

> **Plusieurs relations vers-plusieurs, ou un queryset destiné à être paginé pour de vrai →
> sous-requête (§2). Une seule relation et un comptage occasionnel → `Count`, plus lisible
> (§3).**

**Ce qui change** — nouveau `tout_doux/queries.py`

```python
from django.db.models import Count, IntegerField, Subquery
from django.db.models.functions import Coalesce


def scalar_count(queryset, group_by):
    """Compte les lignes d'un queryset corrélé, sans jointure dans la requête appelante.

    Recette documentée par Django (« Using aggregates within a Subquery expression ») :
    on regroupe sur la colonne de corrélation pour obtenir exactement un groupe, puis on ne
    projette que le compte.

    `order_by()` vide le tri hérité du Meta du modèle, que Django ajouterait sinon à la
    sous-requête. `Coalesce` traite le cas « aucune ligne » : un GROUP BY sans groupe ne
    renvoie pas 0, il ne renvoie aucune ligne, et la sous-requête vaut alors NULL.
    """
    return Coalesce(
        Subquery(
            queryset.order_by().values(group_by).annotate(n=Count('pk')).values('n')[:1],
            output_field=IntegerField(),
        ),
        0,
    )
```

`tout_doux/views/project.py`

```python
# APRÈS
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone

from tout_doux.models import Event, Task
from tout_doux.queries import scalar_count


class ProjectViewSet(viewsets.ModelViewSet):
    # …

    def get_queryset(self):
        queryset = self.request.user.projects.all()

        if self.action in ('list', 'detailed', 'retrieve'):
            queryset = queryset.prefetch_related('tags')

        if self.action == 'list':
            # Une tâche a soit `project`, soit `section` : les deux comptes sont disjoints.
            # Voir « Divergence assumée » plus bas.
            now = timezone.now()
            queryset = queryset.annotate(
                task_count=(
                    scalar_count(Task.objects.filter(project=OuterRef('pk')), 'project')
                    + scalar_count(
                        Task.objects.filter(section__project=OuterRef('pk')), 'section__project'
                    )
                ),
                completed_task_count=(
                    scalar_count(
                        Task.objects.filter(project=OuterRef('pk'), completed=True), 'project'
                    )
                    + scalar_count(
                        Task.objects.filter(section__project=OuterRef('pk'), completed=True),
                        'section__project',
                    )
                ),
                events_to_come=scalar_count(
                    Event.objects.filter(
                        Q(start_date__gte=now) | Q(start_date__lte=now, end_date__gte=now),
                        project=OuterRef('pk'),
                    ),
                    'project',
                ),
            )

        if self.action in ('detailed', 'retrieve'):
            queryset = queryset.prefetch_related('tasks__tags', 'sections__tasks__tags', 'events')

        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(Exists(project_tasks(completed=False)))

        return queryset
```

`tout_doux/serializers/project/project_list.py`

```python
# AVANT — 3 SerializerMethodField + 3 méthodes, 8 lignes de corps
    taskCount = serializers.SerializerMethodField(method_name='get_task_count')
    completedTaskCount = serializers.SerializerMethodField(method_name='get_completed_task_count')
    eventsToCome = serializers.SerializerMethodField(method_name='get_events_to_come')

# APRÈS
    taskCount = serializers.IntegerField(source='task_count', read_only=True)
    completedTaskCount = serializers.IntegerField(source='completed_task_count', read_only=True)
    eventsToCome = serializers.IntegerField(source='events_to_come', read_only=True)
```

Les imports `Q`, `timezone`, `Task` deviennent inutiles dans ce sérialiseur : les retirer.

**Vérification** — `ProjectListContractTest` (7/3 sur le projet mixte, 2/0 et 2/1 sur les
projets à une seule branche, 0/0 sur le projet vide) et `EventsToComeContractTest` (passé,
futur, à cheval, démarrant aujourd'hui). `ProjectQueryCountTest.test_list_*`.

**Pièges**

- ⚠️ **Le sérialiseur devient couplé au queryset.** `ProjectListSerializer` lèvera une
  `AttributeError` s'il est instancié sur un `Project` non annoté. Vérifié : il n'est utilisé
  qu'à l'action `list` (`views/project.py:16`, seule occurrence dans tout le dépôt). À écrire
  dans `architecture/serializers.md`.
- ⚠️ **Ne pas annoter sur `detailed`.** L'action `detailed` délègue à `list()` mais sert
  `ProjectDetailSerializer`, qui n'utilise aucun de ces compteurs : les annoter serait trois
  sous-requêtes par ligne pour rien. D'où le `self.action == 'list'` strict.
- ⚠️ **`Coalesce` n'est pas cosmétique.** Sans lui, un projet sans tâche renvoie `null` au lieu
  de `0`, et `ProjectCard.vue` calcule `completedTaskCount / taskCount`. Un test dédié le
  couvre.
- ⚠️ **`timezone.now()` est calculé une fois par requête**, comme aujourd'hui. `DateField`
  reçoit un `datetime` aware : Django le convertit vers `TIME_ZONE` (Europe/Paris) puis prend
  `.date()`. Comportement identique à l'actuel — ne pas « corriger » en `localdate()` dans ce
  chantier, ce serait un changement de comportement déguisé en nettoyage.
- ⚠️ **Divergence assumée.** Le code actuel compte `Q(project=P) | Q(section__project=P)` sur
  un seul queryset : une tâche portant **à la fois** `project` et `section` serait comptée une
  fois. La somme de deux sous-requêtes la compterait deux fois. `TaskPostSerializer.validate`
  (`serializers/task/task_post.py`) impose exactement une relation sur trois, donc l'API ne
  peut pas produire une telle ligne — mais le modèle, lui, l'autorise. Un test épingle ce garde
  (`test_the_api_refuses_a_task_on_both_a_project_and_a_section`) ; s'il tombe un jour, cette
  équivalence tombe avec lui.
  > ✅ **§2 est fait** — et **§4 avec lui** : les `prefetch_related` étaient déjà dans le
  > `get_queryset()` de cette section, §4 n'en reste que la justification et la vérification.
  > Mesuré : `GET /project/` **58 → 3** requêtes, `GET /project/detailed/` **131 → 9**, les deux
  > constantes (cible atteinte). SQL vérifié : aucune jointure dans la requête externe, et le
  > `COUNT(*)` de pagination reste plat — `SELECT COUNT(*) FROM tout_doux_project`, annotations
  > élidées, exactement le comportement prévu par la table ci-dessus.
  > Suite : **58 tests, 8 échecs** — les 6 de `ProjectQueryCountTest` sont passés au vert,
  > `test_api_contract` reste 30/30 et non modifié.

---

### §3 — Compteurs de `CollectionListSerializer` : deux requêtes par collection → zéro

**Pourquoi** — même problème que §2, et `get_completed_task_count` est le cas d'école : il fait
`collection.tasks.filter(completed=True).count()`. Un `prefetch_related('tasks')` ne le
corrigerait **pas** — `filter()` clone le queryset, ce qui perd le cache de préchargement et
repart en base. Seule l'annotation résout ce cas.

**Pourquoi `Count` et pas une sous-requête** — les deux compteurs portent sur **la même**
relation `tasks`. Une seule jointure, donc aucun produit cartésien possible ; `distinct=True`
serait un coût gratuit et une sous-requête, une complication gratuite. `Count` est ici plus
lisible, et c'est l'idiome Django.

**Le prix à connaître, mesuré** — un agrégat dans les annotations force Django à envelopper le
`COUNT(*)` de la pagination : `SELECT COUNT(*) FROM (SELECT collection.id … LEFT JOIN task …
GROUP BY collection.id)`. Aujourd'hui ce comptage est plat. Pour compter 20 collections, la base
joindra et groupera autant de lignes qu'il y a de tâches — quelques milliers, soit une fraction
de milliseconde. **Décision : on accepte, `Count` reste.** Bascule vers `scalar_count` (une
ligne, même signature qu'en §2) si l'une de ces conditions est atteinte :

- la partie 2 introduit la pagination réelle **et** `GET /collection/` dépasse 100 ms, ce
  comptage étant alors refait à chaque page ;
- une collection dépasse quelques milliers de tâches.

À inscrire dans [`../quality/watched-risks.md`](../quality/watched-risks.md) en §11, avec ces
deux déclencheurs — c'est exactement le format de ce registre.

**Ce qui change** — `tout_doux/views/collection.py`. Le fichier n'importe aujourd'hui **aucun**
de ces noms : le bloc d'imports est à ajouter en entier.

```python
# APRÈS — imports à ajouter en tête de module
from django.db.models import Count, Exists, OuterRef, Q

from tout_doux.models import Task
```

```python
# APRÈS
    def get_queryset(self):
        queryset = self.request.user.collections.all()

        if self.action == 'list':
            # Une seule relation vers-plusieurs jointe : pas de produit cartésien possible.
            queryset = queryset.annotate(
                task_count=Count('tasks'),
                completed_task_count=Count('tasks', filter=Q(tasks__completed=True)),
            )

        if self.action in ('detailed', 'retrieve'):
            queryset = queryset.prefetch_related('tasks__tags')

        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(
                Exists(Task.objects.filter(collection=OuterRef('pk'), completed=False))
            )

        return queryset
```

`tout_doux/serializers/collection/collection_list.py`

```python
# APRÈS
    taskCount = serializers.IntegerField(source='task_count', read_only=True)
    completedTaskCount = serializers.IntegerField(source='completed_task_count', read_only=True)
```

**Vérification** — `CollectionContractTest` (5/2, et 0/0 sur la collection vide),
`CollectionQueryCountTest`.

**Pièges**

- ⚠️ **`Count('*', filter=…)` lève une `ValueError`** (`aggregates.py:171`). Avec un filtre, il
  faut nommer une colonne — d'où `Count('tasks', filter=…)`.
- ⚠️ `Count` sur une relation vide renvoie `0`, pas `NULL` : pas de `Coalesce` nécessaire ici.
  C'est une différence réelle avec §2, et le test de la collection vide la couvre.

> ✅ **§3 est fait** — et **§5 avec lui**, le `prefetch_related('tasks__tags')` étant dans le
> même `get_queryset()`. Mesuré : `GET /collection/` **26 → 2** requêtes (mieux que la cible de
> 3 : cette liste ne sert pas de tags), `GET /collection/detailed/` **59 → 4**, les deux
> constantes.
> **Le prix annoncé est bien réel**, vérifié sur le SQL généré :
> `SELECT COUNT(*) FROM (SELECT collection.id FROM collection LEFT OUTER JOIN task ON … GROUP BY 1) subquery`.
> C'est la contrepartie assumée ci-dessus, à inscrire dans `watched-risks.md` en §11 avec ses
> deux déclencheurs.
> Suite : **58 tests, 4 échecs** — les 4 de `CollectionQueryCountTest` sont passés au vert.

---

### §4 — Préchargement des relations : `ProjectViewSet`

**Pourquoi** — `ProjectDetailSerializer` imbrique quatre relations, dont une à trois niveaux
(`sections` → `tasks` → `tags`). C'est cette dernière qui produit l'essentiel du millier de
requêtes de `project/detailed/` : un `SELECT` de tags par tâche.

Les lignes correspondantes sont déjà dans le `get_queryset()` de §2 ; cette section existe pour
justifier la **liste exacte** des lookups, qui doit correspondre un pour un aux
`many=True` de l'arbre de sérialisation :

| Déclaration du sérialiseur                                           | Lookup                  |
| -------------------------------------------------------------------- | ----------------------- |
| `ProjectSerializer.tags`                                             | `tags`                  |
| `ProjectDetailSerializer.tasks` → `TaskSerializer.tags`              | `tasks__tags`           |
| `.sections` → `SectionTasksSerializer.tasks` → `TaskSerializer.tags` | `sections__tasks__tags` |
| `.events`                                                            | `events`                |

**Vérification** — `ProjectDetailContractTest.test_nested_tasks_carry_their_tags` prouve que le
contenu est intact ; `test_detailed_does_not_grow_with_the_number_of_tasks` prouve que le N+1
par tâche a disparu. C'est la paire la plus importante du chantier.

**Pièges**

- ⚠️ **Le préchargement est restreint aux actions de lecture.** Vérifié dans
  `related_descriptors.py` : `add`, `remove` et `clear` purgent le cache
  (`_remove_prefetched_objects`), donc précharger `tags` sur un PATCH ne renverrait **pas** des
  tags périmés. Le restreindre reste préférable : deux requêtes inutiles en moins sur chaque
  écriture et chaque suppression.
- ✅ **Le mode `size=0` conserve les préchargements.** `paginate_queryset` renvoie
  `queryset.all()`, et `QuerySet._clone()` recopie `_prefetch_related_lookups`
  (`query.py:1920`). Vérifié, parce que c'est le mode utilisé par presque toutes les listes du
  front — si ça n'avait pas été le cas, tout le chantier n'aurait servi à rien.

> ✅ **§4 est fait**, livré avec §2 : les quatre lookups du tableau ci-dessus sont en place.
> `test_detailed_does_not_grow_with_the_number_of_tasks` est vert — +50 tâches n'ajoutent plus
> aucune requête, contre +50 avant. `GET /project/detailed/` : **131 → 9**, constant.

---

### §5 — Préchargement des relations : `CollectionViewSet`

**Pourquoi** — `CollectionDetailSerializer.tasks` → `TaskSerializer.tags` : un `SELECT` de tags
par tâche. Sur les « très grandes collections » signalées, c'est le coût dominant.

**Ce qui change** — la ligne `prefetch_related('tasks__tags')` de §3, aux actions `detailed` et
`retrieve` uniquement.

**Vérification** — `CollectionContractTest.test_detail_carries_tasks_with_their_tags` et
`CollectionQueryCountTest.test_detailed_does_not_grow_with_the_number_of_tasks`.

> ✅ **§5 est fait**, livré avec §3. +50 tâches dans une collection n'ajoutent plus aucune
> requête, contre +50 avant : `GET /collection/detailed/` **59 → 4**, constant. C'est le cas des
> « très grandes collections » signalé au départ.

---

### §6 — Préchargement des relations : `DailyTaskViewSet`

**Pourquoi** — c'est la chaîne la plus profonde de l'API. `DailyTaskSerializer` imbrique
`TaskExtendedSerializer`, qui imbrique `project`, `section` (qui imbrique lui-même `project`) et
`collection` — chacun avec ses tags.

**Ce qui change** — `tout_doux/views/daily_task.py`

```python
# AVANT
    def get_queryset(self):
        return self.request.user.dailytasks.all()

# APRÈS
    def get_queryset(self):
        return self.request.user.dailytasks.select_related(
            'task__project', 'task__section__project', 'task__collection', 'common_task',
        ).prefetch_related(
            'tags', 'task__tags', 'task__project__tags', 'task__section__project__tags',
            'common_task__tags',
        )
```

**Vérification** — `DailyTaskContractTest.test_the_nested_task_carries_its_whole_chain` vérifie
les quatre niveaux, y compris les tags du projet atteint via la section.
`DailyTaskQueryCountTest`.

**Pièges**

- ⚠️ `select_related('task__section__project')` implique `task` et `task__section` : ne pas les
  répéter.
- ⚠️ Les tags sont des M2M : ils ne peuvent **pas** passer en `select_related`. Le mélange des
  deux dans le même queryset est normal et voulu — `select_related` élargit la requête
  principale, `prefetch_related` ajoute des requêtes plates.
- ⚠️ `DailyTask.date` est en `auto_now_add` : impossible à fixer à la création. Les tests qui
  ont besoin d'une autre date passent par `DailyTask.objects.filter(pk=…).update(date=…)`.

> ✅ **§6 est fait** — `GET /daily-task/` **74 → 5** requêtes, constant (cible 7, dépassée).
> Les neuf lookups correspondent un pour un à l'arbre de sérialisation, vérifié :
> `DailyTaskSerializer.tags`, `task__tags`, `task__project__tags`,
> `task__section__project__tags`, `common_task__tags` en préchargement ; `task__project`,
> `task__section__project`, `task__collection`, `common_task` en jointure. `CollectionSerializer`
> ne sert pas de tags — `Collection` n'a pas cette relation — donc rien à précharger de ce côté.
> **Restriction d'action, tranchée par la mesure** — ici le critère de §4 ne s'applique pas tel
> quel : `DailyTaskPostSerializer` et `DailyTaskPatchSerializer` répondent tous deux avec
> `DailyTaskSerializer` via `to_representation`, donc une écriture sert la chaîne imbriquée
> complète et **profite** des lookups. Mesuré sur `PATCH` : **7** requêtes en les gardant, **9**
> en les restreignant aux actions de lecture. Seul `destroy` est du gaspillage pur — il ne lit
> que `date` : **6 → 3** requêtes en l'excluant. D'où `if self.action != 'destroy'`, et non la
> liste blanche de §4.

---

### §7 — Préchargement des relations : `EventViewSet`

**Pourquoi** — `EventExtendedSerializer.project` est un `ProjectSerializer` complet, tags
compris : deux requêtes par événement. `event/` **n'est pas paginé** et renvoie tous les
événements d'un mois, voire tous ceux de l'utilisateur.

**Ce qui change** — `tout_doux/views/event.py`

```python
# AVANT
        queryset = self.request.user.events.all()

# APRÈS
        queryset = self.request.user.events.select_related('project').prefetch_related(
            'project__tags'
        )
```

**Vérification** — `EventContractTest` (forme étendue, tags du projet imbriqué) et
`EventQueryCountTest`.

**Pièges**

- ⚠️ `event/` renvoie **un tableau nu**, pas l'enveloppe de pagination. Les tests doivent
  appeler sans `size` et attendre une `list`.
- ✅ `select_related('project')` bénéficie aussi à `destroy()`, qui lit
  `instance.project.archived`.

> ✅ **§7 est fait** — `GET /event/` **27 → 2** requêtes, constant, exactement la cible.
> L'endpoint n'étant pas paginé, c'est celui où la croissance par objet coûtait le plus cher.

---

### §8 — Connexions PostgreSQL persistantes

**Pourquoi** — `backend/settings.py:88` ne définit pas `CONN_MAX_AGE`, donc il vaut `0` :
**Django ouvre et ferme une connexion PostgreSQL à chaque requête HTTP**. Sur le réseau Docker,
l'établissement d'une connexion coûte quelques millisecondes — invisible derrière mille
requêtes SQL, très visible une fois qu'il n'y en a plus que six.

**Ce qui change** — `backend/settings.py`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        # Connexion persistante par worker uWSGI. Sans ça, une connexion est ouverte et fermée
        # à chaque requête HTTP.
        'CONN_MAX_AGE': 60,
        'HOST': os.environ.get('DB_HOST'),
        # …
    }
}
```

**Vérification** — aucun test ne peut la couvrir (`TestCase` gère les connexions lui-même). La
vérification est la procédure manuelle : `docker logs tout_doux_backend` sans erreur de
connexion, et l'application répond après plus de 60 secondes d'inactivité.

**Pièges**

- ⚠️ Le vrai pooling de Django 6 (`'OPTIONS': {'pool': True}`) exige **psycopg 3**. Le projet
  est en `psycopg2==2.9.12` : `CONN_MAX_AGE` est l'outil disponible, pas un pool.
- ⚠️ Une connexion persistante garde une transaction ouverte si une requête échoue mal. Avec
  uWSGI et `ATOMIC_REQUESTS` non activé, le risque est nul ici — mais c'est la raison pour
  laquelle on ne met pas `CONN_MAX_AGE=None` (persistance illimitée).
- ⚠️ Ce changement relève de `workflows/development.md` : le mettre à jour dans le même commit.

> ✅ **§8 est fait** — `CONN_MAX_AGE = 60` **et `CONN_HEALTH_CHECKS = True`**, documentés dans
> `development.md`.
> ✓ **Bug attrapé par la vérification** : `CONN_MAX_AGE` seul introduisait une régression.
> `close_if_unusable_or_obsolete()` ne teste que l'âge et les erreurs, jamais la vitalité ; le
> contrôle de santé vit dans `close_if_health_check_failed()`, qui sort immédiatement quand
> `CONN_HEALTH_CHECKS` est faux — et c'est le défaut. Prouvé en tuant le backend PostgreSQL par
> `pg_terminate_backend` : sans le réglage, la requête suivante lève `OperationalError` ; avec,
> elle passe. Chaque redémarrage de la base aurait produit un 500 par worker.
> Trois tests posés dans `tests.py` (`PersistentConnectionTest`), d'où **17 tests de fumée**.
> **Vérifié, et c'est une nuance que le plan n'avait pas** : le réglage est **sans effet en
> développement**. `ThreadedWSGIServer.close_request()` appelle `connections.close_all()`
> (`django/core/servers/basehttp.py`), donc `runserver` ferme tout après chaque requête quelle
> que soit la valeur. Le gain n'existe que derrière uWSGI, en production.
> **psycopg 3 écarté ici** : le pooling de Django 6 n'apporterait rien à `--workers 4` sans
> `--threads` — chaque worker est mono-thread, `CONN_MAX_AGE` lui donne déjà sa connexion
> unique et persistante, soit 4 connexions pour un `max_connections` de 100. Le sujet reste
> ouvert dans `django-6-migration.md` §4.1, pour la simplification du build, pas la performance.

---

### §9 — `daily-task/summary/` : trois requêtes par jour affiché

**Statut : conçu et mesuré.** La version précédente de cette section était une esquisse ; elle
proposait un `date__range` qui **ne fonctionne pas** sur les appels réels du front (voir « La
contrainte que l'esquisse avait manquée »). Ce qui suit la remplace.

**Pourquoi** — `DailySummarySerializer` (`serializers/daily_task/daily_summary.py:14-29`)
exécute trois `SELECT COUNT(*)` par jour de l'intervalle : un pour les daily tasks, un pour
celles qui sont terminées, un pour les événements. La vue construit `[{'date': d} for d in
daterange(...)]` et laisse chaque instance interroger la base. C'est le défaut de §2 appliqué à
une boucle sur des dates plutôt que sur des objets.

**Mesuré** — `DailySummary.vue:63` dimensionne la page selon la largeur d'écran, et chaque
défilement en recharge autant :

| Écran                | Jours par page | Requêtes SQL par appel |
| -------------------- | -------------- | ---------------------- |
| `xs`                 | 10             | **30**                 |
| `lgAndDown` (défaut) | 21             | **63**                 |
| `xl`                 | 42             | **126**                |

Exactement 3 × le nombre de jours, sans plancher : l'endpoint n'exécute rien d'autre.

#### §9.0 — Il n'y a aucun filet sur cet endpoint

Contrairement aux six endpoints traités jusqu'ici, `daily-task/summary/` n'est couvert **ni par
`test_api_contract.py`, ni par `test_query_counts.py`, ni par `tests.py`**. Vérifié : le mot
`summary` n'apparaît dans aucun des trois. Cette section doit donc commencer par son propre §0,
sinon elle réécrit à l'aveugle la seule partie de l'API qui n'a jamais été gelée.

Tests de caractérisation à écrire **avant** de toucher au code, verts sur le code actuel :

| Test                                                             | Ce qu'il gèle                                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `test_the_response_keys_are_unchanged`                           | `{date, totalTask, totalTaskCompleted, totalEvent}`            |
| `test_a_descending_range_is_served_newest_first`                 | **le seul mode utilisé par le front** — voir ci-dessous        |
| `test_an_ascending_range_is_served_oldest_first`                 | `daterange` gère les deux sens                                 |
| `test_a_single_day_range_returns_one_row`                        | bornes incluses des deux côtés                                 |
| `test_a_day_without_anything_reports_zeros`                      | des `0`, pas des `null` ni des trous dans la liste             |
| `test_tasks_are_counted_per_day_with_their_completed_share`      | les deux compteurs de tâches                                   |
| `test_a_multi_day_event_counts_on_every_day_it_spans`            | l'événement à cheval, le cas qui interdit un GROUP BY          |
| `test_an_event_without_an_end_date_counts_only_on_its_start_day` | `end_date` est `null=True`                                     |
| `test_events_outside_the_range_are_ignored`                      | le préfiltre ne doit pas élargir le comptage                   |
| `test_another_users_data_is_not_counted`                         | le cloisonnement, qui passe ici par `context`, pas par une vue |
| `test_a_missing_parameter_is_a_400`                              | `TypeError` → `ParseError`                                     |
| `test_an_invalid_date_is_a_400`                                  | `ValueError` → `ParseError`                                    |

⚠️ `DailyTask.date` est en `auto_now_add` : pour poser une daily task sur un jour passé, il faut
`DailyTask.objects.filter(pk=…).update(date=…)`. Une fixture qui l'ignore mesure tout sur
aujourd'hui et rend la moitié de ces tests vides de sens.

#### La contrainte que l'esquisse avait manquée

**L'intervalle demandé par le front est toujours décroissant.** `DailySummary.vue:30` appelle
`retrieveDailySummaryList(today, today - (daysPerPage - 1))`, et `loadNextPage()` (`:83`)
demande `start = dernière date - 1 jour`, `end = dernière date - daysPerPage`. Dans les deux cas
`start_date > end_date`. C'est délibéré : `daterange()` (`utils/date.py:8`) détecte le sens et
itère à rebours, ce qui donne au front une liste déjà triée du plus récent au plus ancien —
`dailySummaryList.concat(response)` puis `.at(-1)` en dépendent.

Or `date__range=(start, end)` de l'esquisse est un `BETWEEN` SQL : avec des bornes inversées il
ne renvoie **rien**. Vérifié à l'exécution :

```
date__range(start > end) renvoie : []
```

Autrement dit, l'esquisse aurait servi des compteurs à zéro sur **100 % des appels réels**, sans
lever la moindre erreur. D'où la règle ci-dessous : normaliser les bornes pour la requête, et ne
garder l'ordre demandé que pour la sortie.

#### Pourquoi les événements ne se groupent pas en SQL

Les daily tasks se groupent : une daily task appartient à une date, `values('date').annotate(…)`
suffit. Les événements, non — un événement à cheval appartient à plusieurs jours, donc aucun
`GROUP BY` ne produit la bonne ligne. `generate_series` de PostgreSQL le ferait, au prix d'un
`RawSQL` non portable, pour compter au plus quelques dizaines de lignes.

Le prédicat actuel, à reproduire exactement, est
`Q(start_date=date) | Q(start_date__lte=date, end_date__gte=date)`. Déplié, l'ensemble des dates
d'un événement vaut :

| Cas                                                         | Dates comptées                                       |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `end_date` renseigné et `>= start_date`                     | `[start_date, end_date]`                             |
| `end_date` nul (`null=True`)                                | `{start_date}`                                       |
| `end_date` < `start_date` (anomalie que le modèle autorise) | `{start_date}` — la seconde clause est insatisfiable |

Deux requêtes suffisent donc : une agrégation groupée pour les tâches, et **une seule** requête
qui rapatrie les bornes des événements recoupant l'intervalle, balayées ensuite en Python.

#### Ce qui change

`tout_doux/queries.py` — le module posé en §2 accueille cette fonction : c'est de l'accès aux
données qui ne tient pas dans une vue, et l'y mettre garde `summary()` lisible.

```python
from collections import Counter
from datetime import timedelta

from django.db.models import Count, IntegerField, Q, Subquery
from django.db.models.functions import Coalesce

from tout_doux.models import DailyTask, Event


def daily_summary_counts(user, dates):
    """Compte tâches et événements pour chaque date, en deux requêtes quel que soit l'intervalle.

    Les événements ne se groupent pas par date en SQL : un événement à cheval appartient à
    plusieurs jours. On rapatrie donc les bornes de ceux qui recoupent l'intervalle et on
    balaie en Python. `dates` peut être décroissant — c'est le cas de tous les appels du
    front — d'où les bornes normalisées par `min`/`max` avant d'interroger la base.
    """
    first, last = min(dates), max(dates)

    tasks = {
        row['date']: row
        for row in DailyTask.objects.filter(user=user, date__gte=first, date__lte=last)
        .values('date')
        .annotate(total=Count('pk'), completed=Count('pk', filter=Q(completed=True)))
    }

    spans = Event.objects.filter(user=user).filter(
        Q(start_date__gte=first, start_date__lte=last)
        | Q(start_date__lte=last, end_date__gte=first)
    ).values_list('start_date', 'end_date')

    events = Counter()
    for start, end in spans:
        # `end_date` est facultatif, et rien n'impose `end_date >= start_date` : dans ces deux
        # cas l'événement ne vaut que pour son jour de début, comme aujourd'hui.
        day, stop = max(start, first), min(end if end and end >= start else start, last)
        while day <= stop:
            events[day] += 1
            day += timedelta(days=1)

    return [
        {
            'date': day,
            'total_task': tasks.get(day, {}).get('total', 0),
            'total_task_completed': tasks.get(day, {}).get('completed', 0),
            'total_event': events[day],
        }
        for day in dates
    ]
```

`tout_doux/serializers/daily_task/daily_summary.py` — le sérialiseur cesse d'interroger la base
et n'a plus besoin de `context` :

```python
# AVANT — 3 SerializerMethodField, 3 méthodes, l'utilisateur passé par le contexte
from django.db.models import Q
from rest_framework import serializers

from tout_doux.models import DailyTask, Event
from tout_doux.serializers.common import ReadOnlySerializer


class DailySummarySerializer(ReadOnlySerializer):
    date = serializers.DateField()
    totalTask = serializers.SerializerMethodField(method_name='get_total_task')
    # … 3 méthodes de 3 à 5 lignes

# APRÈS — le fichier entier
from rest_framework import serializers

from tout_doux.serializers.common import ReadOnlySerializer


class DailySummarySerializer(ReadOnlySerializer):
    date = serializers.DateField()
    totalTask = serializers.IntegerField(source='total_task')
    totalTaskCompleted = serializers.IntegerField(source='total_task_completed')
    totalEvent = serializers.IntegerField(source='total_event')
```

`tout_doux/views/daily_task.py` — `summary()`, dernières lignes :

```python
# AVANT
        summary_range = [{'date': d} for d in daterange(start_date, end_date)]
        data = DailySummarySerializer(summary_range, many=True, context={'user': request.user}).data

        return Response(data)

# APRÈS
        summary_range = daily_summary_counts(request.user, list(daterange(start_date, end_date)))
        data = DailySummarySerializer(summary_range, many=True).data

        return Response(data)
```

avec `from tout_doux.queries import daily_summary_counts` en tête de module.

**Vérification** — les douze tests de §9.0 doivent rester verts **et inchangés**, plus un test de
constance et un budget à ajouter à `test_query_counts.py` :

```python
BUDGETS = {…, 'daily_task-summary': 4}
```

```python
    def test_it_does_not_grow_with_the_length_of_the_range(self):
        """Le cœur de §9 : 10 jours et 42 jours doivent coûter le même nombre de requêtes."""
        self.assertEqual(self.count_summary(days=10), self.count_summary(days=42))
```

Cible : **2 requêtes** de données, quel que soit l'intervalle, contre 30 / 63 / 126 aujourd'hui.

**Pièges**

- ⚠️ **Ne pas utiliser `date__range`** — bornes inversées, voir plus haut. `date__gte=first` +
  `date__lte=last` sur des bornes normalisées par `min`/`max`, jamais sur `start_date` et
  `end_date` tels que reçus.
- ⚠️ **L'ordre de sortie est celui de `dates`, pas celui de la base.** La compréhension de liste
  finale itère sur `dates` : c'est ce qui préserve le tri décroissant dont le front dépend. Ne
  pas la remplacer par une itération sur le résultat de la requête.
- ⚠️ **`Counter[day]` renvoie `0`** pour une clé absente, sans l'insérer. C'est ce qui remplace
  le `Coalesce` de §2 ; un `dict` nu lèverait une `KeyError` sur le premier jour vide.
- ⚠️ **Le préfiltre des événements sur-collecte volontairement** : sa seconde clause attrape
  aussi les événements dont `end_date < start_date`. Le balayage les ramène à leur seul jour de
  début, donc le résultat reste juste — mais ne pas « resserrer » ce filtre sans refaire la
  table des cas ci-dessus.
- ⚠️ **Le cloisonnement change de place.** Il vit aujourd'hui dans le sérialiseur, via
  `context={'user': …}` ; il passera dans `daily_summary_counts(user, …)`. Le `filter(user=…)`
  doit être présent sur **les deux** requêtes — c'est le troisième geste obligatoire de
  `CLAUDE.md`, et `test_another_users_data_is_not_counted` est ce qui le prouve.
- ⚠️ **`daterange()` renvoie un générateur.** `min`/`max` le consommeraient : d'où le `list(...)`
  dans la vue, et non un passage direct.

**Hors périmètre, à inscrire en §11** — l'endpoint **ne borne pas l'intervalle demandé**. Un
`start_date=2000-01-01&end_date=2026-01-01` fait aujourd'hui plus de 28 000 requêtes ; après §9
il en fera 2, mais construira toujours une liste de 9 500 dates en mémoire. §9 rend le défaut
supportable, il ne le corrige pas. C'est un risque surveillé, pas un correctif de ce chantier :
le borner changerait le contrat de l'API.

---

### §11 — Documentation, extraction, clôture

**Pourquoi** — ce fichier est supprimé à la fin. Ce qui doit survivre doit être déplacé avant,
sinon la connaissance part avec lui.

1. **Supprimer `W8`** de [`../quality/watched-risks.md`](../quality/watched-risks.md) — ligne
   d'index **et** section. Ne pas la marquer « faite » : l'historique git est déjà le registre
   de ce qui a été corrigé.
2. **Ajouter un risque surveillé** dans le même fichier : le `COUNT(*)` de pagination de
   `GET /collection/` est désormais enveloppé dans une sous-requête groupée (§3), avec les deux
   déclencheurs mesurables qui y sont donnés. C'est une contrepartie assumée, pas un oubli — le
   registre existe pour ça.
3. **Créer `../patterns/query-optimization.md`** avec ce qui est durable, et rien d'autre :
   - le critère de §2 : plusieurs relations vers-plusieurs, ou queryset réellement paginé →
     sous-requête ; une seule relation et un comptage occasionnel → `Count` ;
   - les deux coûts cachés d'un agrégat annoté : le produit cartésien à partir de la deuxième
     relation, et l'enveloppement du `COUNT(*)` de pagination ;
   - le contournement silencieux du cache de préchargement (`.filter()`, `.exclude()`,
     `.order_by()`, `.exists()` repartent en base ; `.all()`, `len()` et `.count()` utilisent le
     cache) ;
   - la règle « une `SerializerMethodField` ne fait jamais de requête » ;
   - la liste des sites d'application, comme l'exige le format `patterns/`.
4. **Mettre à jour `../architecture/serializers.md`** : les sérialiseurs `*List` sont désormais
   couplés à l'annotation de leur vue.
5. **Mettre à jour `verification.md`** : ✅ les compteurs de tests l'ont déjà été avec le
   correctif CORS. Reste la **commande** qui exécute les deux nouveaux fichiers, et le fait que
   `test_api_contract.py` doive rester vert à chaque étape.
6. **Mettre à jour `development.md`** pour `CONN_MAX_AGE` (§8).
7. **Reporter les nombres mesurés** dans la table « Objectif », puis **supprimer ce fichier**.

---

## Pièges transverses

Ceux qui ne se rattachent à aucune étape en particulier.

- ⚠️ **Le nombre de requêtes ne doit jamais croître avec les données.** C'est la propriété, pas
  un nombre absolu. Les tests de constance l'encodent sans nombre magique ; les tests de budget
  ne sont là que pour attraper une valeur constante mais absurde.
- ⚠️ **Un N+1 ne produit aucune erreur.** Il ne se voit ni au type-check, ni au `manage.py
check`, ni à la relecture — seul un compteur de requêtes le révèle. C'est pour ça que
  `test_query_counts.py` est le livrable le plus durable de ce chantier.
- ⚠️ **`connection.queries` est vide si `DEBUG=False`.** Les tests utilisent
  `CaptureQueriesContext`, qui force lui-même le curseur de debug ; pour une mesure à la main
  en `shell_plus`, il faut `DEBUG=True`.
- ⚠️ **Ne pas confondre `basename`.** `CollectionViewSet` est enregistré sous `basename='list'`
  (`urls.py:14`) : les routes s'appellent `list-list`, `list-detail`, `list-detailed`. Une
  faute ici donne un `NoReverseMatch`, pas un test faux — mais elle fait perdre du temps.
- ⚠️ **`completed_at` n'est posé que par `TaskPatchSerializer.update()`.** Toute fixture qui
  crée une tâche terminée par l'ORM doit le poser explicitement, sinon le tri
  `('-completed_at', '-pk')` ne discrimine rien et les tests d'ordre sont verts pour rien.

## Ordre et points de reprise

| Étape | Dépend de | Peut être livrée seule                                                   |
| ----- | --------- | ------------------------------------------------------------------------ |
| §0    | —         | Oui — le filet a de la valeur même sans la suite                         |
| §1    | §0        | Oui                                                                      |
| §2    | §0, §1    | Oui — §1 d'abord, sinon la jointure du filtre se combine aux annotations |
| §3    | §0        | Oui                                                                      |
| §4    | §0        | Oui                                                                      |
| §5    | §0        | Oui                                                                      |
| §6    | §0        | Oui                                                                      |
| §7    | §0        | Oui                                                                      |
| §8    | —         | Oui                                                                      |
| §9    | §0        | Optionnelle, et pose d'abord son propre filet (§9.0)                     |
| §11   | tout      | Non                                                                      |

Après chaque étape :

```bash
docker exec tout_doux_backend python manage.py check
docker exec tout_doux_backend python manage.py makemigrations --check --dry-run
docker exec tout_doux_backend python manage.py test tout_doux -v 2
```

`test_api_contract` doit rester **vert et inchangé** à chaque étape. C'est la seule
chose qui prouve que rien n'est cassé.

## Voir aussi

- [`../../../AMELIORATIONS-FETCH.md`](../../../AMELIORATIONS-FETCH.md) — le plan d'ensemble, dont
  ce chantier est la partie 1
- [`../quality/watched-risks.md`](../quality/watched-risks.md) — `W8`, à supprimer en §11
- [`../architecture/serializers.md`](../architecture/serializers.md) — conventions de
  sérialisation
- [`verification.md`](verification.md) — la procédure manuelle, à compléter en §11
