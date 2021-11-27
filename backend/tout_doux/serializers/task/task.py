from rest_framework import serializers

from tout_doux.models.task import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'name', 'completed', 'created_at')
