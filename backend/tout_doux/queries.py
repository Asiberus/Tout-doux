from django.db.models import Count, IntegerField, Subquery
from django.db.models.functions import Coalesce


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
