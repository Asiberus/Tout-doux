from django.db.models import Q
from rest_framework import serializers

from tout_doux.models import DailyTask, Event
from tout_doux.serializers.common import ReadOnlySerializer


class DailySummarySerializer(ReadOnlySerializer):
    date = serializers.DateField()
    totalTask = serializers.SerializerMethodField(method_name='get_total_task')
    totalTaskCompleted = serializers.SerializerMethodField(method_name='get_total_task_completed')
    totalEvent = serializers.SerializerMethodField(method_name='get_total_event')

    def get_total_task(self, instance):
        current_user = self.context.get('user')
        date = instance.get('date')
        return DailyTask.objects.filter(user=current_user, date=date).count()

    def get_total_task_completed(self, instance):
        current_user = self.context.get('user')
        date = instance.get('date')
        return DailyTask.objects.filter(user=current_user, date=date, completed=True).count()

    def get_total_event(self, instance):
        current_user = self.context.get('user')
        date = instance.get('date')
        return Event.objects \
            .filter(user=current_user) \
            .filter(Q(start_date=date) | Q(start_date__lte=date, end_date__gte=date)).count()
