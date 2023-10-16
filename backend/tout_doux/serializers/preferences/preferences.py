from rest_framework import serializers

from tout_doux.models import Preferences


class PreferencesSerializer(serializers.ModelSerializer):
    progressWheelMode = serializers.ChoiceField(
        source='progress_wheel_mode',
        choices=Preferences.ProgressWheelMode.choices
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Preferences
        fields = (
            'progressWheelMode',
            'user',
        )
