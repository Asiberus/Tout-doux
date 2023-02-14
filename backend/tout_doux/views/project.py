from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from tout_doux.models import Project
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.project import ProjectSerializer, ProjectListSerializer, ProjectDetailSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('archived',)

    def get_queryset(self):
        queryset = self.queryset
        if self.request.query_params.get('has_uncompleted_task'):
            queryset = queryset.filter(Q(tasks__completed=False) | Q(sections__tasks__completed=False)).distinct()

        return queryset

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list':
                return ProjectListSerializer
            elif self.action == 'retrieve':
                return ProjectDetailSerializer

        # Case for create, update, partial_update and destroy
        return ProjectSerializer
