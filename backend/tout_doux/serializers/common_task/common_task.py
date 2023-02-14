from rest_framework import serializers

from tout_doux.models import TaskTag, CommonTask
from tout_doux.serializers.task_tag import TaskTagSerializer


class CommonTaskSerializer(serializers.ModelSerializer):
    tags = TaskTagSerializer(read_only=True, many=True)
    tagIds = serializers.PrimaryKeyRelatedField(write_only=True, source='tags', queryset=TaskTag.objects.all(),
                                                many=True, required=False, allow_null=True)

    class Meta:
        model = CommonTask
        fields = ('id', 'name', 'tags', 'tagIds')
