from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    archived = models.BooleanField(default=False)
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name
