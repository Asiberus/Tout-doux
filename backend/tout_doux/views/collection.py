from django.db.models import Count, Exists, OuterRef, Q
from rest_framework import viewsets
from rest_framework.decorators import action

from tout_doux.models import Task
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.collection import CollectionListSerializer, CollectionDetailSerializer, CollectionSerializer, \
    CollectionPostOrPatchSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination
    filterset_fields = ('archived',)

    def get_queryset(self):
        queryset = self.request.user.collections.all()

        if self.action == 'list':
            # Une seule relation vers-plusieurs jointe : pas de produit cartésien possible.
            queryset = queryset.annotate(
                task_count=Count('tasks'),
                completed_task_count=Count('tasks', filter=Q(tasks__completed=True)),
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
