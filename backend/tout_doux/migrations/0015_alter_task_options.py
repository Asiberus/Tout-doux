# Generated by Django 3.2.9 on 2023-04-28 09:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0014_alter_user_email'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ('-completed_at', '-pk')},
        ),
    ]
