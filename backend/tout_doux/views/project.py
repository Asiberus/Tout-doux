from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from tout_doux.models.project import Project
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.project import ProjectSerializer
from tout_doux.serializers.section import SectionSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('archived',)

    @action(detail=True)
    def sections(self, request, pk=None):
        size = int(request.query_params.get('size', 20))
        page = int(request.query_params.get('page', 1))

        if Project.objects.filter(id=pk).exists():
            project = Project.objects.get(id=pk)
            print(project.sections)
            sections = SectionSerializer(project.sections.all(), many=True)
            return Response(sections.data)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
