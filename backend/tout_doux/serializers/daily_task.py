from rest_framework import serializers

from tout_doux.models.daily_task import DailyTask
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
                data['task'] = get_or_raise_error(DailyTask, id=task_id,
                                                  error=serializers.ValidationError('This task doesn\'t exist'))
            else:
                data['task'] = None

        return data
