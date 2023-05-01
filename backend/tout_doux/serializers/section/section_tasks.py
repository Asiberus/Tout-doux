from tout_doux.models import Section
from tout_doux.serializers.common import ReadOnlyModelSerializer
from tout_doux.serializers.task import TaskSerializer


class SectionTasksSerializer(ReadOnlyModelSerializer):
    tasks = TaskSerializer(many=True)

    class Meta:
        model = Section
        fields = (
            'id',
            'name',
            'tasks'
        )
