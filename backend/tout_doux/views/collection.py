from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from tout_doux.models.collection import Collection
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.collection.collection import CollectionSerializer
from tout_doux.serializers.collection.collection_task import CollectionTaskSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('archived',)

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list' or self.action == 'retrieve':
                return CollectionTaskSerializer

        # Case for create, update, partial_update and destroy
        return CollectionSerializer
