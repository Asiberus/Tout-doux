from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from tout_doux.models import Project, Task
from tout_doux.serializers.project.project import ProjectSerializer


class ProjectListSerializer(ProjectSerializer):
    taskCount = serializers.SerializerMethodField(method_name='get_task_count')
    completedTaskCount = serializers.SerializerMethodField(method_name='get_completed_task_count')
    eventsToCome = serializers.SerializerMethodField(method_name='get_events_to_come')

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'tags',
            'archived',
            'createdOn',
            'taskCount',
            'completedTaskCount',
            'eventsToCome',
        )

    def get_task_count(self, project):
        return Task.objects.filter(Q(project=project) | Q(section__project=project)).count()

    def get_completed_task_count(self, project):
        return Task.objects.filter(Q(project=project) | Q(section__project=project), completed=True).count()

    def get_events_to_come(self, project):
        today = timezone.now()
        return project.events.filter(Q(start_date__gte=today) | Q(start_date__lte=today, end_date__gte=today)).count()
