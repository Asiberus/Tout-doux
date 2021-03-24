from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.serializers.task import TaskSerializer


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'priority', 'archived', 'tasks', 'created_at')

    def validate(self, data):
        if self.instance and self.instance.archived:
            if 'name' in data or 'description' in data or 'priority' in data:
                raise serializers.ValidationError('You can\'t edit a archived project')
        return data
