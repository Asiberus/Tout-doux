from rest_framework import viewsets

from tout_doux.models.project import Project
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.project import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    pagination_class = ExtendedPageNumberPagination
