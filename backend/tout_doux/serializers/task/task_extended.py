from rest_framework import serializers

from tout_doux.models import Task
from tout_doux.serializers.collection import CollectionSerializer
from tout_doux.serializers.project import ProjectSerializer
from tout_doux.serializers.section import SectionExtendedSerializer
from tout_doux.serializers.task_tag import TaskTagSerializer


class TaskExtendedSerializer(serializers.ModelSerializer):
    tags = TaskTagSerializer(read_only=True, many=True)
    project = ProjectSerializer(read_only=True)
    section = SectionExtendedSerializer(read_only=True)
    collection = CollectionSerializer(read_only=True)
    createdAt = serializers.DateTimeField(read_only=True, source='created_at')
    completedAt = serializers.DateTimeField(read_only=True, source='completed_at')

    class Meta:
        model = Task
        fields = ('id', 'name', 'tags', 'completed', 'project', 'section', 'collection', 'createdAt', 'completedAt')
