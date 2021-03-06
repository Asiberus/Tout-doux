# Generated by Django 3.1.2 on 2021-03-26 23:37

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0012_auto_20210325_1641'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyTask',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(auto_now_add=True)),
                ('name', models.CharField(blank=True, max_length=50, null=True)),
                ('priority', models.IntegerField(blank=True, choices=[(0, 'Normal'), (1, 'Important')], default=0, null=True)),
                ('action', models.CharField(blank=True, choices=[('TH', 'Réfléchir'), ('WO', 'Travailler'), ('FI', 'Terminer')], max_length=2, null=True)),
                ('completed', models.BooleanField(default=False)),
                ('task', models.ForeignKey(blank=True, limit_choices_to={'completed': False}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='daily_tasks', to='tout_doux.task')),
            ],
        ),
    ]
