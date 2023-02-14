from datetime import datetime, time

from rest_framework import serializers

from tout_doux.models.event import Event
from tout_doux.models.project import Project
from tout_doux.utils import get_or_raise_error


class EventSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date')
    startTime = serializers.TimeField(source='start_time', format='%H:%M', input_formats=['%H:%M'], allow_null=True)
    endDate = serializers.DateField(source='end_date', required=False, allow_null=True)
    endTime = serializers.TimeField(source='end_time', format='%H:%M', input_formats=['%H:%M'], allow_null=True)
    takesWholeDay = serializers.BooleanField(source='takes_whole_day')
    projectId = serializers.ModelField(model_field=Event()._meta.get_field('project'), required=False, allow_null=True)

    class Meta:
        model = Event
        fields = (
            'id', 'name', 'startDate', 'startTime', 'endDate', 'endTime',
            'description', 'takesWholeDay', 'projectId'
        )

    def validate(self, data):
        # Map projectId to project
        if 'projectId' in data:
            project = get_or_raise_error(Project, id=data.pop('projectId'),
                                         error=serializers.ValidationError('This project doesn\'t exist'))
            if project.archived:
                raise serializers.ValidationError('You can\'t create or edit an event related to an archived project')

            data['project'] = project

        if data.get('takes_whole_day'):
            data['start_time'] = None
            data['end_date'] = None
            data['end_time'] = None

        if 'end_date' in data and data.get('end_date') is None:
            data['end_time'] = None

        if self.instance:
            if self.instance.project:
                if self.instance.project.archived:
                    raise serializers.ValidationError(
                        'You can\'t create or edit an event related to an archived project')
                if 'project' in data:
                    raise serializers.ValidationError('This event is already link to a project')

            start_date = data.get('start_date') or self.instance.start_date
            start_time = data.get('start_time') if 'start_time' in data else self.instance.start_time
            end_date = data.get('end_date') if 'end_date' in data else self.instance.end_date
            end_time = data.get('end_time') if 'end_time' in data else self.instance.end_time

            if self.instance.takes_whole_day \
                    and data.get('takes_whole_day') is not False \
                    and (start_time or end_date or end_time):
                raise serializers.ValidationError(
                    'You can\'t add a start time or end date or end time to an event that takes whole day')

        else:
            start_date = data.get('start_date')
            start_time = data.get('start_time')
            end_date = data.get('end_date')
            end_time = data.get('end_time')

            if end_time and not end_date:
                raise serializers.ValidationError("You can't add an end time without an end date")

        start = datetime.combine(start_date, start_time or time.min)
        end = datetime.combine(end_date, end_time or time.min) if end_date else None

        if start_date == end_date and (not start_time or not end_time):
            raise serializers.ValidationError(
                'You must provide a start and end time to an event that start and end the same day')

        if end and end <= start:
            raise serializers.ValidationError('You can\'t set the end date before the start date')

        return data
