# Generated by Django 3.2.9 on 2023-04-28 11:22

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('tout_doux', '0002_event'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommonTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
            ],
            options={
                'ordering': ('pk',),
            },
        ),
        migrations.CreateModel(
            name='Preferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('progress_wheel_mode',
                 models.CharField(choices=[('number', 'Number'), ('percent', 'Percent')], default='number',
                                  max_length=10)),
            ],
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('project', 'Project'), ('task', 'Task')], max_length=7)),
                ('name', models.CharField(max_length=20)),
                ('color', models.CharField(
                    choices=[('#37474F', 'Grey Dark'), ('#607D8B', 'Grey'), ('#880E4F', 'Pink Dark'),
                             ('#9C27B0', 'Purple'), ('#673AB7', 'Purple Dark'), ('#3F51B5', 'Indigo'),
                             ('#0D47A1', 'Dark Blue'), ('#2962FF', 'Blue'), ('#2196F3', 'Light Blue'),
                             ('#00BCD4', 'Cyan'), ('#009688', 'Teal'), ('#4CAF50', 'Green'), ('#8BC34A', 'Light Green'),
                             ('#9E9D24', 'Lime'), ('#FFB300', 'Yellow'), ('#FB8C00', 'Yellow Dark'),
                             ('#FF5722', 'Orange'), ('#E53935', 'Red'), ('#B71C1C', 'Red Dark'), ('#794948', 'Brown')],
                    max_length=7)),
            ],
        ),
        migrations.AlterModelOptions(
            name='event',
            options={'ordering': ('start_date', 'end_date', 'start_time', 'end_time')},
        ),
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ('-completed_at', '-pk')},
        ),
        migrations.RenameField(
            model_name='collection',
            old_name='created_at',
            new_name='created_on',
        ),
        migrations.RenameField(
            model_name='project',
            old_name='created_at',
            new_name='created_on',
        ),
        migrations.AddField(
            model_name='collection',
            name='item_name',
            field=models.CharField(blank=True, default='task', max_length=15),
        ),
        migrations.AlterField(
            model_name='dailytask',
            name='task',
            field=models.ForeignKey(blank=True, limit_choices_to={'completed': False}, null=True,
                                    on_delete=django.db.models.deletion.SET_NULL, related_name='daily_tasks',
                                    to='tout_doux.task'),
        ),
        migrations.AddField(
            model_name='commontask',
            name='tags',
            field=models.ManyToManyField(blank=True, limit_choices_to={'type': 'task'}, related_name='common_tasks',
                                         to='tout_doux.Tag'),
        ),
        migrations.AddField(
            model_name='dailytask',
            name='common_task',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                    related_name='daily_tasks', to='tout_doux.commontask'),
        ),
        migrations.AddConstraint(
            model_name='dailytask',
            constraint=models.UniqueConstraint(fields=('date', 'common_task'), name='unique_common_task_for_date'),
        ),
        migrations.AddConstraint(
            model_name='tag',
            constraint=models.UniqueConstraint(fields=('name', 'type'), name='unique_name_for_type'),
        ),
        migrations.AddField(
            model_name='user',
            name='groups',
            field=models.ManyToManyField(blank=True,
                                         help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
                                         related_name='user_set', related_query_name='user', to='auth.Group',
                                         verbose_name='groups'),
        ),
        migrations.AddField(
            model_name='user',
            name='user_permissions',
            field=models.ManyToManyField(blank=True, help_text='Specific permissions for this user.',
                                         related_name='user_set', related_query_name='user', to='auth.Permission',
                                         verbose_name='user permissions'),
        ),
        migrations.AddField(
            model_name='dailytask',
            name='tags',
            field=models.ManyToManyField(blank=True, limit_choices_to={'type': 'task'}, related_name='daily_tasks',
                                         to='tout_doux.Tag'),
        ),
        migrations.AddField(
            model_name='project',
            name='tags',
            field=models.ManyToManyField(blank=True, limit_choices_to={'type': 'project'}, related_name='projects',
                                         to='tout_doux.Tag'),
        ),
        migrations.AddField(
            model_name='task',
            name='tags',
            field=models.ManyToManyField(blank=True, limit_choices_to={'type': 'task'}, related_name='tasks',
                                         to='tout_doux.Tag'),
        ),
    ]
