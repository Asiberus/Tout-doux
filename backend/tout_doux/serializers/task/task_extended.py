from rest_framework import serializers

from tout_doux.models import Task
from tout_doux.serializers.collection import CollectionSerializer
from tout_doux.serializers.project import ProjectSerializer
from tout_doux.serializers.section import SectionSerializer
from tout_doux.serializers.task_tag import TaskTagSerializer


class TaskExtendedSerializer(serializers.ModelSerializer):
    tags = TaskTagSerializer(many=True)
    project = ProjectSerializer()
    section = SectionSerializer()
    collection = CollectionSerializer()
    createdAt = serializers.DateTimeField(source='created_at')
    completedAt = serializers.DateTimeField(source='completed_at')

    class Meta:
        model = Task
        fields = (
            'id',
            'name',
            'tags',
            'completed',
            'project',
            'section',
            'collection',
            'createdAt',
            'completedAt'
        )
