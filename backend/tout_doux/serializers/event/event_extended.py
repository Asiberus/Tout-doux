from rest_framework import serializers

from tout_doux.models.event import Event
from tout_doux.serializers.project.project import ProjectSerializer


class EventExtendedSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M')
    end_time = serializers.TimeField(format='%H:%M')
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Event
        fields = (
            'id', 'name', 'start_date', 'start_time', 'end_date', 'end_time',
            'description', 'takes_whole_day', 'project'
        )
