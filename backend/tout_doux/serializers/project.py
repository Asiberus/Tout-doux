from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.serializers.section import SectionSerializer
from tout_doux.serializers.task import TaskSerializer


class ProjectSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'archived', 'sections', 'tasks', 'created_at')

    def validate(self, data):
        if self.instance and self.instance.archived:
            if 'name' in data or 'description' in data:
                raise serializers.ValidationError('You can\'t edit a archived project')
        return data
