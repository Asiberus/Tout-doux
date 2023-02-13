from rest_framework import viewsets

from tout_doux.models.task_tag import TaskTag
from tout_doux.serializers.task_tag.task_tag import TaskTagSerializer


class TaskTagViewSet(viewsets.ModelViewSet):
    queryset = TaskTag.objects.all()
    serializer_class = TaskTagSerializer
