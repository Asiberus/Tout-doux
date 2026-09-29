from rest_framework import serializers


class MoveSerializer(serializers.Serializer):
    afterId = serializers.IntegerField(source='after_id', allow_null=True)
    beforeId = serializers.IntegerField(source='before_id', allow_null=True)

    def validate(self, data):
        if data['after_id'] is not None and data['after_id'] == data['before_id']:
            raise serializers.ValidationError('afterId and beforeId must differ')

        return data
