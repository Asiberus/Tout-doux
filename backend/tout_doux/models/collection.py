from django.db import models


class Collection(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    item_name = models.CharField(max_length=15, default='task', blank=True)
    archived = models.BooleanField(default=False)
    created_on = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-pk',)
