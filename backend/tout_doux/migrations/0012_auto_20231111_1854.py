# Generated by Django 3.2.9 on 2023-11-11 17:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0011_alter_user_bio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='first_name',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AlterField(
            model_name='user',
            name='last_name',
            field=models.CharField(default='', max_length=100),
        ),
    ]
