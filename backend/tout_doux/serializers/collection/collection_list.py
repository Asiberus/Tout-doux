from rest_framework import serializers

from tout_doux.models import Collection
from tout_doux.serializers.collection.collection import CollectionSerializer


class CollectionListSerializer(CollectionSerializer):
    taskCount = serializers.IntegerField(source='task_count', read_only=True)
    completedTaskCount = serializers.IntegerField(source='completed_task_count', read_only=True)

    class Meta:
        model = Collection
        fields = (
            'id',
            'name',
            'description',
            'archived',
            'createdOn',
            'taskCount',
            'completedTaskCount'
        )
