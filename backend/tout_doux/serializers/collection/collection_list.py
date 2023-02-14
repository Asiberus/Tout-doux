from rest_framework import serializers

from tout_doux.models import Collection


class CollectionListSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(read_only=True, source='created_on')
    taskCount = serializers.SerializerMethodField(method_name='get_task_count')
    completedTaskCount = serializers.SerializerMethodField(method_name='get_completed_task_count')

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'archived', 'createdOn', 'taskCount', 'completedTaskCount')

    def get_task_count(self, collection):
        return collection.tasks.count()

    def get_completed_task_count(self, collection):
        return collection.tasks.filter(completed=True).count()
