from rest_framework import serializers

from tout_doux.serializers.common import ReadOnlySerializer


class DailySummarySerializer(ReadOnlySerializer):
    date = serializers.DateField()
    totalTask = serializers.IntegerField(source='total_task')
    totalTaskCompleted = serializers.IntegerField(source='total_task_completed')
    totalEvent = serializers.IntegerField(source='total_event')
