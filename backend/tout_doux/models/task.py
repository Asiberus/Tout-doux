from django.db import models
from django.dispatch import receiver

from tout_doux.models.collection import Collection
from tout_doux.models.project import Project
from tout_doux.models.section import Section


class Task(models.Model):
    name = models.CharField(max_length=50)
    completed = models.BooleanField(default=False)
    project = models.ForeignKey(Project, limit_choices_to={'archived': False}, on_delete=models.CASCADE,
                                related_name='tasks', null=True, blank=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    collection = models.ForeignKey(Collection, limit_choices_to={'archived': False}, on_delete=models.CASCADE,
                                   related_name='tasks', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, editable=False)

    class Meta:
        ordering = ('-pk',)

    def __str__(self):
        return 'project : {0} - task : {1} - completed : {2}'.format(self.project, self.name,
                                                                     self.completed)


@receiver(models.signals.pre_delete, sender=Task)
def feed_daily_task_name(sender, instance, **kwargs):
    print(instance.daily_tasks.all(), instance.name)
    for daily_task in instance.daily_tasks.all():
        daily_task.name = instance.name
        daily_task.save()
