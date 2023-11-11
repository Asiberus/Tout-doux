from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied


class UserChangePassword(serializers.Serializer):
    currentPassword = serializers.CharField(max_length=64)
    newPassword1 = serializers.CharField(max_length=64)
    newPassword2 = serializers.CharField(max_length=64)

    def save(self):
        user = self.context.get('user')
        new_password = self.validated_data.get('new_password')

        user.set_password(new_password)
        user.save()

    def validate_currentPassword(self, current_password):
        user = self.context.get('user')

        if not user.check_password(current_password):
            raise PermissionDenied('Incorrect password')

        return current_password

    def validate(self, data):
        new_password1, new_password2 = data.pop('newPassword1'), data.pop('newPassword2')
        if new_password1 != new_password2:
            raise serializers.ValidationError({'password': 'The passwords does not match'})

        if new_password1 == data.get('currentPassword'):
            raise serializers.ValidationError(
                {'password': 'The new password can\'t be the same as the current password.'})

        user = self.context.get('user')
        try:
            validate_password(password=new_password1, user=user)
        except ValidationError as error:
            raise serializers.ValidationError({'password': error.messages})

        data['new_password'] = new_password1
        return data
