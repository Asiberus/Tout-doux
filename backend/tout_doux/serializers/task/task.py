from django.utils import timezone
from rest_framework import serializers

from tout_doux.models.collection import Collection
from tout_doux.models.project import Project
from tout_doux.models.section import Section
from tout_doux.models.task import Task
from tout_doux.utils import get_or_raise_error


class TaskSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Task()._meta.get_field('project'), required=False, allow_null=True)
    sectionId = serializers.ModelField(model_field=Task()._meta.get_field('section'), required=False, allow_null=True)
    collectionId = serializers.ModelField(model_field=Task()._meta.get_field('collection'), required=False,
                                          allow_null=True)

    class Meta:
        model = Task
        fields = ('id', 'name', 'completed', 'created_at', 'completed_at', 'projectId', 'sectionId', 'collectionId')

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
            data['collection'] = get_or_raise_error(Collection, id=data.pop('collectionId'),
                                                    error=serializers.ValidationError('This collection doesn\'t exist'))

        # Map projectId to project
        if 'projectId' in data:
            data['project'] = get_or_raise_error(Project, id=data.pop('projectId'),
                                                 error=serializers.ValidationError('This project doesn\'t exist'))

        # Map projectId to project
        if 'sectionId' in data:
            data['section'] = get_or_raise_error(Section, id=data.pop('sectionId'),
                                                 error=serializers.ValidationError('This section doesn\'t exist'))

        if self.instance:
            if self.instance.project:
                if self.instance.project.archived:
                    raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')
                if 'project' in data or 'section' in data or 'collection' in data:
                    raise serializers.ValidationError('This task is already linked to a project')
            if self.instance.section:
                if self.instance.section.project.archived:
                    raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')
                if 'project' in data or 'section' in data or 'collection' in data:
                    raise serializers.ValidationError('This task is already linked to a section')
            if self.instance.collection:
                if self.instance.collection.archived:
                    raise serializers.ValidationError(
                        'You can\'t create or edit a task related to an archived collection')
                if 'project' in data or 'section' in data or 'collection' in data:
                    raise serializers.ValidationError('This task is already linked to a collection')
        else:
            if 'project' not in data and 'section' not in data and 'collection' not in data:
                raise serializers.ValidationError('You must link a task to either a project, a section or a collection')

            # Archived
            if (data.get('project') and data.get('project').archived) or (
                    data.get('section') and data.get('section').project.archived):
                raise serializers.ValidationError('You can\'t create or edit a task related to an archived project')
            if data.get('collection') and data.get('collection').archived:
                raise serializers.ValidationError('You can\'t create or edit a task related to an archived collection')

            # Link
            if ('project' in data and 'section' in data) \
                    or ('project' in data and 'collection' in data) \
                    or ('section' in data and 'collection' in data):
                raise serializers.ValidationError(
                    'You can\'t create a task related to a project, a section and collection')

        return data
