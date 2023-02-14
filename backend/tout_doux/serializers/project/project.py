from rest_framework import serializers

from tout_doux.models import Project, ProjectTag
from tout_doux.serializers.project_tag import ProjectTagSerializer


class ProjectSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(read_only=True, source='created_on')
    tagIds = serializers.PrimaryKeyRelatedField(write_only=True, source='tags', queryset=ProjectTag.objects.all(),
                                                many=True, required=False, allow_null=True)
    tags = ProjectTagSerializer(read_only=True, many=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'tags', 'tagIds', 'archived', 'createdOn')

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived project')

        if self.instance and self.instance.archived:
            if 'archived' not in data or data.get('archived') is True:
                raise serializers.ValidationError('You can\'t edit an archived project')

        return data
