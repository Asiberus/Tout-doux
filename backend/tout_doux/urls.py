from django.conf.urls import url
from django.urls import include
from knox.views import LogoutView
from rest_framework import routers

from tout_doux.views import ProjectViewSet, CollectionViewSet, TaskViewSet, DailyTaskViewSet, SectionViewSet, \
    EventViewSet, TagViewSet, CommonTaskViewSet, PreferencesViewSet, LoginView, UserRegisterView, UserActivationView, \
    PasswordResetRequestView, PasswordResetView, UserViewSet, ValidatePasswordView, ConfirmEmailView, CheckTokenView, \
    ResendActivationEmailView, CheckPasswordView, FeedbackViewSet

router = routers.DefaultRouter()
router.register(r'project', ProjectViewSet, basename='project')
router.register(r'collection', CollectionViewSet, basename='list')
router.register(r'task', TaskViewSet, basename='task')
router.register(r'daily-task', DailyTaskViewSet, basename='daily_task')
router.register(r'section', SectionViewSet, basename='section')
router.register(r'event', EventViewSet, basename='event')
router.register(r'tag', TagViewSet, basename='tag')
router.register(r'common-task', CommonTaskViewSet, basename='common_task')
router.register(r'user', UserViewSet, basename='user')
router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    url('', include(router.urls)),
    url('auth/login/', LoginView.as_view(), name='login'),
    url('auth/logout/', LogoutView.as_view(), name='logout'),
    url('auth/register/', UserRegisterView.as_view(), name='register'),
    url('auth/activate/', UserActivationView.as_view(), name='activate'),
    url('auth/resend-activation-email/', ResendActivationEmailView.as_view(), name='resend_activation_email'),
    url('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    url('auth/password-reset/', PasswordResetView.as_view(), name='password_reset'),
    url('auth/validate-password/', ValidatePasswordView.as_view(), name='validate_password'),
    url('auth/confirm-email-change/', ConfirmEmailView.as_view(), name='confirm_email_change'),
    url('auth/check-token/', CheckTokenView.as_view(), name='check_token'),
    url('auth/check-password/', CheckPasswordView.as_view(), name='check_password'),
    url('preferences/', PreferencesViewSet.as_view(), name='preferences'),
    url('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
