import datetime

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from tout_doux.models import DailyTask, Event
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.daily_task import DailyTaskSerializer
from tout_doux.utils import daterange


class DailyTaskViewSet(viewsets.ModelViewSet):
    queryset = DailyTask.objects.all()
    serializer_class = DailyTaskSerializer
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('date',)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.date != datetime.date.today():
            raise PermissionDenied('The daily task is not related to the current day')
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False)
    def summary(self, request):
        data = list()
        size = int(request.query_params.get('size', 20))
        page = int(request.query_params.get('page', 1))
        start_date = datetime.date.today() - datetime.timedelta(size) * page
        end_date = datetime.date.today() - datetime.timedelta(size) * (page - 1)
        for date in daterange(start_date, end_date, reverse=True):
            daily_overview = {
                'date': date,
                'totalTask': DailyTask.objects.filter(date=date).count(),
                'totalTaskCompleted': DailyTask.objects.filter(date=date, completed=True).count(),
                'totalEvent': Event.objects.filter(
                    Q(start_date=date) | Q(start_date__lte=date, end_date__gte=date)).count()
            }
            data.append(daily_overview)

        data_paginated = self.paginate_queryset(data)
        if data_paginated is not None:
            return self.get_paginated_response(data_paginated)

        return Response(data)
