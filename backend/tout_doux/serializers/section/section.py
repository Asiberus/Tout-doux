from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.models.section import Section
from tout_doux.serializers.section.section_task import SectionTaskSerializer
from tout_doux.utils import get_or_raise_error


class SectionSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Section()._meta.get_field('project'), required=True,
                                       allow_null=False)

    class Meta:
        model = Section
        fields = ('id', 'name', 'projectId')

    def to_representation(self, instance):
        serializer = SectionTaskSerializer(instance)
        return serializer.data

    def validate(self, data):
        # Map projectId to project
        if 'projectId' in data:
            data['project'] = get_or_raise_error(Project, id=data.pop('projectId'),
                                                 error=serializers.ValidationError('This project doesn\'t exist'))

        if self.instance:
            if data.get('project'):
                raise serializers.ValidationError('This section is already link to a project')
            if self.instance.project.archived:
                raise serializers.ValidationError('You can\'t edit a section to an archived project')
        else:
            if data.get('project') and data.get('project').archived:
                raise serializers.ValidationError('You can\'t add a section to an archived project')

        return data
