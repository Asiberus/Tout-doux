import re

from rest_framework import serializers

from tout_doux.models import ProjectTag


class ProjectTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectTag
        fields = ('id', 'name', 'color')

    def validate_color(self, value):
        # Test that the color is a correct hex code
        if not re.fullmatch(r'^#[a-fA-F0-9]{6}$', value):
            raise serializers.ValidationError('Enter a valid hexadecimal color code')
        return value.upper()
