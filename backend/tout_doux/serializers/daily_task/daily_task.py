from datetime import date

from django.utils import timezone
from rest_framework import serializers

from tout_doux.models.daily_task import DailyTask
from tout_doux.models.task import Task
from tout_doux.serializers.task.task_extended import TaskExtendedSerializer
from tout_doux.utils import get_or_raise_error


# Todo : maybe change name of daily task
class DailyTaskSerializer(serializers.ModelSerializer):
    taskId = serializers.ModelField(model_field=DailyTask()._meta.get_field('task'), required=False, allow_null=True)

    class Meta:
        model = DailyTask
        fields = ('id', 'date', 'taskId', 'name', 'action', 'completed')

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if rep['taskId']:
            rep['task'] = TaskExtendedSerializer(instance.task).data
        return rep

    def update(self, instance, validated_data):
        if instance.task and 'completed' in validated_data and (not instance.action or instance.action == DailyTask.FINISH):
            # Test if task is not related to an archived project or collection
            if (instance.task.project and not instance.task.project.archived) \
                    or (instance.task.section and not instance.task.section.project.archived) \
                    or (instance.task.collection and not instance.task.collection.archived):
                instance.task.completed = validated_data.get('completed')
                instance.task.completed_at = timezone.now() if validated_data.get('completed') else None
                instance.task.save()

        instance_updated = super().update(instance, validated_data)

        return instance_updated

    def validate(self, data):
        if 'taskId' in data:
            task_id = data.pop('taskId')
            if task_id:
                task = get_or_raise_error(Task, id=task_id,
                                          error=serializers.ValidationError('This task doesn\'t exist'))
                data['task'] = task
            else:
                data['task'] = None

        if self.instance:
            if self.instance.task:
                if data.get('task'):
                    raise serializers.ValidationError('You can\'t edit the task of a daily task')
                if data.get('name'):
                    raise serializers.ValidationError(
                        'You can\'t edit the name of a daily task related to a task')
            if self.instance.name:
                if data.get('task'):
                    raise serializers.ValidationError('You can\'t edit the task of a daily task that have a name')
            if self.instance.date != date.today():
                if data.get('task') or data.get('name') or data.get('action'):
                    raise serializers.ValidationError('You can\'t edit a closed daily task')
        else:
            if data.get('task'):
                task = data.get('task')
                if data.get('name'):
                    raise serializers.ValidationError('You can\'t create a daily task with a taskId and a name')
                if task.completed:
                    raise serializers.ValidationError('You can\'t link a completed task to a daily task')
                if (task.project and task.project.archived) or (task.section and task.section.project.archived):
                    raise serializers.ValidationError(
                        'You can\'t create a daily task with a task related to an archived project')
                if task.collection and task.collection.archived:
                    raise serializers.ValidationError(
                        'You can\'t create a daily task with a task related to an archived collection')

            if not data.get('task') and not data.get('name'):
                raise serializers.ValidationError('You must provide a name or a taskId to create a daily task')

            if data.get('completed'):
                raise serializers.ValidationError('You can\'t create a completed daily task')

        return data
