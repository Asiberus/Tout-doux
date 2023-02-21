from rest_framework import serializers

from tout_doux.models import Section
from tout_doux.serializers.project import ProjectSerializer


class SectionSerializer(serializers.ModelSerializer):
    project = ProjectSerializer()

    class Meta:
        model = Section
        fields = (
            'id',
            'name',
            'project'
        )
