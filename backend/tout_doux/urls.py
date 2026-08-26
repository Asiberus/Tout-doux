from django.urls import include, path
from knox.views import LogoutView
from rest_framework import routers

from tout_doux.views import ProjectViewSet, CollectionViewSet, TaskViewSet, DailyTaskViewSet, SectionViewSet, \
    EventViewSet, TagViewSet, CommonTaskViewSet, PreferencesViewSet, LoginView, UserRegisterView, UserActivationView, \
    ResetPasswordRequestView, ResetPasswordView, UserViewSet, ValidatePasswordView, ConfirmEmailView, CheckTokenView, \
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
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/register/', UserRegisterView.as_view(), name='register'),
    path('auth/activate/', UserActivationView.as_view(), name='activate'),
    path('auth/resend-activation-email/', ResendActivationEmailView.as_view(), name='resend_activation_email'),
    path('auth/reset-password-request/', ResetPasswordRequestView.as_view(), name='reset_password_request'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('auth/validate-password/', ValidatePasswordView.as_view(), name='validate_password'),
    path('auth/confirm-email-change/', ConfirmEmailView.as_view(), name='confirm_email_change'),
    path('auth/check-token/', CheckTokenView.as_view(), name='check_token'),
    path('auth/check-password/', CheckPasswordView.as_view(), name='check_password'),
    path('preferences/', PreferencesViewSet.as_view(), name='preferences'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
