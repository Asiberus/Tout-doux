from django.db import models


class Priority(models.IntegerChoices):
    NORMAL = 0
    IMPORTANT = 1
