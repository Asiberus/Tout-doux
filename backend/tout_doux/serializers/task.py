from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.models.task import Task
from tout_doux.utils import get_or_none


class TaskSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Task()._meta.get_field('project'), required=False)

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'completed', 'priority', 'projectId', 'event', 'deadline')

    def create(self, validated_data):
        project = get_or_none(Project, id=validated_data.pop('projectId', None))
        task = Task.objects.create(project=project, **validated_data)
        return task
