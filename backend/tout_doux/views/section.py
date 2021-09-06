from rest_framework import viewsets

from tout_doux.models.section import Section
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.section import SectionSerializer


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    pagination_class = ExtendedPageNumberPagination
