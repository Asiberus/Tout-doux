from django.db import models

from tout_doux.models.tag import Tag


class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    tags = models.ManyToManyField(
        Tag,
        limit_choices_to={'type': Tag.Type.PROJECT},
        related_name='projects',
        blank=True
    )
    archived = models.BooleanField(default=False)
    created_on = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-pk',)
