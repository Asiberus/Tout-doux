from django.db import models

from tout_doux.models.project import Project
from tout_doux.models.user import UserRelatedModel


class Section(UserRelatedModel):
    name = models.CharField(max_length=50)
    project = models.ForeignKey(
        Project,
        limit_choices_to={'archived': False},
        on_delete=models.CASCADE,
        related_name='sections'
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-pk',)
