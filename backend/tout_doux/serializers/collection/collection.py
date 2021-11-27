from rest_framework import serializers

from tout_doux.models.collection import Collection


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'created_at')
