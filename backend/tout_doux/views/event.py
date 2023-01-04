from datetime import datetime, MINYEAR, MAXYEAR

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied, ParseError
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

    def get_queryset(self):
        queryset = self.queryset

        if 'date' in self.request.query_params:
            try:
                date = datetime.strptime(self.request.query_params.get('date'), '%Y-%m-%d')
            except ValueError:
                raise ParseError('Date is not valid.')

            queryset = queryset.filter(
                Q(start_date=date) | Q(start_date__lte=date, end_date__gte=date))

        if 'year' in self.request.query_params and 'month' in self.request.query_params:
            year = self.request.query_params.get('year')
            month = self.request.query_params.get('month')
            if year.isdigit() and MINYEAR <= int(year) <= MAXYEAR and month.isdigit() and 1 <= int(month) <= 12:
                year = int(year)
                month = int(month)
                queryset = queryset.filter(
                    Q(start_date__year=year, start_date__month=month) | Q(end_date__year=year, end_date__month=month))
            else:
                raise ParseError('Month and/or year parameters are incorrect')

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        if request.query_params.get('extended', False):
            data = EventExtendedSerializer(instance).data
        else:
            data = EventSerializer(instance).data
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        return serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        if request.query_params.get('extended', False):
            data = EventExtendedSerializer(instance).data
        else:
            data = EventSerializer(instance).data

        return Response(data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project and instance.project.archived:
            raise PermissionDenied('This event is related to an archived project')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
