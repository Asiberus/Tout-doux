from .auth import LoginView, UserRegisterView, UserActivationView, ResetPasswordView, ResetPasswordRequestView, \
    ValidatePasswordView, ConfirmEmailView, CheckTokenView, ResendActivationEmailView, CheckPasswordView
from .collection import CollectionViewSet
from .common_task import CommonTaskViewSet
from .daily_task import DailyTaskViewSet
from .event import EventViewSet
from .feedback import FeedbackViewSet
from .preferences import PreferencesViewSet
from .project import ProjectViewSet
from .section import SectionViewSet
from .tag import TagViewSet
from .task import TaskViewSet
from .user import UserViewSet
