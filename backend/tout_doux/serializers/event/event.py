from rest_framework import serializers

from tout_doux.models import Event


class EventSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date')
    startTime = serializers.TimeField(source='start_time', format='%H:%M')
    endDate = serializers.DateField(source='end_date')
    endTime = serializers.TimeField(source='end_time', format='%H:%M')
    takesWholeDay = serializers.BooleanField(source='takes_whole_day')

    class Meta:
        model = Event
        fields = (
            'id',
            'name',
            'startDate',
            'startTime',
            'endDate',
            'endTime',
            'description',
            'takesWholeDay',
        )
