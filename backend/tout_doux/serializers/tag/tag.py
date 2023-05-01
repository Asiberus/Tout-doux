from rest_framework import serializers

from tout_doux.models import Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = (
            'id',
            'type',
            'name',
            'color'
        )
