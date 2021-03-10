from rest_framework import viewsets

from tout_doux.models.task import Task
from tout_doux.serializers.task import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
