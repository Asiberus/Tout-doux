from collections import Counter
from datetime import date, timedelta

from django.db.models import Count, Exists, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ParseError

from tout_doux.models import DailyTask, Event


def scalar_count(queryset, group_by):
    """Compte les lignes d'un queryset corrélé, sans jointure dans la requête appelante.

    Recette documentée par Django (« Using aggregates within a Subquery expression ») :
    on regroupe sur la colonne de corrélation pour obtenir exactement un groupe, puis on ne
    projette que le compte.

    `order_by()` vide le tri hérité du Meta du modèle, que Django ajouterait sinon à la
    sous-requête. `Coalesce` traite le cas « aucune ligne » : un GROUP BY sans groupe ne
    renvoie pas 0, il ne renvoie aucune ligne, et la sous-requête vaut alors NULL.
    """
    return Coalesce(
        Subquery(
            queryset.order_by().values(group_by).annotate(n=Count('pk')).values('n')[:1],
            output_field=IntegerField(),
        ),
        0,
    )



def daily_task_date_param(request):
    value = request.query_params.get('daily_task_date')
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ParseError('Date not valid.')


def daily_summary_counts(user, dates):
    """Compte tâches et événements pour chaque date, en deux requêtes quel que soit l'intervalle.

    Les événements ne se groupent pas par date en SQL : un événement à cheval appartient à
    plusieurs jours. On rapatrie donc les bornes de ceux qui recoupent l'intervalle et on balaie
    en Python. `dates` peut être décroissant — c'est le cas de tous les appels du front — d'où
    les bornes normalisées par `min`/`max` avant d'interroger la base.
    """
    first, last = min(dates), max(dates)

    tasks = {
        row['date']: row
        for row in DailyTask.objects.filter(user=user, date__gte=first, date__lte=last)
        .values('date')
        .annotate(total=Count('pk'), completed=Count('pk', filter=Q(completed=True)))
    }

    spans = Event.objects.filter(user=user).filter(
        Q(start_date__gte=first, start_date__lte=last)
        | Q(start_date__lte=last, end_date__gte=first)
    ).values_list('start_date', 'end_date')

    events = Counter()
    for start, end in spans:
        # `end_date` est facultatif, et rien n'impose `end_date >= start_date` : dans ces deux
        # cas l'événement ne vaut que pour son jour de début.
        day, stop = max(start, first), min(end if end and end >= start else start, last)
        while day <= stop:
            events[day] += 1
            day += timedelta(days=1)

    return [
        {
            'date': day,
            'total_task': tasks.get(day, {}).get('total', 0),
            'total_task_completed': tasks.get(day, {}).get('completed', 0),
            'total_event': events[day],
        }
        for day in dates
    ]


def daily_carry_over_candidates(queryset):
    """Lignes de la veille encore copiables sur aujourd'hui.

    `queryset` doit déjà être cloisonné sur l'utilisateur : en pratique le `get_queryset()` de
    la vue, dont les préchargements couvrent aussi la sérialisation de la réponse.

    Le tri est fait en Python et non en SQL : les gardes d'archivage portent sur trois relations
    facultatives (`task.project`, `task.section.project`, `task.collection`), et un `exclude()`
    à travers une relation nulle ne s'exécute pas comme il se lit. Le volume est d'une journée.

    """
    today = timezone.localdate()

    # `prefetch_related(None)` purge les préchargements héritables de la vue : ils tourneraient
    # sur les tuples de `values_list` et lèveraient une AttributeError.
    planned_today = (
        queryset.prefetch_related(None).filter(date=today).values_list('task_id', 'common_task_id')
    )
    planned_tasks = {task_id for task_id, _ in planned_today if task_id}
    planned_common_tasks = {common_task_id for _, common_task_id in planned_today if common_task_id}

    def is_candidate(daily_task):
        if daily_task.completed:
            return False

        task = daily_task.task
        if task:
            if task.completed or task.pk in planned_tasks:
                return False
            return not any([
                task.project and task.project.archived,
                task.section and task.section.project.archived,
                task.collection and task.collection.archived,
            ])

        if daily_task.common_task:
            return daily_task.common_task_id not in planned_common_tasks

        # Ligne libre. Un `name` vide n'est atteignable que si les signaux `pre_delete` de
        # Task/CommonTask n'ont pas joué — garde défensive.
        return bool(daily_task.name)

    return [
        daily_task
        for daily_task in queryset.filter(date=today - timedelta(days=1))
        if is_candidate(daily_task)
    ]


def required_date_param(request, name='date'):
    try:
        return date.fromisoformat(request.query_params.get(name))
    except TypeError:
        raise ParseError(f'You must provide a {name}')
    except ValueError:
        raise ParseError('Date not valid.')


def task_due_summary(user, day):
    """Tâches ouvertes en retard ou dues le jour `day`, en une seule requête groupée.

    Les totaux ne comptent que les tâches pas encore planifiées sur `day` ; chaque conteneur
    compte toutes les siennes et dit combien sont planifiées. Une tâche de section compte pour
    son projet.

    Les gardes d'archivage s'écrivent en `filter()` sur `isnull | archived=False` : un
    `exclude()` à travers une relation nulle ne s'exécute pas comme il se lit.
    """
    rows = (
        user.tasks.filter(completed=False, due_date__lte=day)
        .filter(Q(project__isnull=True) | Q(project__archived=False))
        .filter(Q(section__isnull=True) | Q(section__project__archived=False))
        .filter(Q(collection__isnull=True) | Q(collection__archived=False))
        .annotate(
            project_key=Coalesce('project_id', 'section__project_id'),
            planned=Exists(DailyTask.objects.filter(task=OuterRef('pk'), date=day)),
        )
        .order_by()
        .values('project_key', 'collection_id', 'planned')
        .annotate(
            late=Count('pk', filter=Q(due_date__lt=day)),
            today=Count('pk', filter=Q(due_date=day)),
        )
    )

    summary = {'late': 0, 'today': 0, 'containers': []}
    containers = {}
    for row in rows:
        if not row['planned']:
            summary['late'] += row['late']
            summary['today'] += row['today']

        if row['project_key']:
            key = ('project', row['project_key'])
        else:
            key = ('collection', row['collection_id'])
        container = containers.setdefault(
            key, {'type': key[0], 'id': key[1], 'late': 0, 'today': 0, 'planned': 0}
        )
        container['late'] += row['late']
        container['today'] += row['today']
        if row['planned']:
            container['planned'] += row['late'] + row['today']

    summary['containers'] = list(containers.values())
    return summary
