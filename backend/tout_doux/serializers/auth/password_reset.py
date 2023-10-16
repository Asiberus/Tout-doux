from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers

from tout_doux.utils.token import decode_uid, check_token


class PasswordResetSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    password1 = serializers.CharField(max_length=64, write_only=True)
    password2 = serializers.CharField(max_length=64, write_only=True)

    def save(self):
        user, password = self.validated_data.get('user'), self.validated_data.get('password')
        user.set_password(password)
        user.save()

    def validate(self, data):
        user_model = get_user_model()

        uidb64, token = data.pop('uidb64'), data.pop('token')

        try:
            uid = decode_uid(uidb64)
            user = user_model.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            raise serializers.ValidationError('User not found')

        if not check_token(user, token):
            raise serializers.ValidationError('Invalid token')

        password1, password2 = data.pop('password1'), data.pop('password2')

        if password1 != password2:
            raise serializers.ValidationError({'password': 'The passwords does not match'})

        try:
            validate_password(password=password1, user=user)
        except ValidationError as error:
            raise serializers.ValidationError({'password': error.messages})

        data['user'] = user
        data['password'] = password1
        return data
