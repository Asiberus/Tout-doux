from rest_framework import viewsets

from tout_doux.models.collection import Collection
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.collection import CollectionSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    pagination_class = ExtendedPageNumberPagination
