from django.db import models

from tout_doux.models.priority import Priority


class Task(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100, null=True)
    completed = models.BooleanField(default=False)
    priority = models.IntegerField(choices=Priority.choices, default=Priority.NORMAL)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, related_name='tasks', null=True)
    event = models.BooleanField(default=False)
    deadline = models.DateField(null=True)
