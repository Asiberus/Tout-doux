from django.utils import timezone
from rest_framework import serializers

from tout_doux.models import Task, Tag
from tout_doux.serializers.task.task import TaskSerializer


class TaskPatchSerializer(serializers.ModelSerializer):
    tagIds = serializers.PrimaryKeyRelatedField(
        source='tags',
        queryset=Tag.objects.filter(type=Tag.Type.TASK),
        many=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Task
        fields = (
            'name',
            'tagIds',
            'completed',
        )

    def to_representation(self, instance):
        return TaskSerializer(instance).data

    def update(self, instance, validated_data):
        if 'completed' in validated_data:
            if validated_data.get('completed'):
                validated_data['completed_at'] = timezone.now()
            else:
                validated_data['completed_at'] = None

        return super().update(instance, validated_data)

    def validate_tagIds(self, tags):
        current_user = self.context.get('request').user

        for tag in tags:
            if tag.user.pk is not current_user.pk:
                raise serializers.ValidationError(f'Invalid pk \"{tag.pk}\" - object does not exist.')

        return tags

    def validate(self, data):
        # This serializer is only used in a PATCH context, self.instance is always defined
        if self.instance.project and self.instance.project.archived:
            raise serializers.ValidationError('You can\'t edit a task related to an archived project')
        elif self.instance.section and self.instance.section.project.archived:
            raise serializers.ValidationError('You can\'t edit a task related to an archived project')
        elif self.instance.collection and self.instance.collection.archived:
            raise serializers.ValidationError('You can\'t edit a task related to an archived collection')

        return data
