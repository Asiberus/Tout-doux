from rest_framework import viewsets

from tout_doux.models import ProjectTag
from tout_doux.serializers.project_tag import ProjectTagSerializer


class ProjectTagViewSet(viewsets.ModelViewSet):
    queryset = ProjectTag.objects.all()
    serializer_class = ProjectTagSerializer
