from rest_framework import serializers

from tout_doux.models import Project, ProjectTag
from tout_doux.serializers.project.project import ProjectSerializer


class ProjectPostOrPatchSerializer(serializers.ModelSerializer):
    tagIds = serializers.PrimaryKeyRelatedField(
        source='tags',
        queryset=ProjectTag.objects.all(),
        many=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Project
        fields = (
            'name',
            'description',
            'tagIds',
            'archived',
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
