from tout_doux.models import Event
from tout_doux.serializers.event.event import EventSerializer
from tout_doux.serializers.project import ProjectSerializer


class EventExtendedSerializer(EventSerializer):
    project = ProjectSerializer()

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
            'project',
        )
