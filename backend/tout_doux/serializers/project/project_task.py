from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.serializers.event.event import EventSerializer
from tout_doux.serializers.section.section import SectionSerializer
from tout_doux.serializers.task.task import TaskSerializer


class ProjectTaskSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    events = EventSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'archived', 'sections', 'tasks', 'events', 'created_at')
