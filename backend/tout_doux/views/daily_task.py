from datetime import date

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ParseError
from rest_framework.response import Response

from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.daily_task import DailyTaskSerializer, DailyTaskPostSerializer, DailyTaskPatchSerializer, \
    DailySummarySerializer
from tout_doux.utils.date import daterange


class DailyTaskViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination
    filterset_fields = ('date',)

    def get_queryset(self):
        return self.request.user.dailytasks.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return DailyTaskPostSerializer
        elif self.action in ['partial_update', 'update']:
            return DailyTaskPatchSerializer
        else:
            return DailyTaskSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.date != date.today():
            raise PermissionDenied('The daily task is not related to the current day')
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False)
    def summary(self, request):
        try:
            start_date = date.fromisoformat(request.query_params.get('start_date'))
            end_date = date.fromisoformat(request.query_params.get('end_date'))
        except TypeError:
            # TypeError occur when start_date or end_date params are empty
            raise ParseError('You must provide a start date and an end date')
        except ValueError:
            raise ParseError('Date not valid.')

        summary_range = [{'date': d} for d in daterange(start_date, end_date)]
        data = DailySummarySerializer(summary_range, many=True, context={'user': request.user}).data

        return Response(data)
