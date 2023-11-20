from django.contrib.auth import get_user_model
from rest_framework import serializers

from tout_doux.serializers.common import ReadOnlyModelSerializer


class UserSerializer(ReadOnlyModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    isActive = serializers.BooleanField(source='is_active')
    isStaff = serializers.BooleanField(source='is_staff')
    lastLogin = serializers.DateTimeField(source='last_login')

    class Meta:
        model = get_user_model()
        fields = (
            'id',
            'username',
            'email',
            'firstName',
            'lastName',
            'bio',
            'isActive',
            'isStaff',
            'lastLogin',
        )
