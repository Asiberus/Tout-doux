from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.serializers.task.task import TaskSerializer


class CollectionTaskSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateField(read_only=True, source='created_at')
    tasks = TaskSerializer(read_only=True, many=True)

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'createdAt', 'archived', 'tasks')
