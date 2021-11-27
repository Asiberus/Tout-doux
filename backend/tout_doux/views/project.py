from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from tout_doux.models.project import Project
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.project.project import ProjectSerializer
from tout_doux.serializers.project.project_task import ProjectTaskSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    pagination_class = ExtendedPageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('archived',)

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list' or self.action == 'retrieve':
                return ProjectTaskSerializer

        # Case for create, update, partial_update and destroy
        return ProjectSerializer

    # TODO : see if we delete (I think so)
    # @action(detail=True)
    # def sections(self, request, pk=None):
    #     size = int(request.query_params.get('size', 20))
    #     page = int(request.query_params.get('page', 1))
    #
    #     if Project.objects.filter(id=pk).exists():
    #         project = Project.objects.get(id=pk)
    #         sections = SectionSerializer(project.sections.all(), many=True)
    #         return Response(sections.data)
    #     else:
    #         return Response(status=status.HTTP_404_NOT_FOUND)
