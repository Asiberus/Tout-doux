from django.db import models

from tout_doux.models.project import Project


class Event(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    description = models.CharField(max_length=500, null=True, blank=True)
    takes_whole_day = models.BooleanField(default=False)
    project = models.ForeignKey(Project, limit_choices_to={'archived': False}, on_delete=models.CASCADE,
                                related_name='events', null=True, blank=True)
