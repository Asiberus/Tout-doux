from django.conf.urls import url
from django.urls import include
from rest_framework import routers

from tout_doux.views.collection import CollectionViewSet
from tout_doux.views.daily_task import DailyTaskViewSet
from tout_doux.views.project import ProjectViewSet
from tout_doux.views.task import TaskViewSet

router = routers.DefaultRouter()
router.register(r'project', ProjectViewSet, basename='project')
router.register(r'collection', CollectionViewSet, basename='list')
router.register(r'task', TaskViewSet, basename='task')
router.register(r'daily-task', DailyTaskViewSet, basename='daily_task')

urlpatterns = [
  url('', include(router.urls)),
  url('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
