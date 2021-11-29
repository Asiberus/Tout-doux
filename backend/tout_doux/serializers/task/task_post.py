from django.utils import timezone
from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.models.project import Project
from tout_doux.models.section import Section
from tout_doux.models.task import Task
from tout_doux.serializers.task.task import TaskSerializer
from tout_doux.utils import get_or_raise_error


# Todo : Map snake_case to camelCase in serializer fields
class TaskPostSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Task()._meta.get_field('project'), required=False, allow_null=True)
    sectionId = serializers.ModelField(model_field=Task()._meta.get_field('section'), required=False, allow_null=True)
    collectionId = serializers.ModelField(model_field=Task()._meta.get_field('collection'), required=False,
                                          allow_null=True)

    class Meta:
        model = Task
        fields = ('id', 'name', 'completed', 'projectId', 'sectionId', 'collectionId', 'created_at', 'completed_at')

    def to_representation(self, instance):
        serializer = TaskSerializer(instance)
        return serializer.data

    def update(self, instance, validated_data):
        if 'completed' in validated_data:
            if validated_data.get('completed'):
                validated_data['completed_at'] = timezone.now()
            else:
                validated_data['completed_at'] = None

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

        # Map projectId to project
        if 'sectionId' in data:
            section_id = data.pop('sectionId')
            if section_id:
                data['section'] = get_or_raise_error(Section, id=section_id,
                                                     error=serializers.ValidationError(
                                                         'This section doesn\'t exist'))
            else:
                data['project'] = None

        if self.instance:
            if self.instance.project:
                if self.instance.project.archived:
                    raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')
                if data.get('project') or data.get('section') or data.get('collection'):
                    raise serializers.ValidationError('This task is already linked to a project')
            if self.instance.section:
                if self.instance.section.project.archived:
                    raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')
                if data.get('project') or data.get('section') or data.get('collection'):
                    raise serializers.ValidationError('This task is already linked to a section')
            if self.instance.collection:
                if self.instance.collection.archived:
                    raise serializers.ValidationError('You can\'t create or edit a task related to an archived collection')
                if data.get('project') or data.get('section') or data.get('collection'):
                    raise serializers.ValidationError('This task is already linked to a collection')
        else:
            if not data.get('project') and not data.get('section') and not data.get('collection'):
                raise serializers.ValidationError('You must link a task to either a project, a section or a collection')

            # Archived
            if (data.get('project') and data.get('project').archived) or (data.get('section') and data.get('section').project.archived):
                raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')
            if data.get('collection') and data.get('collection').archived:
                raise serializers.ValidationError('You can\'t create or edit a task related to an archived collection')

            # Link
            if (data.get('project') and data.get('section')) \
                    or (data.get('project') and data.get('collection')) \
                    or (data.get('section') and data.get('collection')):
                raise serializers.ValidationError(
                    'You can\'t create a task related to a project, a section and collection')

        return data
