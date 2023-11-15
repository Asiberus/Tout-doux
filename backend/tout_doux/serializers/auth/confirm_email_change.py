from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from tout_doux.models import UserEmailChange
from tout_doux.services.email import EmailService


class ConfirmEmailChangeSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True)

    def save(self):
        user_email_change = self.validated_data.get('user_email_change')
        user = user_email_change.user
        previous_email = user.email

        user.email = user_email_change.new_email
        user.auth_token_set.all().delete()
        user.save()
        
        user_email_change.delete()

        EmailService.send_email_changed_email(user=user, previous_email=previous_email)

    def validate(self, data):
        token = data.get('token')

        try:
            user_email_change = UserEmailChange.objects.get(token=token, expiry_date__gt=timezone.now())
        except UserEmailChange.DoesNotExist:
            raise PermissionDenied('Incorrect token')

        data['user_email_change'] = user_email_change
        return data
