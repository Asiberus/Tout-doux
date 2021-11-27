from rest_framework import serializers

from tout_doux.models.project import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'archived', 'created_at')

    def validate(self, data):
        if not self.instance and data.get('archived'):
            raise serializers.ValidationError('You can\'t create a archived project')

        if self.instance and self.instance.archived:
            if 'name' in data or 'description' in data:
                raise serializers.ValidationError('You can\'t edit an archived project')

        return data


