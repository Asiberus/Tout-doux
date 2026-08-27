from collections import Counter
from datetime import timedelta

from django.db.models import Count, IntegerField, Q, Subquery
from django.db.models.functions import Coalesce

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
