from rest_framework import serializers

from tout_doux.models import CommonTask, DailyTask, Tag, Task
from tout_doux.serializers.daily_task.daily_task import DailyTaskSerializer


class DailyTaskPostSerializer(serializers.ModelSerializer):
    taskId = serializers.PrimaryKeyRelatedField(
        source='task',
        queryset=Task.objects.all(),
        required=False,
        allow_null=True
    )
    commonTaskId = serializers.PrimaryKeyRelatedField(
        source='common_task',
        queryset=CommonTask.objects.all(),
        required=False,
        allow_null=True
    )
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
            'taskId',
            'commonTaskId',
            'name',
            'tagIds',
            'action',
        )

    def to_representation(self, instance):
        return DailyTaskSerializer(instance).data

    def validate_taskId(self, task):
        # Test that the task is not completed or related to an archived project/collection
        if task.completed:
            raise serializers.ValidationError('You can\'t link a completed task to a daily task')
        if (task.project and task.project.archived) or (task.section and task.section.project.archived):
            raise serializers.ValidationError(
                'You can\'t create a daily task with a task related to an archived project')
        if task.collection and task.collection.archived:
            raise serializers.ValidationError(
                'You can\'t create a daily task with a task related to an archived collection')

        return task

    def validate(self, data):
        if 'task' in data and 'common_task' in data:
            raise serializers.ValidationError('You can\'t create a daily task related to a task and a common task')
        elif ('task' in data or 'common_task' in data) and ('name' in data or 'tags' in data):
            raise serializers.ValidationError(
                'You can\'t create a daily task related to a task/common task with a name or tags')

        if not any([key in ['task', 'common_task', 'name'] for key in list(data)]):
            raise serializers.ValidationError(
                'You must provide a name or a task id or a common task id to create a daily task')

        return data
