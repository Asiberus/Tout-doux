from rest_framework import serializers

from tout_doux.models import Collection


class CollectionSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(source='created_on')

    class Meta:
        model = Collection
        fields = (
            'id',
            'name',
            'description',
            'archived',
            'createdOn',
        )
