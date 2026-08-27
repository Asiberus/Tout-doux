from django.db.models import Exists, OuterRef
from rest_framework import viewsets
from rest_framework.decorators import action

from tout_doux.models import Task
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.queries import scalar_count
from tout_doux.serializers.collection import CollectionListSerializer, CollectionDetailSerializer, CollectionSerializer, \
    CollectionPostOrPatchSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination
    filterset_fields = ('archived',)

    def get_queryset(self):
        queryset = self.request.user.collections.all()

        if self.action == 'list':
            queryset = queryset.annotate(
                task_count=scalar_count(
                    Task.objects.filter(collection=OuterRef('pk')), 'collection'
                ),
                completed_task_count=scalar_count(
                    Task.objects.filter(collection=OuterRef('pk'), completed=True), 'collection'
                ),
            )

        if self.action in ('detailed', 'retrieve'):
            queryset = queryset.prefetch_related('tasks__tags')

        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(
                Exists(Task.objects.filter(collection=OuterRef('pk'), completed=False))
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return CollectionListSerializer
        elif self.action in ['detailed', 'retrieve']:
            return CollectionDetailSerializer
        elif self.action in ['create', 'partial_update', 'update']:
            return CollectionPostOrPatchSerializer
        else:
            return CollectionSerializer

    @action(detail=False)
    def detailed(self, request):
        return self.list(request)
