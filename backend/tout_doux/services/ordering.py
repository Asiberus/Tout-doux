from django.db.models import Min
from fractional_indexing import generate_key_between

from tout_doux.exceptions import StaleListError


def neighbours(item, after_id, before_id, anchor_filter=None):
    """Renvoie les clés qui encadrent la place voulue par le client, entre les voisins qu'il voit.

    L'appelant tient le verrou de la liste. Les ancres sont cherchées parmi les lignes affichées
    (`anchor_filter`) ; la borne droite, dans toute la liste, pour que la clé ne prenne jamais
    celle d'une ligne cachée.
    """
    siblings = item.list_queryset()
    if item.pk is not None:
        siblings = siblings.exclude(pk=item.pk)
    anchors = siblings.filter(user_id=item.user_id)
    if anchor_filter is not None:
        anchors = anchors.filter(anchor_filter)

    wanted = [pk for pk in (after_id, before_id) if pk is not None]
    positions = dict(anchors.filter(pk__in=wanted).values_list('pk', 'position')) if wanted else {}
    if len(positions) != len(wanted):
        raise StaleListError()

    left, expected = positions.get(after_id), positions.get(before_id)
    if left is not None and expected is not None and left >= expected:
        raise StaleListError()

    following = siblings.filter(position__gt=left) if left is not None else siblings
    bounds = following.aggregate(
        right=Min('position'),
        next_anchor=Min('position', filter=anchor_filter) if anchor_filter is not None else Min('position'),
    )
    if bounds['next_anchor'] != expected:
        raise StaleListError()

    return left, bounds['right']


def move(item, after_id, before_id, anchor_filter=None):
    left, right = neighbours(item, after_id, before_id, anchor_filter)
    if (left is None or left < item.position) and (right is None or item.position < right):
        return

    item.position = generate_key_between(left, right)
    item.save(update_fields=['position'])
