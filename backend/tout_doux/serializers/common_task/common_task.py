from rest_framework import serializers

from tout_doux.models import CommonTask, Tag
from tout_doux.serializers.tag import TagSerializer


class CommonTaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(read_only=True, many=True)
    tagIds = serializers.PrimaryKeyRelatedField(
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

    def validate_tagIds(self, tags):
        current_user = self.context.get('request').user

        for tag in tags:
            if tag.user.pk is not current_user.pk:
                raise serializers.ValidationError(f'Invalid pk \"{tag.pk}\" - object does not exist.')

        return tags
