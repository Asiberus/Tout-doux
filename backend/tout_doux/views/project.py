from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action

from tout_doux.models import Event, Task
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.queries import scalar_count
from tout_doux.serializers.project import ProjectListSerializer, ProjectDetailSerializer, ProjectPostOrPatchSerializer, \
    ProjectSerializer


def project_tasks(**filters):
    """Les tâches d'un projet, directes ou via une section, corrélées au projet englobant."""
    return Task.objects.filter(
        Q(project=OuterRef('pk')) | Q(section__project=OuterRef('pk')), **filters
    )


class ProjectViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination
    filterset_fields = ('archived',)

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['detailed', 'retrieve']:
            return ProjectDetailSerializer
        elif self.action in ['create', 'partial_update', 'update']:
            return ProjectPostOrPatchSerializer
        else:
            return ProjectSerializer

    def get_queryset(self):
        queryset = self.request.user.projects.all()

        if self.action in ('list', 'detailed', 'retrieve'):
            queryset = queryset.prefetch_related('tags')

        if self.action == 'list':
            # Une tâche a soit `project`, soit `section` : les deux comptes sont disjoints.
            now = timezone.now()
            queryset = queryset.annotate(
                task_count=(
                    scalar_count(Task.objects.filter(project=OuterRef('pk')), 'project')
                    + scalar_count(
                        Task.objects.filter(section__project=OuterRef('pk')), 'section__project'
                    )
                ),
                completed_task_count=(
                    scalar_count(
                        Task.objects.filter(project=OuterRef('pk'), completed=True), 'project'
                    )
                    + scalar_count(
                        Task.objects.filter(section__project=OuterRef('pk'), completed=True),
                        'section__project',
                    )
                ),
                events_to_come=scalar_count(
                    Event.objects.filter(
                        Q(start_date__gte=now) | Q(start_date__lte=now, end_date__gte=now),
                        project=OuterRef('pk'),
                    ),
                    'project',
                ),
            )

        if self.action in ('detailed', 'retrieve'):
            queryset = queryset.prefetch_related('tasks__tags', 'sections__tasks__tags', 'events')

        if self.request.query_params.get('has_uncompleted_task') in ['true', 'True']:
            queryset = queryset.filter(Exists(project_tasks(completed=False)))

        return queryset

    @action(detail=False)
    def detailed(self, request):
        return self.list(request)
