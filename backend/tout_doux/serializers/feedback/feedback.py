from rest_framework import serializers

from tout_doux.models import Feedback
from tout_doux.serializers.user import UserSerializer


class FeedbackSerializer(serializers.ModelSerializer):
    isRead = serializers.BooleanField(source='is_read', default=False)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = (
            'id',
            'title',
            'message',
            'user',
            'date',
            'isRead',
        )

    def create(self, validated_data):
        validated_data['user'] = self.context.get('request').user

        return super().create(validated_data)
