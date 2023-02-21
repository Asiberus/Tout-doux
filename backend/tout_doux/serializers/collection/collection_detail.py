from tout_doux.models import Collection
from tout_doux.serializers.collection.collection import CollectionSerializer
from tout_doux.serializers.task import TaskSerializer


class CollectionDetailSerializer(CollectionSerializer):
    tasks = TaskSerializer(many=True)

    class Meta:
        model = Collection
        fields = (
            'id',
            'name',
            'description',
            'archived',
            'createdOn',
            'tasks'
        )
