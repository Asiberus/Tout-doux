from rest_framework import serializers

from tout_doux.models import Project, Section
from tout_doux.serializers.section.section_tasks import SectionTasksSerializer


class SectionPostSerializer(serializers.ModelSerializer):
    projectId = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all()
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Section
        fields = (
            'name',
            'projectId',
            'user',
        )

    def to_representation(self, instance):
        return SectionTasksSerializer(instance).data

    def validate_projectId(self, project):
        current_user = self.context.get('request').user
        if project.user.pk is not current_user.pk:
            raise serializers.ValidationError(f'Invalid pk \"{project.pk}\" - object does not exist.')

        if project.archived:
            raise serializers.ValidationError('You can\'t add a section to an archived project')

        return project
