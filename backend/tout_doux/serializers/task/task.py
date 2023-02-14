from django.utils import timezone
from rest_framework import serializers

from tout_doux.models import Collection, Project, Section, Task, TaskTag
from tout_doux.serializers.task_tag import TaskTagSerializer


class TaskSerializer(serializers.ModelSerializer):
    tags = TaskTagSerializer(read_only=True, many=True)
    tagIds = serializers.PrimaryKeyRelatedField(write_only=True, source='tags', queryset=TaskTag.objects.all(),
                                                many=True, required=False, allow_null=True)
    projectId = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all(),
                                                   required=False, allow_null=True)
    sectionId = serializers.PrimaryKeyRelatedField(source='section', queryset=Section.objects.all(),
                                                   required=False, allow_null=True)
    collectionId = serializers.PrimaryKeyRelatedField(source='collection', queryset=Collection.objects.all(),
                                                      required=False, allow_null=True)

    createdAt = serializers.DateTimeField(read_only=True, source='created_at')
    completedAt = serializers.DateTimeField(read_only=True, source='completed_at')

    class Meta:
        model = Task
        fields = ('id', 'name', 'tags', 'tagIds', 'completed', 'createdAt', 'completedAt', 'projectId', 'sectionId',
                  'collectionId')

    def update(self, instance, validated_data):
        if 'completed' in validated_data:
            if validated_data.get('completed'):
                validated_data['completed_at'] = timezone.now()
            else:
                validated_data['completed_at'] = None

        return super().update(instance, validated_data)

    def validate_projectId(self, project):
        if project.archived:
            raise serializers.ValidationError('You can\'t create a task to an archived project')

        return project

    def validate_sectionId(self, section):
        if section.project.archived:
            raise serializers.ValidationError('You can\'t create a task to an archived project')

        return section

    def validate_collectionId(self, collection):
        if collection.archived:
            raise serializers.ValidationError('You can\'t create a task to an archived collection')

        return collection

    def validate(self, data):
        if self.instance:
            if self.instance.project:
                if self.instance.project.archived:
                    raise serializers.ValidationError('You can\'t edit a task related to an archived project')
                if 'project' in data or 'section' in data or 'collection' in data:
                    raise serializers.ValidationError('This task is already linked to a project')
            if self.instance.section:
                if self.instance.section.project.archived:
                    raise serializers.ValidationError('You can\'t edit a task related to an archived project')
                if 'project' in data or 'section' in data or 'collection' in data:
                    raise serializers.ValidationError('This task is already linked to a section')
            if self.instance.collection:
                if self.instance.collection.archived:
                    raise serializers.ValidationError(
                        'You can\'t create or edit a task related to an archived collection')
                if 'project' in data or 'section' in data or 'collection' in data:
                    raise serializers.ValidationError('This task is already linked to a collection')
        else:
            if len([key for key in list(data) if key in ['project', 'section', 'collection']]) == 0:
                raise serializers.ValidationError('You must link a task to either a project, a section or a collection')

            if len([key for key in list(data) if key in ['project', 'section', 'collection']]) > 1:
                raise serializers.ValidationError(
                    'You can\'t create a task related to a project, a section and collection')

        return data
