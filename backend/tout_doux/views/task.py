from rest_framework import viewsets, status
from rest_framework.response import Response

from rest_framework.exceptions import NotFound, PermissionDenied
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (instance.project and instance.project.archived) \
                or (instance.section and instance.section.project.archived) \
                or (instance.collection and instance.collection.archived):
            raise PermissionDenied('This task is related to either an archived project or an archived collection')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)



