from rest_framework import viewsets, status, mixins
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from tout_doux.serializers.section import SectionSerializer, SectionPatchSerializer, SectionPostSerializer


class SectionViewSet(mixins.CreateModelMixin,
                     mixins.UpdateModelMixin,
                     mixins.DestroyModelMixin,
                     viewsets.GenericViewSet):

    def get_serializer_class(self):
        if self.action == 'create':
            return SectionPostSerializer
        elif self.action in ['partial_update', 'update']:
            return SectionPatchSerializer
        else:
            return SectionSerializer

    def get_queryset(self):
        return self.request.user.sections.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.archived:
            raise PermissionDenied('This section is related to an archived project')

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
