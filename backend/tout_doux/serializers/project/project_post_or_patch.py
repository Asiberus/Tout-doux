from rest_framework import serializers

from tout_doux.models import Project, Tag
from tout_doux.serializers.common import OwnedPrimaryKeyRelatedField
from tout_doux.serializers.project.project import ProjectSerializer


class ProjectPostOrPatchSerializer(serializers.ModelSerializer):
    tagIds = OwnedPrimaryKeyRelatedField(
        source='tags',
        queryset=Tag.objects.filter(type=Tag.Type.PROJECT),
        many=True,
        required=False,
        allow_null=True
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Project
        fields = (
            'name',
            'description',
            'tagIds',
            'archived',
            'user',
        )

    def to_representation(self, instance):
        return ProjectSerializer(instance).data

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived project')

        if self.instance and self.instance.archived:
            if 'archived' not in data or data.get('archived') is True:
                raise serializers.ValidationError('You can\'t edit an archived project')

        return data
