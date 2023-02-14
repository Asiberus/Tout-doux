from rest_framework import serializers

from tout_doux.models.collection import Collection


class CollectionSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateField(read_only=True, source='created_at')

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'createdAt', 'archived')

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived collection')

        if self.instance and self.instance.archived:
            if 'archived' not in data or data.get('archived') is True:
                raise serializers.ValidationError('You can\'t edit an archived collection')

        return data
