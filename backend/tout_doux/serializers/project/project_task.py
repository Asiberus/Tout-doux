from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.serializers.section.section_task import SectionTaskSerializer
from tout_doux.serializers.task.task import TaskSerializer


class ProjectTaskSerializer(serializers.ModelSerializer):
    sections = SectionTaskSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'archived', 'sections', 'tasks', 'created_at')
