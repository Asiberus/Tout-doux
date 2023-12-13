from rest_framework import serializers

from tout_doux.models import Tag


class TagSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Tag
        fields = (
            'id',
            'type',
            'name',
            'color',
            'user',
        )
