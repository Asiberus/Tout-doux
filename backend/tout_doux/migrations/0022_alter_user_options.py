# Generated by Django 3.2.9 on 2023-11-21 15:48

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0021_auto_20231113_1250'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={'ordering': ('date_joined',)},
        ),
    ]