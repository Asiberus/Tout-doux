from rest_framework import viewsets

from tout_doux.models import TaskTag
from tout_doux.serializers.task_tag import TaskTagSerializer


class TaskTagViewSet(viewsets.ModelViewSet):
    queryset = TaskTag.objects.all()
    serializer_class = TaskTagSerializer
