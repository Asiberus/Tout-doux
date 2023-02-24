from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action

from tout_doux.models import Project
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.project import ProjectListSerializer, ProjectDetailSerializer, ProjectPostOrPatchSerializer, \
    ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('archived',)

    def get_queryset(self):
        queryset = self.queryset
        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(Q(tasks__completed=False) | Q(sections__tasks__completed=False)).distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['detailed', 'retrieve']:
            return ProjectDetailSerializer
        elif self.action in ['create', 'partial_update', 'update']:
            return ProjectPostOrPatchSerializer
        else:
            return ProjectSerializer

    @action(detail=False)
    def detailed(self, request):
        return self.list(request)
