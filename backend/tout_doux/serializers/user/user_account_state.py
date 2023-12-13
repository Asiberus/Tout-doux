from rest_framework import serializers

from tout_doux.serializers.user.user import UserSerializer


class UserAccountState(serializers.Serializer):
    active = serializers.BooleanField()

    def save(self):
        user = self.instance

        user.is_active = self.validated_data.get('active')
        user.save()

        if not user.is_active:
            user.auth_token_set.all().delete()  # we log out the user from all his sessions

    def to_representation(self, instance):
        return UserSerializer(instance).data
