from django.db import models

from tout_doux.models.user import UserRelatedModel


class Preferences(UserRelatedModel):
    class ProgressWheelMode(models.TextChoices):
        NUMBER = 'number'
        PERCENT = 'percent'

    progress_wheel_mode = models.CharField(
        choices=ProgressWheelMode.choices,
        max_length=10,
        default=ProgressWheelMode.NUMBER
    )
