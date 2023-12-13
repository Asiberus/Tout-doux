from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters

from tout_doux.models import Feedback
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.permissions import CreateOrAdmin
from tout_doux.serializers.feedback import FeedbackSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = (CreateOrAdmin,)
    pagination_class = ExtendedPageNumberPagination
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filterset_fields = ('is_read',)
