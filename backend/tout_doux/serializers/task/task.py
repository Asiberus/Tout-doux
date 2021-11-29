from rest_framework import serializers

from tout_doux.models.task import Task


# TODO : add projectId, sectionId, collectionId in fields
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'name', 'completed', 'created_at', 'completed_at')
