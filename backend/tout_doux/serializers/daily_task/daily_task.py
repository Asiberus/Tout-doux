from datetime import date

from django.utils import timezone
from rest_framework import serializers

from tout_doux.models.common_task import CommonTask
from tout_doux.models.daily_task import DailyTask
from tout_doux.models.task import Task
from tout_doux.models.task_tag import TaskTag
from tout_doux.serializers.common_task.common_task import CommonTaskSerializer
from tout_doux.serializers.task.task_extended import TaskExtendedSerializer
from tout_doux.serializers.task_tag.task_tag import TaskTagSerializer


class DailyTaskSerializer(serializers.ModelSerializer):
    taskId = serializers.PrimaryKeyRelatedField(write_only=True, source='task', queryset=Task.objects.all(),
                                                required=False, allow_null=True)
    task = TaskExtendedSerializer(read_only=True)

    commonTaskId = serializers.PrimaryKeyRelatedField(write_only=True, queryset=CommonTask.objects.all(),
                                                      source='common_task', required=False, allow_null=True)
    commonTask = CommonTaskSerializer(read_only=True, source='common_task')

    tags = TaskTagSerializer(read_only=True, many=True)
    tagIds = serializers.PrimaryKeyRelatedField(write_only=True, source='tags', queryset=TaskTag.objects.all(),
                                                many=True, required=False, allow_null=True)

    class Meta:
        model = DailyTask
        fields = (
            'id', 'date', 'task', 'taskId', 'commonTask', 'commonTaskId',
            'name', 'tags', 'tagIds', 'action', 'completed')

    def update(self, instance, validated_data):
        if instance.task and 'completed' in validated_data and (
                not instance.action or instance.action == DailyTask.FINISH):
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
        if self.instance:
            if self.instance.date != date.today() and list(data) != ['completed']:
                raise serializers.ValidationError('You can\'t edit a closed daily task')

            if self.instance.task or self.instance.common_task:
                # Only completed and action fields can be modified for a task/common_task related daily task
                if not all([key in ['completed', 'action'] for key in list(data)]):
                    raise serializers.ValidationError('You can\'t edit a daily task related to a task or a common task')
            elif 'task' in data or 'common_task' in data:
                raise serializers.ValidationError('You can\'t add a task or a common task to a created daily task')
        else:
            if 'task' in data and 'common_task' in data:
                raise serializers.ValidationError('You can\'t create a daily task related to a task and a common task')
            elif ('task' in data or 'common_task' in data) and ('name' in data or 'tags' in data):
                raise serializers.ValidationError(
                    'You can\'t create a daily task related to a task/common task with a name or tags')

            if not any([key in ['task', 'common_task', 'name'] for key in list(data)]):
                raise serializers.ValidationError(
                    'You must provide a name or a task id or a common task id to create a daily task')

            # Test that the task is not related to an archived project/collection
            if 'task' in data:
                task = data.get('task')
                if task.completed:
                    raise serializers.ValidationError('You can\'t link a completed task to a daily task')
                if (task.project and task.project.archived) or (task.section and task.section.project.archived):
                    raise serializers.ValidationError(
                        'You can\'t create a daily task with a task related to an archived project')
                if task.collection and task.collection.archived:
                    raise serializers.ValidationError(
                        'You can\'t create a daily task with a task related to an archived collection')

        return data
