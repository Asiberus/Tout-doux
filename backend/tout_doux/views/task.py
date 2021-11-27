from rest_framework import viewsets

from tout_doux.models.task import Task
from tout_doux.serializers.task.task import TaskSerializer
from tout_doux.serializers.task.task_post import TaskPostSerializer


# TODO : Block retrieve and list action
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list' or self.action == 'retrieve':
                return TaskSerializer

        # Case for create, update, partial_update and destroy
        return TaskPostSerializer

