from rest_framework import serializers

from tout_doux.models import Collection
from tout_doux.serializers.common import ReadOnlyModelSerializer


class CollectionSerializer(ReadOnlyModelSerializer):
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
