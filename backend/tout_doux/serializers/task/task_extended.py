from tout_doux.models import Task
from tout_doux.serializers.collection import CollectionSerializer
from tout_doux.serializers.project import ProjectSerializer
from tout_doux.serializers.section import SectionSerializer
from tout_doux.serializers.task.task import TaskSerializer


class TaskExtendedSerializer(TaskSerializer):
    project = ProjectSerializer()
    section = SectionSerializer()
    collection = CollectionSerializer()

    class Meta:
        model = Task
        fields = (
            'id',
            'name',
            'tags',
            'completed',
            'createdAt',
            'completedAt',
            'project',
            'section',
            'collection',
        )
