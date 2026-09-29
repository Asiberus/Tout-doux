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
