from django.db import models


class Tag(models.Model):
    class Type(models.TextChoices):
        PROJECT = 'project'
        TASK = 'task'

    type = models.CharField(choices=Type.choices, max_length=7)
    name = models.CharField(max_length=20)
    color = models.CharField(max_length=7)  # Color code in hexadecimal

    class Meta:
        ordering = ('pk',)
        constraints = (
            models.UniqueConstraint(fields=('name', 'type'), name='unique_name_for_type'),
        )
