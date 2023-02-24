from tout_doux.models import Section
from tout_doux.serializers.common import ReadOnlyModelSerializer
from tout_doux.serializers.project import ProjectSerializer


class SectionSerializer(ReadOnlyModelSerializer):
    project = ProjectSerializer()

    class Meta:
        model = Section
        fields = (
            'id',
            'name',
            'project'
        )
