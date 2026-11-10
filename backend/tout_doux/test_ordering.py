"""Tri manuel des listes (docs/superpowers/specs/2026-09-29-task-ordering-design.md)."""
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone

from tout_doux.models import Collection, DailyTask, Project, Task
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


class TaskCreateAtAnchorsTest(DataFixtureTestCase):
    """La section de la fixture reçoit trois tâches ouvertes de plus : cinq voisines possibles."""

    def setUp(self):
        super().setUp()
        self.make_tasks(3, completed=0, section=self.section)
        self.a, self.b, self.c, self.d, self.e = self.open_ids()

    def open_ids(self):
        return list(
            Task.objects.filter(section=self.section, completed=False).values_list('pk', flat=True)
        )

    def create(self, after=None, before=None, **extra):
        return self.client.post(
            reverse('task-list'),
            {'name': 'Nouvelle', 'sectionId': self.section.pk, 'afterId': after, 'beforeId': before, **extra},
            format='json',
        )

    def test_a_task_created_after_the_last_open_task_goes_last(self):
        response = self.create(after=self.e)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.open_ids()[-1], response.data['id'])

    def test_a_task_created_between_two_neighbours_lands_between_them(self):
        response = self.create(after=self.a, before=self.b)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.open_ids()[1], response.data['id'])

    def test_null_anchors_keep_the_task_first(self):
        response = self.create()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.open_ids()[0], response.data['id'])

    def test_anchors_that_are_no_longer_neighbours_refuse_the_creation(self):
        before = Task.objects.count()
        self.assertEqual(self.create(after=self.a, before=self.c).status_code, 409)
        self.assertEqual(Task.objects.count(), before)

    def test_a_completed_anchor_is_a_409(self):
        Task.objects.filter(pk=self.e).update(completed=True)
        self.assertEqual(self.create(after=self.e).status_code, 409)

    def test_an_anchor_from_another_list_is_a_409(self):
        other = Task.objects.filter(project=self.project, completed=False).first()
        self.assertEqual(self.create(after=other.pk).status_code, 409)

    def test_both_anchors_cannot_be_the_same_task(self):
        self.assertEqual(self.create(after=self.a, before=self.a).status_code, 400)

    def test_the_tags_are_still_saved(self):
        response = self.create(after=self.e, tagIds=[self.task_tag.pk])
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual([tag['id'] for tag in response.data['tags']], [self.task_tag.pk])


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
