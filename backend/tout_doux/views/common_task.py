from rest_framework import viewsets

from tout_doux.models.common_task import CommonTask
from tout_doux.serializers.common_task.common_task import CommonTaskSerializer


class CommonTaskViewSet(viewsets.ModelViewSet):
    queryset = CommonTask.objects.all()
    serializer_class = CommonTaskSerializer
