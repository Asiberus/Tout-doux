from django.db import models

from tout_doux.models.user import UserRelatedModel


class Tag(UserRelatedModel):
    class Type(models.TextChoices):
        PROJECT = 'project'
        TASK = 'task'

    class Color(models.TextChoices):
        GREY_DARK = '#37474F'
        GREY = '#607D8B'
        PINK_DARK = '#880E4F'
        PURPLE = '#9C27B0'
        PURPLE_DARK = '#673AB7'
        INDIGO = '#3F51B5'
        DARK_BLUE = '#0D47A1'
        BLUE = '#2962FF'
        LIGHT_BLUE = '#2196F3'
        CYAN = '#00BCD4'
        TEAL = '#009688'
        GREEN = '#4CAF50'
        LIGHT_GREEN = '#8BC34A'
        LIME = '#9E9D24'
        YELLOW = '#FFB300'
        YELLOW_DARK = '#FB8C00'
        ORANGE = '#FF5722'
        RED = '#E53935'
        RED_DARK = '#B71C1C'
        BROWN = '#794948'

    type = models.CharField(choices=Type.choices, max_length=7)
    name = models.CharField(max_length=20)
    color = models.CharField(choices=Color.choices, max_length=7)

    class Meta:
        constraints = (
            models.UniqueConstraint(fields=('user', 'name', 'type'), name='unique_name_for_user_and_type'),
        )
