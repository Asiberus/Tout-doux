from knox.views import LoginView as KnoxLoginView
from rest_framework.permissions import AllowAny

from tout_doux.auth.json_authentication import JsonAuthentication


class LoginView(KnoxLoginView):
    authentication_classes = [JsonAuthentication]
    permission_classes = [AllowAny]
