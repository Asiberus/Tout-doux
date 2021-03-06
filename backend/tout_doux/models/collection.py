from django.db import models


class Collection(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name
