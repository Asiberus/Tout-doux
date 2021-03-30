from rest_framework import serializers

from tout_doux.models.daily_task import DailyTask
from tout_doux.models.task import Task
from tout_doux.utils import get_or_raise_error


class DailyTaskSerializer(serializers.ModelSerializer):
    taskId = serializers.ModelField(model_field=DailyTask()._meta.get_field('task'), required=False, allow_null=True)

    class Meta:
        model = DailyTask
        fields = '__all__'

    def validate(self, data):
        if 'taskId' in data:
            task_id = data.pop('taskId')
            if task_id:
                task = get_or_raise_error(Task, id=task_id,
                                          error=serializers.ValidationError('This task doesn\'t exist'))
                if task.completed:
                    raise serializers.ValidationError('You can\'t link a completed task to a daily task')
                data['task'] = task
            else:
                data['task'] = None

        if not data.get('task') and not data.get('name'):
            raise serializers.ValidationError('You must provide a name or a taskId to create a daily task')

        if data.get('task') and data.get('name') or data.get('priority'):
            raise serializers.ValidationError('You can\'t create a daily task with a taskId and a name or a priority')

        if self.instance:
            if self.instance.task:
                if data.get('task'):
                    raise serializers.ValidationError('You can\'t edit the task of a daily task')
                if data.get('name') or data.get('priority'):
                    raise serializers.ValidationError(
                        'You can\'t edit the name or the priority of a daily task that are related to a task')

            if self.instance.name:
                if data.get('task'):
                    raise serializers.ValidationError('You can\'t edit the task of a daily task that have a name')

        return data
