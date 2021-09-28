# Generated by Django 3.1.2 on 2021-05-25 17:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0014_auto_20210327_0053'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dailytask',
            name='priority',
        ),
        migrations.RemoveField(
            model_name='project',
            name='priority',
        ),
        migrations.RemoveField(
            model_name='task',
            name='deadline',
        ),
        migrations.RemoveField(
            model_name='task',
            name='description',
        ),
        migrations.RemoveField(
            model_name='task',
            name='event',
        ),
        migrations.RemoveField(
            model_name='task',
            name='priority',
        ),
        migrations.AlterField(
            model_name='dailytask',
            name='action',
            field=models.CharField(blank=True, choices=[('TH', 'Réfléchir'), ('WO', 'Travailler'), ('FI', 'Finir')], max_length=2, null=True),
        ),
    ]