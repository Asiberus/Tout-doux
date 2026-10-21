from rest_framework import serializers

from tout_doux.models import Task, Project, Section, Collection, Tag
from tout_doux.serializers.common import OwnedPrimaryKeyRelatedField
from tout_doux.serializers.task.task import TaskSerializer


class TaskPostSerializer(serializers.ModelSerializer):
    tagIds = OwnedPrimaryKeyRelatedField(
        source='tags',
        queryset=Tag.objects.filter(type=Tag.Type.TASK),
        many=True,
        required=False,
        allow_null=True
    )
    projectId = OwnedPrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )
    sectionId = OwnedPrimaryKeyRelatedField(
        source='section',
        queryset=Section.objects.all(),
        required=False,
        allow_null=True
    )
    collectionId = OwnedPrimaryKeyRelatedField(
        source='collection',
        queryset=Collection.objects.all(),
        required=False,
        allow_null=True
    )
    dueDate = serializers.DateField(source='due_date', required=False, allow_null=True)
    afterId = serializers.IntegerField(
        source='after_id', write_only=True, required=False, allow_null=True
    )
    beforeId = serializers.IntegerField(
        source='before_id', write_only=True, required=False, allow_null=True
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
            'dueDate',
            'afterId',
            'beforeId',
            'user',
        )

    def to_representation(self, instance):
        return TaskSerializer(instance).data

    def create(self, validated_data):
        after_id = validated_data.pop('after_id', None)
        before_id = validated_data.pop('before_id', None)
        tags = validated_data.pop('tags', [])

        task = Task(**validated_data)
        task.save(after_id=after_id, before_id=before_id)
        task.tags.set(tags)
        return task

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
        # Presence of keys 'project', 'section' and 'collection' in data
        relation_keys = len([key for key in list(data) if key in ['project', 'section', 'collection']])

        if relation_keys == 0:
            raise serializers.ValidationError('You must link a task to either a project, a section or a collection')
        elif relation_keys > 1:
            raise serializers.ValidationError('You can\'t create a task related to a project, a section and collection')

        after_id, before_id = data.get('after_id'), data.get('before_id')
        if after_id is not None and after_id == before_id:
            raise serializers.ValidationError('afterId and beforeId must differ')

        return data
