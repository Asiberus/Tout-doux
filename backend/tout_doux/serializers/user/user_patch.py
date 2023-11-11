from django.contrib.auth import get_user_model
from rest_framework import serializers

from tout_doux.serializers.user.user import UserSerializer


class UserPatchSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', max_length=100, allow_blank=True)
    lastName = serializers.CharField(source='last_name', max_length=100, allow_blank=True)

    class Meta:
        model = get_user_model()
        fields = (
            'username',
            'firstName',
            'lastName',
            'bio'
        )

    def to_representation(self, instance):
        return UserSerializer(instance).data
