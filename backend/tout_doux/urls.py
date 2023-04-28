from django.conf.urls import url
from django.urls import include
from knox.views import LogoutView
from rest_framework import routers

from tout_doux.views import ProjectViewSet, CollectionViewSet, TaskViewSet, DailyTaskViewSet, SectionViewSet, \
    EventViewSet, TagViewSet, CommonTaskViewSet, PreferencesViewSet, LoginView

router = routers.DefaultRouter()
router.register(r'project', ProjectViewSet, basename='project')
router.register(r'collection', CollectionViewSet, basename='list')
router.register(r'task', TaskViewSet, basename='task')
router.register(r'daily-task', DailyTaskViewSet, basename='daily_task')
router.register(r'section', SectionViewSet, basename='section')
router.register(r'event', EventViewSet, basename='event')
router.register(r'tag', TagViewSet, basename='tag')
router.register(r'common-task', CommonTaskViewSet, basename='common_task')

urlpatterns = [
    url('', include(router.urls)),
    url('login/', LoginView.as_view(), name='login'),
    url('logout/', LogoutView.as_view(), name='logout'),
    url('preferences/', PreferencesViewSet.as_view(), name='preferences'),
    url('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
