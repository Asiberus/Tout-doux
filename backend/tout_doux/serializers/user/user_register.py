from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from tout_doux.models import Preferences
from tout_doux.serializers.user.user import UserSerializer
from tout_doux.services.email import EmailService


class UserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=100,
        validators=[UniqueValidator(queryset=get_user_model().objects.all())]
    )
    email = serializers.EmailField(
        max_length=100,
        validators=[UniqueValidator(queryset=get_user_model().objects.all())]
    )
    password = serializers.CharField(max_length=64)
    confirmPassword = serializers.CharField(max_length=64)
    is_active = serializers.HiddenField(default=False)

    def to_representation(self, instance):
        return UserSerializer(instance).data

    def create(self, validated_data):
        user = get_user_model()(**validated_data)
        password = validated_data.get('password')

        try:
            validate_password(password=password, user=user)
        except ValidationError as error:
            raise serializers.ValidationError({'password': error.messages})

        user.set_password(password)
        user.save()

        # We create the preferences in the db at registration
        preferences = Preferences(user=user)
        preferences.save()

        EmailService.send_user_creation_email(user)
        return user

    def validate(self, data):
        # We remove confirmPassword from data as it not need in the creation of the user
        password, confirm_password = data.get('password'), data.pop('confirmPassword')
        if password != confirm_password:
            raise serializers.ValidationError({'password': 'The passwords does not match'})

        return data
