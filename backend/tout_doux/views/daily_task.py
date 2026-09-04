from datetime import date

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ParseError
from rest_framework.response import Response

from tout_doux.models import DailyTask
from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.queries import daily_carry_over_candidates, daily_summary_counts
from tout_doux.serializers.daily_task import DailyTaskSerializer, DailyTaskPostSerializer, DailyTaskPatchSerializer, \
    DailySummarySerializer
from tout_doux.utils.date import daterange


def copy_daily_tasks_to_today(daily_tasks):
    """Recopie des lignes du plan sur aujourd'hui, à coût constant en requêtes.

    Attend des lignes dont `tags` est préchargé — sinon la lecture des tags repart en une
    requête par ligne.

    `date` n'est pas passée : `auto_now_add` la pose, y compris via `bulk_create`. PostgreSQL
    renvoie les clés dans l'ordre soumis, d'où le `zip`.

    Seules les colonnes de clé étrangère sont lues. Passer par `daily_task.user` n'est gratuit
    que tant que la vue part du manager de relation de l'utilisateur, qui pré-remplit le cache :
    un `get_queryset()` écrit autrement le ferait retomber à une requête par ligne.

    Les tags passent par la table de liaison directement : `tags.set()` émettrait un SELECT par
    ligne, y compris pour les origines liées dont les tags sont toujours vides.
    """
    copies = DailyTask.objects.bulk_create([
        DailyTask(
            user_id=daily_task.user_id,
            task_id=daily_task.task_id,
            common_task_id=daily_task.common_task_id,
            name=daily_task.name,
            action=daily_task.action,
        )
        for daily_task in daily_tasks
    ])

    through = DailyTask.tags.through
    through.objects.bulk_create([
        through(dailytask_id=copy.pk, tag_id=tag.pk)
        for copy, daily_task in zip(copies, daily_tasks)
        for tag in daily_task.tags.all()
    ])

    return copies


class DailyTaskViewSet(viewsets.ModelViewSet):
    pagination_class = ExtendedPageNumberPagination
    filterset_fields = ('date',)

    def get_queryset(self):
        queryset = self.request.user.dailytasks.all()

        # `destroy` ne lit que `date` ; les autres actions répondent toutes avec la chaîne
        # imbriquée complète, y compris les écritures via `to_representation`.
        if self.action != 'destroy':
            queryset = queryset.select_related(
                'task__project', 'task__section__project', 'task__collection', 'common_task',
            ).prefetch_related(
                'tags', 'task__tags', 'task__project__tags', 'task__section__project__tags',
                'common_task__tags',
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return DailyTaskPostSerializer
        elif self.action in ['partial_update', 'update']:
            return DailyTaskPatchSerializer
        else:
            return DailyTaskSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.date != date.today():
            raise PermissionDenied('The daily task is not related to the current day')
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False)
    def summary(self, request):
        try:
            start_date = date.fromisoformat(request.query_params.get('start_date'))
            end_date = date.fromisoformat(request.query_params.get('end_date'))
        except TypeError:
            # TypeError occur when start_date or end_date params are empty
            raise ParseError('You must provide a start date and an end date')
        except ValueError:
            raise ParseError('Date not valid.')

        summary_range = daily_summary_counts(request.user, list(daterange(start_date, end_date)))
        data = DailySummarySerializer(summary_range, many=True).data

        return Response(data)

    @action(detail=False, url_path='carry-over-candidates')
    def carry_over_candidates(self, request):
        candidates = daily_carry_over_candidates(self.get_queryset())
        return Response(DailyTaskSerializer(candidates, many=True).data)

    @action(detail=False, methods=['post'], url_path='carry-over')
    def carry_over(self, request):
        with transaction.atomic():
            created = copy_daily_tasks_to_today(daily_carry_over_candidates(self.get_queryset()))

        # Les instances tout juste créées n'ont aucun des préchargements de `get_queryset()` :
        # sans cette relecture, sérialiser la chaîne imbriquée repart en requêtes par ligne.
        queryset = self.get_queryset().filter(pk__in=[daily_task.pk for daily_task in created])

        return Response(
            DailyTaskSerializer(queryset, many=True).data, status=status.HTTP_201_CREATED
        )
