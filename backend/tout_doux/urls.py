from django.conf.urls import url
from django.urls import include
from rest_framework import routers

from tout_doux.views.project import ProjectViewSet
from tout_doux.views.task import TaskViewSet

router = routers.DefaultRouter()
router.register(r'project', ProjectViewSet, basename='project')
router.register(r'task', TaskViewSet, basename='task')

urlpatterns = [
  url('', include(router.urls)),
  url('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
