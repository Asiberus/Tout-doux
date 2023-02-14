from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from tout_doux.models import Collection
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.collection import CollectionListSerializer, CollectionDetailSerializer, CollectionSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('archived',)

    def get_queryset(self):
        queryset = self.queryset
        if self.request.query_params.get('has_uncompleted_task'):
            queryset = queryset.filter(tasks__completed=False).distinct()

        return queryset

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list':
                return CollectionListSerializer
            elif self.action == 'retrieve':
                return CollectionDetailSerializer

        # Case for create, update, partial_update and destroy
        return CollectionSerializer
