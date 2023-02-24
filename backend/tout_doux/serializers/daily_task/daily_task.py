from tout_doux.models import DailyTask
from tout_doux.serializers.common import ReadOnlyModelSerializer
from tout_doux.serializers.common_task import CommonTaskSerializer
from tout_doux.serializers.task import TaskExtendedSerializer
from tout_doux.serializers.task_tag import TaskTagSerializer


class DailyTaskSerializer(ReadOnlyModelSerializer):
    task = TaskExtendedSerializer()
    commonTask = CommonTaskSerializer(source='common_task')
    tags = TaskTagSerializer(many=True)

    class Meta:
        model = DailyTask
        fields = (
            'id',
            'date',
            'task',
            'commonTask',
            'name',
            'tags',
            'action',
            'completed',
        )
