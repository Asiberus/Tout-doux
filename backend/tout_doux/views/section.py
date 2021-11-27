from rest_framework import viewsets

from tout_doux.models.section import Section
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.section.section import SectionSerializer
from tout_doux.serializers.section.section_task import SectionTaskSerializer


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    pagination_class = ExtendedPageNumberPagination

    def get_serializer_class(self):
        if hasattr(self, 'action'):
            if self.action == 'list' or self.action == 'retrieve':
                return SectionTaskSerializer

        # Case for create, update, partial_update and destroy
        return SectionSerializer
