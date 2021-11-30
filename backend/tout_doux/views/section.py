from rest_framework import viewsets, status, mixins
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from tout_doux.models.section import Section
from tout_doux.serializers.section.section import SectionSerializer


class SectionViewSet(mixins.CreateModelMixin,
                     mixins.UpdateModelMixin,
                     mixins.DestroyModelMixin,
                     viewsets.GenericViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.archived:
            raise PermissionDenied('This section is related to an archived project')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
