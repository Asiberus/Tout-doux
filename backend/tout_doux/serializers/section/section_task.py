from rest_framework import serializers

from tout_doux.models.section import Section
from tout_doux.serializers.task.task import TaskSerializer


class SectionTaskSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ('id', 'name', 'tasks')
