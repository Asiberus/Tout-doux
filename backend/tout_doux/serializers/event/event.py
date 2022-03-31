from rest_framework import serializers

from tout_doux.models.event import Event
from tout_doux.models.project import Project
from tout_doux.utils import get_or_raise_error


class EventSerializer(serializers.ModelSerializer):
    projectId = serializers.ModelField(model_field=Event()._meta.get_field('project'), required=False, allow_null=True)

    class Meta:
        model = Event
        fields = ('id', 'name', 'start_date', 'end_date', 'description', 'takes_whole_day', 'projectId')

    def validate(self, data):
        # Map projectId to project
        if 'projectId' in data:
            project = get_or_raise_error(Project, id=data.pop('projectId'),
                                         error=serializers.ValidationError('This project doesn\'t exist'))
            if project.archived:
                raise serializers.ValidationError('You can\'t create or edit an event related to an archived project')

            data['project'] = project

        if data.get('takes_whole_day'):
            data['end_date'] = None

        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if self.instance:
            if self.instance.project:
                if self.instance.project.archived:
                    raise serializers.ValidationError(
                        'You can\'t create or edit an event related to an archived project')
                if 'project' in data:
                    raise serializers.ValidationError('This event is already link to a project')

            if self.instance.takes_whole_day and data.get('end_date') and 'takes_whole_day' not in data:
                raise serializers.ValidationError('You can\' add an end date to an event that takes whole day')

            if data.get('end_date') and not data.get('start_date'):
                start_date = self.instance.start_date
                end_date = data.get('end_date')

            if self.instance.end_date and data.get('start_date') and not data.get('end_date'):
                start_date = data.get('start_date')
                end_date = self.instance.end_date

        if end_date and start_date >= end_date:
            raise serializers.ValidationError('You can\'t set the end date before the start date')

        return data
