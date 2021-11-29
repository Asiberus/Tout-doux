from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.serializers.task.task import TaskSerializer


class CollectionTaskSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'created_at', 'archived', 'tasks')
