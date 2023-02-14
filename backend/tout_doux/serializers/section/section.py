from rest_framework import serializers

from tout_doux.models import Project, Section
from tout_doux.serializers.task import TaskSerializer


class SectionSerializer(serializers.ModelSerializer):
    projectId = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all(),
                                                   required=True, allow_null=False)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ('id', 'name', 'projectId', 'tasks')

    def validate_projectId(self, project):
        if project.archived:
            raise serializers.ValidationError('You can\'t add a section to an archived project')

        return project

    def validate(self, data):
        if self.instance:
            if 'project' in data:
                raise serializers.ValidationError('This section is already link to a project')
            if self.instance.project.archived:
                raise serializers.ValidationError('You can\'t edit a section to an archived project')

        return data
