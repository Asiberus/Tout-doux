from itertools import groupby

from django.db import migrations
from fractional_indexing import generate_n_keys_between


def assign_positions(model, list_columns, order):
    # `project_id` et non `project` : trier sur le nom d'une FK suit le Meta.ordering du modèle lié.
    rows = model.objects.order_by(*list_columns, order)
    updated = []
    for _, siblings in groupby(rows, key=lambda row: tuple(getattr(row, column) for column in list_columns)):
        siblings = list(siblings)
        for row, position in zip(siblings, generate_n_keys_between(None, None, len(siblings))):
            row.position = position
            updated.append(row)
    model.objects.bulk_update(updated, ['position'], batch_size=500)


def backfill_positions(apps, schema_editor):
    assign_positions(
        apps.get_model('tout_doux', 'Task'), ('project_id', 'section_id', 'collection_id'), '-pk'
    )
    assign_positions(apps.get_model('tout_doux', 'DailyTask'), ('user_id', 'date'), 'pk')


class Migration(migrations.Migration):
    dependencies = [
        ('tout_doux', '0010_position'),
    ]

    operations = [
        migrations.RunPython(backfill_positions, migrations.RunPython.noop),
    ]
