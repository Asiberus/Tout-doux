from django.db import models

from tout_doux.models.user import UserRelatedModel


class Collection(UserRelatedModel):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    item_name = models.CharField(max_length=15, default='task')
    archived = models.BooleanField(default=False)
    created_on = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-pk',)
