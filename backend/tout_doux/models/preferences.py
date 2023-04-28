from django.db import models


class Preferences(models.Model):
    class ProgressWheelMode(models.TextChoices):
        NUMBER = 'number'
        PERCENT = 'percent'

    progress_wheel_mode = models.CharField(
        choices=ProgressWheelMode.choices,
        max_length=10,
        default=ProgressWheelMode.NUMBER
    )
