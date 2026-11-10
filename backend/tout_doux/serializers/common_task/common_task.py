from rest_framework import serializers

from tout_doux.models import CommonTask, Tag
from tout_doux.serializers.common import OwnedPrimaryKeyRelatedField
from tout_doux.serializers.tag import TagSerializer


class CommonTaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(read_only=True, many=True)
    tagIds = OwnedPrimaryKeyRelatedField(
        write_only=True,
        source='tags',
        queryset=Tag.objects.filter(type=Tag.Type.TASK),
        many=True,
        required=False,
        allow_null=True
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = CommonTask
        fields = (
            'id',
            'name',
            'tags',
            'tagIds',
            'user',
        )
