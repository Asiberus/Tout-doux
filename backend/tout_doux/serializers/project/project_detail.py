from tout_doux.models import Project
from tout_doux.serializers.event import EventSerializer
from tout_doux.serializers.project.project import ProjectSerializer
from tout_doux.serializers.section import SectionTasksSerializer
from tout_doux.serializers.task import TaskSerializer


class ProjectDetailSerializer(ProjectSerializer):
    sections = SectionTasksSerializer(many=True)
    tasks = TaskSerializer(many=True)
    events = EventSerializer(many=True)

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'tags',
            'archived',
            'createdOn',
            'sections',
            'tasks',
            'events',
        )
