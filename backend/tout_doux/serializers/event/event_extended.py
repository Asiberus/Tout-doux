from rest_framework import serializers

from tout_doux.models.event import Event
from tout_doux.serializers.project.project import ProjectSerializer


class EventExtendedSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date')
    startTime = serializers.TimeField(format='%H:%M', source='start_time')
    endDate = serializers.DateField(source='end_date')
    endTime = serializers.TimeField(format='%H:%M', source='end_time')
    takesWholeDay = serializers.BooleanField(source='takes_whole_day')
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Event
        fields = (
            'id', 'name', 'startDate', 'startTime', 'endDate', 'endTime',
            'description', 'takesWholeDay', 'project'
        )
