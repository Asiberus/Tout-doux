from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.serializers.task import TaskSerializer


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('name', 'description', 'priority', 'archived', 'tasks')
