from datetime import date

from django.urls import reverse

from tout_doux.models import Task
from tout_doux.test_api_contract import DataFixtureTestCase


class TaskDueDateTest(DataFixtureTestCase):
    def create_task(self, **payload):
        return self.client.post(
            reverse('task-list'), {'name': 'Nouvelle', 'projectId': self.project.pk, **payload},
            format='json',
        )

    def patch_task(self, task, payload):
        return self.client.patch(reverse('task-detail', args=[task.pk]), payload, format='json')

    def open_task(self):
        return Task.objects.filter(project=self.project, completed=False).first()

    def test_a_task_is_created_without_due_date(self):
        response = self.create_task()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data['dueDate'])

    def test_a_task_is_created_with_a_due_date(self):
        response = self.create_task(dueDate='2026-10-22')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['dueDate'], '2026-10-22')

    def test_a_past_due_date_is_accepted(self):
        response = self.create_task(dueDate='2020-01-01')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['dueDate'], '2020-01-01')

    def test_an_invalid_due_date_is_refused(self):
        response = self.create_task(dueDate='2026-13-40')
        self.assertEqual(response.status_code, 400)
        self.assertIn('dueDate', response.data)

    def test_the_due_date_is_updated(self):
        task = self.open_task()
        response = self.patch_task(task, {'dueDate': '2026-11-03'})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['dueDate'], '2026-11-03')

    def test_the_due_date_is_cleared_with_null(self):
        task = self.open_task()
        Task.objects.filter(pk=task.pk).update(due_date=date(2026, 11, 3))
        response = self.patch_task(task, {'dueDate': None})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsNone(response.data['dueDate'])

    def test_a_patch_without_due_date_keeps_it(self):
        task = self.open_task()
        Task.objects.filter(pk=task.pk).update(due_date=date(2026, 11, 3))
        response = self.patch_task(task, {'name': 'Renommée'})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['dueDate'], '2026-11-03')

    def test_nested_tasks_carry_their_due_date(self):
        task = Task.objects.filter(section=self.section, completed=False).first()
        Task.objects.filter(pk=task.pk).update(due_date=date(2026, 11, 3))
        response = self.client.post(
            reverse('daily_task-list'), {'taskId': task.pk}, format='json'
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['task']['dueDate'], '2026-11-03')

        response = self.client.get(reverse('project-detail', args=[self.project.pk]))
        self.assertEqual(response.status_code, 200, response.data)
        section_tasks = response.data['sections'][0]['tasks']
        self.assertEqual(
            next(item['dueDate'] for item in section_tasks if item['id'] == task.pk), '2026-11-03'
        )
