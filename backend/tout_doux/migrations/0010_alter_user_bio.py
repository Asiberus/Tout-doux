# Generated by Django 3.2.9 on 2023-11-11 16:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0009_user_bio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='bio',
            field=models.CharField(default='', max_length=500),
        ),
    ]