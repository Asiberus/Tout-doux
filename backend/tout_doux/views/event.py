from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from tout_doux.models.event import Event
from tout_doux.serializers.event.event import EventSerializer
from tout_doux.serializers.event.event_extended import EventExtendedSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list' or self.action == 'retrieve':
                return EventExtendedSerializer

        # Case for create, update, partial_update and destroy
        return EventSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.archived:
            raise PermissionDenied('This event is related to an archived project')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
