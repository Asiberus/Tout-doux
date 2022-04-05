from datetime import datetime

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from tout_doux.models.event import Event
from tout_doux.serializers.event.event import EventSerializer
from tout_doux.serializers.event.event_extended import EventExtendedSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('project',)

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list' or self.action == 'retrieve':
                return EventExtendedSerializer

        # Case for create, update, partial_update and destroy
        return EventSerializer

    def get_queryset(self):
        queryset = self.queryset

        if 'date' in self.request.query_params:
            try:
                date = datetime.strptime(self.request.query_params.get('date'), '%Y-%m-%d')
            except ValueError:
                raise ValidationError('Date is not valid.')
            queryset = queryset.filter(
                Q(start_date__date=date) | Q(start_date__date__lte=date, end_date__date__gte=date))

        if 'month' in self.request.query_params:
            param = self.request.query_params.get('month')
            if param.isdigit() and 1 <= int(param) <= 12:
                month = int(param)
                queryset = queryset.filter(Q(start_date__month=month) | Q(end_date__month=month))

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.archived:
            raise PermissionDenied('This event is related to an archived project')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
