from rest_framework import viewsets

from tout_doux.models.project_tag import ProjectTag
from tout_doux.serializers.project_tag.project_tag import ProjectTagSerializer


class ProjectTagViewSet(viewsets.ModelViewSet):
    queryset = ProjectTag.objects.all()
    serializer_class = ProjectTagSerializer
