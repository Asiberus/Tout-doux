from rest_framework import serializers

from tout_doux.models.list import List
from tout_doux.serializers.task import TaskSerializer


class ListSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ('id', 'name', 'description', 'tasks', 'created_at')
