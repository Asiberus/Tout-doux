from rest_framework import viewsets, status, mixins
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from tout_doux.models import Task
from tout_doux.serializers.task import TaskSerializer, TaskPostSerializer, TaskPatchSerializer


class TaskViewSet(mixins.CreateModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):
    queryset = Task.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskPostSerializer
        elif self.action in ['partial_update', 'update']:
            return TaskPatchSerializer
        else:
            return TaskSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (instance.project and instance.project.archived) \
                or (instance.section and instance.section.project.archived) \
                or (instance.collection and instance.collection.archived):
            raise PermissionDenied('This task is related to either an archived project or an archived collection')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
