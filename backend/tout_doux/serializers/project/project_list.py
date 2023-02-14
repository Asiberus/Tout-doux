from django.db.models import Q
from rest_framework import serializers

from tout_doux.models import Project, Task


class ProjectListSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(read_only=True, source='created_on')
    taskCount = serializers.SerializerMethodField(method_name='get_task_count')
    completedTaskCount = serializers.SerializerMethodField(method_name='get_completed_task_count')

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'tags', 'archived', 'createdOn', 'taskCount', 'completedTaskCount')

    def get_task_count(self, project):
        return Task.objects.filter(Q(project=project) | Q(section__project=project)).count()

    def get_completed_task_count(self, project):
        return Task.objects.filter(Q(project=project) | Q(section__project=project), completed=True).count()
