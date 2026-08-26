from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0006_task_name_max_length_150'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='description',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AlterField(
            model_name='collection',
            name='description',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
