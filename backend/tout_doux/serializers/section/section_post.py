from rest_framework import serializers

from tout_doux.models import Project, Section
from tout_doux.serializers.section.section_tasks import SectionTasksSerializer


class SectionPostSerializer(serializers.ModelSerializer):
    projectId = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all()
    )

    class Meta:
        model = Section
        fields = (
            'name',
            'projectId',
        )

    def to_representation(self, instance):
        return SectionTasksSerializer(instance).data

    def validate_projectId(self, project):
        if project.archived:
            raise serializers.ValidationError('You can\'t add a section to an archived project')

        return project
