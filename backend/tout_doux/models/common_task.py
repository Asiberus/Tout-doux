from django.db import models
from django.dispatch import receiver

from tout_doux.models.task_tag import TaskTag


class CommonTask(models.Model):
    name = models.CharField(max_length=50, unique=True)
    tags = models.ManyToManyField(TaskTag, related_name='common_tasks', blank=True)

    class Meta:
        ordering = ('pk',)


@receiver(models.signals.pre_delete, sender=CommonTask)
def feed_daily_task_name(sender, instance, **kwargs):
    for daily_task in instance.daily_tasks.all():
        daily_task.name = instance.name
        daily_task.tags.add(*instance.tags.all())
        daily_task.save()