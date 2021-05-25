# Generated by Django 3.1.2 on 2021-03-10 22:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('description', models.CharField(max_length=500)),
                ('priority', models.IntegerField(choices=[(0, 'Normal'), (1, 'Important'), (2, 'Very Important')], default=0)),
                ('archived', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('description', models.CharField(max_length=100, null=True)),
                ('completed', models.BooleanField(default=False)),
                ('priority', models.IntegerField(choices=[(0, 'Normal'), (1, 'Important'), (2, 'Very Important')], default=0)),
                ('event', models.BooleanField(default=False)),
                ('deadline', models.DateField(null=True)),
                ('project', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='tout_doux.project')),
            ],
        ),
    ]
