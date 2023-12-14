from django.contrib.auth.models import AbstractUser
from django.db import models


def get_anonymous_user():
    anonymous_user = User.objects.get_or_create(username="anonymous")[0]
    return anonymous_user.id


class User(AbstractUser):
    email = models.EmailField(unique=True, max_length=100)
    first_name = models.CharField(max_length=100, default='', blank=True)
    last_name = models.CharField(max_length=100, default='', blank=True)
    bio = models.CharField(max_length=500, default='', blank=True)

    class Meta:
        ordering = ('date_joined',)


class UserRelatedModel(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='%(class)ss',
        related_query_name='%(class)ss',
        editable=False,
        default=get_anonymous_user,
    )

    class Meta:
        abstract = True
