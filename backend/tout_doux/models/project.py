from django.db import models

from tout_doux.models.priority import Priority


class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    priority = models.IntegerField(choices=Priority.choices, default=Priority.NORMAL)
    archived = models.BooleanField(default=False)

    def __str__(self):
        return self.name
