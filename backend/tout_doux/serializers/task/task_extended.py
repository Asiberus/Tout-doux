from rest_framework import serializers

from tout_doux.models.task import Task
from tout_doux.serializers.collection.collection import CollectionSerializer
from tout_doux.serializers.project.project import ProjectSerializer
from tout_doux.serializers.section.section_extended import SectionExtendedSerializer
from tout_doux.serializers.task_tag.task_tag import TaskTagSerializer


class TaskExtendedSerializer(serializers.ModelSerializer):
    tags = TaskTagSerializer(read_only=True, many=True)
    project = ProjectSerializer(read_only=True)
    section = SectionExtendedSerializer(read_only=True)
    collection = CollectionSerializer(read_only=True)

    class Meta:
        model = Task
        fields = ('id', 'name', 'tags', 'completed', 'project', 'section', 'collection', 'created_at')
