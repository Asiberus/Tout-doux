from rest_framework import serializers

from tout_doux.models.project import Project
from tout_doux.models.section import Section
from tout_doux.serializers.task import TaskSerializer
from tout_doux.utils import get_or_raise_error


class SectionSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    projectId = serializers.ModelField(model_field=Section()._meta.get_field('project'), required=True,
                                       allow_null=False)

    class Meta:
        model = Section
        fields = ('id', 'name', 'tasks', 'projectId')

    def to_representation(self, instance):
        print('instance', self.instance)
        serializer = SectionSerializerGet(instance)
        return serializer.data

        # return super().to_representation(instance)

    def validate(self, data):
        # Map projectId to project
        project_id = data.pop('projectId')
        project = get_or_raise_error(Project, id=project_id,
                                     error=serializers.ValidationError('This project doesn\'t exist'))
        if project.archived:
            raise serializers.ValidationError('This project is archived')

        data['project'] = project
        return data


class SectionSerializerGet(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ('id', 'name', 'tasks')


class SectionSerializerPost(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Section()._meta.get_field('project'), required=True,
                                       allow_null=False)

    class Meta:
        model = Section

    def validate(self, data):
        # Map projectId to project
        project_id = data.pop('projectId')
        project = get_or_raise_error(Project, id=project_id,
                                     error=serializers.ValidationError('This project doesn\'t exist'))
        if project.archived:
            raise serializers.ValidationError('This project is archived')

        data['project'] = project
        return data
