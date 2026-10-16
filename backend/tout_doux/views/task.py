from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from tout_doux.exceptions import StaleListError
from tout_doux.models import Section
from tout_doux.serializers.move import MoveSerializer
from tout_doux.serializers.task import TaskSerializer, TaskPostSerializer, TaskPatchSerializer
from tout_doux.services import ordering


class TaskViewSet(mixins.CreateModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskPostSerializer
        elif self.action in ['partial_update', 'update']:
            return TaskPatchSerializer
        elif self.action == 'move':
            return MoveSerializer
        else:
            return TaskSerializer

    def get_queryset(self):
        return self.request.user.tasks.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (instance.project and instance.project.archived) \
                or (instance.section and instance.section.project.archived) \
                or (instance.collection and instance.collection.archived):
            raise PermissionDenied('This task is related to either an archived project or an archived collection')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        after_id = serializer.validated_data['after_id']
        before_id = serializer.validated_data['before_id']

        with transaction.atomic():
            task = self.get_object()
            if task.pk in (after_id, before_id):
                raise ValidationError('A task cannot be its own anchor')

            container = task.lock_list()
            owner = container.project if isinstance(container, Section) else container
            if owner.archived:
                raise PermissionDenied('This task is related to either an archived project or an archived collection')
            if task.completed:
                raise StaleListError()

            ordering.move(task, after_id, before_id, anchor_filter=Q(completed=False))

        return Response({'id': task.pk, 'position': task.position})
