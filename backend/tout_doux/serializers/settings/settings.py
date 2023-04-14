from rest_framework import serializers

from tout_doux.models import Settings


class SettingsSerializer(serializers.ModelSerializer):
    progressWheelMode = serializers.ChoiceField(
        source='progress_wheel_mode',
        choices=Settings.ProgressWheelMode.choices
    )

    class Meta:
        model = Settings
        fields = (
            'progressWheelMode',
        )
