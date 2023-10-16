from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action

from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.project import ProjectListSerializer, ProjectDetailSerializer, ProjectPostOrPatchSerializer, \
    ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination
    filterset_fields = ('archived',)

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['detailed', 'retrieve']:
            return ProjectDetailSerializer
        elif self.action in ['create', 'partial_update', 'update']:
            return ProjectPostOrPatchSerializer
        else:
            return ProjectSerializer

    def get_queryset(self):
        queryset = self.request.user.projects.all()

        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(Q(tasks__completed=False) | Q(sections__tasks__completed=False)).distinct()

        return queryset

    @action(detail=False)
    def detailed(self, request):
        return self.list(request)
