from rest_framework import serializers

from tout_doux.models import Collection
from tout_doux.serializers.collection.collection import CollectionSerializer


class CollectionPostOrPatchSerializer(serializers.ModelSerializer):
    itemName = serializers.CharField(source='item_name')
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Collection
        fields = (
            'name',
            'description',
            'itemName',
            'archived',
            'user',
        )

    def to_representation(self, instance):
        return CollectionSerializer(instance).data

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived collection')

        if self.instance and self.instance.archived:
            if 'archived' not in data or data.get('archived') is True:
                raise serializers.ValidationError('You can\'t edit an archived collection')

        return data
