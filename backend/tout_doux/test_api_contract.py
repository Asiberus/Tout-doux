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
        Voir docs/quality/refactoring-backlog.md R13 : le corriger modifiera ce test."""
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
