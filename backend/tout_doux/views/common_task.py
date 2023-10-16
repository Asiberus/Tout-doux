from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.common_task import CommonTaskSerializer


class CommonTaskViewSet(viewsets.ModelViewSet):
    serializer_class = CommonTaskSerializer
    pagination_class = ExtendedPageNumberPagination

    def get_queryset(self):
        return self.request.user.commontasks.all()

    @action(detail=False, url_path='is-name-unique', url_name='common_task_is_name_unique')
    def is_name_unique(self, request):
        name = request.query_params.get('name')
        exclude_id = request.query_params.get('exclude_id')

        if not name:
            raise ParseError('You must provide a name')
        
        if self.get_queryset().filter(name=name).exclude(id=exclude_id).count() > 0:
            data = {'unique': False}
        else:
            data = {'unique': True}

        return Response(data)
