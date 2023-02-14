from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.serializers.task.task import TaskSerializer


class CollectionTaskSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(read_only=True, source='created_on')
    tasks = TaskSerializer(read_only=True, many=True)

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'createdOn', 'archived', 'tasks')
