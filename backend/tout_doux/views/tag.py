from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

from tout_doux.models import Tag
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.tag import TagSerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = ExtendedPageNumberPagination
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filterset_fields = ('type',)
    search_fields = ('name',)

    @action(detail=False, url_path='is-name-unique', url_name='tag_is_name_unique')
    def is_name_unique(self, request):
        name = request.query_params.get('name')
        tag_type = request.query_params.get('type')
        exclude_id = request.query_params.get('exclude-id')

        if not name:
            raise ParseError('You must provide a name')
        elif tag_type not in [Tag.Type.PROJECT, Tag.Type.TASK]:
            raise ParseError('Type is not good')

        if self.queryset.filter(type=tag_type, name=name).exclude(id=exclude_id).count() > 0:
            data = {'unique': False}
        else:
            data = {'unique': True}

        return Response(data)
