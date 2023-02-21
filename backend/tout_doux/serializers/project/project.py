from rest_framework import serializers

from tout_doux.models import Project
from tout_doux.serializers.project_tag import ProjectTagSerializer


class ProjectSerializer(serializers.ModelSerializer):
    createdOn = serializers.DateField(source='created_on')
    tags = ProjectTagSerializer(many=True)

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'tags',
            'archived',
            'createdOn'
        )
