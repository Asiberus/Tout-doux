from rest_framework import serializers


class UserAccountState(serializers.Serializer):
    active = serializers.BooleanField()

    def save(self):
        user = self.instance

        user.is_active = self.validated_data.get('active')
        user.save()
