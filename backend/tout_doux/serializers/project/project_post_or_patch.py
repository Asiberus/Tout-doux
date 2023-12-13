from rest_framework import serializers

from tout_doux.models import Project, Tag
from tout_doux.serializers.project.project import ProjectSerializer


class ProjectPostOrPatchSerializer(serializers.ModelSerializer):
    tagIds = serializers.PrimaryKeyRelatedField(
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

    def validate_tagIds(self, tags):
        current_user = self.context.get('request').user
        for tag in tags:
            if tag.user.pk is not current_user.pk:
                raise serializers.ValidationError(f'Invalid pk \"{tag.pk}\" - object does not exist.')

        return tags

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived project')

        if self.instance and self.instance.archived:
            if 'archived' not in data or data.get('archived') is True:
                raise serializers.ValidationError('You can\'t edit an archived project')

        return data
