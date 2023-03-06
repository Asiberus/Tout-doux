from rest_framework import serializers

from tout_doux.models import Task
from tout_doux.serializers.common import ReadOnlyModelSerializer
from tout_doux.serializers.tag import TagSerializer


class TaskSerializer(ReadOnlyModelSerializer):
    tags = TagSerializer(many=True)
    createdAt = serializers.DateTimeField(source='created_at')
    completedAt = serializers.DateTimeField(source='completed_at')

    class Meta:
        model = Task
        fields = (
            'id',
            'name',
            'tags',
            'completed',
            'createdAt',
            'completedAt',
        )
