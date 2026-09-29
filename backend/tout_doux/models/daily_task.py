from django.db import models, transaction
from django.db.models import Max
from django.utils import timezone
from fractional_indexing import generate_key_between

from tout_doux.models.common_task import CommonTask
from tout_doux.models.tag import Tag
from tout_doux.models.task import Task
from tout_doux.models.user import User, UserRelatedModel


class DailyTask(UserRelatedModel):
    THINK = 'TH'
    WORK = 'WO'
    FINISH = 'FI'
    ACTION_CHOICES = (
        (THINK, 'Réfléchir'),
        (WORK, 'Travailler'),
        (FINISH, 'Finir'),
    )

    date = models.DateField(default=timezone.localdate)
    task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        limit_choices_to={'completed': False},
        related_name='daily_tasks',
        null=True,
        blank=True
    )
    common_task = models.ForeignKey(
        CommonTask,
        on_delete=models.SET_NULL,
        related_name='daily_tasks',
        null=True,
        blank=True
    )
    name = models.CharField(
        max_length=150,
        null=True,
        blank=True
    )
    tags = models.ManyToManyField(
        Tag,
        limit_choices_to={'type': Tag.Type.TASK},
        related_name='daily_tasks',
        blank=True
    )
    action = models.CharField(
        max_length=2,
        choices=ACTION_CHOICES,
        null=True,
        blank=True
    )
    completed = models.BooleanField(default=False)
    position = models.CharField(max_length=255, db_collation='C', editable=False)

    class Meta:
        ordering = ('date', 'position')
        constraints = (
            models.UniqueConstraint(fields=('date', 'task'), name='unique_task_for_date'),
            models.UniqueConstraint(fields=('date', 'common_task'), name='unique_common_task_for_date'),
            models.UniqueConstraint(
                fields=('user', 'date', 'position'), name='unique_daily_task_position_per_day'
            ),
        )

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
