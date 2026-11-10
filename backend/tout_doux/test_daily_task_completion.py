"""Une Task planifiée sur plusieurs jours : chaque ligne cochée la termine à nouveau."""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

from tout_doux.models import DailyTask, Task
from tout_doux.test_api_contract import DataFixtureTestCase


class MultiDayTaskCompletionTest(DataFixtureTestCase):
    def setUp(self):
        super().setUp()
        today = timezone.localdate()
        self.task = Task.objects.create(user=self.user, name='Planifiée', project=self.project)
        self.yesterday, self.today, self.tomorrow = (
            DailyTask.objects.create(user=self.user, task=self.task, date=today + timedelta(days=offset))
            for offset in (-1, 0, 1)
        )

    def complete(self, daily_task, completed=True):
        response = self.client.patch(
            reverse('daily_task-detail', args=[daily_task.pk]), {'completed': completed}, format='json'
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.task.refresh_from_db()

    def test_completing_a_day_leaves_the_other_days_planned_and_open(self):
        self.complete(self.today)
        self.assertTrue(self.task.completed)
        self.tomorrow.refresh_from_db()
        self.assertFalse(self.tomorrow.completed)

    def test_the_last_completed_day_overwrites_the_completion_date(self):
        self.complete(self.yesterday)
        first = self.task.completed_at
        self.complete(self.today)
        self.assertGreater(self.task.completed_at, first)

    def test_reopening_any_day_reopens_the_task(self):
        self.complete(self.yesterday)
        self.complete(self.today)
        self.complete(self.yesterday, completed=False)
        self.assertFalse(self.task.completed)
