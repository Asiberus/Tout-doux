"""
Mesure et non-régression de performance (docs/patterns/query-optimization.md).

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
    'daily_task-summary': 4,
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


class DailySummaryQueryCountTest(QueryCountTestCase):
    """`summary/` boucle sur des dates, pas sur des objets : son coût suit la largeur d'écran
    du visiteur (10, 21 ou 42 jours selon DailySummary.vue)."""

    def setUp(self):
        super().setUp()
        self.plan(Task.objects.filter(section=self.section, completed=False))
        Event.objects.create(
            user=self.user, name='À cheval', project=self.project,
            start_date=timezone.localdate() - timedelta(days=3),
            end_date=timezone.localdate() + timedelta(days=3),
        )

    def plan(self, tasks):
        for task in tasks:
            response = self.client.post(
                reverse('daily_task-list'), {'taskId': task.pk}, format='json'
            )
            self.assertEqual(response.status_code, 201, response.data)

    def range_of(self, days):
        end = timezone.localdate()
        # Sens décroissant : c'est celui qu'envoie le front.
        return {
            'start_date': end.isoformat(),
            'end_date': (end - timedelta(days=days - 1)).isoformat(),
        }

    def test_it_does_not_grow_with_the_length_of_the_range(self):
        """Le cœur de §9 : 10 jours et 42 jours doivent coûter le même nombre de requêtes."""
        self.assertEqual(
            self.count_queries('daily_task-summary', self.range_of(10)),
            self.count_queries('daily_task-summary', self.range_of(42)),
        )

    def test_stays_within_budget(self):
        self.assert_within_budget('daily_task-summary', self.range_of(42))
