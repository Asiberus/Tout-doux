from rest_framework import serializers
from django.utils import timezone
from tout_doux.models.project import Project
from tout_doux.models.task import Task
from tout_doux.utils import get_or_none


# Todo : Map snake_case to camelCase in serializer fields
class TaskSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Task()._meta.get_field('project'), required=False)

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'completed', 'priority', 'projectId', 'event', 'deadline', 'created_at',
                  'completed_at')

    def create(self, validated_data):
        task = Task.objects.create(project=validated_data.pop('projectId', None), **validated_data)
        return task

    def update(self, instance, validated_data):
        if validated_data.get('completed', None):
            validated_data['completed_at'] = timezone.now()
        return super().update(instance, validated_data)

    def validate(self, data):
        if self.instance and self.instance.project and self.instance.project.archived:
            raise serializers.ValidationError('You can\'t edit a task related to an archived project')
        return data

    def validate_projectId(self, value):
        project = get_or_none(Project, id=value)
        if project and project.archived:
            raise serializers.ValidationError('You can\'t add a task to an archived project')
        return project
