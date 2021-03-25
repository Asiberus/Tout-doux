from rest_framework import viewsets

from tout_doux.models.list import List
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.list import ListSerializer


class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer
    pagination_class = ExtendedPageNumberPagination
