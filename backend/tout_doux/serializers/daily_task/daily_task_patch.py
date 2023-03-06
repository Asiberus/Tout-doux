from datetime import date

from django.utils import timezone
from rest_framework import serializers

from tout_doux.models import DailyTask, Tag
from tout_doux.serializers.daily_task.daily_task import DailyTaskSerializer


class DailyTaskPatchSerializer(serializers.ModelSerializer):
    tagIds = serializers.PrimaryKeyRelatedField(
        source='tags',
        queryset=Tag.objects.filter(type=Tag.Type.TASK),
        many=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = DailyTask
        fields = (
            'name',
            'tagIds',
            'action',
            'completed'
        )

    def to_representation(self, instance):
        return DailyTaskSerializer(instance).data

    def update(self, instance, validated_data):
        if instance.task \
                and 'completed' in validated_data \
                and (not instance.action or instance.action == DailyTask.FINISH):
            # Test if task is not related to an archived project or archived collection
            if (instance.task.project and not instance.task.project.archived) \
                    or (instance.task.section and not instance.task.section.project.archived) \
                    or (instance.task.collection and not instance.task.collection.archived):
                instance.task.completed = validated_data.get('completed', False)
                instance.task.completed_at = timezone.now() if validated_data.get('completed') else None
                instance.task.save()

        instance_updated = super().update(instance, validated_data)

        return instance_updated

    def validate(self, data):
        # This serializer is only used in a PATCH context, self.instance is always defined
        if self.instance.date != date.today() and list(data) != ['completed']:
            raise serializers.ValidationError('You can\'t edit a closed daily task')

        if self.instance.task or self.instance.common_task:
            # Only completed and action fields can be modified for a task/common_task related daily task
            if not all([key in ['completed', 'action'] for key in list(data)]):
                raise serializers.ValidationError('You can\'t edit a daily task related to a task or a common task')
        elif 'task' in data or 'common_task' in data:
            raise serializers.ValidationError('You can\'t add a task or a common task to a created daily task')

        return data
