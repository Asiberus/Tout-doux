from django.db import models

from tout_doux.models.user import UserRelatedModel


class Feedback(UserRelatedModel):
    title = models.CharField(max_length=100)
    message = models.CharField(max_length=2000)
    date = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ('-date',)
