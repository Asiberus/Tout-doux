from django.db import models


class ProjectTag(models.Model):
    name = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=7)  # Color code in hexadecimal

    class Meta:
        ordering = ('pk',)
