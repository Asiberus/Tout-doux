from datetime import date

from django.utils import timezone
from rest_framework import serializers

from tout_doux.models.daily_task import DailyTask
from tout_doux.models.task import Task
from tout_doux.serializers.task.task_extended import TaskExtendedSerializer
from tout_doux.utils import get_or_raise_error


class DailyTaskSerializer(serializers.ModelSerializer):
    taskId = serializers.ModelField(model_field=DailyTask()._meta.get_field('task'), required=False, allow_null=True)

    class Meta:
        model = DailyTask
        fields = ('id', 'date', 'taskId', 'name', 'action', 'completed')

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if rep.get('taskId'):
            rep['task'] = TaskExtendedSerializer(instance.task).data

        return rep

    def update(self, instance, validated_data):
        if instance.task and 'completed' in validated_data and (
                not instance.action or instance.action == DailyTask.FINISH):
            # Test if task is not related to an archived project or collection
            if (instance.task.project and not instance.task.project.archived) \
                    or (instance.task.section and not instance.task.section.project.archived) \
                    or (instance.task.collection and not instance.task.collection.archived):
                instance.task.completed = validated_data.get('completed', False)
                instance.task.completed_at = timezone.now() if validated_data.get('completed') else None
                instance.task.save()

        instance_updated = super().update(instance, validated_data)

        return instance_updated

    def validate(self, data):
        # Map taskId to task
        if 'taskId' in data:
            data['task'] = get_or_raise_error(Task, id=data.pop('taskId'),
                                              error=serializers.ValidationError('This task doesn\'t exist'))

        if self.instance:
            if self.instance.date != date.today():
                if 'task' in data or 'name' in data or 'action' in data:
                    raise serializers.ValidationError('You can\'t edit a closed daily task')
            if self.instance.task:
                if 'task' in data:
                    raise serializers.ValidationError('You can\'t edit the task of a daily task')
                if 'name' in data:
                    raise serializers.ValidationError(
                        'You can\'t edit the name of a daily task related to a task')
            if self.instance.name:
                if 'task' in data:
                    raise serializers.ValidationError('You can\'t edit the task of a daily task that have a name')
        else:
            if 'task' in data:
                task = data.get('task')
                if 'name' in data:
                    raise serializers.ValidationError('You can\'t create a daily task with a taskId and a name')
                if task.completed:
                    raise serializers.ValidationError('You can\'t link a completed task to a daily task')
                if (task.project and task.project.archived) or (task.section and task.section.project.archived):
                    raise serializers.ValidationError(
                        'You can\'t create a daily task with a task related to an archived project')
                if task.collection and task.collection.archived:
                    raise serializers.ValidationError(
                        'You can\'t create a daily task with a task related to an archived collection')

            if 'task' not in data and 'name' not in data:
                raise serializers.ValidationError('You must provide a name or a taskId to create a daily task')

            if data.get('completed'):
                raise serializers.ValidationError('You can\'t create a completed daily task')

        return data
