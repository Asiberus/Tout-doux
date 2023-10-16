from datetime import datetime, time

from rest_framework import serializers

from tout_doux.models import Event, Project
from tout_doux.serializers.event import EventExtendedSerializer
from tout_doux.serializers.event.event import EventSerializer


class EventPostOrPatchSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date')
    startTime = serializers.TimeField(
        source='start_time',
        format='%H:%M',
        input_formats=['%H:%M'],
        required=False,
        allow_null=True
    )
    endDate = serializers.DateField(
        source='end_date',
        required=False,
        allow_null=True
    )
    endTime = serializers.TimeField(
        source='end_time',
        format='%H:%M',
        input_formats=['%H:%M'],
        required=False,
        allow_null=True
    )
    takesWholeDay = serializers.BooleanField(source='takes_whole_day')
    projectId = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Event
        fields = (
            'name',
            'startDate',
            'startTime',
            'endDate',
            'endTime',
            'description',
            'takesWholeDay',
            'projectId',
            'user',
        )

    def to_representation(self, instance):
        extended = self.context['request'].query_params.get('extended', False)
        if extended in ['true', 'True']:
            representation_serializer = EventExtendedSerializer
        else:
            representation_serializer = EventSerializer

        return representation_serializer(instance).data

    def validate_projectId(self, project):
        current_user = self.context.get('request').user
        if project.user.pk is not current_user.pk:
            raise serializers.ValidationError(f'Invalid pk \"{project.pk}\" - object does not exist.')

        if project.archived:
            raise serializers.ValidationError('You can\'t create an event related to an archived project')

        return project

    def validate(self, data):
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
                        'You can\'t edit an event related to an archived project')
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
