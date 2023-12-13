from django.db import models
from django.dispatch import receiver

from tout_doux.models.tag import Tag
from tout_doux.models.user import UserRelatedModel


class CommonTask(UserRelatedModel):
    name = models.CharField(max_length=50)
    tags = models.ManyToManyField(
        Tag,
        limit_choices_to={'type': Tag.Type.TASK},
        related_name='common_tasks',
        blank=True
    )

    class Meta:
        ordering = ('pk',)
        constraints = (
            models.UniqueConstraint(fields=('name', 'user'), name='unique_name_for_user'),
        )


@receiver(models.signals.pre_delete, sender=CommonTask)
def feed_daily_task_name(sender, instance, **kwargs):
    for daily_task in instance.daily_tasks.all():
        daily_task.name = instance.name
        daily_task.tags.add(*instance.tags.all())
        daily_task.save()
