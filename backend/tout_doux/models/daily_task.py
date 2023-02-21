from django.db import models

from tout_doux.models.common_task import CommonTask
from tout_doux.models.task import Task
from tout_doux.models.task_tag import TaskTag


class DailyTask(models.Model):
    THINK = 'TH'
    WORK = 'WO'
    FINISH = 'FI'
    ACTION_CHOICES = (
        (THINK, 'Réfléchir'),
        (WORK, 'Travailler'),
        (FINISH, 'Finir'),
    )

    date = models.DateField(auto_now_add=True)
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
        max_length=50,
        null=True,
        blank=True
    )
    tags = models.ManyToManyField(
        TaskTag,
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

    class Meta:
        ordering = ('pk',)
        constraints = (
            models.UniqueConstraint(fields=('date', 'task'), name='unique_task_for_date'),
            models.UniqueConstraint(fields=('date', 'common_task'), name='unique_common_task_for_date')
        )
