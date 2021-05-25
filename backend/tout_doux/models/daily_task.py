from django.db import models

from tout_doux.models.task import Task


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
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, limit_choices_to={'completed': False},
                             related_name='daily_tasks', null=True, blank=True)
    name = models.CharField(max_length=50, null=True, blank=True)
    action = models.CharField(max_length=2, choices=ACTION_CHOICES, null=True, blank=True)
    completed = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('date', 'task'), name='unique_task_for_date')
        ]


# @receiver(models.signals.post_save, sender=DailyTask)
# def complete_task(sender, instance, created, raw, using, update_fields, **kwargs):
#     print('complete task signal')
#     print(sender)
#     print(instance)
#     print(created)
#     print(raw)
#     print(using)
#     print(update_fields)