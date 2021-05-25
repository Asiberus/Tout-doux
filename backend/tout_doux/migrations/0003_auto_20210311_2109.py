# Generated by Django 3.1.2 on 2021-03-11 21:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0002_auto_20210310_2246'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='priority',
            field=models.IntegerField(choices=[(0, 'Normal'), (1, 'Important')], default=0),
        ),
        migrations.AlterField(
            model_name='task',
            name='priority',
            field=models.IntegerField(choices=[(0, 'Normal'), (1, 'Important')], default=0),
        ),
    ]
