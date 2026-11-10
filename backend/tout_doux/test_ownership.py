from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from tout_doux.models import Collection, CommonTask, DailyTask, Project, Section, Tag, Task, User

PASSWORD = 'Sm0ke!Test'

# CPython met en cache les entiers de -5 à 256 : en dessous, deux pk égaux sont le même objet et
# une comparaison par identité passe par accident. Au-delà, seule une comparaison par valeur tient.
LARGE_PK = 10_000


def make_relations(user):
    project = Project.objects.create(user=user, name='Projet', description='')
    collection = Collection.objects.create(user=user, name='Collection')
    return {
        'task_tag': Tag.objects.create(
            user=user, type=Tag.Type.TASK, name='rapide', color=Tag.Color.TEAL
        ),
        'project_tag': Tag.objects.create(
            user=user, type=Tag.Type.PROJECT, name='urgent', color=Tag.Color.BLUE
        ),
        'project': project,
        'section': Section.objects.create(user=user, name='Section', project=project),
        'collection': collection,
        'task': Task.objects.create(user=user, name='Tâche', collection=collection),
        'common_task': CommonTask.objects.create(user=user, name='Courante'),
    }


class OwnershipTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('owner', 'owner@example.com', PASSWORD, pk=LARGE_PK)
        self.other = User.objects.create_user('other', 'other@example.com', PASSWORD)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.own = make_relations(self.user)
        self.daily = DailyTask.objects.create(
            user=self.user, name='Libre', date=timezone.localdate()
        )

    def requests(self, relations):
        today = timezone.localdate().isoformat()
        own_project = self.own['project'].pk
        return (
            ('tagIds', 'post', reverse('task-list'),
             {'name': 'T', 'projectId': own_project, 'tagIds': [relations['task_tag'].pk]}),
            ('projectId', 'post', reverse('task-list'),
             {'name': 'T', 'projectId': relations['project'].pk}),
            ('sectionId', 'post', reverse('task-list'),
             {'name': 'T', 'sectionId': relations['section'].pk}),
            ('collectionId', 'post', reverse('task-list'),
             {'name': 'T', 'collectionId': relations['collection'].pk}),
            ('tagIds', 'patch', reverse('task-detail', args=[self.own['task'].pk]),
             {'tagIds': [relations['task_tag'].pk]}),
            ('taskId', 'post', reverse('daily_task-list'),
             {'taskId': relations['task'].pk}),
            ('commonTaskId', 'post', reverse('daily_task-list'),
             {'commonTaskId': relations['common_task'].pk}),
            ('tagIds', 'post', reverse('daily_task-list'),
             {'name': 'D', 'tagIds': [relations['task_tag'].pk]}),
            ('tagIds', 'patch', reverse('daily_task-detail', args=[self.daily.pk]),
             {'tagIds': [relations['task_tag'].pk]}),
            ('tagIds', 'post', reverse('project-list'),
             {'name': 'P', 'description': '', 'tagIds': [relations['project_tag'].pk]}),
            ('projectId', 'post', reverse('event-list'),
             {'name': 'E', 'startDate': today, 'projectId': relations['project'].pk}),
            ('projectId', 'post', reverse('section-list'),
             {'name': 'S', 'projectId': relations['project'].pk}),
            ('tagIds', 'post', reverse('common_task-list'),
             {'name': 'C', 'tagIds': [relations['task_tag'].pk]}),
        )

    def send(self, method, url, payload):
        return getattr(self.client, method)(url, payload, format='json')

    def test_own_relations_are_accepted(self):
        for field, method, url, payload in self.requests(self.own):
            with self.subTest(method=method, url=url, field=field):
                response = self.send(method, url, payload)
                self.assertIn(response.status_code, (200, 201), response.data)

    def test_foreign_relations_look_nonexistent(self):
        foreign = make_relations(self.other)
        for field, method, url, payload in self.requests(foreign):
            with self.subTest(method=method, url=url, field=field):
                response = self.send(method, url, payload)
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn('object does not exist', str(response.data[field]))

    def test_a_null_common_task_alone_is_refused(self):
        response = self.send('post', reverse('daily_task-list'), {'commonTaskId': None})
        self.assertEqual(response.status_code, 400, response.data)
