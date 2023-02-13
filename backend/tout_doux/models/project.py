from django.db import models

from tout_doux.models.project_tag import ProjectTag


class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    tags = models.ManyToManyField(ProjectTag, related_name='projects', blank=True)
    archived = models.BooleanField(default=False)
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-pk',)
