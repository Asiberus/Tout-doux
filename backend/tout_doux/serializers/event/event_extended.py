from rest_framework import serializers

from tout_doux.models.event import Event
from tout_doux.serializers.project.project import ProjectSerializer


class EventExtendedSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Event
        fields = ('id', 'name', 'start_date', 'end_date', 'description', 'takes_whole_day', 'project')
