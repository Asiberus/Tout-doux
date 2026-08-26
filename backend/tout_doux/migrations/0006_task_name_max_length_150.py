from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tout_doux', '0005_alter_user_related_names'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='name',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='commontask',
            name='name',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='dailytask',
            name='name',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
    ]
