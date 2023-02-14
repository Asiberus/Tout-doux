from rest_framework import serializers

from tout_doux.models import Project
from tout_doux.serializers.event import EventSerializer
from tout_doux.serializers.project_tag import ProjectTagSerializer
from tout_doux.serializers.section import SectionSerializer
from tout_doux.serializers.task import TaskSerializer


class ProjectDetailSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(read_only=True, source='created_on')
    tags = ProjectTagSerializer(read_only=True, many=True)
    sections = SectionSerializer(read_only=True, many=True)
    tasks = TaskSerializer(read_only=True, many=True)
    events = EventSerializer(read_only=True, many=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'tags', 'archived', 'sections', 'tasks', 'events', 'createdOn')
