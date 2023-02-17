from rest_framework import serializers

from tout_doux.models import Section
from tout_doux.serializers.task import TaskSerializer


class SectionTasksSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True)

    class Meta:
        model = Section
        fields = (
            'id',
            'name',
            'tasks'
        )
