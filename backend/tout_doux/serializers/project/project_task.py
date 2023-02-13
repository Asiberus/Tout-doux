from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.serializers.event.event import EventSerializer
from tout_doux.serializers.project_tag.project_tag import ProjectTagSerializer
from tout_doux.serializers.section.section import SectionSerializer
from tout_doux.serializers.task.task import TaskSerializer


class ProjectTaskSerializer(serializers.ModelSerializer):
    tags = ProjectTagSerializer(read_only=True, many=True)
    sections = SectionSerializer(read_only=True, many=True)
    tasks = TaskSerializer(read_only=True, many=True)
    events = EventSerializer(read_only=True, many=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'tags', 'archived', 'sections', 'tasks', 'events', 'created_at')
