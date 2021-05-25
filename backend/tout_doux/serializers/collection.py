from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.serializers.task import TaskSerializer


class CollectionSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'tasks', 'created_at')
