from datetime import datetime, MINYEAR, MAXYEAR

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied, ParseError
from rest_framework.response import Response

from tout_doux.models import Event
from tout_doux.serializers.event import EventSerializer, EventExtendedSerializer, EventPostOrPatchSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'partial_update', 'update']:
            return EventPostOrPatchSerializer
        elif self.action in ['list', 'retrieve']:
            return EventExtendedSerializer
        else:
            return EventSerializer

    def get_queryset(self):
        queryset = self.queryset

        if 'date' in self.request.query_params:
            queryset = self.filter_queryset_by_date(queryset, self.request.query_params.get('date'))

        if 'year' in self.request.query_params and 'month' in self.request.query_params:
            queryset = self.filter_queryset_by_month_year(
                queryset,
                self.request.query_params.get('month'),
                self.request.query_params.get('year')
            )

        return queryset

    def filter_queryset_by_date(self, queryset, date):
        try:
            date = datetime.fromisoformat(date)
        except ValueError:
            raise ParseError('Date is not valid.')

        return queryset.filter(Q(start_date=date) | Q(start_date__lte=date, end_date__gte=date))

    def filter_queryset_by_month_year(self, queryset, month, year):
        if year.isdigit() and MINYEAR <= int(year) <= MAXYEAR and month.isdigit() and 1 <= int(month) <= 12:
            year = int(year)
            month = int(month)
            queryset = queryset.filter(Q(start_date__year=year, start_date__month=month) |
                                       Q(end_date__year=year, end_date__month=month))
        else:
            raise ParseError('Month and/or year parameters are incorrect')

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project and instance.project.archived:
            raise PermissionDenied('This event is related to an archived project')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
