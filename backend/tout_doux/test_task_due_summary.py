from datetime import date

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from tout_doux.models import Collection, DailyTask, Project, Section, Task, User
from tout_doux.test_api_contract import PASSWORD

DAY = date(2026, 10, 22)


class TaskDueSummaryTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('owner', 'owner@example.com', PASSWORD)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.project = Project.objects.create(user=self.user, name='Projet', description='')
        self.section = Section.objects.create(user=self.user, name='Section', project=self.project)
        self.collection = Collection.objects.create(user=self.user, name='Collection')

    def task(self, due_date, **container):
        return Task.objects.create(user=self.user, name='Tâche', due_date=due_date, **container)

    def summary(self, day=DAY):
        return self.client.get(reverse('task-due-summary'), {'date': day.isoformat()})

    def container(self, response, kind, pk):
        return next(
            (c for c in response.data['containers'] if c['type'] == kind and c['id'] == pk), None
        )

    def test_counts_late_and_today_tasks(self):
        self.task(date(2026, 10, 20), project=self.project)
        self.task(date(2026, 10, 21), collection=self.collection)
        self.task(DAY, section=self.section)
        self.task(date(2026, 10, 23), project=self.project)
        self.task(None, project=self.project)

        response = self.summary()

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['late'], 2)
        self.assertEqual(response.data['today'], 1)

    def test_ignores_completed_tasks(self):
        task = self.task(DAY, project=self.project)
        Task.objects.filter(pk=task.pk).update(completed=True)

        response = self.summary()

        self.assertEqual((response.data['late'], response.data['today']), (0, 0))
        self.assertEqual(response.data['containers'], [])

    def test_ignores_archived_containers(self):
        self.task(DAY, project=self.project)
        self.task(DAY, section=self.section)
        self.task(DAY, collection=self.collection)
        Project.objects.filter(pk=self.project.pk).update(archived=True)
        Collection.objects.filter(pk=self.collection.pk).update(archived=True)

        response = self.summary()

        self.assertEqual((response.data['late'], response.data['today']), (0, 0))
        self.assertEqual(response.data['containers'], [])

    def test_totals_skip_tasks_planned_on_the_day_but_containers_keep_them(self):
        planned = self.task(DAY, project=self.project)
        self.task(date(2026, 10, 1), section=self.section)
        DailyTask.objects.create(user=self.user, date=DAY, task=planned)

        response = self.summary()

        self.assertEqual((response.data['late'], response.data['today']), (1, 0))
        self.assertEqual(
            self.container(response, 'project', self.project.pk),
            {'type': 'project', 'id': self.project.pk, 'late': 1, 'today': 1, 'planned': 1},
        )

    def test_a_task_planned_on_another_day_stays_to_plan(self):
        task = self.task(DAY, collection=self.collection)
        DailyTask.objects.create(user=self.user, date=date(2026, 10, 21), task=task)

        response = self.summary()

        self.assertEqual(response.data['today'], 1)
        self.assertEqual(
            self.container(response, 'collection', self.collection.pk),
            {'type': 'collection', 'id': self.collection.pk, 'late': 0, 'today': 1, 'planned': 0},
        )

    def test_section_tasks_count_for_their_project(self):
        self.task(DAY, section=self.section)
        self.task(DAY, project=self.project)

        response = self.summary()

        self.assertEqual(len(response.data['containers']), 1)
        self.assertEqual(self.container(response, 'project', self.project.pk)['today'], 2)

    def test_ignores_other_users_tasks(self):
        other = User.objects.create_user('other', 'other@example.com', PASSWORD)
        project = Project.objects.create(user=other, name='Autre', description='')
        Task.objects.create(user=other, name='Tâche', due_date=DAY, project=project)

        response = self.summary()

        self.assertEqual((response.data['late'], response.data['today']), (0, 0))

    def test_answers_in_a_single_query(self):
        planned = self.task(DAY, project=self.project)
        self.task(date(2026, 10, 1), section=self.section)
        self.task(DAY, collection=self.collection)
        DailyTask.objects.create(user=self.user, date=DAY, task=planned)

        with self.assertNumQueries(1):
            self.summary()

    def test_the_date_is_required_and_valid(self):
        self.assertEqual(self.client.get(reverse('task-due-summary')).status_code, 400)
        self.assertEqual(
            self.client.get(reverse('task-due-summary'), {'date': '2026-13-40'}).status_code, 400
        )
