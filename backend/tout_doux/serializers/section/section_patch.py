from rest_framework import serializers

from tout_doux.models import Section
from tout_doux.serializers.section.section_tasks import SectionTasksSerializer


class SectionPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = (
            'name',
        )

    def to_representation(self, instance):
        return SectionTasksSerializer(instance).data

    def validate(self, data):
        # This serializer is only used in a PATCH context, self.instance is always defined
        if self.instance.project.archived:
            raise serializers.ValidationError('You can\'t edit a section related to an archived project')

        return data
