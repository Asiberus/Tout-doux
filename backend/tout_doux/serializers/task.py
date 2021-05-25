from django.utils import timezone
from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.models.project import Project
from tout_doux.models.task import Task
from tout_doux.utils import get_or_raise_error


# Todo : Map snake_case to camelCase in serializer fields
class TaskSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Task()._meta.get_field('project'), required=False, allow_null=True)
    collectionId = serializers.ModelField(model_field=Task()._meta.get_field('collection'), required=False,
                                          allow_null=True)

    class Meta:
        model = Task
        fields = ('id', 'name', 'completed', 'projectId', 'collectionId', 'created_at', 'completed_at')

    def update(self, instance, validated_data):
        if validated_data.get('completed'):
            validated_data['completed_at'] = timezone.now()

        return super().update(instance, validated_data)

    def validate(self, data):
        # Map collectionId to collection
        if 'collectionId' in data:
            collection_id = data.pop('collectionId')
            if collection_id:
                data['collection'] = get_or_raise_error(Collection, id=collection_id, error=serializers.ValidationError(
                    'This collection doesn\'t exist'))
            else:
                data['collection'] = None

        # Map projectId to project
        if 'projectId' in data:
            project_id = data.pop('projectId')
            if project_id:
                data['project'] = get_or_raise_error(Project, id=project_id,
                                                     error=serializers.ValidationError('This project doesn\'t exist'))
            else:
                data['project'] = None

        # Todo : test if task is created without a project or a collection
        # Todo : test this condition
        if self.instance and self.instance.project and self.instance.project.archived \
                or data.get('project') and data.get('project').archived:
            raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')

        if data.get('project') and data.get('collection'):
            raise serializers.ValidationError('You can\'t create a task related to a project and a collection')
        elif self.instance and self.instance.project and data.get('collection'):
            raise serializers.ValidationError('This task is already linked to a project')
        elif self.instance and self.instance.collection and data.get('project'):
            raise serializers.ValidationError('This task is already linked to a collection')

        return data
