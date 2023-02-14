from rest_framework import serializers

from tout_doux.models import Collection


class CollectionSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(read_only=True, source='created_on')

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'createdOn', 'archived')

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived collection')

        if self.instance and self.instance.archived:
            if 'archived' not in data or data.get('archived') is True:
                raise serializers.ValidationError('You can\'t edit an archived collection')

        return data
