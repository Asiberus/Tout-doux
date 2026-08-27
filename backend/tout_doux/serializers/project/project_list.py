from rest_framework import serializers

from tout_doux.models import Project
from tout_doux.serializers.project.project import ProjectSerializer


class ProjectListSerializer(ProjectSerializer):
    taskCount = serializers.IntegerField(source='task_count', read_only=True)
    completedTaskCount = serializers.IntegerField(source='completed_task_count', read_only=True)
    eventsToCome = serializers.IntegerField(source='events_to_come', read_only=True)

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'tags',
            'archived',
            'createdOn',
            'taskCount',
            'completedTaskCount',
            'eventsToCome',
        )
