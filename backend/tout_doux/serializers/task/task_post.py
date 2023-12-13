from rest_framework import serializers

from tout_doux.models import Task, Project, Section, Collection, Tag
from tout_doux.serializers.task.task import TaskSerializer


class TaskPostSerializer(serializers.ModelSerializer):
    tagIds = serializers.PrimaryKeyRelatedField(
        source='tags',
        queryset=Tag.objects.filter(type=Tag.Type.TASK),
        many=True,
        required=False,
        allow_null=True
    )
    projectId = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )
    sectionId = serializers.PrimaryKeyRelatedField(
        source='section',
        queryset=Section.objects.all(),
        required=False,
        allow_null=True
    )
    collectionId = serializers.PrimaryKeyRelatedField(
        source='collection',
        queryset=Collection.objects.all(),
        required=False,
        allow_null=True
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Task
        fields = (
            'name',
            'tagIds',
            'projectId',
            'sectionId',
            'collectionId',
            'user',
        )

    def to_representation(self, instance):
        return TaskSerializer(instance).data

    def validate_tagIds(self, tags):
        current_user = self.context.get('request').user
        for tag in tags:
            if tag.user.pk is not current_user.pk:
                raise serializers.ValidationError(f'Invalid pk \"{tag.pk}\" - object does not exist.')

        return tags

    def validate_projectId(self, project):
        current_user = self.context.get('request').user
        if project.user.pk is not current_user.pk:
            raise serializers.ValidationError(f'Invalid pk \"{project.pk}\" - object does not exist.')

        if project.archived:
            raise serializers.ValidationError('You can\'t create a task to an archived project')

        return project

    def validate_sectionId(self, section):
        current_user = self.context.get('request').user
        if section.user.pk is not current_user.pk:
            raise serializers.ValidationError(f'Invalid pk \"{section.pk}\" - object does not exist.')

        if section.project.archived:
            raise serializers.ValidationError('You can\'t create a task to an archived project')

        return section

    def validate_collectionId(self, collection):
        current_user = self.context.get('request').user
        if collection.user.pk is not current_user.pk:
            raise serializers.ValidationError(f'Invalid pk \"{collection.pk}\" - object does not exist.')

        if collection.archived:
            raise serializers.ValidationError('You can\'t create a task to an archived collection')

        return collection

    def validate(self, data):
        # Presence of keys 'project', 'section' and 'collection' in data
        relation_keys = len([key for key in list(data) if key in ['project', 'section', 'collection']])

        if relation_keys == 0:
            raise serializers.ValidationError('You must link a task to either a project, a section or a collection')
        elif relation_keys > 1:
            raise serializers.ValidationError('You can\'t create a task related to a project, a section and collection')

        return data
